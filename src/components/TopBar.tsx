import React, { useState } from 'react';
import { 
  Bell, 
  ChevronRight
} from 'lucide-react';
import { NavView, ServiceHealth } from '../types';
import { MOCK_NOTIFICATIONS } from '../data/mockData';

interface TopBarProps {
  currentView: NavView;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
  isBurmese?: boolean;
  onToggleBurmese?: () => void;
  onOpenShortcuts?: () => void;
  onOpenServiceHealth: () => void;
  services: ServiceHealth[];
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  selectedDocClaimNo?: string;
  selectedTemplateCode?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  isBurmese = false,
  onOpenServiceHealth,
  services,
  selectedDocClaimNo,
  selectedTemplateCode
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(MOCK_NOTIFICATIONS);

  const operationalServicesCount = services.filter(s => s.status === 'operational').length;
  const totalServicesCount = services.length;
  const unreadCount = unreadNotifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setUnreadNotifications(unreadNotifications.map(n => ({ ...n, unread: false })));
  };

  const getViewBreadcrumb = () => {
    switch (currentView) {
      case 'work-queue':
        return isBurmese ? 'လုပ်ငန်းခွင် ဇယား (Work Queue)' : 'Work Queue';
      case 'templates':
        return isBurmese ? 'ပုံစံ တမ်းပလိတ်များ (Templates)' : 'Template Studio';
      case 'process-doc':
        return isBurmese ? 'စာရွက်စာတမ်း စစ်ဆေးမှု (Review)' : 'Process & Review';
      case 'records':
        return isBurmese ? 'မှတ်တမ်းနှင့် စာရင်းများ (Records)' : 'Records & Audit';
      case 'reports-export':
        return isBurmese ? 'အစီရင်ခံစာနှင့် ထုတ်ယူမှု (Export)' : 'Reports & Export';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header 
      id="app-topbar"
      className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900 transition-colors"
    >
      {/* Left: Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-slate-500 min-w-0">
        <span className="font-medium hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Dashboard</span>
        <span className="opacity-50">/</span>
        <span className="text-slate-900 dark:text-slate-100 font-medium truncate font-myanmar">
          {getViewBreadcrumb()}
        </span>

        {currentView === 'process-doc' && selectedDocClaimNo && (
          <>
            <span className="opacity-50">/</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 truncate">
              {selectedDocClaimNo}
            </span>
          </>
        )}

        {currentView === 'templates' && selectedTemplateCode && (
          <>
            <span className="opacity-50">/</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 truncate">
              {selectedTemplateCode}
            </span>
          </>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* OCR Services Status Chip */}
        <div 
          onClick={onOpenServiceHealth}
          className="flex items-center space-x-2 text-xs cursor-pointer hover:opacity-80 transition-opacity"
          title="Click to view OCR Engine & Gateway Health"
        >
          <span className="text-slate-400 font-medium hidden sm:inline uppercase tracking-wider text-[11px]">OCR SERVICES:</span>
          <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-md font-medium dark:bg-green-950/60 dark:text-green-300 dark:border-green-800 flex items-center space-x-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            <span>Available ({operationalServicesCount}/{totalServicesCount})</span>
          </span>
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            id="notifications-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100 transition-all"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    {isBurmese ? 'အသိပေးချက်များ' : 'Operations Alerts'}
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {isBurmese ? 'အားလုံး ဖတ်ပြီးပြီ' : 'Mark all read'}
                  </button>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {unreadNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-lg p-2.5 text-xs transition-colors ${
                      n.unread
                        ? 'bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50'
                        : 'bg-slate-50 dark:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
