import {
  AuditEvent, ClaimDocument, ClaimType, EditableRegion, ExtractedField, FieldCategory,
  OCRTemplate, TemplateRegistration, TemplateRegion,
} from '../types';
import { apiUrl } from './client';

type Json = Record<string, any>;

const categoryToClaimType: Record<string, ClaimType> = {
  motor: 'Motor / Vehicle', health: 'Health & Hospitalization', life: 'Life & Beneficiary',
  fire: 'Fire & Property', agriculture: 'Agricultural Crop', travel: 'Travel & Accident',
};

const claimType = (id?: string): ClaimType => categoryToClaimType[id ?? ''] ?? 'Motor / Vehicle';
const percentage = (value: unknown): number => {
  const number = Number(value ?? 0);
  return Math.max(0, Math.min(100, number <= 1 ? number * 100 : number));
};

function displayAge(value?: string): string {
  const timestamp = Date.parse(value ?? '');
  if (!Number.isFinite(timestamp)) return '—';
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

function fieldCategory(key: string): FieldCategory {
  if (/policy|insur|form_type/.test(key)) return 'policy';
  if (/claimant|insured|nrc|phone|email|address|name/.test(key)) return 'claimant';
  if (/loss|incident|accident|date|description|vehicle/.test(key)) return 'incident';
  if (/amount|currency|payment|bank|cost/.test(key)) return 'payment';
  return 'internal';
}

function dataType(value?: string): ExtractedField['dataType'] {
  if (value === 'boolean' || value === 'checkbox') return 'boolean';
  if (value === 'date') return 'date';
  if (value === 'number') return 'number';
  if (value === 'currency') return 'currency';
  if (value === 'select' || value === 'multiple_choice') return 'select';
  return 'text';
}

function templateStatus(status: string): OCRTemplate['status'] {
  if (status === 'active' || status === 'registered') return 'Active';
  if (status === 'needs_approval' || status === 'needs_resubmission') return 'Awaiting Approval';
  if (status === 'archived' || status === 'deprecated') return 'Deprecated';
  return 'Draft';
}

function regionToUi(region: EditableRegion): TemplateRegion {
  return {
    id: region.id,
    fieldKey: region.key,
    nameEn: region.label || region.key.replace(/_/g, ' '),
    nameMm: region.language === 'mya' ? region.label : '',
    category: fieldCategory(region.key),
    dataType: dataType(region.data_type ?? region.extraction_mode),
    required: Boolean(region.required),
    box: { page: Number(region.page || 1), x: Number(region.bbox?.x || 0) * 100, y: Number(region.bbox?.y || 0) * 100,
      width: Number(region.bbox?.width || 0) * 100, height: Number(region.bbox?.height || 0) * 100 },
    confidenceThreshold: percentage(region.confidence),
    status: region.enabled === false ? 'disabled' : region.review_required ? 'review_required' : 'approved',
    source: region,
  };
}

export function adaptRegistration(raw: Json): TemplateRegistration {
  const draft = raw.draft ?? null;
  const pages = draft?.pages ?? (draft?.page ? [draft.page] : []);
  return {
    id: raw.id, templateId: raw.template_id, name: raw.name ?? raw.file_name ?? 'Untitled template',
    description: raw.description ?? '', fileName: raw.file_name ?? '', formTypeId: raw.form_type_id ?? 'motor',
    rawStatus: raw.status ?? 'draft', status: templateStatus(raw.status),
    progress: raw.progress ?? { stage: raw.status ?? 'queued', percent: 0 }, createdAt: raw.created_at ?? '',
    updatedAt: raw.updated_at ?? '', approvedAt: raw.approved_at, failure: raw.failure, draft,
    draftRevision: Number(raw.draft_revision ?? draft?.revision ?? 0),
    pageUrls: pages.map((page: Json) => apiUrl(page.image_url)),
  };
}

export function registrationToTemplate(registration: TemplateRegistration): OCRTemplate {
  const regions = (registration.draft?.regions ?? []).map(regionToUi);
  return {
    id: registration.templateId ?? registration.id, registrationId: registration.id, name: registration.name,
    nameMm: '', code: registration.templateId ?? registration.id, version: registration.templateId ? 'Saved' : 'Draft',
    claimType: claimType(registration.formTypeId), formTypeId: registration.formTypeId, carrier: '', status: registration.status,
    pageCount: registration.pageUrls.length || 1, fieldCount: regions.filter(region => region.status !== 'disabled').length,
    lastUpdated: registration.updatedAt, updatedBy: 'Backend audit log', sampleDocumentUrl: registration.pageUrls[0] ?? '',
    regions, accuracyScore: regions.length ? regions.reduce((sum, region) => sum + region.confidenceThreshold, 0) / regions.length : 0,
    totalProcessedCount: 0, stage: registration.status === 'Active' ? 'Save' : registration.draft ? 'Review' : 'Analyze',
  };
}

export function adaptTemplate(raw: Json, registrations: TemplateRegistration[]): OCRTemplate {
  const registration = registrations.find(item => item.templateId === raw.id);
  if (registration) return { ...registrationToTemplate(registration), id: raw.id, version: raw.version ?? '1.0' };
  return {
    id: raw.id, name: raw.name ?? raw.id, nameMm: '', code: raw.id, version: raw.version ?? '1.0',
    claimType: claimType(raw.form_type_id), formTypeId: raw.form_type_id ?? 'motor', carrier: '', status: templateStatus(raw.status),
    pageCount: Number(raw.pages ?? 1), fieldCount: (raw.fields ?? []).length, lastUpdated: raw.updated_at ?? '',
    updatedBy: 'Backend audit log', sampleDocumentUrl: '', regions: [], accuracyScore: percentage(raw.confidence_score),
    totalProcessedCount: 0, stage: 'Save',
  };
}

function extractFields(raw: Json): ExtractedField[] {
  return Object.entries(raw.processed?.fields ?? {}).map(([key, value], index) => {
    const field = value as Json;
    const issues = [
      ...(field.errors ?? []).map((message: string, issue: number) => ({ id: `${key}-error-${issue}`, fieldKey: key, severity: 'error' as const, message })),
      ...(field.warnings ?? []).map((message: string, issue: number) => ({ id: `${key}-warning-${issue}`, fieldKey: key, severity: 'warning' as const, message })),
    ];
    return {
      id: key || `field-${index}`, key, labelEn: field.label ?? key.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase()),
      labelMm: '', category: fieldCategory(key), value: String(field.value ?? ''), originalOcrValue: String(field.raw_value ?? field.value ?? ''),
      confidence: percentage(field.confidence), isEdited: field.source === 'human_correction', isRequired: false,
      dataType: dataType(field.field_type), validationIssues: issues,
    };
  });
}

