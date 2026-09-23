import React from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import { CheckCircle2, Sparkles, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications, dismissNotification } = useGameinfor();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {notifications.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            toast.type === 'xp'
              ? 'bg-amber-950/90 border-amber-500/40 text-amber-100'
              : toast.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
              : 'bg-slate-900/90 border-blue-500/40 text-slate-100'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {toast.type === 'xp' ? (
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm border border-amber-500/40">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
              ) : toast.type === 'success' ? (
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/40">
                  <Info className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold text-sm tracking-tight text-white flex items-center gap-2">
                  {toast.title}
                  {toast.xpAmount && (
                    <span className="bg-amber-500 text-slate-950 text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
                      +{toast.xpAmount} XP
                    </span>
                  )}
                </h4>
                <button
                  onClick={() => dismissNotification(toast.id)}
                  className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
