import React, { useState } from 'react';
import { AlertCircle, Download, FileJson, FileSpreadsheet, FileText, Loader2, X } from 'lucide-react';
import { downloadExport, userError } from '../api';
import { ClaimDocument } from '../types';

interface ReportsExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  documents: ClaimDocument[];
  isBurmese: boolean;
}

export const ReportsExportModal: React.FC<ReportsExportModalProps> = ({ isOpen, onClose, documents }) => {
  const [format, setFormat] = useState<'excel'|'csv'|'json'>('excel');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!isOpen) return null;
  async function download() {
    setBusy(true); setError('');
    try { await downloadExport(format); onClose(); } catch (caught) { setError(userError(caught)); } finally { setBusy(false); }
  }
  const choices = [
    {id:'excel' as const,label:'Excel workbook',hint:'Best for review and reporting',icon:FileSpreadsheet},
    {id:'csv' as const,label:'CSV',hint:'Flat extracted records',icon:FileText},
    {id:'json' as const,label:'JSON',hint:'Complete application data',icon:FileJson},
  ];
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800"><div><h2 className="font-bold">Export OCR records</h2><p className="mt-1 text-xs text-slate-500">Download {documents.length} current record(s) from the backend.</p></div>
        <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-4 w-4"/></button></div>
      <div className="space-y-3 p-5">{choices.map(choice => <button key={choice.id} onClick={() => setFormat(choice.id)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left ${format===choice.id?'border-blue-500 bg-blue-50 dark:bg-blue-950/30':'border-slate-200 dark:border-slate-800'}`}>
        <choice.icon className="h-5 w-5 text-blue-600"/><span className="flex-1"><strong className="block text-sm">{choice.label}</strong><small className="text-slate-500">{choice.hint}</small></span><span className={`h-4 w-4 rounded-full border-4 ${format===choice.id?'border-blue-600':'border-slate-300'}`}/></button>)}
        {error && <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"><AlertCircle className="h-4 w-4"/>{error}</div>}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800"><button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold">Cancel</button>
        <button disabled={busy} onClick={download} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{busy?<Loader2 className="h-4 w-4 animate-spin"/>:<Download className="h-4 w-4"/>}Download</button></div>
    </div>
  </div>;
};
