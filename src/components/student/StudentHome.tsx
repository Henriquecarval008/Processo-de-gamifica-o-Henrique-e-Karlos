import React from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  FileSpreadsheet,
  HelpCircle,
  Award,
  Download,
  AlertCircle,
} from 'lucide-react';

interface StudentHomeProps {
  onNavigate: (tabId: string) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ onNavigate }) => {
  const {
    currentUser,
    levels,
    activities,
    submissions,
    quizzes,
    achievements,
    sharedFiles,
    lessons,
  } = useGameinfor();

  // Current level data
  const currentLevel = levels.find((l) => l.level === currentUser.level) || levels[0];
  const nextLevel = levels.find((l) => l.level === currentUser.level + 1);

  let xpPercent = 100;
  let xpNeeded = 0;
  if (nextLevel) {
    const range = nextLevel.minXp - currentLevel.minXp;
    const currentInLevel = Math.max(0, currentUser.xp - currentLevel.minXp);
    xpPercent = Math.min(100, Math.round((currentInLevel / range) * 100));
    xpNeeded = Math.max(0, nextLevel.minXp - currentUser.xp);
  }

  // Student specific stats
  const mySubmissions = submissions.filter((s) => s.studentId === currentUser.id);
  const completedActivities = mySubmissions.filter((s) => s.status === 'corrigido').length;
  const pendingSubmissions = mySubmissions.filter((s) => s.status === 'pendente').length;
  const unlockedAchievements = achievements.filter((a) => a.unlocked).length;
  const completedLessons = lessons.filter((l) => l.completed).length;

  return (
    <div className="space-y-6">
      {/* Welcome & Level Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 border border-blue-500/20 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                {currentUser.className || 'Turma Ativa'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ID: {currentUser.nickname}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Olá, {currentUser.name}! 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Continue sua jornada gamificada em informática. Complete a atividade de{' '}
              <strong className="text-cyan-300 font-semibold">Planilha de Controle de Materiais</strong>{' '}
              e ganhe mais XP para avançar de nível!
            </p>
          </div>

          {/* Gamification Progress Box */}
          <div className="bg-slate-950/80 border border-blue-500/30 rounded-2xl p-5 min-w-[280px] shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Nível {currentUser.level}
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {currentLevel.title}
                </h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-bold text-amber-400">
                  <Trophy className="w-6 h-6 text-amber-400" />
                </div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="space-y-1.5 mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Progresso XP</span>
                <span className="text-amber-400 font-extrabold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 inline" />
                  {currentUser.xp} XP
                </span>
              </div>
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400 rounded-full transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              {nextLevel ? (
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{currentLevel.minXp} XP</span>
                  <span className="text-cyan-400 font-semibold">
                    Faltam {xpNeeded} XP para o Nível {nextLevel.level}
                  </span>
                  <span>{nextLevel.minXp} XP</span>
                </div>
              ) : (
                <span className="text-[11px] text-emerald-400 font-semibold">
                  Nível Máximo Atingido! Mestre da Tecnologia 👑
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Fast Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Atividades Corrigidas</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{completedActivities}</span>
            {pendingSubmissions > 0 && (
              <span className="text-xs font-medium text-amber-400">
                ({pendingSubmissions} em correção)
              </span>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Aulas Concluídas</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{completedLessons}</span>
            <span className="text-xs text-slate-400 font-medium">de {lessons.length} aulas</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Conquistas</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{unlockedAchievements}</span>
            <span className="text-xs text-slate-400 font-medium">de {achievements.length} troféus</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total de XP</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400">{currentUser.xp}</span>
            <span className="text-xs text-slate-400 font-medium">pontos</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Atividade Destaque & Próximo Módulo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Atividades Pendentes & Envio */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              Atividades do Curso
            </h2>
            <button
              onClick={() => onNavigate('aluno-atividades')}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activities.map((act) => {
              const mySub = mySubmissions.find((s) => s.activityId === act.id);
              return (
                <div
                  key={act.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                          {act.module} • {act.lesson}
                        </span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Entrega: {act.dueDate}
                        </span>
                      </div>
                      <h3 className="font-bold text-white text-base">
                        {act.title}
                      </h3>
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {act.description}
                      </p>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-xs font-extrabold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        +{act.xp} XP
                      </div>

                      {mySub ? (
                        mySub.status === 'corrigido' ? (
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Corrigido (+{mySub.awardedXp || act.xp} XP)
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            🟡 Aguardando correção
                          </span>
                        )
                      ) : (
                        <button
                          onClick={() => onNavigate('aluno-atividades')}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
                        >
                          Enviar Atividade
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Banner: Quiz Excel Básico */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-blue-950 border border-indigo-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Desafio de Conhecimento
              </span>
              <h3 className="font-extrabold text-white text-base">
                Quiz — Excel Básico
              </h3>
              <p className="text-xs text-slate-300">
                Teste seus conhecimentos em linhas, colunas, células e fórmulas como =SOMA().
              </p>
            </div>
            <button
              onClick={() => onNavigate('aluno-quizzes')}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Jogar Quiz (+120 XP)
            </button>
          </div>
        </div>

        {/* Right Column: Materiais & Níveis */}
        <div className="space-y-6">
          {/* Materiais da Turma */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                Arquivos do Professor
              </h3>
              <span className="text-[11px] text-slate-400">
                {sharedFiles.length} disponíveis
              </span>
            </div>

            <div className="space-y-2">
              {sharedFiles.slice(0, 3).map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {f.module} • {f.materialType} • {f.fileSize}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      alert(`Iniciando download do arquivo de apoio: ${f.name}`);
                    }}
                    className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors shrink-0"
                    title="Baixar arquivo"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trilha de Níveis do GAMEINFOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Trilha de Níveis
            </h3>

            <div className="space-y-2">
              {levels.map((lvl) => {
                const isCurrent = lvl.level === currentUser.level;
                const isPassed = lvl.level < currentUser.level;
                return (
                  <div
                    key={lvl.level}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-blue-600/20 border-blue-500/40 text-blue-200'
                        : isPassed
                        ? 'bg-emerald-950/20 border-emerald-500/20 text-slate-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold flex items-center gap-1.5">
                        {lvl.badge}
                      </span>
                      <span className="text-[10px] font-mono">
                        {lvl.minXp} - {lvl.maxXp} XP
                      </span>
                    </div>
                    <div className="text-[11px] font-medium mt-1">
                      Nível {lvl.level}: {lvl.title}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
