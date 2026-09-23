import React from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Users,
  CheckSquare,
  Paperclip,
  Brain,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface TeacherHomeProps {
  onNavigate: (tabId: string) => void;
}

export const TeacherHome: React.FC<TeacherHomeProps> = ({ onNavigate }) => {
  const { classes, users, activities, submissions, sharedFiles, quizzes, currentUser } =
    useGameinfor();

  const teacherStudents = users.filter((u) => u.role === 'aluno');
  const pendingSubmissions = submissions.filter((s) => s.status === 'pendente');
  const correctedSubmissions = submissions.filter((s) => s.status === 'corrigido');

  return (
    <div className="space-y-6">
      {/* Welcome Hero */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Espaço do Educador
            </span>
            <span className="text-xs text-slate-400">
              GAMEINFOR Pedagogia & Gamificação
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Painel do Professor — {currentUser.name}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Gerencie suas turmas, envie apostilas e exercícios de Excel, lance atividades práticas e avalie os envios dos estudantes com atribuição de XP.
          </p>
        </div>

        {/* Quick action: pending corrections CTA */}
        {pendingSubmissions.length > 0 && (
          <div className="bg-slate-950/90 border border-amber-500/40 p-4 rounded-xl shrink-0 flex flex-col items-start gap-2 shadow-lg">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <Clock className="w-4 h-4 animate-spin" />
              <span>{pendingSubmissions.length} Atividade(s) aguardando correção</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Avalie os trabalhos e credite XP aos alunos.
            </p>
            <button
              onClick={() => onNavigate('prof-atividades')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md"
            >
              Corrigir Agora
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('prof-turmas')}
          className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-xl cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Minhas Turmas</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{classes.length}</div>
          <span className="text-[11px] text-indigo-300 font-medium flex items-center gap-1 mt-1">
            Ver detalhes das turmas <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('prof-alunos')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/40 p-5 rounded-xl cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total de Alunos</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{teacherStudents.length}</div>
          <span className="text-[11px] text-blue-300 font-medium flex items-center gap-1 mt-1">
            Ver perfis individuais <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('prof-atividades')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-5 rounded-xl cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pendentes p/ Corrigir</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-400">
            {pendingSubmissions.length}
          </div>
          <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1 mt-1">
            Fila de avaliação de XP <ArrowRight className="w-3 h-3" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('prof-arquivos')}
          className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 p-5 rounded-xl cursor-pointer transition-all shadow-md group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Arquivos Publicados</span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20">
              <Paperclip className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-white">{sharedFiles.length}</div>
          <span className="text-[11px] text-cyan-300 font-medium flex items-center gap-1 mt-1">
            Gerenciar materiais <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* Main Grid: Atividades para Corrigir (Immediate Highlight) & Turmas Ativas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Atividades para Corrigir */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-400" />
              Atividades Recentes para Correção
            </h2>
            <button
              onClick={() => onNavigate('prof-atividades')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Abrir central de notas
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {pendingSubmissions.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Tudo em dia!</h4>
                <p className="text-xs text-slate-400">
                  Nenhum trabalho pendente de correção no momento.
                </p>
              </div>
            ) : (
              pendingSubmissions.slice(0, 3).map((sub) => (
                <div
                  key={sub.id}
                  className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {sub.studentName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({sub.studentNickname})
                      </span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        🟡 Pendente
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-indigo-300">
                      {sub.activityTitle}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>Arquivo: <strong>{sub.fileName}</strong> ({sub.fileSize})</span>
                      <span>•</span>
                      <span>Enviado: {sub.submittedAt}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('prof-atividades')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
                  >
                    Avaliar & Dar XP
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div
              onClick={() => onNavigate('prof-materiais')}
              className="bg-slate-900/80 border border-slate-800 hover:border-blue-500 p-4 rounded-xl cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-cyan-400 group-hover:bg-blue-500/20 shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">+ Gerar Material</div>
                <div className="text-[11px] text-slate-400">Apostila didática</div>
              </div>
            </div>

            <div
              onClick={() => onNavigate('prof-atividades')}
              className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500 p-4 rounded-xl cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">+ Criar Atividade</div>
                <div className="text-[11px] text-slate-400">Exercício com XP</div>
              </div>
            </div>

            <div
              onClick={() => onNavigate('prof-arquivos')}
              className="bg-slate-900/80 border border-slate-800 hover:border-cyan-500 p-4 rounded-xl cursor-pointer transition-all flex items-center gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 shrink-0">
                <Paperclip className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">+ Enviar Arquivo</div>
                <div className="text-[11px] text-slate-400">PDF, XLSX ou PPTX</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Turmas do Professor */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Turmas sob Minha Gestão
            </h2>
            <button
              onClick={() => onNavigate('prof-turmas')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Ver todas
            </button>
          </div>

          <div className="space-y-3">
            {classes.map((cls) => (
              <div
                key={cls.id}
                onClick={() => onNavigate('prof-turmas')}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl cursor-pointer transition-all space-y-3 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    {cls.courseName}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {cls.studentCount} Alunos
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">{cls.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{cls.schedule}</p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Progresso Médio</span>
                    <span className="font-extrabold text-cyan-400">{cls.avgProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                      style={{ width: `${cls.avgProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
