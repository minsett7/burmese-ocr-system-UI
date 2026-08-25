import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, RefreshCw, Save, Send, Trash2, Upload } from 'lucide-react';
import { technicalError, userError } from '../api';
import { ClaimDocument, OCRTemplate, ProgressState } from '../types';

interface ProcessDocumentViewProps {
  document?: ClaimDocument;
  templates: OCRTemplate[];
  onProcess: (file: File, templateId: string, onProgress: (value: ProgressState) => void) => Promise<void>;
  onUpdateDocument: (doc: ClaimDocument) => void;
  onSave: (doc: ClaimDocument) => Promise<void>;
  onApprove: (doc: ClaimDocument) => Promise<void>;
  onSync: (doc: ClaimDocument) => Promise<void>;
  onReprocess: (doc: ClaimDocument) => Promise<void>;
  onDelete: (doc: ClaimDocument) => Promise<void>;
  onNavigateBack: () => void;
}

const friendlyStages: Record<string, string> = {
  queued: 'Uploading document…', preprocessing: 'Preparing document image…', matching_template: 'Matching the template…',
  extracting: 'Extracting fields…', postprocessing: 'Validating results…', completed: 'Preparing review…', failed: 'Processing stopped',
};

export const ProcessDocumentView: React.FC<ProcessDocumentViewProps> = ({
  document, templates, onProcess, onUpdateDocument, onSave, onApprove, onSync, onReprocess, onDelete, onNavigateBack,
}) => {
  const activeTemplates = templates.filter(template => template.status === 'Active');
  const [templateId, setTemplateId] = useState(activeTemplates[0]?.id ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<ProgressState>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [details, setDetails] = useState('');
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    if (!templateId && activeTemplates[0]) setTemplateId(activeTemplates[0].id);
  }, [activeTemplates, templateId]);

  const changedCount = document?.fields.filter(field => field.isEdited).length ?? 0;
  const reviewFields = useMemo(() => document?.fields.filter(field =>
    field.confidence < 80 || (field.validationIssues?.length ?? 0) > 0) ?? [], [document]);

  async function perform(action: () => Promise<void>, success: string) {
    setBusy(true); setError(''); setDetails(''); setMessage('');
    try { await action(); setMessage(success); }
    catch (caught) { setError(userError(caught)); setDetails(technicalError(caught)); }
    finally { setBusy(false); }
  }

  async function startProcessing() {
    if (!file || !templateId) return;
    setBusy(true); setError(''); setDetails(''); setMessage('');
    try { await onProcess(file, templateId, setProgress); setMessage('Document is ready for review.'); setFile(null); }
    catch (caught) { setError(userError(caught)); setDetails(technicalError(caught)); }
    finally { setBusy(false); }
  }

  function changeField(fieldId: string, value: string) {
    if (!document) return;
    onUpdateDocument({ ...document, fields: document.fields.map(field => field.id === fieldId
      ? { ...field, value, isEdited: value !== field.originalOcrValue }
      : field) });
  }

  return <div className="mx-auto max-w-7xl space-y-5 pb-10">
    <header className="flex items-center gap-3">
      <button onClick={onNavigateBack} className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"><ArrowLeft className="h-4 w-4"/></button>
      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Process & Review</p>
        <h1 className="text-2xl font-bold">Extract a completed claim form</h1></div>
    </header>

    {(error || message) && <div className={`rounded-xl border p-4 text-sm ${error ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'}`}>
      <div className="flex gap-2">{error ? <AlertCircle className="h-4 w-4"/> : <CheckCircle2 className="h-4 w-4"/>}<strong>{error || message}</strong></div>
      {details && <details className="mt-2"><summary className="cursor-pointer text-xs">Developer details</summary><pre className="mt-2 whitespace-pre-wrap text-xs">{details}</pre></details>}
    </div>}

    <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="grid items-end gap-4 md:grid-cols-[minmax(220px,.8fr)_minmax(260px,1fr)_auto]">
        <label className="text-xs font-bold text-slate-600">1. Select template<select value={templateId} onChange={event => setTemplateId(event.target.value)} disabled={busy}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950">
          <option value="">Choose an active template</option>{activeTemplates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label>
        <label className="text-xs font-bold text-slate-600">2. Upload completed form<span className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2.5 text-sm font-normal dark:border-slate-700">
          <Upload className="h-4 w-4 text-blue-600"/><span className="truncate">{file?.name ?? 'Choose PDF or image'}</span>
          <input className="hidden" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff" disabled={busy} onChange={event => setFile(event.target.files?.[0] ?? null)}/></span></label>
        <button disabled={!file || !templateId || busy} onClick={startProcessing} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {busy && progress ? <Loader2 className="h-4 w-4 animate-spin"/> : <FileText className="h-4 w-4"/>} Process document</button>
      </div>
      {busy && progress && <div className="mt-4"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>{friendlyStages[progress.stage] ?? progress.message ?? 'Analyzing document…'}</span><span>{progress.percent ?? 0}%</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full bg-blue-600 transition-all" style={{width:`${progress.percent ?? 3}%`}}/></div></div>}
      {!activeTemplates.length && <p className="mt-3 text-xs text-amber-700">Save at least one template before processing a completed form.</p>}
    </section>

    {document ? <>
      <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex flex-wrap items-center gap-2"><strong className="font-mono">{document.claimNumber}</strong>
          <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase text-blue-700 dark:bg-blue-950">{document.status}</span></div>
          <p className="mt-1 text-xs text-slate-500">{document.fileName} · {document.matchedTemplateName} · {document.overallConfidence.toFixed(0)}% confidence</p></div>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} onClick={() => perform(() => onReprocess(document), 'Document queued for reprocessing.')} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold"><RefreshCw className="h-3.5 w-3.5"/> Reprocess</button>
          <button disabled={busy} onClick={() => document && window.confirm(`Remove “${document.fileName}”?`) && perform(() => onDelete(document), 'Document removed.')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600"><Trash2 className="h-3.5 w-3.5"/></button>
        </div>
      </section>

      {document.rawStatus === 'failed' ? <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
        <h2 className="font-bold">We couldn't process this document.</h2><p className="mt-1 text-sm">Verify the scan and selected template, then reprocess or upload it again.</p>
        <details className="mt-3 text-xs"><summary>Developer details</summary><pre className="mt-2 whitespace-pre-wrap">{JSON.stringify(document.failure ?? {}, null, 2)}</pre></details>
      </section> : <div className="grid min-h-[620px] gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(380px,.9fr)]">
        <section className="rounded-xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950">
          {document.pageCount > 1 && <div className="mb-3 flex gap-2">{Array.from({length:document.pageCount},(_,index)=>index+1).map(number => <button key={number} onClick={()=>setActivePage(number)} className={`rounded px-3 py-1 text-xs ${number===activePage?'bg-blue-600 text-white':'bg-white text-slate-700'}`}>Page {number}</button>)}</div>}
          {document.alignedPageBaseUrl ? <img src={`${document.alignedPageBaseUrl}/${activePage}`} alt={`Processed page ${activePage}`} className="mx-auto max-h-[72vh] rounded bg-white object-contain shadow"/>
            : <iframe src={document.previewUrl} title={document.fileName} className="h-[72vh] w-full rounded bg-white shadow"/>}
        </section>

        <section className="flex flex-col rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-200 p-4 dark:border-slate-800"><h2 className="font-bold">Review extracted information</h2>
            <p className="mt-1 text-xs text-slate-500">{reviewFields.length ? `${reviewFields.length} field(s) need attention.` : 'No extraction warnings. Check the values before confirming.'}</p></div>
          <div className="max-h-[61vh] flex-1 space-y-3 overflow-y-auto p-4">
            {document.fields.map(field => <label key={field.id} className={`block rounded-lg border p-3 ${field.validationIssues?.length || field.confidence < 80 ? 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-800'}`}>
              <span className="flex items-center justify-between gap-2 text-xs font-bold"><span>{field.labelEn}</span><span className={field.confidence<80?'text-amber-600':'text-emerald-600'}>{field.confidence.toFixed(0)}%</span></span>
              {field.dataType === 'boolean' ? <select value={field.value} onChange={event=>changeField(field.id,event.target.value)} className="mt-2 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="">Not set</option><option value="true">Yes</option><option value="false">No</option></select>
                : <input value={field.value} onChange={event=>changeField(field.id,event.target.value)} className="mt-2 w-full rounded border border-slate-300 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"/>}
              {field.validationIssues?.map(issue => <span key={issue.id} className="mt-1 block text-[11px] text-amber-700">{issue.message}</span>)}
              {field.isEdited && <span className="mt-1 block text-[10px] font-bold text-blue-600">Edited</span>}
            </label>)}
            {!document.fields.length && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No fields were extracted. Reprocess the file or verify the template.</div>}
          </div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
            <button disabled={busy || !changedCount} onClick={() => perform(() => onSave(document), 'Corrections saved.')} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-40"><Save className="h-3.5 w-3.5"/> Save changes</button>
            {document.rawStatus === 'ready_to_sync' ? <button disabled={busy} onClick={() => perform(() => onSync(document), 'Document confirmed and synchronized.')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white"><Send className="h-3.5 w-3.5"/> Confirm & sync</button>
              : document.rawStatus !== 'synced' && <button disabled={busy || !document.fields.length} onClick={() => perform(() => onApprove(document), 'Document approved and ready to sync.')} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5"/> Approve</button>}
          </div>
        </section>
      </div>}
    </> : <section className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500 dark:border-slate-700"><Upload className="mx-auto h-8 w-8"/><p className="mt-3 text-sm">Select a template and upload a completed claim form to begin.</p></section>}
  </div>;
};
