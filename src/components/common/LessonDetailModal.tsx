import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  FileSpreadsheet,
  HelpCircle,
  X,
  Sparkles,
  Users,
  Layers,
  ChevronRight,
  ExternalLink,
  Award,
  AlertCircle,
  Lightbulb,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { Lesson, DidacticMaterial } from '../../types';
import { DidacticBookletViewer } from './DidacticBookletViewer';

interface LessonDetailModalProps {
  lesson: Lesson | null;
  onClose: () => void;
  onNavigateTab?: (tabId: string) => void;
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  lesson,
  onClose,
  onNavigateTab,
}) => {
  const {
    currentUser,
    modules,
    courses,
    classes,
    users,
    activities,
    quizzes,
    didacticMaterials,
    toggleLessonCompleted,
    generateDidacticMaterial,
    publishDidacticMaterial,
    activeProjectId,
  } = useGameinfor();

  const [activeTab, setActiveTab] = useState<'conteudo' | 'apostila' | 'atividade' | 'quiz' | 'turma' | 'player'>('conteudo');
  const [viewingBooklet, setViewingBooklet] = useState<DidacticMaterial | null>(null);
  const [playerStepIndex, setPlayerStepIndex] = useState(0);

  if (!lesson) return null;

  const currentModule = modules.find((m) => m.id === lesson.moduleId) || modules[0];
  const currentCourse = courses.find((c) => c.id === currentModule?.courseId) || courses[0];

  // Associated didactic material (published or any if teacher)
  const lessonMaterial = didacticMaterials.find((m) =>
    m.lessonId === lesson.id && (currentUser.role === 'aluno' ? m.status === 'publicado' : true)
  );

  // Associated activity
  const lessonActivity = activities.find((a) =>
    a.lesson.toLowerCase().includes(lesson.title.substring(0, 7).toLowerCase()) ||
    a.title.toLowerCase().includes(lesson.title.toLowerCase())
  );

  // Associated quiz
  const lessonQuiz = quizzes.find((q) =>
    q.module.toLowerCase().includes('excel') ||
    q.title.toLowerCase().includes('excel')
  );

  // Students of the class for teacher tracking
  const targetClass = classes[0];
  const classStudents = users.filter((u) => u.role === 'aluno' && (!targetClass || u.classId === targetClass.id));
  const completedStudentsCount = lesson.completed ? classStudents.length : Math.max(1, Math.floor(classStudents.length * 0.6));

  const isTeacher = currentUser.role === 'professor' || currentUser.role === 'admin';

  // Interactive step slides
  const defaultSteps = [
    {
      title: 'Passo 1: Fundamentos do Tema',
      description: `Nesta etapa você compreenderá o propósito de: "${lesson.title}". ${lesson.description}`,
      tip: 'Preste atenção nos conceitos para facilitar a resolução das atividades e quizzes!',
    },
    {
      title: 'Passo 2: Demonstração e Interface',
      description: 'Observe as ferramentas e menus do Excel necessários para aplicar o conteúdo na prática. Toda funcionalidade tem um atalho e um caminho visual na Faixa de Opções.',
      tip: 'Mantenha o Excel aberto lado a lado com a plataforma para praticar em tempo real.',
    },
    {
      title: 'Passo 3: Aplicação Prática',
      description: 'Agora execute o procedimento demonstrado. Digite os dados na tabela e observe o comportamento automático das células.',
      tip: 'Se encontrar dúvidas, consulte a Apostila Digital passo a passo disponível nesta mesma aula.',
    },
    {
      title: 'Passo 4: Verificação de Aprendizagem',
      description: 'Revise o resultado obtido. Certifique-se de que os valores, fórmulas e formatações estão consistentes.',
      tip: 'Você pode testar seus conhecimentos respondendo o Quiz de Fixação da aula para ganhar pontos de XP.',
    },
  ];

  const steps = lesson.interactiveSteps && lesson.interactiveSteps.length > 0
    ? lesson.interactiveSteps
    : defaultSteps;

  const handleGenerateMaterialQuick = () => {
    const mat = generateDidacticMaterial(
      currentCourse?.id || 'curso-inf-basica',
      currentModule?.id || 'mod-excel',
      lesson.id,
      targetClass?.id || 'turma-1'
    );
    publishDidacticMaterial(mat.id);
    setViewingBooklet(mat);
  };

  // If viewing the full booklet
  if (viewingBooklet) {
    return (
      <DidacticBookletViewer
        material={viewingBooklet}
        onClose={() => setViewingBooklet(null)}
        isTeacherView={isTeacher}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full my-auto overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/70 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                {currentCourse.title}
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentModule.title}
              </span>
              {isTeacher ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Publicada para Turmas
                </span>
              ) : (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                    lesson.completed
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {lesson.completed ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Concluída ✓
                    </>
                  ) : (
                    <>
                      <Circle className="w-3 h-3 text-amber-400" />
                      Pendente de Estudo
                    </>
                  )}
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-400 shrink-0" />
              {lesson.title}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-300 pt-0.5 flex-wrap">
              <span className="flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Duração estimada: <strong className="text-white">{lesson.durationMin} minutos</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1.5 font-medium text-amber-300">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Recompensa: <strong>+25 XP</strong>
              </span>
              {lessonMaterial && (
                <>
                  <span className="text-slate-600">•</span>
                  <span className="flex items-center gap-1 font-semibold text-indigo-300">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    Apostila Didática Disponível
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors shrink-0"
            title="Fechar Detalhes da Aula"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="px-5 sm:px-6 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('conteudo')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'conteudo'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            Conteúdo & Objetivos
          </button>

          <button
            onClick={() => setActiveTab('player')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'player'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Play className="w-4 h-4" />
            Modo Aula Interativa
          </button>

          <button
            onClick={() => setActiveTab('apostila')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'apostila'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Apostila Didática {lessonMaterial && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
          </button>

          <button
            onClick={() => setActiveTab('atividade')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'atividade'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Atividade Prática
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Quiz da Aula
          </button>

          {isTeacher && (
            <button
              onClick={() => setActiveTab('turma')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'turma'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              Progresso dos Alunos
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: CONTEÚDO & OBJETIVOS */}
          {activeTab === 'conteudo' && (
            <div className="space-y-5">
              {/* Summary Box */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Visão Geral da Aula
                </span>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {lesson.description}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('player')}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    Iniciar Estudo da Aula Agora
                  </button>

                  {lessonMaterial && (
                    <button
                      onClick={() => setViewingBooklet(lessonMaterial)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      Abrir Apostila Visual
                    </button>
                  )}
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  Objetivos de Aprendizagem
                </h4>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2.5">
                  {(lesson.objectives || [
                    'Compreender os conceitos essenciais apresentados na aula.',
                    'Aplicar o passo a passo demonstrado no software Excel.',
                    'Consolidar a fixação realizando o exercício prático correspondente.',
                  ]).map((obj, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Content Topics */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  Conteúdo Programático & Ementa da Aula
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(lesson.contentTopics || [
                    'Introdução e fundamentos práticos',
                    'Demonstração passo a passo com exemplos visuais',
                    'Dicas para evitar erros frequentes no Excel',
                    'Exercício prático de laboratório',
                  ]).map((topic, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-950/50 border border-slate-800/90 p-3.5 rounded-xl flex items-center gap-3 text-xs text-slate-200"
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="font-medium">{topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODO AULA INTERATIVA (PLAYER) */}
          {activeTab === 'player' && (
            <div className="space-y-5">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    <Play className="w-4 h-4 text-blue-400" />
                    Etapa {playerStepIndex + 1} de {steps.length}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {steps.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPlayerStepIndex(i)}
                        className={`h-2 rounded-full transition-all ${
                          i === playerStepIndex
                            ? 'w-6 bg-cyan-400'
                            : i < playerStepIndex
                            ? 'w-2 bg-emerald-500'
                            : 'w-2 bg-slate-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3 py-2 min-h-[160px]">
                  <h3 className="text-lg font-black text-white">
                    {steps[playerStepIndex].title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {steps[playerStepIndex].description}
                  </p>

                  {steps[playerStepIndex].tip && (
                    <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-start gap-2.5 text-xs text-indigo-200">
                      <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{steps[playerStepIndex].tip}</span>
                    </div>
                  )}
                </div>

                {/* Player Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setPlayerStepIndex((prev) => Math.max(0, prev - 1))}
                    disabled={playerStepIndex === 0}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold text-xs transition-colors"
                  >
                    Anterior
                  </button>

                  {playerStepIndex < steps.length - 1 ? (
                    <button
                      onClick={() => setPlayerStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      Próxima Etapa
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!lesson.completed) {
                          toggleLessonCompleted(lesson.id);
                        }
                        setActiveTab('conteudo');
                      }}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {lesson.completed ? 'Aula Já Concluída' : 'Concluir Aula (+25 XP)'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: APOSTILA DIDÁTICA */}
          {activeTab === 'apostila' && (
            <div className="space-y-4">
              {lessonMaterial ? (
                <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-500/40 p-6 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Apostila Didática Oficial
                      </span>
                      <h3 className="text-lg font-black text-white mt-1.5">
                        {lessonMaterial.title}
                      </h3>
                      <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                        {lessonMaterial.summary}
                      </p>
                    </div>

                    <span className="text-xs font-mono text-cyan-300 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 shrink-0">
                      ~{lessonMaterial.readTimeMin} min de leitura
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-center text-xs">
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Seções Didáticas</span>
                      <strong className="text-white text-base">{lessonMaterial.sections.length} seções</strong>
                    </div>
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nível</span>
                      <strong className="text-cyan-300 text-base">Iniciante</strong>
                    </div>
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tabelas & Exemplos</span>
                      <strong className="text-emerald-400 text-base">Incluídos</strong>
                    </div>
                    <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Exercício Prático</span>
                      <strong className="text-amber-400 text-base">Passo a Passo</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingBooklet(lessonMaterial)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    Ler Apostila Visual Completa Passo a Passo
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-base font-bold text-white">
                      Nenhuma Apostila Vinculada no Momento
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {isTeacher
                        ? 'Você pode gerar instantaneamente uma apostila visual e didática completa para esta aula utilizando o Gerador de Material Didático.'
                        : 'O professor está estruturando o material didático desta aula. Você já pode conferir o conteúdo programático e a atividade prática.'}
                    </p>
                  </div>

                  {isTeacher && (
                    <button
                      onClick={handleGenerateMaterialQuick}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      Gerar Material Didático para Esta Aula (1 Clique)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ATIVIDADE PRÁTICA */}
          {activeTab === 'atividade' && (
            <div className="space-y-4">
              {lessonActivity ? (
                <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                        Atividade Prática Vinculada
                      </span>
                      <h3 className="text-lg font-black text-white mt-1">
                        {lessonActivity.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {lessonActivity.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        +{lessonActivity.xp} XP
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Prazo de Entrega: <strong className="text-white">{lessonActivity.dueDate}</strong>
                    </span>
                    <span className="text-slate-400">
                      Envio de Arquivos: <strong className="text-emerald-400">Habilitado (.xlsx, .pdf)</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateTab) {
                        onNavigateTab(isTeacher ? 'prof-atividades' : 'aluno-atividades');
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {isTeacher ? 'Gerenciar Atividade no Painel' : 'Ir para Atividade e Enviar Arquivo'}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <FileSpreadsheet className="w-10 h-10 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Nenhuma Atividade Cadastrada</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {isTeacher
                      ? 'Você pode cadastrar um exercício prático ou desafio de planilha para os alunos desta turma.'
                      : 'Esta aula é predominantemente teórica e introdutória.'}
                  </p>
                  {isTeacher && (
                    <button
                      onClick={() => {
                        onClose();
                        if (onNavigateTab) onNavigateTab('prof-atividades');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                    >
                      Criar Atividade Prática
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              {lessonQuiz ? (
                <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Quiz de Fixação da Aula
                      </span>
                      <h3 className="text-lg font-black text-white mt-1">
                        {lessonQuiz.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {lessonQuiz.description}
                      </p>
                    </div>

                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1.5 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                      +{lessonQuiz.rewardXp} XP
                    </span>
                  </div>

                  <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Total de Perguntas: <strong className="text-white">{lessonQuiz.questions.length} questões</strong>
                    </span>
                    <span className="text-slate-400">
                      Tempo Estimado: <strong className="text-cyan-300">~5 minutos</strong>
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      if (onNavigateTab) {
                        onNavigateTab(isTeacher ? 'prof-quizzes' : 'aluno-quizzes');
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                  >
                    <HelpCircle className="w-4 h-4" />
                    {isTeacher ? 'Gerenciar Quizzes' : 'Responder Quiz e Conquistar XP'}
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-8 text-center space-y-3">
                  <HelpCircle className="w-10 h-10 text-slate-500 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Nenhum Quiz Vinculado</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {isTeacher
                      ? 'Crie perguntas de fixação para testar o entendimento dos alunos nesta aula.'
                      : 'Não há quiz cadastrado especificamente para esta aula.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: TURMA & ACOMPANHAMENTO (PROFESSOR) */}
          {activeTab === 'turma' && isTeacher && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">Desempenho da Turma nesta Aula</h4>
                    <p className="text-xs text-slate-400">
                      Acompanhe quais alunos já marcaram a aula como concluída e estudaram o conteúdo.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                    {completedStudentsCount} de {classStudents.length} concluídos
                  </span>
                </div>

                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round((completedStudentsCount / (classStudents.length || 1)) * 100)}%`,
                    }}
                  />
                </div>

                {/* Students List */}
                <div className="space-y-2 pt-2">
                  {classStudents.map((st, i) => {
                    const isCompleted = lesson.completed || i < completedStudentsCount;
                    return (
                      <div
                        key={st.id}
                        className="p-3 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={st.avatar}
                            alt={st.name}
                            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                          />
                          <div>
                            <div className="text-xs font-bold text-white">{st.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Nível {st.level} • {st.xp} XP
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              Concluído
                            </>
                          ) : (
                            <>
                              <Circle className="w-3 h-3 text-amber-400" />
                              Pendente
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {isTeacher ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Painel do Professor: você está gerenciando a ementa pedagógica da aula.
              </span>
            ) : (
              <span>
                Status do Aluno:{' '}
                <strong className={lesson.completed ? 'text-emerald-400' : 'text-amber-400'}>
                  {lesson.completed ? 'Aula Concluída ✓' : 'Ainda não concluída'}
                </strong>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Action buttons depending on role */}
            {currentUser.role === 'aluno' ? (
              <>
                <button
                  onClick={() => toggleLessonCompleted(lesson.id)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                    lesson.completed
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {lesson.completed ? 'Desmarcar Conclusão' : 'Marcar Aula como Concluída (+25 XP)'}
                </button>
              </>
            ) : (
              <>
                {!lessonMaterial && (
                  <button
                    onClick={handleGenerateMaterialQuick}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    Gerar Material Didático
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('player')}
                  className="px-3.5 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-cyan-300 border border-blue-500/40 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Visualizar como Aluno
                </button>
              </>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
