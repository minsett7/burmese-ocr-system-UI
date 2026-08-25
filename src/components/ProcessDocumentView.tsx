import React, { useState } from 'react';
import { 
  Check, 
  AlertCircle, 
  AlertTriangle, 
  FileText, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ShieldCheck, 
  Save, 
  ArrowRight, 
  Flag, 
  Sparkles, 
  CheckCircle2, 
  FileCheck, 
  ChevronDown, 
  ChevronUp,
  CornerDownLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCheck
} from 'lucide-react';
import { ClaimDocument, ExtractedField, FieldCategory, ValidationIssue } from '../types';

interface ProcessDocumentViewProps {
  document: ClaimDocument;
  onUpdateDocument: (doc: ClaimDocument) => void;
  onApproveAndNext: (doc: ClaimDocument) => void;
  onMarkReadyToSync: (doc: ClaimDocument) => void;
  onFlagForRescan: (doc: ClaimDocument) => void;
  isBurmese: boolean;
  onNavigateBack: () => void;
}

export const ProcessDocumentView: React.FC<ProcessDocumentViewProps> = ({
  document,
  onUpdateDocument,
  onApproveAndNext,
  onMarkReadyToSync,
  onFlagForRescan,
  isBurmese,
  onNavigateBack
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activePage, setActivePage] = useState(1);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string>('claimant_name_mm');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState<Record<FieldCategory, boolean>>({
    policy: false,
    claimant: false,
    incident: false,
    payment: false,
    internal: false
  });

  const toggleSection = (cat: FieldCategory) => {
    setCollapsedSections(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleFieldChange = (fieldId: string, newValue: string) => {
    const updatedFields = document.fields.map(f => {
      if (f.id === fieldId) {
        // Clear issue if user fixed it
        return {
          ...f,
          value: newValue,
          isEdited: true,
          confidence: Math.max(f.confidence, 95)
        };
      }
      return f;
    });

    onUpdateDocument({
      ...document,
      fields: updatedFields
    });
  };

  const handleAutoFixField = (fieldId: string, fixValue: string) => {
    const updatedFields = document.fields.map(f => {
      if (f.id === fieldId) {
        return {
          ...f,
          value: fixValue,
          isEdited: true,
          confidence: 98,
          validationIssues: []
        };
      }
      return f;
    });

    const remainingIssues = updatedFields.reduce((acc, f) => acc + (f.validationIssues?.length || 0), 0);

    onUpdateDocument({
      ...document,
      fields: updatedFields,
      issuesCount: remainingIssues
    });

    setToastMessage('Auto-corrected Burmese script medial spelling');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSave = () => {
    setToastMessage('Field corrections saved successfully');
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Group fields by category
  const groupedFields: Record<FieldCategory, ExtractedField[]> = {
    policy: document.fields.filter(f => f.category === 'policy'),
    claimant: document.fields.filter(f => f.category === 'claimant'),
    incident: document.fields.filter(f => f.category === 'incident'),
    payment: document.fields.filter(f => f.category === 'payment'),
    internal: document.fields.filter(f => f.category === 'internal')
  };

  const categoryMeta: Record<FieldCategory, { titleEn: string; titleMm: string }> = {
    policy: { titleEn: '1. Policy & Insurer Details', titleMm: '၁။ အာမခံ ပေါ်လစီနှင့် ကုမ္ပဏီ အချက်အလက်' },
    claimant: { titleEn: '2. Claimant & Identification', titleMm: '၂။ အာမခံထားသူနှင့် မှတ်ပုံတင်' },
    incident: { titleEn: '3. Incident & Occurrence', titleMm: '၃။ မတော်တဆ ဖြစ်စဉ် အသေးစိတ်' },
    payment: { titleEn: '4. Payment & Assessment', titleMm: '၄။ လျော်ကြေးနှင့် ပြင်ဆင်စရိတ်' },
    internal: { titleEn: '5. Internal Routing & Assessor', titleMm: '၅။ စစ်ဆေးရေးမှူးနှင့် အတွင်းပိုင်း မှတ်တမ်း' }
  };

  const selectedField = document.fields.find(f => f.key === selectedFieldKey);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {confidence}%
        </span>
      );
    }
    if (confidence >= 75) {
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          {confidence}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800">
        {confidence}% Low
      </span>
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Compact Review Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateBack}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            title="Back to queue"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                {document.claimNumber}
              </span>
              <span className="text-xs text-slate-500 font-medium truncate max-w-xs" title={document.fileName}>
                ({document.fileName})
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                <AlertCircle className="h-3 w-3" />
                {document.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-myanmar">
              {document.carrierName} • {document.claimType} • Uploaded {document.age}
            </div>
          </div>
        </div>

        {/* Confidence & Issue Summary Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Template Match Score */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">Template Match:</span>
            <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
              {document.templateMatchScore}%
            </span>
          </div>

          {/* OCR Confidence */}
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-1.5 border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500">OCR Average:</span>
            <span className={`font-mono text-xs font-bold ${
              document.overallConfidence >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {document.overallConfidence}%
            </span>
          </div>

          {/* Issue Count */}
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 border ${
            document.issuesCount > 0
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
              : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          }`}>
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="text-xs font-bold">
              {document.issuesCount} {document.issuesCount === 1 ? 'Alert' : 'Alerts'}
            </span>
          </div>
        </div>
      </div>

      {/* Split-Screen Review Layout (50/50 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Source Document Viewer (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col h-[740px]">
          {/* Document Header & Zoom Controls */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                Source Document Scan (Page {activePage}/{document.pageCount})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Page Selector */}
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
                <button
                  onClick={() => setActivePage(1)}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${activePage === 1 ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  Page 1
                </button>
                {document.pageCount > 1 && (
                  <button
                    onClick={() => setActivePage(2)}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${activePage === 2 ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                  >
                    Page 2
                  </button>
                )}
              </div>

              {/* Zoom */}
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
                <button
                  onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
                  className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(Math.min(160, zoomLevel + 15))}
                  className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Document Canvas Display */}
          <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 rounded-lg p-3 flex items-center justify-center">
            <div 
              className="relative bg-white shadow-xl border border-slate-300 dark:border-slate-700 transition-transform duration-150 origin-top text-slate-900"
              style={{
                width: `${460 * (zoomLevel / 100)}px`,
                minHeight: `${680 * (zoomLevel / 100)}px`,
                padding: '24px'
              }}
            >
              {/* Document Scan Header */}
              <div className="border-b-2 border-slate-800 pb-2 mb-3 text-center">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                  KBZ MS GENERAL INSURANCE CO., LTD.
                </div>
                <div className="text-sm font-extrabold text-slate-950 font-myanmar mt-0.5">
                  မော်တော်ယာဉ် မတော်တဆမှု လျော်ကြေးတောင်းခံလွှာ
                </div>
                <div className="text-[11px] font-semibold text-slate-700">
                  COMPREHENSIVE MOTOR VEHICLE CLAIM FORM (FORM-M04)
                </div>
                <div className="mt-1 flex justify-between text-[9px] font-mono text-slate-500">
                  <span>POLICY: POL-MTR-20260481</span>
                  <span>DOC: CLM-2026-0884</span>
                </div>
              </div>

              {/* Scanned Content Fields Simulation */}
              <div className="space-y-3.5 text-[9px] text-slate-800">
                {/* 1. Policy */}
                <div className="bg-slate-100 p-1 rounded font-bold uppercase tracking-wider text-slate-600">
                  1. Policy & Certificate Identification
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">Carrier:</span> KBZ MS General Insurance Co., Ltd.
                  </div>
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">Policy No:</span> POL-MTR-20260481
                  </div>
                </div>

                {/* 2. Claimant */}
                <div className="bg-slate-100 p-1 rounded font-bold uppercase tracking-wider text-slate-600">
                  2. Claimant Particulars
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">Name EN:</span> U AUNG KYAW THU
                  </div>
                  <div className="p-1 border border-slate-200 rounded font-myanmar bg-amber-50/50">
                    <span className="text-slate-400 font-sans">Name MM:</span> ဦးအောင်ကျော်သူ
                  </div>
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">NRC No:</span> 12/LKN(N)148293
                  </div>
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">Mobile Phone:</span> 09-420088192
                  </div>
                </div>
                <div className="p-1 border border-slate-200 rounded">
                  <span className="text-slate-400">Address:</span> No. 42, Inya Myaing Road, Bahan Township, Yangon
                </div>

                {/* 3. Incident */}
                <div className="bg-slate-100 p-1 rounded font-bold uppercase tracking-wider text-slate-600">
                  3. Incident & Damage Summary
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">Date/Time:</span> 2026-08-22 14:15
                  </div>
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">Location:</span> Pyay Road, Kamayut, Yangon
                  </div>
                </div>
                <div className="p-1 border border-slate-200 rounded">
                  <span className="text-slate-400">Vehicle Plate:</span> 7N-4821 (YGN)
                </div>
                <div className="p-1 border border-slate-200 rounded">
                  <span className="text-slate-400">Damage:</span> Front bumper collision with bus. Radiator bracket and headlight fractured.
                </div>

                {/* 4. Payment */}
                <div className="bg-slate-100 p-1 rounded font-bold uppercase tracking-wider text-slate-600">
                  4. Payment & Workshop
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1 border border-slate-200 rounded font-bold">
                    <span className="text-slate-400 font-normal">Estimate:</span> 3,850,000 MMK
                  </div>
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">Workshop:</span> Grand Star Motors (Bahan)
                  </div>
                </div>
                <div className="p-1 border border-slate-200 rounded bg-amber-50/50">
                  <span className="text-slate-400">Bank Account:</span> KBZ Bank — 039-301-891048123
                </div>

                {/* 5. Internal */}
                <div className="bg-slate-100 p-1 rounded font-bold uppercase tracking-wider text-slate-600">
                  5. Assessor Routing
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">Assessor:</span> U Myo Min Tun (#04)
                  </div>
                  <div className="p-1 border border-slate-200 rounded">
                    <span className="text-slate-400">Police Ref:</span> KMY-TP/2026/08-119
                  </div>
                </div>
              </div>

              {/* Dynamic Region Overlay for Selected Field */}
              {selectedField?.boundingBox && selectedField.boundingBox.page === activePage && (
                <div 
                  className="absolute border-2 border-blue-600 bg-blue-500/25 ring-4 ring-blue-500/30 rounded transition-all duration-200 z-20 pointer-events-none"
                  style={{
                    left: `${selectedField.boundingBox.x}%`,
                    top: `${selectedField.boundingBox.y}%`,
                    width: `${selectedField.boundingBox.width}%`,
                    height: `${selectedField.boundingBox.height}%`
                  }}
                >
                  <span className="absolute -top-4 left-0 text-[8px] font-mono px-1 rounded bg-blue-600 text-white font-bold whitespace-nowrap shadow-xs">
                    {selectedField.key} ({selectedField.confidence}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Extracted Fields Review Panel (6 cols) */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col h-[740px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-myanmar">
              {isBurmese ? 'OCR ထုတ်ယူထားသော အချက်အလက်များ' : 'Extracted Fields'} ({document.fields.length})
            </span>
            <span className="text-[11px] text-slate-400">
              Click any field to zoom source bounding box
            </span>
          </div>

          {/* Collapsible Grouped Fields List */}
          <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
            {(['policy', 'claimant', 'incident', 'payment', 'internal'] as FieldCategory[]).map((cat) => {
              const fields = groupedFields[cat];
              if (!fields || fields.length === 0) return null;
              const isCollapsed = collapsedSections[cat];
              const meta = categoryMeta[cat];
              const categoryIssues = fields.reduce((acc, f) => acc + (f.validationIssues?.length || 0), 0);

              return (
                <div 
                  key={cat}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 overflow-hidden"
                >
                  {/* Section Accordion Header */}
                  <button
                    onClick={() => toggleSection(cat)}
                    className="w-full flex items-center justify-between px-3 py-2 text-left bg-slate-100/60 dark:bg-slate-800/80 hover:bg-slate-200/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-myanmar">
                        {isBurmese ? meta.titleMm : meta.titleEn}
                      </span>
                      {categoryIssues > 0 && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {categoryIssues} alert
                        </span>
                      )}
                    </div>
                    {isCollapsed ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
                  </button>

                  {/* Section Fields */}
                  {!isCollapsed && (
                    <div className="p-3 space-y-2.5 bg-white dark:bg-slate-900">
                      {fields.map((field) => {
                        const isSelected = field.key === selectedFieldKey;
                        const hasIssues = field.validationIssues && field.validationIssues.length > 0;

                        return (
                          <div
                            key={field.id}
                            onClick={() => setSelectedFieldKey(field.key)}
                            className={`rounded-lg p-2.5 transition-all border ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-1 ring-blue-500/30'
                                : hasIssues
                                ? 'border-amber-300 bg-amber-50/20 dark:border-amber-800/70 dark:bg-amber-950/20'
                                : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-myanmar">
                                <span>{field.labelEn}</span>
                                <span className="text-[11px] text-slate-400 font-normal">({field.labelMm})</span>
                              </label>
                              <div className="flex items-center gap-1.5">
                                {field.isEdited && (
                                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Edited</span>
                                )}
                                {getConfidenceBadge(field.confidence)}
                              </div>
                            </div>

                            {/* Input Field (Normal vs Textarea) */}
                            {field.key === 'incident_description' ? (
                              <textarea
                                rows={2}
                                value={field.value}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-myanmar focus:border-blue-500 focus:outline-none"
                              />
                            ) : (
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className={`w-full rounded-md border px-2.5 py-1.5 text-xs font-medium dark:bg-slate-800 dark:text-slate-100 font-myanmar focus:outline-none transition-all ${
                                  hasIssues
                                    ? 'border-amber-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-400 bg-amber-50/30'
                                    : 'border-slate-200 dark:border-slate-700 bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                                }`}
                              />
                            )}

                            {/* Validation Warnings with 1-click Fix */}
                            {hasIssues && (
                              <div className="mt-2 space-y-1">
                                {field.validationIssues!.map((issue) => (
                                  <div
                                    key={issue.id}
                                    className="flex items-start justify-between gap-2 rounded-md bg-amber-50 dark:bg-amber-950/60 p-2 text-[11px] text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                  >
                                    <div className="flex items-start gap-1.5">
                                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 mt-0.5" />
                                      <div>
                                        <div>{issue.message}</div>
                                        {issue.messageMm && (
                                          <div className="font-myanmar text-amber-900 dark:text-amber-200 mt-0.5">
                                            {issue.messageMm}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {issue.autoFixable && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAutoFixField(field.id, 'ဦးအောင်ကျော်သူ');
                                        }}
                                        className="shrink-0 rounded bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs hover:bg-amber-700 transition-colors"
                                      >
                                        Auto Fix
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Persistent Bottom Review Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-3 backdrop-blur-md shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onFlagForRescan(document)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300 transition-colors"
          >
            <Flag className="h-3.5 w-3.5" />
            <span className="font-myanmar">{isBurmese ? 'ပြန်လည် Scan ပြုလုပ်ရန် မှတ်သားမည်' : 'Flag for re-scan'}</span>
          </button>

          <button
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="font-myanmar">{isBurmese ? 'ပြင်ဆင်ချက် သိမ်းမည်' : 'Save changes'}</span>
          </button>
        </div>

        {/* Secondary Shortcuts Hint & Primary Approval Action */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 font-mono">
            <span>Shortcuts:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">Tab</kbd> next field
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">⌘↵</kbd> approve
          </div>

          <button
            onClick={() => onMarkReadyToSync(document)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 transition-colors"
          >
            <FileCheck className="h-3.5 w-3.5" />
            <span className="font-myanmar">{isBurmese ? 'ချိတ်ဆက်ရန် အတည်ပြု' : 'Mark ready to sync'}</span>
          </button>

          <button
            id="approve-next-btn"
            onClick={() => onApproveAndNext(document)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <CheckCheck className="h-4 w-4" />
            <span className="font-myanmar">{isBurmese ? 'အတည်ပြုပြီး နောက်တစ်ခုသို့ (Approve & Next)' : 'Approve & Next (⌘↵)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
