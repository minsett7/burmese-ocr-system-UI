import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, FilePlus2, Loader2, Plus, RefreshCw, Save, Trash2, Upload, WandSparkles } from 'lucide-react';
import { approveTemplate, beginTemplateRevision, deleteTemplateRegistration, retryTemplateAnalysis, saveTemplateDraft, startTemplateAnalysis, technicalError, userError, validateTemplate } from '../api';
import { EditableRegion, FormCategory, TemplateRegistration } from '../types';

interface TemplateWorkspaceProps {
  registrations: TemplateRegistration[];
  categories: FormCategory[];
  selectedRegistrationId?: string;
  onSelectRegistration: (id: string) => void;
  onChanged: (preferredId?: string) => Promise<void>;
  isBurmese: boolean;
}

const allowedFilePattern = /\.(pdf|png|jpe?g|webp|tiff?)$/i;
const friendlyStages: Record<string, string> = {
  queued: 'Waiting to start...', upload_validation: 'Checking your file...',
  visual_upload: 'Sending the form for analysis...', preprocessing: 'Preparing a clear document image...',
  capture_quality: 'Checking document image quality...', layout_and_ocr: 'Finding fields and reading labels...',
  contract_validation: 'Checking the detected form structure...', semantic_mapping: 'Understanding field meanings...',
  vlm_poll: 'Understanding field meanings...', relationship_validation: 'Checking field relationships...',
  human_review: 'Preparing your review...',
  registered: 'Template saved', failed: 'Analysis stopped',
};

