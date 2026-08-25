import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  CheckSquare, 
  Square, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  X, 
  ShieldCheck, 
  Send, 
  FileSpreadsheet, 
  Calendar, 
  User, 
  Layers, 
  CheckCheck,
  FileCode,
  ArrowUpDown,
  History
} from 'lucide-react';
import { ClaimDocument, AuditEvent, DocumentStatus, ClaimType } from '../types';

interface RecordsViewProps {
  documents: ClaimDocument[];
  auditLogs: AuditEvent[];
  onOpenDocumentDetail: (doc: ClaimDocument) => void;
  isBurmese: boolean;
  onOpenExportModal: () => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  documents,
  auditLogs,
  onOpenDocumentDetail,
  isBurmese,
  onOpenExportModal
}) => {
  const [activeTab, setActiveTab] = useState<'records' | 'audit'>('records');
  const [searchQuery, setSearchQuery] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [selectedRecordForDrawer, setSelectedRecordForDrawer] = useState<ClaimDocument | null>(null);
  const [auditFilterType, setAuditFilterType] = useState('all');

  // Multi-selection
  const handleToggleSelectAll = () => {
    if (selectedDocIds.length === documents.length) {
      setSelectedDocIds([]);
    } else {
      setSelectedDocIds(documents.map(d => d.id));
    }
  };

  const handleToggleSelectDoc = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(selectedDocIds.filter(item => item !== id));
    } else {
      setSelectedDocIds([...selectedDocIds, id]);
    }
  };

  // Filter records
  const filteredRecords = documents.filter(doc => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        doc.claimNumber.toLowerCase().includes(q) ||
        doc.claimantNameEn.toLowerCase().includes(q) ||
        doc.claimantNameMm.toLowerCase().includes(q) ||
        doc.nrcNumber.toLowerCase().includes(q) ||
        doc.policyNumber.toLowerCase().includes(q) ||
        doc.carrierName.toLowerCase().includes(q);
      if (!match) return false;
    }
    if (carrierFilter !== 'all' && !doc.carrierName.includes(carrierFilter)) return false;
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    return true;
  });

  // Filter audit events
  const filteredAuditLogs = auditLogs.filter(log => {
    if (auditFilterType !== 'all' && log.actionType !== auditFilterType) return false;
    return true;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Top Header & Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-myanmar">
            {isBurmese ? 'မှတ်တမ်းနှင့် စာရင်းစစ်မှတ်တမ်း' : 'Records & Regulatory Audit'}
          </h1>
          <p className="text-xs text-slate-500 font-myanmar mt-0.5">
            {isBurmese ? 'စစ်ဆေးအတည်ပြုပြီးသော အာမခံမှတ်တမ်း ၂၃၂ ခုနှင့် တရားဝင် ထုတ်ယူမှုများ' : 'Comprehensive archive of processed insurance claims and 232 audit event trails.'}
          </p>
        </div>

        {/* Tab Switcher & Export Action */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('records')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'records'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Claims Records ({documents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'audit'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>Audit Trail (232)</span>
            </button>
          </div>

          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="font-myanmar">{isBurmese ? 'ဖိုင်ထုတ်ယူမည် (Export)' : 'Export'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'records' ? (
        /* Records Table with Batch Selection and Filters */
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {/* Filter & Batch Actions Bar */}
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-1 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {selectedDocIds.length > 0 && (
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  {selectedDocIds.length} selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Carrier Filter */}
              <select
                value={carrierFilter}
                onChange={(e) => setCarrierFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Carriers</option>
                <option value="KBZ">KBZ MS General</option>
                <option value="GGI">GGI Tokio Marine</option>
                <option value="AYA">AYA SOMPO</option>
                <option value="IKBZ">IKBZ Insurance</option>
                <option value="CB">CB Insurance</option>
                <option value="Myanma">Myanma Insurance</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Statuses</option>
                <option value="Approved">Approved (အတည်ပြုပြီး)</option>
                <option value="Ready to Sync">Ready to Sync (ချိတ်ဆက်ရန် အသင့်)</option>
                <option value="Processing">Processing (ဆောင်ရွက်ဆဲ)</option>
                <option value="Needs Review">Needs Review (စစ်ဆေးရန်)</option>
              </select>
            </div>
          </div>

          {/* Sticky Header Table */}
          <div className="overflow-x-auto max-h-[580px]">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100/90 backdrop-blur-xs text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/90 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-3 py-3 w-10 text-center">
                    <button onClick={handleToggleSelectAll} className="text-slate-500 hover:text-slate-800">
                      {selectedDocIds.length === documents.length ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">Claim ID & Policy</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Claimant / NRC</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Carrier</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-right">Claimed (MMK)</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-center">OCR Score</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-3 py-3 font-semibold">Processed Date</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((doc) => {
                  const isSelected = selectedDocIds.includes(doc.id);

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedRecordForDrawer(doc)}
                      className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="px-3 py-3 text-center" onClick={(e) => handleToggleSelectDoc(doc.id, e)}>
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-blue-600 inline-block" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-300 dark:text-slate-600 inline-block" />
                        )}
                      </td>

                      {/* Claim ID & Policy */}
                      <td className="px-3 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        <div>{doc.claimNumber}</div>
                        <div className="text-[10px] font-normal text-slate-400 font-mono">{doc.policyNumber}</div>
                      </td>

                      {/* Claimant */}
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{doc.claimantNameEn}</div>
                        <div className="text-[11px] text-slate-500 font-myanmar">{doc.claimantNameMm} • {doc.nrcNumber}</div>
                      </td>

                      {/* Carrier */}
                      <td className="px-3 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">{doc.carrierName}</div>
                        <div className="text-[10px] text-slate-400 font-myanmar">{doc.claimType}</div>
                      </td>

                      {/* Claim Amount */}
                      <td className="px-3 py-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {doc.claimedAmount.toLocaleString()} MMK
                      </td>

                      {/* Confidence */}
                      <td className="px-3 py-3 text-center">
                        <span className="font-mono font-bold px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {doc.overallConfidence}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3 font-myanmar">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                          doc.status === 'Approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : doc.status === 'Ready to Sync'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {doc.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-3 py-3 text-slate-400 text-[11px] font-mono">
                        {doc.uploadedAt}
                      </td>

                      {/* Action */}
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRecordForDrawer(doc);
                          }}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 inline-flex items-center gap-1"
                        >
                          View Details <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit History Timeline View */
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-myanmar">
                {isBurmese ? 'စနစ် လှုပ်ရှားမှု စာရင်းစစ် မှတ်တမ်း' : 'Immutable Operations Audit Trail'}
              </h2>
              <p className="text-xs text-slate-500">232 logged events verifying operator corrections, OCR extractions, and core ERP transmissions</p>
            </div>

            <select
              value={auditFilterType}
              onChange={(e) => setAuditFilterType(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="all">All Event Types</option>
              <option value="OCR_EXTRACTED">OCR Extractions</option>
              <option value="FIELD_CORRECTED">Field Corrections</option>
              <option value="DOCUMENT_APPROVED">Document Approvals</option>
              <option value="SYNCED_CORE_ERP">ERP Dispatches</option>
              <option value="TEMPLATE_MODIFIED">Template Modifications</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredAuditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold font-mono text-xs">
                  {log.actor.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{log.actor.name}</span>
                      <span className="text-[10px] text-slate-400">({log.actor.role})</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                        {log.actionType}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{log.timestamp}</span>
                  </div>

                  <p className="mt-1 text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                    {log.description}
                  </p>

                  {log.details && (
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-1.5 rounded border border-slate-200/60 dark:border-slate-800">
                      {log.details.destination && <span>Destination: {log.details.destination}</span>}
                      {log.details.field && <span>Field: {log.details.field}</span>}
                      {log.details.oldValue && <span>Old: "{log.details.oldValue}" → New: "{log.details.newValue}"</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right-Side Record-Detail Slide-Over Drawer */}
      {selectedRecordForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-base text-slate-900 dark:text-slate-100">
                    {selectedRecordForDrawer.claimNumber}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    {selectedRecordForDrawer.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedRecordForDrawer.fileName}</div>
              </div>

              <button
                onClick={() => setSelectedRecordForDrawer(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Claimant</span>
                  <div className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">{selectedRecordForDrawer.claimantNameEn}</div>
                  <div className="font-myanmar text-slate-500">{selectedRecordForDrawer.claimantNameMm}</div>
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Claimed</span>
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm mt-0.5">
                    {selectedRecordForDrawer.claimedAmount.toLocaleString()} MMK
                  </div>
                  <div className="text-[10px] text-slate-400">Currency: Myanmar Kyat</div>
                </div>
              </div>

              {/* Policy & Carrier Details */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block border-b border-slate-100 dark:border-slate-800 pb-1 font-myanmar">
                  အာမခံ အချက်အလက် (Policy Information)
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400">Carrier:</span> {selectedRecordForDrawer.carrierName}
                  </div>
                  <div>
                    <span className="text-slate-400">Policy:</span> <span className="font-mono">{selectedRecordForDrawer.policyNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">NRC:</span> <span className="font-mono">{selectedRecordForDrawer.nrcNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Assigned:</span> {selectedRecordForDrawer.assignedReviewer}
                  </div>
                </div>
              </div>

              {/* Raw OCR Text Dump */}
              <div className="space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block font-myanmar">
                  မူရင်း OCR စာသား (Raw Extracted Payload)
                </span>
                <pre className="rounded-lg bg-slate-900 text-slate-200 p-3 font-mono text-[11px] overflow-x-auto max-h-48 whitespace-pre-wrap font-myanmar">
                  {selectedRecordForDrawer.rawOcrText || `KBZ MS GENERAL INSURANCE\nCLAIM: ${selectedRecordForDrawer.claimNumber}\nPOLICY: ${selectedRecordForDrawer.policyNumber}\nCLAIMANT: ${selectedRecordForDrawer.claimantNameEn} (${selectedRecordForDrawer.claimantNameMm})\nNRC: ${selectedRecordForDrawer.nrcNumber}\nAMOUNT: ${selectedRecordForDrawer.claimedAmount.toLocaleString()} MMK\nSTATUS: VERIFIED`}
                </pre>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedRecordForDrawer(null)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Close
              </button>

              <button
                onClick={() => {
                  onOpenDocumentDetail(selectedRecordForDrawer);
                  setSelectedRecordForDrawer(null);
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
              >
                Open in Full Review Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
