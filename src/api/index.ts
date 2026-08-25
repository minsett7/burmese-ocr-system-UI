import { ClaimDocument, DashboardData, EditableRegion, FormCategory, OCRTemplate, ServiceHealth, TemplateRegistration } from '../types';
import { adaptAudit, adaptDocument, adaptRegistration, adaptTemplate, registrationToTemplate } from './adapters';
import { apiUrl, request } from './client';

type Json = Record<string, any>;
const terminalRegistrationStatuses = new Set(['needs_approval', 'needs_resubmission', 'registered', 'failed']);
const terminalDocumentStatuses = new Set(['needs_review', 'ready_to_sync', 'synced', 'failed']);

export async function loadDashboard(): Promise<DashboardData> {
  const [rawTemplates, rawRegistrations, rawDocuments, rawAudits, formCategories] = await Promise.all([
    request<Json[]>('/api/templates'), request<Json[]>('/api/template-registrations'), request<Json[]>('/api/documents'),
    request<Json[]>('/api/audit-events'), request<FormCategory[]>('/api/v1/form-categories'),
  ]);
  const registrations = rawRegistrations.map(adaptRegistration);
  const approved = rawTemplates.map(template => adaptTemplate(template, registrations));
  const pending = registrations.filter(item => !item.templateId).map(registrationToTemplate);
  const templates = [...approved, ...pending];
  return { templates, registrations, documents: rawDocuments.map(document => adaptDocument(document, templates)),
    auditEvents: rawAudits.map(adaptAudit).reverse(), formCategories };
}

export async function fetchServiceHealth(): Promise<ServiceHealth[]> {
  const response = await request<Json>('/api/v1/services/status');
  return Object.entries(response.services ?? {}).map(([key, value]) => {
    const service = value as Json;
    return { key, name: key.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
      status: service.status === 'available' ? 'operational' : 'offline', latencyMs: 0,
      uptimePercentage: service.status === 'available' ? 100 : 0, version: String(service.details?.version ?? '—'),
      description: service.status === 'available' ? 'Connected through the orchestrator.' : String(service.error ?? 'Unavailable') };
  });
}

async function pause(milliseconds: number, signal?: AbortSignal): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, milliseconds);
    signal?.addEventListener('abort', () => { window.clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')); }, { once: true });
  });
}

export async function startTemplateAnalysis(
  file: File, metadata: { name: string; description?: string; formTypeId: string }, signal?: AbortSignal,
): Promise<{ id: string; status: string; progress: { stage: string; percent: number; message?: string } }> {
  const form = new FormData();
  form.append('file', file); form.append('name', metadata.name); form.append('description', metadata.description ?? '');
  form.append('form_type_id', metadata.formTypeId); form.append('language', 'my-en'); form.append('preprocessing_policy', 'auto');
  return request('/api/v1/template-registrations', { method: 'POST', body: form, signal });
}

export async function waitForTemplateAnalysis(
  id: string, onProgress?: (progress: { stage: string; percent: number; message?: string }) => void, signal?: AbortSignal,
): Promise<TemplateRegistration> {
  while (true) {
    signal?.throwIfAborted();
    const current = await request<Json>(`/api/v1/template-registrations/${encodeURIComponent(id)}`, { signal });
    onProgress?.(current.progress ?? { stage: current.status, percent: 0 });
    if (terminalRegistrationStatuses.has(current.status)) return adaptRegistration(current);
    await pause(1000, signal);
  }
}

export async function analyzeTemplate(
  file: File, metadata: { name: string; description?: string; formTypeId: string },
  onProgress?: (progress: { stage: string; percent: number; message?: string }) => void, signal?: AbortSignal,
): Promise<TemplateRegistration> {
  const accepted = await startTemplateAnalysis(file, metadata, signal);
  return waitForTemplateAnalysis(accepted.id, onProgress, signal);
}

export async function saveTemplateDraft(registration: TemplateRegistration, regions: EditableRegion[]): Promise<TemplateRegistration> {
  return adaptRegistration(await request<Json>(`/api/v1/template-registrations/${encodeURIComponent(registration.id)}/draft`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ revision: registration.draftRevision, regions }),
  }));
}

export const validateTemplate = (id: string): Promise<{ valid: boolean; errors: string[]; revision: number }> =>
  request(`/api/v1/template-registrations/${encodeURIComponent(id)}/validate`, { method: 'POST' });
export const approveTemplate = (id: string): Promise<Json> =>
  request(`/api/v1/template-registrations/${encodeURIComponent(id)}/approve`, { method: 'POST' });
export const beginTemplateRevision = async (id: string): Promise<TemplateRegistration> =>
  adaptRegistration(await request<Json>(`/api/v1/template-registrations/${encodeURIComponent(id)}/revisions`, { method: 'POST' }));
export const deleteTemplateRegistration = (id: string): Promise<void> =>
  request(`/api/v1/template-registrations/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const retryTemplateAnalysis = (id: string): Promise<Json> =>
  request(`/api/v1/template-registrations/${encodeURIComponent(id)}/retry`, { method: 'POST' });

export async function processDocument(
  file: File, templateId: string, templates: OCRTemplate[],
  onProgress?: (progress: { stage: string; percent: number; message?: string }) => void, signal?: AbortSignal,
): Promise<ClaimDocument> {
  const form = new FormData(); form.append('files', file);
  const accepted = await request<Json>(`/api/v1/document-jobs?template_id=${encodeURIComponent(templateId)}`, { method: 'POST', body: form, signal });
  const id = accepted.items?.[0]?.id;
  if (!id) throw new Error('The server did not return a document job ID.');
  while (true) {
    signal?.throwIfAborted();
    const current = await request<Json>(`/api/v1/documents/${encodeURIComponent(id)}`, { signal });
    onProgress?.(current.progress ?? { stage: current.status, percent: 0 });
    if (terminalDocumentStatuses.has(current.status)) return adaptDocument(current, templates);
    await pause(1000, signal);
  }
}

export async function saveDocumentCorrections(document: ClaimDocument): Promise<void> {
  const fields = Object.fromEntries(document.fields.map(field => [field.key, field.value]));
  await request(`/api/v1/documents/${encodeURIComponent(document.id)}/review`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }),
  });
}
export const approveDocument = (id: string): Promise<void> => request(`/api/v1/documents/${encodeURIComponent(id)}/approve`, { method: 'POST' });
export const syncDocument = (id: string): Promise<void> => request(`/api/v1/documents/${encodeURIComponent(id)}/sync`, { method: 'POST' });
export const reprocessDocument = (id: string): Promise<void> => request(`/api/v1/documents/${encodeURIComponent(id)}/reprocess`, { method: 'POST' });
export const deleteDocument = (id: string): Promise<void> => request(`/api/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });

export async function downloadExport(format: 'json' | 'csv' | 'excel'): Promise<void> {
  const response = await fetch(apiUrl(`/api/export/${format}`));
  if (!response.ok) throw new Error(`Export failed (${response.status}).`);
  const blob = await response.blob();
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob);
  link.download = `insurance-ocr-export.${format === 'excel' ? 'xlsx' : format}`; link.click(); URL.revokeObjectURL(link.href);
}

export { technicalError, userError } from './client';