export const TemplateWorkspace: React.FC<TemplateWorkspaceProps> = ({
  registrations, categories, selectedRegistrationId, onSelectRegistration, onChanged,
}) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const selected = registrations.find(item => item.id === selectedRegistrationId) ?? registrations[0];
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formTypeId, setFormTypeId] = useState('motor');
  const [creating, setCreating] = useState(registrations.length === 0);
  const [regions, setRegions] = useState<EditableRegion[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>();
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    setRegions(selected?.draft?.regions ? structuredClone(selected.draft.regions) : []);
    setSelectedRegionId(selected?.draft?.regions?.find(region => region.enabled !== false)?.id);
    setPage(selected?.draft?.page?.page_number ?? selected?.draft?.pages?.[0]?.page_number ?? 1);
    setError('');
    setValidationErrors([]);
  }, [selected?.id, selected?.draftRevision]);

  const selectedRegion = regions.find(region => region.id === selectedRegionId);
  const pageIndex = Math.max(0, (selected?.draft?.pages ?? (selected?.draft?.page ? [selected.draft.page] : [])).findIndex(item => item.page_number === page));
  const preview = selected?.pageUrls[pageIndex];
  const enabledRegions = regions.filter(region => region.enabled !== false && region.page === page);
  const reviewCount = regions.filter(region => region.enabled !== false && region.review_required).length;
  const isEditable = Boolean(selected?.draft) && selected?.rawStatus !== 'registered';
  const canAnalyze = Boolean(file && name.trim() && formTypeId && !busy);
  const isProcessing = Boolean(selected && !['needs_approval', 'needs_resubmission', 'registered', 'failed'].includes(selected.rawStatus));

  const visibleRegistrations = useMemo(
    () => [...registrations].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
    [registrations],
  );

  function chooseFile(next: File | null) {
    setError('');
    if (next && !allowedFilePattern.test(next.name)) {
      setFile(null);
      setError('Choose a PDF, PNG, JPG, WEBP, or TIFF file.');
      return;
    }
    setFile(next);
    if (next && !name) setName(next.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
  }

  async function runAnalysis() {
    if (!file || !canAnalyze) return;
    setBusy(true); setError(''); setDetails(''); setValidationErrors([]);
    try {
      const accepted = await startTemplateAnalysis(file, { name: name.trim(), description, formTypeId });
      setFile(null); setCreating(false);
      if (fileInput.current) fileInput.current.value = '';
      await onChanged(accepted.id);
      onSelectRegistration(accepted.id);
    } catch (caught) {
      setError(userError(caught)); setDetails(technicalError(caught));
    } finally { setBusy(false); }
  }

  function selectRegistration(id: string) {
    setCreating(false); setFile(null); setError(''); setDetails(''); setValidationErrors([]);
    if (fileInput.current) fileInput.current.value = '';
    onSelectRegistration(id);
  }

  async function retryAnalysis() {
    if (!selected || selected.rawStatus !== 'failed' || busy) return;
    setBusy(true); setError(''); setDetails('');
    try { await retryTemplateAnalysis(selected.id); await onChanged(selected.id); }
    catch (caught) { setError(userError(caught)); setDetails(technicalError(caught)); }
    finally { setBusy(false); }
  }

  function updateRegion(patch: Partial<EditableRegion>) {
    if (!selectedRegion) return;
    setRegions(current => current.map(region => region.id === selectedRegion.id
      ? { ...region, ...patch, review_required: false, review_reasons: [] }
      : region));
  }

  function addRegion() {
    const suffix = Date.now().toString(36);
    const manual: EditableRegion = {
      id: `manual_${suffix}`, field_id: `manual_field_${suffix}`, page, key: `new_field_${regions.length + 1}`,
      label: 'New field', data_type: 'text', extraction_mode: 'printed_text', required: false, confidence: 1,
      bbox: { x: 0.1, y: 0.1, width: 0.25, height: 0.05 }, source_region_ids: [], review_required: false,
      review_reasons: [], enabled: true, geometry_source: 'manual', region_type: 'INPUT_LINE',
    };
    setRegions(current => [...current, manual]); setSelectedRegionId(manual.id);
  }

  async function saveTemplate() {
    if (!selected || !isEditable || busy) return;
    setBusy(true); setError(''); setDetails(''); setValidationErrors([]);
    try {
      const saved = await saveTemplateDraft(selected, regions);
      const validation = await validateTemplate(saved.id);
      if (!validation.valid) {
        setValidationErrors(validation.errors);
        setError('Review the highlighted field issues before saving the template.');
        await onChanged(saved.id);
        return;
      }
      await approveTemplate(saved.id);
      await onChanged(saved.id);
    } catch (caught) {
      setError(userError(caught)); setDetails(technicalError(caught));
    } finally { setBusy(false); }
  }

  async function reviseTemplate() {
    if (!selected || busy) return;
    setBusy(true); setError('');
    try { await beginTemplateRevision(selected.id); await onChanged(selected.id); }
    catch (caught) { setError(userError(caught)); setDetails(technicalError(caught)); }
    finally { setBusy(false); }
  }

  async function removeTemplate() {
    if (!selected || busy || !window.confirm(`Remove “${selected.name}” from the application?`)) return;
    setBusy(true);
    try { await deleteTemplateRegistration(selected.id); await onChanged(); }
    catch (caught) { setError(userError(caught)); setDetails(technicalError(caught)); }
    finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-7xl space-y-5 pb-10">
    {/* Keep the picker mounted even while an existing template is open. */}
    <input ref={fileInput} className="hidden" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.tif,.tiff" onChange={event => chooseFile(event.target.files?.[0] ?? null)}/>
    <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Template Studio</p>
        <h1 className="mt-1 text-2xl font-bold">Teach the system a blank claim form</h1>
        <p className="mt-1 text-sm text-slate-500">Upload, analyze, review the fields, and save. The OCR pipeline runs automatically.</p></div>
      <button onClick={() => {
        setCreating(true); setFile(null); setName(''); setDescription(''); setError(''); setDetails(''); setValidationErrors([]);
        if (fileInput.current) fileInput.current.value = '';
        fileInput.current?.click();
      }}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
        <FilePlus2 className="h-4 w-4" /> New template
      </button>
    </header>

    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">Templates</div>
        <div className="max-h-[70vh] space-y-1 overflow-y-auto">
          {visibleRegistrations.map(item => <button key={item.id} onClick={() => selectRegistration(item.id)}
            className={`w-full rounded-lg border p-3 text-left ${!creating && item.id === selected?.id ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            <div className="truncate text-sm font-semibold">{item.name}</div>
            <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-slate-500">
              <span className="truncate">{item.fileName}</span><span className={item.rawStatus === 'registered' ? 'text-emerald-600' : item.rawStatus === 'failed' ? 'text-red-600' : item.rawStatus === 'needs_resubmission' ? 'text-orange-600' : 'text-amber-600'}>{item.status}</span>
            </div>
          </button>)}
          {!visibleRegistrations.length && <p className="p-4 text-center text-sm text-slate-500">No templates yet.</p>}
        </div>
      </aside>

      <section className="space-y-5">
        <div className="grid grid-cols-4 gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          {['Upload', 'Analyze', 'Review', 'Save'].map((stage, index) => {
            const current = creating
              ? (busy ? .25 : file ? .2 : 0)
              : selected?.rawStatus === 'registered' ? 1
                : selected?.draft ? .75
                  : selected ? Math.min(.5, Number(selected.progress?.percent ?? 5) / 100) : 0;
            const done = current >= (index + 1) / 4;
            return <div key={stage} className={`rounded-lg px-3 py-2 text-center text-xs font-bold ${done ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'}`}>
              <span className="mr-1">{done ? '✓' : index + 1}.</span>{stage}
            </div>;
          })}
        </div>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <div className="flex gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0"/><div><strong>{error}</strong>
            {validationErrors.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{validationErrors.map(item => <li key={item}>{item}</li>)}</ul>}
          </div></div>
          {details && <details className="mt-3"><summary className="cursor-pointer text-xs font-semibold">Developer details</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs">{details}</pre></details>}
        </div>}

        {(creating || !selected) && <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); chooseFile(event.dataTransfer.files[0] ?? null); }}
            onClick={() => fileInput.current?.click()} className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-blue-400 hover:bg-blue-50/40 dark:border-slate-700 dark:hover:bg-blue-950/20">
            <Upload className="mx-auto h-8 w-8 text-blue-600"/><strong className="mt-3 block">{file?.name ?? 'Choose or drop a blank form'}</strong>
            <span className="mt-1 block text-xs text-slate-500">PDF, PNG, JPG, WEBP, or TIFF · up to the server upload limit</span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">Template name<input value={name} onChange={event => setName(event.target.value)} maxLength={160}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"/></label>
            <label className="text-xs font-semibold text-slate-600">Form category<select value={formTypeId} onChange={event => setFormTypeId(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950">
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          </div>
          <label className="mt-4 block text-xs font-semibold text-slate-600">Description (optional)<textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={2000}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950" rows={2}/></label>
          <button disabled={!canAnalyze} onClick={runAnalysis} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <WandSparkles className="h-4 w-4"/>}{busy ? 'Starting analysis...' : 'Analyze template'}
          </button>
        </div>}

        {!creating && selected && !selected.draft && <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          {isProcessing && <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="rounded-full bg-blue-50 p-3 text-blue-600 dark:bg-blue-950/50"><Loader2 className="h-6 w-6 animate-spin"/></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">Analysis is running in the background</h2>
              <p className="mt-1 text-sm text-slate-500">{friendlyStages[selected.progress?.stage ?? ''] ?? 'Analyzing the form and detecting its fields...'}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full bg-blue-600 transition-all" style={{width: `${Math.max(3, Number(selected.progress?.percent ?? 3))}%`}}/></div>
              <div className="mt-2 flex justify-between text-xs text-slate-500"><span>You can open another template while this continues.</span><span>{Math.round(Number(selected.progress?.percent ?? 0))}%</span></div>
            </div>
          </div>}

          {selected.rawStatus === 'failed' && <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="rounded-full bg-red-50 p-3 text-red-600 dark:bg-red-950/50"><AlertCircle className="h-6 w-6"/></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">We couldn't analyze this template</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selected.failure?.message ?? 'The analysis stopped before a review draft could be created.'}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button disabled={busy} onClick={retryAnalysis} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>} Retry analysis</button>
                <button disabled={busy} onClick={removeTemplate} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4"/> Delete</button>
              </div>
              {selected.failure && <details className="mt-4"><summary className="cursor-pointer text-xs font-semibold text-slate-500">Developer details</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-950">{JSON.stringify(selected.failure, null, 2)}</pre></details>}
            </div>
          </div>}

          {selected.rawStatus === 'needs_resubmission' && <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="rounded-full bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/50"><AlertCircle className="h-6 w-6"/></div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold">A clearer form image is needed</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">The uploaded image did not pass the document quality check. Start a new upload with a clearer scan or photo.</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={() => { setCreating(true); setFile(null); setName(selected.name); setDescription(selected.description); setFormTypeId(selected.formTypeId); setError(''); fileInput.current?.click(); }} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"><Upload className="h-4 w-4"/> Upload replacement</button>
                <button disabled={busy} onClick={removeTemplate} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4"/> Delete</button>
              </div>
            </div>
          </div>}
        </div>}

        {!creating && selected?.draft && <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div><h2 className="font-bold">{selected.name}</h2><p className="text-xs text-slate-500">{regions.filter(region => region.enabled !== false).length} fields · {reviewCount} need attention</p></div>
            <div className="flex gap-2">
              {selected.rawStatus === 'registered' && <button disabled={busy} onClick={reviseTemplate} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold">Edit template</button>}
              <button disabled={busy} onClick={removeTemplate} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600"><Trash2 className="inline h-3.5 w-3.5"/> Remove</button>
              {isEditable && <button disabled={busy} onClick={saveTemplate} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                {busy ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>} Save template</button>}
            </div>
          </div>

          <div className="grid min-h-[620px] gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
            <div className="rounded-xl border border-slate-200 bg-slate-200 p-4 dark:border-slate-800 dark:bg-slate-950">
              {(selected.draft.pages?.length ?? 1) > 1 && <div className="mb-3 flex gap-2">{(selected.draft.pages ?? [selected.draft.page!]).map(item => <button key={item.page_number} onClick={() => setPage(item.page_number)} className={`rounded px-3 py-1 text-xs ${page === item.page_number ? 'bg-blue-600 text-white' : 'bg-white'}`}>Page {item.page_number}</button>)}</div>}
              <div className="relative mx-auto overflow-hidden rounded bg-white shadow" style={{aspectRatio: `${selected.draft.pages?.[pageIndex]?.width ?? selected.draft.page?.width ?? 1}/${selected.draft.pages?.[pageIndex]?.height ?? selected.draft.page?.height ?? 1}`}}>
                {preview && <img src={preview} alt={`Template page ${page}`} className="h-full w-full object-contain"/>}
                {enabledRegions.map(region => <button key={region.id} onClick={() => setSelectedRegionId(region.id)} title={region.label}
                  className={`absolute border-2 ${region.id === selectedRegionId ? 'z-10 border-blue-600 bg-blue-500/15' : region.review_required ? 'border-amber-500 bg-amber-400/10' : 'border-emerald-500 bg-emerald-400/5'}`}
                  style={{left:`${region.bbox.x*100}%`,top:`${region.bbox.y*100}%`,width:`${region.bbox.width*100}%`,height:`${region.bbox.height*100}%`}}/>)}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800"><div><h3 className="font-bold">Detected fields</h3><p className="text-xs text-slate-500">Select a field to rename or reposition it.</p></div>
                {isEditable && <button onClick={addRegion} className="rounded-lg border border-slate-300 p-2" title="Add missing field"><Plus className="h-4 w-4"/></button>}</div>
              <div className="max-h-72 overflow-y-auto p-2">{regions.filter(region => region.enabled !== false).map(region => <button key={region.id} onClick={() => {setSelectedRegionId(region.id);setPage(region.page);}}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg p-2.5 text-left ${region.id === selectedRegionId ? 'bg-blue-50 dark:bg-blue-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                <span className={`h-2 w-2 rounded-full ${region.review_required ? 'bg-amber-500' : 'bg-emerald-500'}`}/><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{region.label}</strong><small className="font-mono text-slate-500">{region.key}</small></span><span className="text-[10px] text-slate-400">{Math.round(region.confidence*100)}%</span></button>)}</div>

              {selectedRegion && <div className="space-y-3 border-t border-slate-200 p-4 dark:border-slate-800">
                <label className="block text-xs font-semibold">Field label<input disabled={!isEditable} value={selectedRegion.label} onChange={event => updateRegion({label:event.target.value})} className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60"/></label>
                <label className="block text-xs font-semibold">Field key<input disabled={!isEditable} value={selectedRegion.key} onChange={event => updateRegion({key:event.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'_')})} className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-mono text-sm disabled:opacity-60"/></label>
                <label className="block text-xs font-semibold">How to read this field<select disabled={!isEditable} value={selectedRegion.extraction_mode ?? ''} onChange={event => updateRegion({extraction_mode:event.target.value})} className="mt-1 w-full rounded-lg border border-slate-300 bg-transparent px-3 py-2 text-sm disabled:opacity-60">
                  <option value="">Choose a field type</option><option value="printed_text">Printed text</option><option value="handwriting">Handwriting</option><option value="checkbox">Checkbox</option><option value="table">Table</option><option value="signature">Signature</option>
                </select></label>
                <div className="grid grid-cols-4 gap-2">{(['x','y','width','height'] as const).map(key => <label key={key} className="text-[10px] font-bold uppercase text-slate-500">{key}<input disabled={!isEditable} type="number" min="0" max="1" step="0.01" value={selectedRegion.bbox[key]} onChange={event => updateRegion({bbox:{...selectedRegion.bbox,[key]:Math.max(0,Math.min(1,Number(event.target.value)))}})} className="mt-1 w-full rounded border border-slate-300 bg-transparent p-1.5 text-xs"/></label>)}</div>
                {selectedRegion.review_required && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><strong>Check this field</strong>{selectedRegion.review_reasons.map(reason => <p key={reason} className="mt-1">{reason}</p>)}
                  {isEditable && <button onClick={() => updateRegion({review_required:false,review_reasons:[]})} className="mt-2 inline-flex items-center gap-1 rounded bg-amber-600 px-2 py-1 font-bold text-white"><Check className="h-3 w-3"/> Accept mapping</button>}</div>}
                {isEditable && <button onClick={() => updateRegion({enabled:false})} className="text-xs font-semibold text-red-600"><Trash2 className="mr-1 inline h-3.5 w-3.5"/>Remove incorrect field</button>}
              </div>}
              <button onClick={() => setAdvanced(value => !value)} className="flex w-full items-center justify-between border-t border-slate-200 p-4 text-xs font-bold dark:border-slate-800">Advanced details <ChevronDown className={`h-4 w-4 transition-transform ${advanced?'rotate-180':''}`}/></button>
              {advanced && <pre className="max-h-52 overflow-auto border-t border-slate-200 bg-slate-50 p-4 text-[10px] dark:border-slate-800 dark:bg-slate-950">{JSON.stringify({status:selected.rawStatus,progress:selected.progress,warnings:selected.draft.warnings,region:selectedRegion},null,2)}</pre>}
            </div>
          </div>
        </>}
      </section>
    </div>
  </div>;
};
