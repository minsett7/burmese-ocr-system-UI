import React from 'react';
import { Search } from 'lucide-react';
import { NavView, ServiceHealth } from '../types';

interface TopBarProps {
  currentView: NavView;
  isBurmese?: boolean;
  onOpenServiceHealth: () => void;
  services: ServiceHealth[];
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  selectedDocClaimNo?: string;
  selectedTemplateCode?: string;
}

const labels: Record<NavView, string> = {
  'work-queue': 'Work Queue', templates: 'Template Studio', 'process-doc': 'Process & Review',
  records: 'Records & Audit', 'reports-export': 'Reports & Export',
};

export const TopBar: React.FC<TopBarProps> = ({
  currentView, onOpenServiceHealth, services, searchQuery = '', onSearchChange, selectedDocClaimNo, selectedTemplateCode,
}) => {
  const healthy = services.filter(service => service.status === 'operational').length;
  const allHealthy = services.length > 0 && healthy === services.length;
  const selected = currentView === 'process-doc' ? selectedDocClaimNo : currentView === 'templates' ? selectedTemplateCode : undefined;
  return <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900 lg:px-8">
    <div className="min-w-0 text-sm"><span className="text-slate-400">Dashboard / </span><strong>{labels[currentView]}</strong>
      {selected && <span className="ml-2 hidden rounded bg-blue-50 px-2 py-1 font-mono text-[10px] text-blue-700 sm:inline dark:bg-blue-950 dark:text-blue-300">{selected}</span>}</div>
    <div className="flex items-center gap-3">
      <label className="relative hidden md:block"><Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"/>
        <input id="global-search-input" value={searchQuery} onChange={event => onSearchChange?.(event.target.value)} placeholder="Search records…"
          className="w-52 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-400 dark:border-slate-700 dark:bg-slate-800"/></label>
      <button onClick={onOpenServiceHealth} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[11px] font-bold ${allHealthy ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300' : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300'}`}>
        <span className={`h-2 w-2 rounded-full ${allHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}/>{services.length ? `${healthy}/${services.length} services` : 'Health unavailable'}
      </button>
    </div>
  </header>;
};
