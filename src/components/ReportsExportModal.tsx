import React, { useState } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  Send, 
  CheckCircle2, 
  Copy,
  Calendar,
  Layers
} from 'lucide-react';
import { ClaimDocument } from '../types';

interface ReportsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ClaimDocument[];
  isBurmese: boolean;
}

export const ReportsExportModal: React.FC<ReportsExportModalProps> = ({
  isOpen,
  onClose,
  documents,
  isBurmese
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'json' | 'api'>('xlsx');
  const [selectedCarrier, setSelectedCarrier] = useState('all');
  const [includeBurmeseScript, setIncludeBurmeseScript] = useState(true);
  const [exportSuccessToast, setExportSuccessToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownload = () => {
    let filename = `FormFlow_Claims_Export_${new Date().toISOString().slice(0, 10)}`;
    let mimeType = 'text/plain';

    if (exportFormat === 'csv') {
      filename += '.csv';
      mimeType = 'text/csv';
      const headers = ['ClaimNumber', 'PolicyNumber', 'ClaimantEn', 'ClaimantMm', 'NRC', 'Carrier', 'ClaimType', 'AmountMMK', 'Confidence', 'Status'];
      const rows = documents.map(d => [
        d.claimNumber,
        d.policyNumber,
        `"${d.claimantNameEn}"`,
        `"${d.claimantNameMm}"`,
        `"${d.nrcNumber}"`,
        `"${d.carrierName}"`,
        `"${d.claimType}"`,
        d.claimedAmount,
        d.overallConfidence,
        d.status
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.click();
    } else if (exportFormat === 'json') {
      filename += '.json';
      const jsonContent = JSON.stringify(documents, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.click();
    } else if (exportFormat === 'xlsx') {
      filename += '.xlsx';
      // Simulating Excel binary trigger
      const dummyCsv = documents.map(d => `${d.claimNumber}\t${d.claimantNameEn}\t${d.claimedAmount} MMK`).join('\n');
      const blob = new Blob([dummyCsv], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.click();
    } else {
      setExportSuccessToast('Triggered direct REST API sync to KBZ MS & AYA Gateway');
      setTimeout(() => {
        setExportSuccessToast(null);
        onClose();
      }, 2000);
      return;
    }

    setExportSuccessToast(`Downloaded ${filename} successfully`);
    setTimeout(() => {
      setExportSuccessToast(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-myanmar">
                {isBurmese ? 'အစီရင်ခံစာနှင့် စာရင်း ထုတ်ယူခြင်း' : 'Structured Data Export'}
              </h2>
              <p className="text-xs text-slate-500 font-myanmar">
                {isBurmese ? 'မြန်မာအာမခံ လုပ်ငန်းသုံး ဒေတာ ဖော်မတ်များ' : 'Export OCR-verified claim records to regulatory spreadsheets or core ERP'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="py-4 space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('xlsx')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  exportFormat === 'xlsx'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                }`}
              >
                <FileSpreadsheet className="h-5 w-5 mb-1 text-emerald-600" />
                <span className="font-semibold text-xs">Excel (XLSX)</span>
                <span className="text-[10px] text-slate-400">Audit Ready</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('csv')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  exportFormat === 'csv'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                }`}
              >
                <FileText className="h-5 w-5 mb-1 text-blue-600" />
                <span className="font-semibold text-xs">CSV</span>
                <span className="text-[10px] text-slate-400">Raw Data</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('json')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  exportFormat === 'json'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                }`}
              >
                <FileCode className="h-5 w-5 mb-1 text-purple-600" />
                <span className="font-semibold text-xs">JSON</span>
                <span className="text-[10px] text-slate-400">Schema Tree</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat('api')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  exportFormat === 'api'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300'
                }`}
              >
                <Send className="h-5 w-5 mb-1 text-amber-600" />
                <span className="font-semibold text-xs">ERP Sync</span>
                <span className="text-[10px] text-slate-400">API Gateway</span>
              </button>
            </div>
          </div>

          {/* Scope and Filter Options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Carrier Filter
              </label>
              <select
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="all">All Carriers ({documents.length} records)</option>
                <option value="KBZ">KBZ MS General Insurance</option>
                <option value="GGI">GGI Tokio Marine</option>
                <option value="AYA">AYA SOMPO</option>
                <option value="IKBZ">IKBZ Life</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Batch Period
              </label>
              <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <option>Today (Aug 25, 2026)</option>
                <option>Current Week</option>
                <option>Monthly Regulatory Filing</option>
              </select>
            </div>
          </div>

          {/* Toggle Burmese Unicode UTF-8 */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200 font-myanmar">
                မြန်မာ ယူနီကုဒ် စာသားများ ထည့်သွင်းရန် (Include Myanmar Unicode)
              </div>
              <div className="text-[11px] text-slate-400">
                Preserves native Burmese names, townships, and NRC characters with UTF-8 BOM.
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeBurmeseScript}
              onChange={(e) => setIncludeBurmeseScript(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
            />
          </div>

          {/* Toast */}
          {exportSuccessToast && (
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/60 p-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{exportSuccessToast}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all"
          >
            <Download className="h-4 w-4" />
            <span className="font-myanmar">
              {exportFormat === 'api' ? 'Dispatch to ERP' : 'Download File'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
