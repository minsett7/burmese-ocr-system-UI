import React from 'react';
import { X, Activity, CheckCircle2, ShieldAlert, Cpu, Server, Database, RefreshCw, Zap } from 'lucide-react';
import { ServiceHealth } from '../types';

interface ServiceHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  services: ServiceHealth[];
  isBurmese: boolean;
}

export const ServiceHealthModal: React.FC<ServiceHealthModalProps> = ({
  isOpen,
  onClose,
  services,
  isBurmese
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-myanmar">
                  {isBurmese ? 'OCR နှင့် စနစ် လည်ပတ်မှု အခြေအနေ' : 'OCR & Microservice Telemetry'}
                </h2>
                <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  4/4 Available
                </span>
              </div>
              <p className="text-xs text-slate-500 font-myanmar">
                {isBurmese ? 'ရန်ကုန် အချက်အချာ ဆာဗာ အချိန်နှင့်တပြေးညီ အခြေအနေ' : 'Real-time health status of Yangon Operations processing cluster'}
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

        {/* Services List */}
        <div className="py-4 space-y-3">
          {services.map((svc) => (
            <div
              key={svc.key}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                    {svc.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">({svc.version})</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-slate-500">{svc.latencyMs} ms</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{svc.uptimePercentage}%</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {svc.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            <span>Region: asia-southeast1 (Yangon Transit)</span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-1.5 text-xs font-semibold hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
