import React from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
} from 'lucide-react';

export const TeacherPerformance: React.FC = () => {
  const { classes, users, submissions, quizzes } = useGameinfor();

  const students = users.filter((u) => u.role === 'aluno');
  const totalXp = students.reduce((acc, curr) => acc + curr.xp, 0);
  const avgXp = students.length > 0 ? Math.round(totalXp / students.length) : 0;

  const totalSubmissions = submissions.length;
  const correctedCount = submissions.filter((s) => s.status === 'corrigido').length;
  const correctionRate =
    totalSubmissions > 0 ? Math.round((correctedCount / totalSubmissions) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
            Desempenho & Métricas Pedagógicas
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Indicadores de engajamento, taxa de entrega de planilhas e aproveitamento geral das turmas.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Média de XP por Aluno</span>
          <div className="text-2xl font-black text-amber-400 flex items-center gap-1">
            <Sparkles className="w-5 h-5 text-amber-400" />
            {avgXp} XP
          </div>
          <p className="text-[11px] text-slate-400">Excelente retenção na turma principal</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Taxa de Resolução</span>
          <div className="text-2xl font-black text-emerald-400">{correctionRate}%</div>
          <p className="text-[11px] text-slate-400">
            {correctedCount} de {totalSubmissions} envios avaliados
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs text-slate-400 font-medium">Frequência Geral</span>
          <div className="text-2xl font-black text-cyan-400">92.8%</div>
          <p className="text-[11px] text-slate-400">Turmas engajadas no cronograma</p>
        </div>
      </div>

      {/* Performance by Class */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
          Aproveitamento Médio por Turma
        </h3>

        <div className="space-y-4">
          {classes.map((cls) => (
            <div key={cls.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{cls.name}</span>
                <span className="font-extrabold text-cyan-400 font-mono">
                  {cls.avgProgress}% de conclusão
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-700"
                  style={{ width: `${cls.avgProgress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
