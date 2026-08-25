import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sliders, 
  Layers, 
  ShieldCheck, 
  Save, 
  Check, 
  AlertTriangle, 
  Trash2, 
  Eye, 
  EyeOff, 
  ChevronRight, 
  FileText,
  MousePointer,
  Crosshair,
  ArrowRight,
  Maximize2
} from 'lucide-react';
import { OCRTemplate, TemplateRegion, FieldCategory, TemplateStatus } from '../types';

interface TemplateWorkspaceProps {
  templates: OCRTemplate[];
  selectedTemplate: OCRTemplate;
  onSelectTemplate: (tmpl: OCRTemplate) => void;
  onUpdateTemplate: (tmpl: OCRTemplate) => void;
  isBurmese: boolean;
}

export const TemplateWorkspace: React.FC<TemplateWorkspaceProps> = ({
  templates,
  selectedTemplate,
  onSelectTemplate,
  onUpdateTemplate,
  isBurmese
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Editor states
  const [currentZoom, setCurrentZoom] = useState(100); // 50 to 180
  const [selectedRegionId, setSelectedRegionId] = useState<string>('reg-01');
  const [activeStage, setActiveStage] = useState<'Upload' | 'Detect regions' | 'Map fields' | 'Review' | 'Approve'>('Review');
  const [highlightBoxes, setHighlightBoxes] = useState(true);
  const [activePage, setActivePage] = useState(1);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const selectedRegion = selectedTemplate.regions.find(r => r.id === selectedRegionId) || selectedTemplate.regions[0];

  const stages = [
    { name: 'Upload', nameMm: 'ဖိုင်တင်သွင်းရန်', num: '1' },
    { name: 'Detect regions', nameMm: 'အပိုင်းများ ရှာဖွေရန်', num: '2' },
    { name: 'Map fields', nameMm: 'အကွက်များ ချိတ်ဆက်ရန်', num: '3' },
    { name: 'Review', nameMm: 'စစ်ဆေးအတည်ပြုရန်', num: '4' },
    { name: 'Approve', nameMm: 'တရားဝင် သတ်မှတ်ရန်', num: '5' }
  ];

  const filteredTemplates = templates.filter(t => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = t.name.toLowerCase().includes(q) || 
                    t.nameMm.toLowerCase().includes(q) || 
                    t.code.toLowerCase().includes(q) || 
                    t.carrier.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (categoryFilter !== 'all' && t.claimType !== categoryFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const handleUpdateRegion = (updated: Partial<TemplateRegion>) => {
    if (!selectedRegion) return;
    const updatedRegions = selectedTemplate.regions.map(r => 
      r.id === selectedRegion.id ? { ...r, ...updated } : r
    );
    onUpdateTemplate({
      ...selectedTemplate,
      regions: updatedRegions
    });
  };

  const handleSaveDraft = () => {
    setSaveToast('Draft saved successfully with 15 configured regions');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleApproveTemplate = () => {
    onUpdateTemplate({
      ...selectedTemplate,
      status: 'Active',
      stage: 'Approve'
    });
    setSaveToast(`Template ${selectedTemplate.code} approved and deployed to production`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleAutoDetect = () => {
    setSaveToast('AI Region Engine re-aligned 15 bounding boxes with 98.6% precision');
    setTimeout(() => setSaveToast(null), 3000);
  };

  const getRegionStatusBadge = (status: TemplateRegion['status']) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Approved</span>;
      case 'review_required':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">Review</span>;
      case 'detected':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Detected</span>;
      case 'disabled':
        return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">Disabled</span>;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Toast alert */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold">{saveToast}</span>
        </div>
      )}

      {/* Top Template Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-myanmar">
                {selectedTemplate.name}
              </h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                {selectedTemplate.code} ({selectedTemplate.version})
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                selectedTemplate.status === 'Active' 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {selectedTemplate.status}
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-myanmar">
              {selectedTemplate.carrier} • {selectedTemplate.claimType} • {selectedTemplate.fieldCount} mapped regions
            </div>
          </div>
        </div>

        {/* View mode toggle & Template Selector dropdown */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTemplate.id}
            onChange={(e) => {
              const tmpl = templates.find(t => t.id === e.target.value);
              if (tmpl) onSelectTemplate(tmpl);
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name.slice(0, 32)}... ({t.status})
              </option>
            ))}
          </select>

          <button
            onClick={() => setViewMode(viewMode === 'editor' ? 'list' : 'editor')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {viewMode === 'editor' ? 'View Template Registry' : 'Back to Visual Editor'}
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Template Registry List View */
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-myanmar">
                {isBurmese ? 'တမ်းပလိတ်များ စာရင်း' : 'Carrier Template Registry'}
              </h2>
              <p className="text-xs text-slate-500">Manage OCR region mapping rules for Myanmar insurance carrier claim forms</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active (1)</option>
                <option value="Awaiting Approval">Awaiting Approval (6)</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((tmpl) => (
              <div 
                key={tmpl.id}
                onClick={() => {
                  onSelectTemplate(tmpl);
                  setViewMode('editor');
                }}
                className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${
                  tmpl.id === selectedTemplate.id
                    ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 dark:border-blue-700 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {tmpl.code}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    tmpl.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {tmpl.status}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 font-myanmar">
                  {tmpl.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-myanmar line-clamp-1 mt-0.5">
                  {tmpl.nameMm}
                </p>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
                  <span>{tmpl.carrier}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{tmpl.fieldCount} fields</span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Score: {tmpl.accuracyScore}%</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    Edit regions <ChevronRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Visual Region Editor: Staged workflow + 3-column layout */
        <div className="space-y-4">
          {/* Staged Workflow Progress Bar */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-sm overflow-x-auto">
            <div className="flex items-center justify-between min-w-[640px] px-2">
              {stages.map((stage, idx) => {
                const isCurrent = activeStage === stage.name;
                const isPast = stages.findIndex(s => s.name === activeStage) >= idx;

                return (
                  <React.Fragment key={stage.name}>
                    <button
                      onClick={() => setActiveStage(stage.name as any)}
                      className={`flex items-center gap-2 py-1 px-3 rounded-lg text-xs font-semibold transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow-sm'
                          : isPast
                          ? 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                      }`}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                        isCurrent 
                          ? 'bg-white text-blue-600'
                          : isPast 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                      }`}>
                        {stage.num}
                      </span>
                      <span className="font-myanmar">{isBurmese ? stage.nameMm : stage.name}</span>
                    </button>
                    {idx < stages.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-2 ${isPast ? 'bg-blue-500/40' : 'bg-slate-200 dark:bg-slate-800'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* 3-Column Region Editor */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Panel: Field list and validation issues (3 cols) */}
            <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col h-[680px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-myanmar">
                  {isBurmese ? 'ကွက်လပ် အပိုင်းများ' : 'Mapped Regions'} ({selectedTemplate.regions.length})
                </span>
                <button
                  onClick={handleAutoDetect}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  title="Run AI auto-detection on regions"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Auto-Detect
                </button>
              </div>

              {/* Region List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 py-2 pr-1">
                {selectedTemplate.regions.map((region) => {
                  const isSelected = region.id === selectedRegion?.id;

                  return (
                    <div
                      key={region.id}
                      onClick={() => setSelectedRegionId(region.id)}
                      className={`cursor-pointer rounded-lg p-2.5 text-xs transition-all border ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 dark:border-blue-600 ring-1 ring-blue-500/30'
                          : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-200 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {region.fieldKey}
                        </span>
                        {getRegionStatusBadge(region.status)}
                      </div>

                      <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {region.nameEn}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-myanmar truncate">
                        {region.nameMm}
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="uppercase font-semibold tracking-wider text-slate-500">{region.category}</span>
                        <span className="font-mono text-slate-500">[{region.box.x}%, {region.box.y}%]</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Field button */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    const newId = `reg-${Date.now().toString().slice(-4)}`;
                    const newRegion: TemplateRegion = {
                      id: newId,
                      fieldKey: `custom_field_${selectedTemplate.regions.length + 1}`,
                      nameEn: 'New Custom Field',
                      nameMm: 'ကွက်လပ် အသစ်',
                      category: 'internal',
                      dataType: 'text',
                      required: false,
                      box: { page: 1, x: 20, y: 50, width: 40, height: 4 },
                      confidenceThreshold: 80,
                      status: 'detected'
                    };
                    onUpdateTemplate({
                      ...selectedTemplate,
                      regions: [...selectedTemplate.regions, newRegion]
                    });
                    setSelectedRegionId(newId);
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-xs font-semibold text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add New Bounding Region
                </button>
              </div>
            </div>

            {/* Center Canvas: Interactive Document with editable bounding boxes (6 cols) */}
            <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col h-[680px]">
              {/* Canvas Controls Bar */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    Page {activePage} of {selectedTemplate.pageCount}
                  </span>
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs">
                    <button
                      onClick={() => setActivePage(1)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${activePage === 1 ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                    >
                      P1
                    </button>
                    {selectedTemplate.pageCount > 1 && (
                      <button
                        onClick={() => setActivePage(2)}
                        className={`px-2 py-0.5 rounded text-xs font-medium ${activePage === 2 ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                      >
                        P2
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setHighlightBoxes(!highlightBoxes)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                      highlightBoxes
                        ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        : 'border-slate-200 text-slate-500'
                    }`}
                    title="Toggle bounding box overlay"
                  >
                    {highlightBoxes ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    Overlay
                  </button>

                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5">
                    <button
                      onClick={() => setCurrentZoom(Math.max(50, currentZoom - 15))}
                      className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="px-2 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      {currentZoom}%
                    </span>
                    <button
                      onClick={() => setCurrentZoom(Math.min(180, currentZoom + 15))}
                      className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Canvas Viewport */}
              <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-950 rounded-lg p-4 flex items-center justify-center">
                <div 
                  className="relative bg-white shadow-xl border border-slate-300 dark:border-slate-700 transition-transform duration-150 origin-top text-slate-900"
                  style={{
                    width: `${460 * (currentZoom / 100)}px`,
                    minHeight: `${650 * (currentZoom / 100)}px`,
                    padding: '24px'
                  }}
                >
                  {/* Simulated Myanmar Claim Template Document Header */}
                  <div className="border-b-2 border-slate-800 pb-3 mb-3 text-center">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-600">
                      {selectedTemplate.carrier}
                    </div>
                    <div className="text-sm font-extrabold text-slate-950 font-myanmar mt-0.5">
                      {selectedTemplate.nameMm}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700">
                      {selectedTemplate.name}
                    </div>
                    <div className="mt-1 flex justify-between text-[9px] font-mono text-slate-500">
                      <span>FORM CODE: {selectedTemplate.code}</span>
                      <span>VERSION: {selectedTemplate.version}</span>
                    </div>
                  </div>

                  {/* Document Body Skeleton */}
                  <div className="space-y-4 text-[10px] text-slate-700 font-sans">
                    {/* Section 1 */}
                    <div className="bg-slate-100/70 p-1.5 rounded font-bold text-[9px] uppercase tracking-wider text-slate-600">
                      1. Policy & Certificate Identification (အာမခံ ပေါ်လစီ အချက်အလက်)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div className="p-1 border border-slate-200 rounded">
                        <span className="text-slate-400">Insurer:</span> KBZ MS General Insurance
                      </div>
                      <div className="p-1 border border-slate-200 rounded">
                        <span className="text-slate-400">Policy No:</span> POL-MTR-20260481
                      </div>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-slate-100/70 p-1.5 rounded font-bold text-[9px] uppercase tracking-wider text-slate-600">
                      2. Claimant Identity (အာမခံထားသူ အမည်နှင့် မှတ်ပုံတင်)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div className="p-1 border border-slate-200 rounded">
                        <span className="text-slate-400">Claimant EN:</span> U AUNG KYAW THU
                      </div>
                      <div className="p-1 border border-slate-200 rounded font-myanmar">
                        <span className="text-slate-400 font-sans">Claimant MM:</span> ဦးအောင်ကျော်သူ
                      </div>
                      <div className="p-1 border border-slate-200 rounded">
                        <span className="text-slate-400">NRC No:</span> 12/LKN(N)148293
                      </div>
                      <div className="p-1 border border-slate-200 rounded">
                        <span className="text-slate-400">Phone:</span> 09-420088192
                      </div>
                    </div>

                    {/* Section 3 */}
                    <div className="bg-slate-100/70 p-1.5 rounded font-bold text-[9px] uppercase tracking-wider text-slate-600">
                      3. Accident / Loss Particulars (မတော်တဆ ဖြစ်စဉ် အသေးစိတ်)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div className="p-1 border border-slate-200 rounded">
                        <span className="text-slate-400">Date/Time:</span> 2026-08-22 14:15
                      </div>
                      <div className="p-1 border border-slate-200 rounded">
                        <span className="text-slate-400">Location:</span> Kamayut, Yangon
                      </div>
                    </div>
                    <div className="p-1 border border-slate-200 rounded text-[9px]">
                      <span className="text-slate-400">Description:</span> Front bumper collision with city bus. Headlight assembly cracked.
                    </div>

                    {/* Section 4 */}
                    <div className="bg-slate-100/70 p-1.5 rounded font-bold text-[9px] uppercase tracking-wider text-slate-600">
                      4. Disbursement & Estimate (ပြင်ဆင်စရိတ်နှင့် ငွေလွှဲအကောင့်)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div className="p-1 border border-slate-200 rounded font-bold">
                        <span className="text-slate-400 font-normal">Estimate:</span> 3,850,000 MMK
                      </div>
                      <div className="p-1 border border-slate-200 rounded">
                        <span className="text-slate-400">Workshop:</span> Grand Star Motors
                      </div>
                    </div>
                  </div>

                  {/* Interactive Bounding Boxes Overlay */}
                  {highlightBoxes && (
                    <div className="absolute inset-0 pointer-events-auto">
                      {selectedTemplate.regions
                        .filter(r => r.box.page === activePage)
                        .map((region) => {
                          const isSelected = region.id === selectedRegion?.id;

                          return (
                            <div
                              key={region.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRegionId(region.id);
                              }}
                              className={`absolute cursor-pointer transition-all border-2 rounded ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-500/25 ring-2 ring-blue-500/40 z-20'
                                  : 'border-indigo-500/70 bg-indigo-500/10 hover:border-blue-500 hover:bg-blue-500/20 z-10'
                              }`}
                              style={{
                                left: `${region.box.x}%`,
                                top: `${region.box.y}%`,
                                width: `${region.box.width}%`,
                                height: `${region.box.height}%`
                              }}
                            >
                              <span className={`absolute -top-4 left-0 text-[8px] font-mono px-1 rounded font-bold whitespace-nowrap ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-900/80 text-white'
                              }`}>
                                {region.fieldKey}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: Selected-Field Inspector (3 cols) */}
            <div className="lg:col-span-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-sm flex flex-col h-[680px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-myanmar">
                  {isBurmese ? 'အကွက် အသေးစိတ်' : 'Field Inspector'}
                </span>
                {selectedRegion && (
                  <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                    {selectedRegion.fieldKey}
                  </span>
                )}
              </div>

              {selectedRegion ? (
                <div className="flex-1 overflow-y-auto space-y-3 py-2 text-xs">
                  {/* Field Name English */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Field Label (English)
                    </label>
                    <input
                      type="text"
                      value={selectedRegion.nameEn}
                      onChange={(e) => handleUpdateRegion({ nameEn: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-medium"
                    />
                  </div>

                  {/* Field Name Burmese */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 font-myanmar">
                      မြန်မာ အမည် (Myanmar Label)
                    </label>
                    <input
                      type="text"
                      value={selectedRegion.nameMm}
                      onChange={(e) => handleUpdateRegion({ nameMm: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-myanmar font-medium"
                    />
                  </div>

                  {/* Category and Data Type */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Category
                      </label>
                      <select
                        value={selectedRegion.category}
                        onChange={(e) => handleUpdateRegion({ category: e.target.value as FieldCategory })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="policy">Policy</option>
                        <option value="claimant">Claimant</option>
                        <option value="incident">Incident</option>
                        <option value="payment">Payment</option>
                        <option value="internal">Internal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Data Type
                      </label>
                      <select
                        value={selectedRegion.dataType}
                        onChange={(e) => handleUpdateRegion({ dataType: e.target.value as any })}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="text">Text</option>
                        <option value="nrc">NRC ID</option>
                        <option value="date">Date/Time</option>
                        <option value="currency">Currency (MMK)</option>
                        <option value="phone">Phone No</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                  </div>

                  {/* Bounding Box Coordinates (X, Y, W, H) */}
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200 dark:border-slate-700/80">
                    <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Bounding Box Geometry (%)
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400">X:</span>
                        <input
                          type="number"
                          value={selectedRegion.box.x}
                          onChange={(e) => handleUpdateRegion({ box: { ...selectedRegion.box, x: Number(e.target.value) } })}
                          className="w-full mt-0.5 rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">Y:</span>
                        <input
                          type="number"
                          value={selectedRegion.box.y}
                          onChange={(e) => handleUpdateRegion({ box: { ...selectedRegion.box, y: Number(e.target.value) } })}
                          className="w-full mt-0.5 rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">Width:</span>
                        <input
                          type="number"
                          value={selectedRegion.box.width}
                          onChange={(e) => handleUpdateRegion({ box: { ...selectedRegion.box, width: Number(e.target.value) } })}
                          className="w-full mt-0.5 rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400">Height:</span>
                        <input
                          type="number"
                          value={selectedRegion.box.height}
                          onChange={(e) => handleUpdateRegion({ box: { ...selectedRegion.box, height: Number(e.target.value) } })}
                          className="w-full mt-0.5 rounded border border-slate-300 dark:border-slate-600 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Confidence Threshold */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      <span>OCR Confidence Threshold</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">{selectedRegion.confidenceThreshold}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="98"
                      value={selectedRegion.confidenceThreshold}
                      onChange={(e) => handleUpdateRegion({ confidenceThreshold: Number(e.target.value) })}
                      className="w-full accent-blue-600"
                    />
                  </div>

                  {/* Regex / Sample */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Validation Regex Pattern
                    </label>
                    <input
                      type="text"
                      value={selectedRegion.regexPattern || ''}
                      placeholder="e.g. ^POL-[A-Z]{3}-\d{8}$"
                      onChange={(e) => handleUpdateRegion({ regexPattern: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* Sample Value */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 font-myanmar">
                      နမူနာ ထုတ်ယူရရှိမှု (Sample Output)
                    </label>
                    <div className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 font-myanmar break-all">
                      {selectedRegion.sampleValue || 'U AUNG KYAW THU'}
                    </div>
                  </div>

                  {/* Status toggle */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Region Approval Status
                    </label>
                    <select
                      value={selectedRegion.status}
                      onChange={(e) => handleUpdateRegion({ status: e.target.value as any })}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="approved">Approved (အဆင်ပြေသည်)</option>
                      <option value="review_required">Review Required (စစ်ဆေးရန်)</option>
                      <option value="detected">Detected (ရှာဖွေတွေ့ရှိ)</option>
                      <option value="disabled">Disabled (ပိတ်ထားရန်)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
                  Select a region to view details
                </div>
              )}

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                  onClick={handleSaveDraft}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-all"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Draft
                </button>
                <button
                  onClick={handleApproveTemplate}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve & Deploy Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
