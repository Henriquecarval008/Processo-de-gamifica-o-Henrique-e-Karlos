import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  FileSpreadsheet,
  HelpCircle,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Lesson, DidacticMaterial } from '../../types';
import { DidacticBookletViewer } from '../common/DidacticBookletViewer';

export const StudentCurriculum: React.FC = () => {
  const {
    lessons,
    modules,
    courses,
    activities,
    quizzes,
    didacticMaterials,
    toggleLessonCompleted,
    openLessonDetail,
    currentUser,
  } = useGameinfor();

  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || 'mod-excel');
  const activeModule = modules.find((m) => m.id === selectedModuleId) || modules[0];
  const activeLessons = lessons.filter((l) => l.moduleId === activeModule.id);

  const [selectedLesson, setSelectedLesson] = useState<Lesson>(activeLessons[0] || lessons[0] || null);
  const [viewingMaterial, setViewingMaterial] = useState<DidacticMaterial | null>(null);

  const completedCount = activeLessons.filter((l) => l.completed).length;
  const progressPercent = activeLessons.length > 0 ? Math.round((completedCount / activeLessons.length) * 100) : 0;

  // Keep selectedLesson in sync when lessons state changes
  const currentSelectedLesson = lessons.find((l) => l.id === selectedLesson?.id) || selectedLesson;

  // Check published material for currently selected lesson
  const selectedLessonMaterial = didacticMaterials.find(
    (m) => m.lessonId === selectedLesson?.id && m.status === 'publicado'
  );

  // If student opened a booklet, render the full viewer
  if (viewingMaterial) {
    return (
      <DidacticBookletViewer
        material={viewingMaterial}
        onClose={() => setViewingMaterial(null)}
        isTeacherView={false}
      />
    );
  }

  // Related activity or quiz for selected lesson
  const relatedActivity = activities.find((a) =>
    a.lesson.toLowerCase().includes(selectedLesson?.title.substring(0, 7).toLowerCase())
  );
  const relatedQuiz = quizzes.find((q) => q.module.toLowerCase() === 'excel');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
            {currentUser.className || 'Informática Básica'}
          </span>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1">
            <BookOpen className="w-7 h-7 text-blue-400" />
            Currículo do Curso & Aulas
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Acompanhe a grade curricular oficial do módulo de Excel e marque suas aulas concluídas.
          </p>
        </div>

        {/* Progress pill */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-w-[200px]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">Progresso do Módulo</span>
            <span className="font-extrabold text-cyan-400">{progressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1 text-right">
            {completedCount} de {activeLessons.length} aulas concluídas
          </div>
        </div>
      </div>

      {/* Module Selector */}
      {modules.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setSelectedModuleId(m.id);
                const first = lessons.find((l) => l.moduleId === m.id);
                if (first) setSelectedLesson(first);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedModuleId === m.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {m.title}
            </button>
          ))}
        </div>
      )}

      {/* Course & Module Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Lessons List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                MÓDULO: {activeModule.title}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              {activeLessons.length} Aulas Estruturadas
            </span>
          </div>

          <div className="space-y-2">
            {activeLessons.map((lesson) => {
              const isSelected = currentSelectedLesson?.id === lesson.id;
              return (
                <div
                  key={lesson.id}
                  onClick={() => setSelectedLesson(lesson)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 text-white shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLessonCompleted(lesson.id);
                      }}
                      className="p-1 text-slate-400 hover:text-white shrink-0"
                      title={lesson.completed ? 'Marcar como não concluída' : 'Marcar como concluída'}
                    >
                      {lesson.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {lesson.title}
                        </span>
                        {didacticMaterials.some(
                          (m) => m.lessonId === lesson.id && m.status === 'publicado'
                        ) && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shrink-0">
                            <BookOpen className="w-2.5 h-2.5 text-indigo-400" />
                            Apostila
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.durationMin} min
                        </span>
                        <span>•</span>
                        <span className="truncate">{lesson.description}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLessonDetail(lesson);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-cyan-300 text-[10px] font-bold border border-blue-500/40 hidden sm:inline-flex"
                    >
                      Ver Detalhes
                    </button>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-blue-400 translate-x-1' : 'text-slate-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Selected Lesson Details */}
        <div className="lg:col-span-5">
          {currentSelectedLesson ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 sticky top-24 shadow-xl">
              <div>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                  Detalhes da Aula
                </span>
                <h2 className="text-lg font-black text-white mt-1">
                  {currentSelectedLesson.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Duração: {currentSelectedLesson.durationMin} minutos
                  </span>
                  <span>•</span>
                  <span
                    className={`font-semibold ${
                      currentSelectedLesson.completed ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {currentSelectedLesson.completed ? 'Concluída ✓' : 'Pendente de Estudo'}
                  </span>
                </div>
              </div>

              {/* Lesson Objectives */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Conteúdo Programático & Objetivos
                </h4>
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl text-xs text-slate-200 leading-relaxed space-y-2">
                  <p>{currentSelectedLesson.description}</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pt-1">
                    <li>Conceitos teóricos e fundamentação</li>
                    <li>Exercícios práticos com planilhas reais</li>
                    <li>Fixação através de desafios gamificados</li>
                  </ul>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <button
                  onClick={() => openLessonDetail(currentSelectedLesson)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Acessar Aula Completa (Ementa & Guia)
                </button>

                <button
                  onClick={() => toggleLessonCompleted(currentSelectedLesson.id)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    currentSelectedLesson.completed
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {currentSelectedLesson.completed
                    ? 'Desmarcar Conclusão'
                    : 'Marcar Aula como Concluída (+25 XP)'}
                </button>

                {/* Official Didactic Material if Published */}
                {selectedLessonMaterial && (
                  <div className="p-4 bg-gradient-to-r from-indigo-950/80 via-slate-950 to-blue-950/80 border border-indigo-500/40 rounded-xl space-y-2.5 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        Apostila Didática da Aula
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ~{selectedLessonMaterial.readTimeMin} min
                      </span>
                    </div>

                    <div className="text-xs font-bold text-white">
                      {selectedLessonMaterial.title}
                    </div>

                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                      {selectedLessonMaterial.summary}
                    </p>

                    <button
                      onClick={() => setViewingMaterial(selectedLessonMaterial)}
                      className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Ler Apostila Digital da Aula
                    </button>
                  </div>
                )}

                {/* Related Activity if any */}
                {relatedActivity && (
                  <div className="p-3 bg-blue-950/30 border border-blue-500/30 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      Atividade Prática Vinculada
                    </span>
                    <div className="text-xs font-bold text-white">
                      {relatedActivity.title}
                    </div>
                    <div className="text-[11px] text-amber-400 font-extrabold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Valendo +{relatedActivity.xp} XP
                    </div>
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
