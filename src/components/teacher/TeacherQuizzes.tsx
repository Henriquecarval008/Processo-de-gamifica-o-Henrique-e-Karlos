import React, { useState, useEffect } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Brain,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  X,
  Users,
  Radio,
  Play,
  Flame,
  ArrowRight,
  Music,
  Sliders,
  Volume2,
} from 'lucide-react';
import { Quiz, LiveQuizRoom, RoomAudioConfig } from '../../types';
import { LiveQuizRoomCreator } from '../liveQuiz/LiveQuizRoomCreator';
import { TeacherLiveQuizHost } from '../liveQuiz/TeacherLiveQuizHost';
import { liveQuizService, RoomEventPayload } from '../../services/liveQuizService';
import { soundEffects } from '../../utils/soundEffects';
import { RoomAudioSettingsSection } from '../liveQuiz/RoomAudioSettingsSection';
import { DEFAULT_ROOM_AUDIO_CONFIG } from '../../utils/audioLibrary';

export const TeacherQuizzes: React.FC = () => {
  const { quizzes, quizAttempts, classes, createQuiz, toggleQuizActive, currentUser } = useGameinfor();

  // Tab State: 'live' or 'traditional'
  const [activeTab, setActiveTab] = useState<'live' | 'traditional'>('live');

  // Live Quiz Flow States
  const [isCreatingLiveRoom, setIsCreatingLiveRoom] = useState(false);
  const [activeHostRoom, setActiveHostRoom] = useState<LiveQuizRoom | null>(null);
  const [editingAudioRoom, setEditingAudioRoom] = useState<LiveQuizRoom | null>(null);
  const [liveRooms, setLiveRooms] = useState<LiveQuizRoom[]>(() => liveQuizService.getRooms());

  // Traditional Quiz States
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [selectedQuizResults, setSelectedQuizResults] = useState<Quiz | null>(null);

  // Subscribe to live room updates
  useEffect(() => {
    const unsub = liveQuizService.subscribe((event: RoomEventPayload) => {
      setLiveRooms(liveQuizService.getRooms());
      if (activeHostRoom && (event.roomId === activeHostRoom.id || event.type === 'ROOM_UPDATED')) {
        const fresh = liveQuizService.getRoomById(activeHostRoom.id);
        if (fresh) setActiveHostRoom(fresh);
      }
    });
    return () => unsub();
  }, [activeHostRoom]);

  // New Traditional Quiz Form State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('Desafio de fixação de fórmulas e interface.');
  const [classId, setClassId] = useState(classes[0]?.id || 'turma-1');
  const [module, setModule] = useState('Excel');
  const [timeSec, setTimeSec] = useState(45);
  const [xp, setXp] = useState(100);

  // Dynamic Questions State
  const [questions, setQuestions] = useState([
    {
      question: 'Qual fórmula deve ser utilizada para calcular a soma total de A1 até A10?',
      options: ['=SOMA(A1:A10)', '=SOMAR(A1-A10)', '=SOMA(A1;A10)', '=TOTAL(A1..A10)'],
      correctIndex: 0,
      explanation: 'No Excel, o operador de dois pontos (:) define o intervalo contínuo.',
    },
    {
      question: 'Qual caractere inicia qualquer fórmula no Microsoft Excel?',
      options: ['=', '@', '#', '$'],
      correctIndex: 0,
      explanation: 'Toda fórmula precisa iniciar com o sinal de igual (=).',
    },
  ]);

  const handleAddQuestion = () => {
    soundEffects.playClick();
    setQuestions((prev) => [
      ...prev,
      {
        question: 'Nova pergunta sobre ferramentas ou fórmulas?',
        options: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'],
        correctIndex: 0,
        explanation: 'Explicação didática da resposta correta.',
      },
    ]);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    if (!quizTitle.trim()) {
      alert('Informe o título do quiz.');
      return;
    }

    const targetClass = classes.find((c) => c.id === classId);

    createQuiz({
      title: quizTitle,
      description: quizDesc,
      classId,
      className: targetClass?.name || 'Projeto Crescer e Transformar',
      module,
      timePerQuestionSec: Number(timeSec),
      xp: Number(xp),
      questions,
    });

    setIsCreatingQuiz(false);
    setQuizTitle('');
    soundEffects.playCorrect();
  };

  // Filter rooms created by this specific authenticated teacher
  const myRooms = liveRooms.filter(
    (r) => r.teacherId === currentUser.id || r.teacherId === 'user-prof-1'
  );

  // If hosting an active live room, render the host interface full screen in the workspace
  if (activeHostRoom) {
    return (
      <TeacherLiveQuizHost
        initialRoom={activeHostRoom}
        onExit={() => {
          soundEffects.playClick();
          setActiveHostRoom(null);
          setLiveRooms(liveQuizService.getRooms());
        }}
      />
    );
  }

  // If creating a live room, render the creator
  if (isCreatingLiveRoom) {
    return (
      <LiveQuizRoomCreator
        teacherId={currentUser.id}
        teacherName={currentUser.name || 'Professor'}
        onCancel={() => {
          soundEffects.playClick();
          setIsCreatingLiveRoom(false);
        }}
        onRoomCreated={(newRoom) => {
          soundEffects.playCorrect();
          setIsCreatingLiveRoom(false);
          setActiveHostRoom(newRoom);
          setLiveRooms(liveQuizService.getRooms());
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold mb-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> SALAS AO VIVO & FIXAÇÃO
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-400" />
            Gestão de Quizzes Interativos
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Controle salas de quiz ao vivo em tempo real com código para a turma e avaliações individuais.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              soundEffects.playClick();
              setIsCreatingLiveRoom(true);
            }}
            className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider px-5 py-3 rounded-2xl shadow-lg shadow-cyan-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + CRIAR SALA AO VIVO
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveTab('live');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'live'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          Minhas Salas ao Vivo ({myRooms.length})
        </button>

        <button
          onClick={() => {
            soundEffects.playClick();
            setActiveTab('traditional');
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'traditional'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          Quizzes Individuais / Fixação ({quizzes.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SALAS AO VIVO (LIVE QUIZ ROOMS)                                    */}
      {/* ========================================================================= */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Salas Criadas por Você
            </h2>
            <span className="text-xs text-slate-400">
              Clique em <strong>Iniciar Sala</strong> para abrir o lobby com o código e conectar os alunos.
            </span>
          </div>

          {myRooms.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Nenhuma sala criada por você ainda</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Crie sua sala com slides da aula, perguntas com 4 alternativas, imagens ilustrativas e tempos individuais por questão.
              </p>
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setIsCreatingLiveRoom(true);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                + Criar Sala
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRooms.map((room) => {
                const participants = liveQuizService.getParticipants(room.id);
                const isWaiting = room.status === 'waiting';
                const isInProgress = room.status === 'in_progress' || room.status === 'question_ended';

              return (
                <div
                  key={room.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg hover:border-cyan-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Code Badge */}
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-black text-sm">
                          {room.code}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            isInProgress
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse'
                              : isWaiting
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isInProgress ? 'Partida em Andamento' : isWaiting ? 'Lobby / Aguardando' : 'Encerrada'}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        {participants.length} conectados
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-white">{room.name}</h3>
                      {room.lessonTitle && (
                        <p className="text-xs text-indigo-300/80 font-medium mt-0.5">
                          {room.lessonTitle}
                        </p>
                      )}
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {room.description || 'Sala ao vivo com perguntas interativas e ranking instantâneo.'}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
                      <span>Perguntas: <strong className="text-white">{room.questions.length}</strong></span>
                      <span>Tempo: <strong className="text-amber-400">{room.defaultTimeSec}s</strong></span>
                      <span>XP Inicial: <strong className="text-emerald-400">+{room.xpRules.startingXp}</strong></span>
                    </div>

                    {/* Room Music Badge & Quick Edit */}
                    <div className="bg-slate-950/80 p-2.5 rounded-2xl border border-slate-800/60 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Music className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="font-bold text-slate-300 truncate">
                          {room.audioConfig?.musicEnabled ? room.audioConfig.trackTitle : 'Música Mudo'}
                        </span>
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20 shrink-0">
                          {room.audioConfig?.musicEnabled ? `${Math.round((room.audioConfig.volume ?? 0.5) * 100)}%` : 'OFF'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          soundEffects.playClick();
                          setEditingAudioRoom(room);
                        }}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        <Sliders className="w-3 h-3" /> Áudio
                      </button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        liveQuizService.deleteRoom(room.id);
                        setLiveRooms(liveQuizService.getRooms());
                      }}
                      className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      Excluir Sala
                    </button>

                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setActiveHostRoom(room);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-md shadow-cyan-500/20 flex items-center gap-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      ABRIR PAINEL DA SALA
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: QUIZZES TRADICIONAIS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'traditional' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-400" />
              Quizzes para Fixação Individual
            </h2>
            <button
              onClick={() => {
                soundEffects.playClick();
                setIsCreatingQuiz(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> + Novo Quiz Individual
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => {
              const attemptsForQuiz = quizAttempts.filter((a) => a.quizId === quiz.id);

              return (
                <div
                  key={quiz.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {quiz.module}
                        </span>
                        <button
                          onClick={() => {
                            soundEffects.playClick();
                            toggleQuizActive(quiz.id);
                          }}
                          className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                            quiz.active
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {quiz.active ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Desativado
                            </>
                          )}
                        </button>
                      </div>

                      <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-xs font-black">
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        +{quiz.xp} XP
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-white">{quiz.title}</h3>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{quiz.description}</p>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span>Turma:</span>
                        <strong className="text-slate-200">{quiz.className}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Configuração:</span>
                        <span>
                          {quiz.questions.length} perguntas • {quiz.timePerQuestionSec}s/pergunta
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setSelectedQuizResults(quiz);
                      }}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Desempenho ({attemptsForQuiz.length} tentativas)
                    </button>

                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        toggleQuizActive(quiz.id);
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      {quiz.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: NOVO QUIZ INDIVIDUAL */}
      {isCreatingQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                Criar Quiz Individual de Fixação
              </h3>
              <button
                onClick={() => setIsCreatingQuiz(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título do Quiz</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Ex: Desafio de Fórmulas e Atalhos"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Turma Destino</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Módulo</label>
                  <select
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="Excel">Excel / Planilhas</option>
                    <option value="Word">Word / Documentos</option>
                    <option value="Hardware">Hardware & Sistema</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingQuiz(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Salvar Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VER RESULTADOS DO QUIZ */}
      {selectedQuizResults && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Resultados: {selectedQuizResults.title}</h3>
                <p className="text-xs text-slate-400">Histórico de tentativas dos alunos nesta avaliação</p>
              </div>
              <button
                onClick={() => setSelectedQuizResults(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {quizAttempts.filter((a) => a.quizId === selectedQuizResults.id).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  Nenhum aluno realizou este quiz ainda.
                </p>
              ) : (
                quizAttempts
                  .filter((a) => a.quizId === selectedQuizResults.id)
                  .map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-white block">Aluno ID: {attempt.studentId}</span>
                        <span className="text-[11px] text-slate-400">{attempt.completedAt}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-indigo-400 block">
                          {attempt.score}/{attempt.totalQuestions} acertos
                        </span>
                        <span className="text-amber-400 font-mono">+{attempt.xpEarned} XP</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio Modal for Room Audio Configuration */}
      {editingAudioRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Música da Atividade • {editingAudioRoom.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Defina a trilha sonora e os efeitos sonoros específicos desta sala
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingAudioRoom(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <RoomAudioSettingsSection
              config={editingAudioRoom.audioConfig || DEFAULT_ROOM_AUDIO_CONFIG}
              onChange={(updated) => {
                const saved = liveQuizService.updateRoomAudioConfig(editingAudioRoom.id, updated);
                if (saved) {
                  setEditingAudioRoom(saved);
                  setLiveRooms(liveQuizService.getRooms());
                }
              }}
              showSaveButton={true}
              onSave={() => {
                soundEffects.playClick();
                setEditingAudioRoom(null);
                setLiveRooms(liveQuizService.getRooms());
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
