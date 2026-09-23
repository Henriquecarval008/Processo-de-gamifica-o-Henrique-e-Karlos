import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Users,
  Trophy,
  Sparkles,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  Paperclip,
  TrendingUp,
  Download,
} from 'lucide-react';
import { ClassRoom } from '../../types';

interface TeacherClassesProps {
  onSelectStudent?: (studentId: string) => void;
}

export const TeacherClasses: React.FC<TeacherClassesProps> = ({ onSelectStudent }) => {
  const {
    classes,
    users,
    activities,
    submissions,
    sharedFiles,
    quizzes,
    levels,
    activeProjectId,
    projects,
    courses,
    modules,
    lessons,
    openLessonDetail,
    didacticMaterials,
  } = useGameinfor();

  // Filter classes by activeProjectId if not 'all'
  const displayClasses = activeProjectId === 'all'
    ? classes
    : classes.filter((c) => c.projectId === activeProjectId);

  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const selectedClass = classes.find((c) => c.id === selectedClassId) || displayClasses[0] || classes[0];
  const [classTab, setClassTab] = useState<'alunos' | 'aulas' | 'arquivos'>('alunos');

  // Course and lessons for the selected class
  const classCourse = courses.find((c) => c.id === selectedClass?.courseId) || courses[0];
  const classModules = modules.filter((m) => !classCourse || m.courseId === classCourse.id);
  const classLessons = lessons.filter((l) => classModules.some((m) => m.id === l.moduleId));

  // Students belonging to the selected class
  const classStudents = users.filter(
    (u) => u.role === 'aluno' && u.classId === selectedClass?.id
  );

  // Files of selected class
  const classFiles = sharedFiles.filter((f) => f.classId === selectedClass?.id);

  // Activities of selected class
  const classActivities = activities.filter((a) => a.classId === selectedClass?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-indigo-400" />
            Minhas Turmas
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Selecione uma turma para visualizar a lista completa de alunos, XP, níveis, arquivos e desempenho pedagógico.
          </p>
        </div>
      </div>

      {/* Class Cards Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayClasses.map((cls) => {
          const isSelected = selectedClass?.id === cls.id;
          return (
            <div
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-850 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {cls.projectName || 'Projeto Institucional'}
                    </span>
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      {cls.courseName}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white mt-0.5">{cls.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {cls.schedule}
                  </p>
                </div>

                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                  <div className="text-xs text-slate-400">Alunos</div>
                  <div className="text-base font-black text-white">{cls.studentCount}</div>
                </div>
              </div>

              {/* Progress & Stats */}
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
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
          );
        })}
      </div>

      {/* Selected Class Deep View */}
      {selectedClass && (
        <div className="space-y-6">
          {/* Class Summary Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase">
                  Detalhamento da Turma
                </span>
                <h2 className="text-xl font-black text-white">{selectedClass.name}</h2>
                <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                  <span>Curso: <strong>{selectedClass.courseName}</strong></span>
                  <span>•</span>
                  <span>Professor: <strong>{selectedClass.teacherName}</strong></span>
                  <span>•</span>
                  <span>Alunos: <strong>{selectedClass.studentCount}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Frequência Média
                  </span>
                  <div className="text-sm font-black text-emerald-400">94.2%</div>
                </div>
                <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Arquivos
                  </span>
                  <div className="text-sm font-black text-cyan-400">
                    {classFiles.length} publicados
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-tabs inside selected class */}
            <div className="flex items-center gap-2 border-b border-slate-800 pt-2 pb-3 overflow-x-auto">
              <button
                onClick={() => setClassTab('alunos')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  classTab === 'alunos'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Alunos Matriculados ({classStudents.length})
              </button>

              <button
                onClick={() => setClassTab('aulas')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  classTab === 'aulas'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Aulas do Curso ({classLessons.length})
              </button>

              <button
                onClick={() => setClassTab('arquivos')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  classTab === 'arquivos'
                    ? 'bg-amber-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Atividades & Arquivos
              </button>
            </div>

            {/* TAB 1: Alunos */}
            {classTab === 'alunos' && (
              <div className="pt-2 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  Alunos Matriculados na Turma ({classStudents.length})
                </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Aluno</th>
                      <th className="py-3 px-3">Apelido (Ranking)</th>
                      <th className="py-3 px-3">Nível</th>
                      <th className="py-3 px-3 text-right">XP Acumulado</th>
                      <th className="py-3 px-3 text-center">Atividades Concluídas</th>
                      <th className="py-3 px-3 text-center">Pendências</th>
                      <th className="py-3 px-3 text-center">Desempenho</th>
                      <th className="py-3 px-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {classStudents.map((st) => {
                      const studentSubs = submissions.filter((s) => s.studentId === st.id);
                      const completedCount = studentSubs.filter(
                        (s) => s.status === 'corrigido'
                      ).length;
                      const pendingCount = studentSubs.filter(
                        (s) => s.status === 'pendente'
                      ).length;

                      const lvlInfo =
                        levels.find((l) => l.level === st.level) || levels[0];

                      return (
                        <tr
                          key={st.id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4 flex items-center gap-3">
                            <img
                              src={st.avatar}
                              alt={st.name}
                              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                            />
                            <div>
                              <div className="font-bold text-white">{st.name}</div>
                              <div className="text-[10px] text-slate-400">{st.email}</div>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-cyan-300 font-mono font-semibold">
                            {st.nickname || '—'}
                          </td>

                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-cyan-300 border border-blue-500/20">
                              Nível {st.level}
                            </span>
                          </td>

                          <td className="py-3 px-3 text-right font-black text-amber-400">
                            {st.xp} XP
                          </td>

                          <td className="py-3 px-3 text-center font-bold text-emerald-400">
                            {completedCount}
                          </td>

                          <td className="py-3 px-3 text-center">
                            {pendingCount > 0 ? (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                                {pendingCount} pendente
                              </span>
                            ) : (
                              <span className="text-slate-500">0</span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span className="text-xs font-semibold text-emerald-400">
                              {st.xp > 700 ? 'Excelente' : st.xp > 400 ? 'Bom' : 'Em evolução'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onSelectStudent && onSelectStudent(st.id)}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white text-[11px] font-semibold transition-all"
                            >
                              Ver Perfil
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}

            {/* TAB 2: Aulas do Curso */}
            {classTab === 'aulas' && (
              <div className="pt-2 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      Grade de Aulas: {classCourse?.title || selectedClass.courseName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Clique em qualquer aula para visualizar detalhes pedagógicos, objetivos, apostila e atividades.
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-semibold self-start sm:self-auto">
                    {classLessons.length} Aulas no Curso
                  </span>
                </div>

                <div className="space-y-2.5">
                  {classLessons.map((lesson) => {
                    const hasMaterial = didacticMaterials.some((m) => m.lessonId === lesson.id);
                    return (
                      <div
                        key={lesson.id}
                        onClick={() => openLessonDetail(lesson)}
                        className="p-3.5 bg-slate-950/70 border border-slate-800 hover:border-blue-500/80 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-all cursor-pointer group"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="w-5 h-5 rounded-md bg-blue-600/30 text-blue-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {lesson.order || '•'}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                              {lesson.title}
                            </span>
                            {hasMaterial && (
                              <span className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1">
                                <BookOpen className="w-2.5 h-2.5 text-indigo-400" />
                                Apostila
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">
                            {lesson.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            {lesson.durationMin} min
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLessonDetail(lesson);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-all"
                          >
                            Acessar Aula
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Arquivos e Atividades */}
            {classTab === 'arquivos' && (
              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Arquivos Enviados para esta turma */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-cyan-400" />
                    Arquivos Publicados nesta Turma ({classFiles.length})
                  </h3>

                  <div className="space-y-2">
                    {classFiles.length === 0 ? (
                      <p className="text-xs text-slate-400">Nenhum arquivo publicado.</p>
                    ) : (
                      classFiles.map((f) => (
                        <div
                          key={f.id}
                          className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-semibold text-white">{f.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {f.module} • {f.materialType} • {f.fileSize}
                            </div>
                          </div>
                          <button
                            onClick={() => alert(`Baixando: ${f.name}`)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Atividades ativas */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                    Atividades da Turma ({classActivities.length})
                  </h3>

                  <div className="space-y-2">
                    {classActivities.map((act) => (
                      <div
                        key={act.id}
                        className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{act.title}</div>
                          <div className="text-[10px] text-slate-400">
                            {act.module} • Prazo: {act.dueDate}
                          </div>
                        </div>
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          +{act.xp} XP
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
