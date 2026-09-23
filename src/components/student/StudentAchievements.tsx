import React from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import { Award, Sparkles, CheckCircle2, Lock } from 'lucide-react';

export const StudentAchievements: React.FC = () => {
  const { achievements, currentUser } = useGameinfor();

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXpRewards = achievements
    .filter((a) => a.unlocked)
    .reduce((acc, curr) => acc + curr.xpReward, 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-400" />
            Galeria de Conquistas & Medalhas
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Desbloqueie troféus ao completar desafios, entregar planilhas e gabaritar quizzes.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div>
            <div className="text-xs text-slate-400">Desbloqueadas</div>
            <div className="text-lg font-black text-white">
              {unlockedCount} / {achievements.length}
            </div>
          </div>
          <div className="h-8 w-px bg-slate-800" />
          <div>
            <div className="text-xs text-slate-400">XP Conquistado</div>
            <div className="text-lg font-black text-amber-400 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              +{totalXpRewards}
            </div>
          </div>
        </div>
      </div>

      {/* Trophy Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((ach) => {
          return (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
                ach.unlocked
                  ? 'bg-slate-900/90 border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-slate-950/60 border-slate-800 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                    ach.unlocked
                      ? 'bg-gradient-to-tr from-amber-500/20 to-yellow-400/20 border border-amber-500/40'
                      : 'bg-slate-800 border border-slate-700 grayscale'
                  }`}
                >
                  {ach.icon}
                </div>

                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-black shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  +{ach.xpReward} XP
                </div>
              </div>

              <div className="mt-4 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">
                    {ach.title}
                  </h3>
                  {ach.unlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {ach.description}
                </p>
              </div>

              {/* Progress bar if not unlocked */}
              <div className="mt-4 pt-3 border-t border-slate-800/80">
                {ach.unlocked ? (
                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center justify-between">
                    <span>Desbloqueado</span>
                    <span>{ach.unlockedAt}</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Progresso</span>
                      <span className="font-mono text-cyan-400 font-semibold">
                        {ach.progress} / {ach.maxProgress}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
