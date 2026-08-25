import React, { useState } from 'react';
import { 
  FileSearch, 
  PlusCircle, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  FileText, 
  ArrowUpRight, 
  Filter, 
  RefreshCw,
  Sparkles,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { ClaimDocument, ClaimType, DocumentStatus } from '../types';

interface WorkQueueProps {
  documents: ClaimDocument[];
  onReviewDocument: (doc: ClaimDocument) => void;
  onNavigateToTemplates: () => void;
  onNavigateToProcessDocs: () => void;
  isBurmese: boolean;
  searchQuery: string;
}

export const WorkQueue: React.FC<WorkQueueProps> = ({
  documents,
  onReviewDocument,
  onNavigateToTemplates,
  onNavigateToProcessDocs,
  isBurmese,
  searchQuery
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute key metrics
  const needsReviewCount = documents.filter(d => d.status === 'Needs Review').length;
  const processingCount = documents.filter(d => d.status === 'Processing').length;
  const readyToSyncCount = 14; // live sync batch metric
  const templateDraftsCount = 6; // templates awaiting approval

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    // Search query match
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        doc.claimNumber.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        doc.claimantNameEn.toLowerCase().includes(q) ||
        doc.claimantNameMm.toLowerCase().includes(q) ||
        doc.nrcNumber.toLowerCase().includes(q) ||
        doc.policyNumber.toLowerCase().includes(q) ||
        doc.carrierName.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // Type filter
    if (selectedTypeFilter !== 'all' && doc.claimType !== selectedTypeFilter) {
      return false;
    }

    // Status filter
    if (selectedStatusFilter !== 'all' && doc.status !== selectedStatusFilter) {
      return false;
    }

    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'Needs Review':
        return (
          <span className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold uppercase rounded border border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800">
            {isBurmese ? 'စစ်ဆေးရန်' : 'Needs Review'}
          </span>
        );
      case 'Processing':
        return (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            {isBurmese ? 'ဆောင်ရွက်ဆဲ' : 'Processing'}
          </span>
        );
      case 'Ready to Sync':
        return (
          <span className="px-2 py-1 bg-green-50 text-green-700 text-[10px] font-bold uppercase rounded border border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800">
            {isBurmese ? 'အသင့်ဖြစ်' : 'Ready'}
          </span>
        );
      case 'Approved':
        return (
          <span className="px-2 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold uppercase rounded border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            {isBurmese ? 'အတည်ပြုပြီး' : 'Approved'}
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase rounded">
            {status}
          </span>
        );
    }
  };

  const getConfidenceGauge = (score: number) => {
    let barColor = 'bg-green-500';
    let textColor = 'text-green-600 dark:text-green-400';
    if (score < 85 && score >= 75) {
      barColor = 'bg-amber-500';
      textColor = 'text-amber-600 dark:text-amber-400';
    } else if (score < 75) {
      barColor = 'bg-red-500';
      textColor = 'text-red-600 dark:text-red-400';
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="w-12 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden inline-block">
          <div className={`h-full ${barColor}`} style={{ width: `${Math.min(100, score)}%` }}></div>
        </span>
        <span className={`text-xs font-bold ${textColor}`}>{score.toFixed(0)}%</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-myanmar">
            {isBurmese ? 'ယနေ့ လုပ်ငန်းစဉ်များ (Today’s work)' : 'Today’s work'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-myanmar">
            {isBurmese
              ? 'မြန်မာနိုင်ငံရှိ အာမခံ လျော်ကြေးတောင်းခံလွှာ စာရွက်စာတမ်းများ၏ OCR စစ်ဆေးမှုနှင့် ဒေတာစီမံမှု လုပ်ငန်းခွင်'
              : 'Review and verify high-volume Myanmar and English insurance claim documents with automated OCR extraction.'}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            id="register-template-btn"
            onClick={onNavigateToTemplates}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 transition-colors"
          >
            <span className="font-myanmar">{isBurmese ? 'တမ်းပလိတ် အသစ်ဖွင့်ရန်' : 'Register template'}</span>
          </button>

          <button
            id="process-documents-btn"
            onClick={onNavigateToProcessDocs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-200 dark:shadow-none transition-colors"
          >
            <span className="font-myanmar">{isBurmese ? 'စာရွက်စာတမ်း စစ်ဆေးရန်' : 'Process documents'}</span>
          </button>
        </div>
      </div>

      {/* 4 Core Essential Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Needs Review */}
        <div 
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Needs Review' ? 'all' : 'Needs Review')}
          className={`bg-white p-6 rounded-xl border transition-all cursor-pointer dark:bg-slate-900 ${
            selectedStatusFilter === 'Needs Review'
              ? 'border-red-400 ring-2 ring-red-400/20 shadow-sm'
              : 'border-slate-200 shadow-sm hover:border-slate-300 dark:border-slate-800'
          }`}
        >
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-myanmar">
            {isBurmese ? 'စစ်ဆေးရန် လိုအပ်' : 'Needs review'}
          </div>
          <div className="flex items-end space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {needsReviewCount}
            </span>
            <span className="text-red-500 text-xs font-medium mb-1">
              {isBurmese ? 'ဦးစားပေး' : 'Priority'}
            </span>
          </div>
        </div>

        {/* Processing */}
        <div 
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Processing' ? 'all' : 'Processing')}
          className={`bg-white p-6 rounded-xl border transition-all cursor-pointer dark:bg-slate-900 ${
            selectedStatusFilter === 'Processing'
              ? 'border-blue-400 ring-2 ring-blue-400/20 shadow-sm'
              : 'border-slate-200 shadow-sm hover:border-slate-300 dark:border-slate-800'
          }`}
        >
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-myanmar">
            {isBurmese ? 'ဆောင်ရွက်ဆဲ' : 'Processing'}
          </div>
          <div className="flex items-end space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {processingCount}
            </span>
            <span className="text-slate-400 text-xs mb-1">
              In queue
            </span>
          </div>
        </div>

        {/* Template Drafts */}
        <div 
          onClick={onNavigateToTemplates}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 transition-all cursor-pointer"
        >
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-myanmar">
            {isBurmese ? 'တမ်းပလိတ် မူကြမ်းများ' : 'Template drafts'}
          </div>
          <div className="flex items-end space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {templateDraftsCount}
            </span>
            <span className="text-amber-500 text-xs font-medium mb-1">
              Awaiting Approval
            </span>
          </div>
        </div>

        {/* Ready to Sync */}
        <div 
          onClick={() => setSelectedStatusFilter(selectedStatusFilter === 'Ready to Sync' ? 'all' : 'Ready to Sync')}
          className={`bg-white p-6 rounded-xl border transition-all cursor-pointer dark:bg-slate-900 ${
            selectedStatusFilter === 'Ready to Sync'
              ? 'border-green-400 ring-2 ring-green-400/20 shadow-sm'
              : 'border-slate-200 shadow-sm hover:border-slate-300 dark:border-slate-800'
          }`}
        >
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-myanmar">
            {isBurmese ? 'ချိတ်ဆက်ရန် အသင့်' : 'Ready to sync'}
          </div>
          <div className="flex items-end space-x-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {readyToSyncCount}
            </span>
            <span className="text-green-500 text-xs font-medium mb-1">
              Completed
            </span>
          </div>
        </div>
      </div>

      {/* Priority Work Queue Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        {/* Table Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm font-myanmar">
              {isBurmese ? 'ဦးစားပေး စစ်ဆေးရမည့် ဖိုင်များ' : 'Prioritized Queue'}
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400 italic">
              Viewing {filteredDocs.length} active items
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Claim Type */}
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">{isBurmese ? 'အာမခံ အားလုံး' : 'All Claim Types'}</option>
              <option value="Motor / Vehicle">Motor / Vehicle</option>
              <option value="Health & Hospitalization">Health & Hospital</option>
              <option value="Fire & Property">Fire & Property</option>
              <option value="Life & Beneficiary">Life & Beneficiary</option>
              <option value="Agricultural Crop">Agricultural Crop</option>
              <option value="Travel & Accident">Travel & Accident</option>
            </select>

            {/* Filter by Status */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="all">{isBurmese ? 'အခြေအနေ အားလုံး' : 'All Statuses'}</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Processing">Processing</option>
              <option value="Ready to Sync">Ready to Sync</option>
              <option value="Approved">Approved</option>
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              title="Refresh queue"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Document & Claim ID</th>
                <th scope="col" className="px-6 py-3 font-semibold">Claimant / NRC</th>
                <th scope="col" className="px-6 py-3 font-semibold">Carrier & Type</th>
                <th scope="col" className="px-6 py-3 font-semibold">OCR Confidence</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">Issues</th>
                <th scope="col" className="px-6 py-3 font-semibold">Status</th>
                <th scope="col" className="px-6 py-3 font-semibold">Age</th>
                <th scope="col" className="px-6 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => {
                  const isTopPriority = doc.status === 'Needs Review';

                  return (
                    <tr 
                      key={doc.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors ${
                        isTopPriority ? 'bg-amber-50/20 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      {/* Document Filename & Claim Number */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            isTopPriority 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' 
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                                {doc.claimNumber}
                              </span>
                              {doc.pageCount > 1 && (
                                <span className="text-[10px] text-slate-400 font-medium">
                                  ({doc.pageCount} pgs)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs" title={doc.fileName}>
                              {doc.fileName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Claimant Details */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                            {doc.claimantNameEn}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-myanmar">
                            {doc.claimantNameMm} • <span className="font-mono">{doc.nrcNumber}</span>
                          </span>
                        </div>
                      </td>

                      {/* Carrier & Type */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate max-w-[160px]">
                            {doc.carrierName}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate font-myanmar">
                            {doc.claimType}
                          </span>
                        </div>
                      </td>

                      {/* OCR Confidence */}
                      <td className="px-6 py-4">
                        {getConfidenceGauge(doc.overallConfidence)}
                      </td>

                      {/* Validation Issues */}
                      <td className="px-6 py-4 text-center">
                        {doc.issuesCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            {doc.issuesCount}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-mono">0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap font-myanmar">
                        {getStatusBadge(doc.status)}
                      </td>

                      {/* Age */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{doc.age}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          id={`review-doc-btn-${doc.id}`}
                          onClick={() => onReviewDocument(doc)}
                          className={`inline-flex items-center space-x-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                            isTopPriority
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="font-myanmar">{isBurmese ? 'စစ်ဆေးမည်' : 'Review'}</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 mb-3">
                        <FileSearch className="h-6 w-6" />
                      </div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm font-myanmar">
                        {isBurmese ? 'စစ်ဆေးရန် စာရွက်စာတမ်း မရှိပါ' : 'No matching documents in queue'}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Try resetting your search query or filters to see all pending insurance claim files.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedTypeFilter('all');
                          setSelectedStatusFilter('all');
                        }}
                        className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom Shortcuts Hint Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400 dark:bg-slate-800/50 dark:border-slate-800">
          <span className="mx-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 font-mono text-[11px]">
            Ctrl+O
          </span>
          <span>Open Next Document • </span>
          <span className="mx-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 font-mono text-[11px]">
            Enter
          </span>
          <span>Approve & Next</span>
        </div>
      </div>
    </div>
  );
};
