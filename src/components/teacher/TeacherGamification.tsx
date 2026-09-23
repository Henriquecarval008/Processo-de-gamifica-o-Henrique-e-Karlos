import React from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Sparkles,
  Trophy,
  Award,
  Layers,
  Users,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';

export const TeacherGamification: React.FC = () => {
  const { levels, users, activities, achievements } = useGameinfor();

  const students = users.filter((u) => u.role === 'aluno');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-400" />
            Configurações de Gamificação & Regras de XP
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Controle os critérios de pontuação, faixas de evolução de níveis e recompensas automáticas de conquistas.
          </p>
        </div>
      </div>

      {/* Levels Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          Níveis da Trilha Tecnológica
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levels.map((lvl) => {
            const countInLevel = students.filter((s) => s.level === lvl.level).length;
            return (
              <div
                key={lvl.level}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400">
                    Nível {lvl.level}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    {lvl.minXp} - {lvl.maxXp} XP
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-white text-sm">{lvl.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{lvl.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Alunos no Nível:</span>
                  <span className="font-black text-amber-400">{countInLevel} alunos</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* XP Source Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-cyan-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">Atividades Práticas</h4>
          <p className="text-xs text-slate-300">
            Atribuição controlada de 50 a 200 XP por envio após correção pedagógica pelo professor.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="p-3 w-fit rounded-xl bg-indigo-500/10 text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">Quizzes com Tempo</h4>
          <p className="text-xs text-slate-300">
            Cálculo proporcional imediato com base no número de acertos e tempo de resposta.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="font-bold text-white text-sm">Conquistas & Badges</h4>
          <p className="text-xs text-slate-300">
            Recompensas extras de 50 a 200 XP por marcos e persistência nos estudos.
          </p>
        </div>
      </div>
    </div>
  );
};
