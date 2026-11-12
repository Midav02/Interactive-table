import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      aria-label="Офлайн уведомление"
      className="fixed bottom-10 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/90 text-white backdrop-blur-md px-3.5 py-2 text-xs font-medium shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
        <WifiOff className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="font-semibold text-slate-100 leading-tight">Офлайн-режим</p>
        <p className="text-[11px] text-slate-300">Данные сохраняются локально на вашем устройстве</p>
      </div>
    </aside>
  );
};
