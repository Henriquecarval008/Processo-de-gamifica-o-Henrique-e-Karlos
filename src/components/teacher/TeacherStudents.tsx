import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  GraduationCap,
  Sparkles,
  Trophy,
  CheckCircle2,
  Clock,
  Award,
  Search,
  BookOpen,
  Paperclip,
  FileSpreadsheet,
  ArrowRight,
  User as UserIcon,
} from 'lucide-react';
import { User } from '../../types';

interface TeacherStudentsProps {
  initialSelectedStudentId?: string;
}

export const TeacherStudents: React.FC<TeacherStudentsProps> = ({
  initialSelectedStudentId,
}) => {
  const { users, levels, submissions, achievements, quizAttempts } = useGameinfor();

  const students = users.filter((u) => u.role === 'aluno');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    initialSelectedStudentId || students[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');

  const selectedStudent =
    students.find((s) => s.id === selectedStudentId) || students[0];

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Student specific data
  const studentSubs = submissions.filter((s) => s.studentId === selectedStudent?.id);
  const completedSubs = studentSubs.filter((s) => s.status === 'corrigido');
  const pendingSubs = studentSubs.filter((s) => s.status === 'pendente');
  const studentAttempts = quizAttempts.filter(
    (a) => a.studentId === selectedStudent?.id
  );

  const studentLevel =
    levels.find((l) => l.level === selectedStudent?.level) || levels[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-indigo-400" />
            Gestão de Alunos & Desempenho
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Consulte o dossiê individual do aluno: progresso, nível, XP, arquivos enviados, quizzes e histórico de atividades.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou apelido..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid: Student Selector on Left & Deep Dossier on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Student List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Alunos Encontrados ({filteredStudents.length})
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredStudents.map((st) => {
              const isSelected = selectedStudent?.id === st.id;
              return (
                <div
                  key={st.id}
                  onClick={() => setSelectedStudentId(st.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={st.avatar}
                      alt={st.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {st.name}
                      </div>
                      <div className="text-[11px] text-cyan-300 font-mono">
                        @{st.nickname}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Nível {st.level} • {st.xp} XP
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded shrink-0">
                    {st.xp} XP
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Student Deep Dossier */}
        <div className="lg:col-span-8">
          {selectedStudent ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
              {/* Profile Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedStudent.avatar}
                    alt={selectedStudent.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-indigo-500/30 shadow-xl"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-white">
                        {selectedStudent.name}
                      </h2>
                      <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                        Turma: {selectedStudent.className || 'Informática'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Apelido no Ranking:{' '}
                      <strong className="text-cyan-400 font-mono font-bold">
                        {selectedStudent.nickname}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Level badge */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-right min-w-[160px]">
                  <span className="text-[10px] uppercase font-bold text-indigo-400">
                    Nível {selectedStudent.level}
                  </span>
                  <div className="text-sm font-extrabold text-white">
                    {studentLevel.title}
                  </div>
                  <div className="text-sm font-black text-amber-400 flex items-center justify-end gap-1 mt-1">
                    <Sparkles className="w-4 h-4" />
                    {selectedStudent.xp} XP Acumulado
                  </div>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">Atividades Aprovadas</span>
                  <div className="text-lg font-black text-emerald-400 mt-0.5">
                    {completedSubs.length}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">Atividades Pendentes</span>
                  <div className="text-lg font-black text-amber-400 mt-0.5">
                    {pendingSubs.length}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">Quizzes Realizados</span>
                  <div className="text-lg font-black text-indigo-400 mt-0.5">
                    {studentAttempts.length}
                  </div>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[11px] text-slate-400">Arquivos Enviados</span>
                  <div className="text-lg font-black text-cyan-400 mt-0.5">
                    {studentSubs.length}
                  </div>
                </div>
              </div>

              {/* Arquivos e Envios do Aluno (Privados para a turma/professor) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-cyan-400" />
                  Arquivos Enviados pelo Aluno (Segurança e Privacidade Garantidas)
                </h3>

                {studentSubs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-950 rounded-xl">
                    Nenhum arquivo enviado por este estudante até o momento.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {studentSubs.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{sub.fileName}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                                sub.status === 'corrigido'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {sub.status === 'corrigido'
                                ? '🟢 Corrigido'
                                : '🟡 Aguardando Correção'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Atividade: <strong>{sub.activityTitle}</strong> • {sub.fileSize} • Enviado em: {sub.submittedAt}
                          </div>
                          {sub.feedback && (
                            <div className="text-[11px] text-emerald-300 italic mt-1 bg-emerald-950/20 p-2 rounded border border-emerald-900/30">
                              Feedback: "{sub.feedback}" ({sub.awardedXp} XP)
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => alert(`Visualizando arquivo seguro: ${sub.fileName}`)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-xs font-semibold transition-all shrink-0"
                        >
                          Examinar Trabalho
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Histórico de Quizzes */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  Histórico de Desempenho em Quizzes
                </h3>

                {studentAttempts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 bg-slate-950 rounded-xl">
                    Nenhum quiz realizado ainda.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {studentAttempts.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-white">{att.quizTitle}</div>
                          <div className="text-[10px] text-slate-400">{att.completedAt}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-emerald-400">
                            Nota: {att.score}/{att.totalQuestions}
                          </span>
                          <span className="font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            +{att.xpEarned} XP
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