const valueOf = (fields: ExtractedField[], ...keys: string[]): string => fields.find(field => keys.includes(field.key))?.value ?? '';

export function adaptDocument(raw: Json, templates: OCRTemplate[]): ClaimDocument {
  const fields = extractFields(raw);
  const amount = Number(String(valueOf(fields, 'amount_claimed', 'claimed_amount', 'claimed_amount_mmk')).replace(/[^0-9.-]/g, '')) || 0;
  const matched = templates.find(template => template.id === raw.template_id);
  const issuesCount = fields.reduce((sum, field) => sum + (field.validationIssues?.length ?? 0), 0);
  const statuses: Record<string, ClaimDocument['status']> = { needs_review: 'Needs Review', ready_to_sync: 'Ready to Sync', synced: 'Approved', failed: 'Rejected' };
  return {
    id: raw.id, claimNumber: valueOf(fields, 'claim_reference', 'claim_number') || raw.id, fileName: raw.file_name ?? 'Uploaded document',
    fileSize: '—', pageCount: Number(raw.processed?.summary?.page_count ?? raw.pages ?? 1), claimType: claimType(raw.form_type_id),
    carrierName: matched?.name ?? 'Selected template', policyNumber: valueOf(fields, 'policy_number'),
    claimantNameEn: valueOf(fields, 'claimant_name', 'insured_name'), claimantNameMm: '', nrcNumber: valueOf(fields, 'nrc', 'nrc_number'),
    claimedAmount: amount, currency: valueOf(fields, 'currency') === 'USD' ? 'USD' : 'MMK', status: statuses[raw.status] ?? 'Processing',
    rawStatus: raw.status ?? 'uploaded', overallConfidence: percentage(raw.processed?.summary?.overall_confidence ??
      (fields.length ? fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length : 0)),
    templateMatchScore: percentage(raw.template_match?.score), matchedTemplateId: raw.template_id ?? '',
    matchedTemplateName: matched?.name ?? raw.template_id ?? 'Automatic match pending', uploadedAt: raw.created_at ?? '',
    age: displayAge(raw.created_at), assignedReviewer: 'Unassigned', issuesCount, fields,
    previewUrl: apiUrl(`/api/v1/documents/${encodeURIComponent(raw.id)}/source`),
    alignedPageBaseUrl: raw.processed?.summary?.aligned_page_count ? apiUrl(`/api/v1/documents/${encodeURIComponent(raw.id)}/pages`) : undefined,
    progress: raw.progress, failure: raw.failure,
  };
}

export function adaptAudit(raw: Json): AuditEvent {
  const action = String(raw.action ?? 'updated record');
  let actionType: AuditEvent['actionType'] = 'STATUS_CHANGED';
  if (action.includes('correct')) actionType = 'FIELD_CORRECTED';
  else if (action.includes('approved document')) actionType = 'DOCUMENT_APPROVED';
  else if (action.includes('synchron')) actionType = 'SYNCED_CORE_ERP';
  else if (action.includes('template')) actionType = 'TEMPLATE_MODIFIED';
  else if (action.includes('processing')) actionType = 'OCR_EXTRACTED';
  return {
    id: raw.id, timestamp: raw.created_at ?? '', documentId: raw.target_type === 'document' ? raw.target_id : undefined,
    documentRef: raw.target_type === 'document' ? raw.target_id : undefined,
    templateId: raw.target_type?.includes('template') ? raw.target_id : undefined,
    actor: { name: raw.actor ?? 'system', role: 'Application user', avatar: String(raw.actor ?? 'SY').slice(0, 2).toUpperCase() },
    actionType, description: action,
  };
}
