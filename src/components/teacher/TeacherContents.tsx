import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  BookOpen,
  Layers,
  Plus,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  HelpCircle,
  ChevronRight,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';
import { Lesson } from '../../types';

export const TeacherContents: React.FC = () => {
  const {
    courses,
    modules,
    lessons,
    activities,
    quizzes,
    didacticMaterials,
    openLessonDetail,
  } = useGameinfor();

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || '');
  const courseModules = modules.filter((m) => !selectedCourseId || m.courseId === selectedCourseId);
  const [selectedModuleId, setSelectedModuleId] = useState(courseModules[0]?.id || modules[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const selectedModule = modules.find((m) => m.id === selectedModuleId) || courseModules[0] || modules[0];
  const moduleLessons = lessons
    .filter((l) => l.moduleId === selectedModule?.id)
    .filter((l) => !searchTerm || l.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Grade Curricular & Aulas
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1">
            <BookOpen className="w-7 h-7 text-indigo-400" />
            Gestão de Conteúdos & Aulas
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Navegue pelos cursos, módulos e clique em qualquer aula para visualizar detalhes pedagógicos, apostilas, atividades e quizzes.
          </p>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs flex items-center gap-4">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Módulos</span>
            <strong className="text-white text-base">{modules.length}</strong>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Aulas Totais</span>
            <strong className="text-cyan-300 text-base">{lessons.length}</strong>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Apostilas</span>
            <strong className="text-indigo-400 text-base">{didacticMaterials.length}</strong>
          </div>
        </div>
      </div>

      {/* Course & Search Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Course Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCourseId(c.id);
                const firstMod = modules.find((m) => m.courseId === c.id);
                if (firstMod) setSelectedModuleId(firstMod.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCourseId === c.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar aula pelo título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Module Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {courseModules.map((m) => {
          const isSelected = selectedModule?.id === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedModuleId(m.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {m.title}
            </button>
          );
        })}
      </div>

      {/* Lessons in Selected Module */}
      {selectedModule && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Módulo Selecionado
                </span>
                <span className="text-slate-600 text-xs">•</span>
                <span className="text-xs text-slate-400">
                  {selectedCourse?.title}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">{selectedModule.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{selectedModule.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-semibold">
                {moduleLessons.length} Aulas Disponíveis
              </span>
            </div>
          </div>

          {/* Interactive Lesson Cards */}
          <div className="space-y-2.5">
            {moduleLessons.map((lesson) => {
              const hasMaterial = didacticMaterials.some((m) => m.lessonId === lesson.id);
              const hasActivity = activities.some((a) =>
                a.lesson.toLowerCase().includes(lesson.title.substring(0, 7).toLowerCase())
              );
              const hasQuiz = quizzes.some((q) => q.module.toLowerCase().includes('excel'));

              return (
                <div
                  key={lesson.id}
                  onClick={() => openLessonDetail(lesson)}
                  className="p-4 bg-slate-950/70 border border-slate-800/90 hover:border-indigo-500/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-5 h-5 rounded-md bg-indigo-600/30 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {lesson.order || '•'}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {lesson.title}
                      </h3>
                      {hasMaterial && (
                        <span className="px-2 py-0.5 rounded text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1">
                          <BookOpen className="w-2.5 h-2.5 text-indigo-400" />
                          Apostila
                        </span>
                      )}
                      {hasActivity && (
                        <span className="px-2 py-0.5 rounded text-[9px] bg-blue-500/20 text-cyan-300 border border-blue-500/30 font-bold flex items-center gap-1">
                          <FileSpreadsheet className="w-2.5 h-2.5 text-cyan-400" />
                          Atividade
                        </span>
                      )}
                      {hasQuiz && (
                        <span className="px-2 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                          <HelpCircle className="w-2.5 h-2.5 text-purple-400" />
                          Quiz
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">
                      {lesson.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0 self-end sm:self-center">
                    <span className="flex items-center gap-1 font-mono text-[11px] bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      {lesson.durationMin} min
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openLessonDetail(lesson);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md group-hover:translate-x-0.5"
                    >
                      Acessar Aula
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

