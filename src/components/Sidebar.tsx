import React from 'react';
import { 
  Inbox, 
  LayoutTemplate, 
  FileSearch, 
  Database, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';
import { NavView } from '../types';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  needsReviewCount: number;
  templateDraftsCount: number;
  isBurmese: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  collapsed,
  onToggleCollapse,
  needsReviewCount,
  templateDraftsCount,
  isBurmese
}) => {
  const navItems = [
    {
      id: 'work-queue' as NavView,
      labelEn: 'Work Queue',
      labelMm: 'လုပ်ငန်းခွင် ဇယား',
      icon: Inbox,
      badge: needsReviewCount > 0 ? needsReviewCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-bold'
    },
    {
      id: 'templates' as NavView,
      labelEn: 'Templates',
      labelMm: 'ပုံစံ တမ်းပလိတ်များ',
      icon: LayoutTemplate,
      badge: templateDraftsCount > 0 ? templateDraftsCount : undefined,
      badgeColor: 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
    },
    {
      id: 'process-doc' as NavView,
      labelEn: 'Process Documents',
      labelMm: 'စာရွက်စာတမ်း စစ်ဆေးမှု',
      icon: FileSearch,
      badge: undefined
    },
    {
      id: 'records' as NavView,
      labelEn: 'Records & Audit',
      labelMm: 'မှတ်တမ်းနှင့် စာရင်းများ',
      icon: Database,
      badge: undefined
    },
    {
      id: 'reports-export' as NavView,
      labelEn: 'Reports & Export',
      labelMm: 'အစီရင်ခံစာနှင့် ထုတ်ယူမှု',
      icon: FileSpreadsheet,
      badge: undefined
    }
  ];

  return (
    <aside
      id="main-sidebar"
      className={`relative flex flex-col border-r border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 transition-all duration-300 select-none z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
        <div 
          className="flex items-center space-x-3 cursor-pointer overflow-hidden"
          onClick={() => onSelectView('work-queue')}
          title="FormFlow OCR Operations"
        >
          <div className="w-8 h-8 shrink-0 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm shadow-sm shadow-blue-500/20">
            FF
          </div>
          {!collapsed && (
            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight truncate">FormFlow</span>
              <span className="text-xs font-semibold px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/30">OCR</span>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          id="sidebar-toggle-btn"
          onClick={onToggleCollapse}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100 transition-colors ml-1"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        <div className="px-2 pb-2">
          {!collapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isBurmese ? 'အဓိက လုပ်ငန်းစဉ်' : 'Operations'}
            </span>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => onSelectView(item.id)}
              title={collapsed ? (isBurmese ? item.labelMm : item.labelEn) : undefined}
              className={`w-full p-2 rounded-lg flex items-center space-x-3 cursor-pointer transition-colors text-sm ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-100 dark:bg-blue-600/10 dark:text-blue-400 dark:border-transparent'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between truncate text-left">
                  <span className={`truncate ${isBurmese ? 'font-myanmar text-[13px]' : 'text-sm'}`}>
                    {isBurmese ? item.labelMm : item.labelEn}
                  </span>
                  {item.badge !== undefined && (
                    <span className={`ml-2 inline-flex items-center justify-center rounded px-1.5 py-0.2 text-[11px] font-bold ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {collapsed && item.badge !== undefined && (
                <span className="absolute top-2 right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        {!collapsed ? (
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-slate-700 dark:text-slate-300 font-medium">System: Healthy</span>
            </div>
            <div className="mt-1 text-slate-500 flex items-center justify-between text-[11px]">
              <span>v2.4.0 (Production)</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">99.96%</span>
            </div>
            {isBurmese && (
              <div className="mt-1 text-[10px] text-slate-400 font-myanmar">
                ရန်ကုန် ဆာဗာ အချက်အလက်
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-1" title="System: Healthy">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
          </div>
        )}
      </div>
    </aside>
  );
};
