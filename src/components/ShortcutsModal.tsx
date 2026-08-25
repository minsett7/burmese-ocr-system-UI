import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isBurmese: boolean;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  isOpen,
  onClose,
  isBurmese
}) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      group: 'Review & Navigation',
      items: [
        { keys: ['J'], desc: 'Next document / queue item' },
        { keys: ['K'], desc: 'Previous document / queue item' },
        { keys: ['Tab'], desc: 'Focus next extracted field' },
        { keys: ['Shift', 'Tab'], desc: 'Focus previous field' },
        { keys: ['⌘ / Ctrl', '↵ Enter'], desc: 'Approve claim document and load next' }
      ]
    },
    {
      group: 'Document & Region Canvas',
      items: [
        { keys: ['+ / ='], desc: 'Zoom in document canvas' },
        { keys: ['-'], desc: 'Zoom out document canvas' },
        { keys: ['0'], desc: 'Reset zoom level to 100%' },
        { keys: ['O'], desc: 'Toggle bounding box overlay' }
      ]
    },
    {
      group: 'Global Operations',
      items: [
        { keys: ['⌘ / Ctrl', 'K'], desc: 'Global search and claim filter' },
        { keys: ['?'], desc: 'Open keyboard shortcuts cheatsheet' },
        { keys: ['Esc'], desc: 'Close modals, drawers, and active popups' }
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
              <Keyboard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-myanmar">
                {isBurmese ? 'ကီးဘုတ် ဖြတ်လမ်းများ' : 'Keyboard Shortcuts'}
              </h2>
              <p className="text-xs text-slate-500 font-myanmar">
                {isBurmese ? 'စာရွက်စာတမ်း အမြန် စစ်ဆေးနိုင်ရန် ဖြတ်လမ်းများ' : 'High-volume claim review speed controls'}
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

        {/* Shortcuts List */}
        <div className="py-4 space-y-4 text-xs">
          {shortcutGroups.map((grp) => (
            <div key={grp.group} className="space-y-2">
              <div className="font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {grp.group}
              </div>
              <div className="space-y-1.5">
                {grp.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                  >
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-200 shadow-xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
