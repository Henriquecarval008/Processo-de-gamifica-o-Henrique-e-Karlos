import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Users,
  Clock,
  Play,
  Pause,
  SkipForward,
  LogOut,
  Trophy,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Bot,
  Flame,
  Award,
  Music,
  Volume2,
  VolumeX,
  Sliders,
  X,
} from 'lucide-react';
import { LiveQuizRoom, LiveQuizParticipant, RoomAudioConfig } from '../../types';
import { liveQuizService, RoomEventPayload } from '../../services/liveQuizService';
import { soundEffects } from '../../utils/soundEffects';
import { DEFAULT_ROOM_AUDIO_CONFIG } from '../../utils/audioLibrary';
import { RoomAudioSettingsSection } from './RoomAudioSettingsSection';

interface TeacherLiveQuizHostProps {
  initialRoom: LiveQuizRoom;
  onExit: () => void;
}

export const TeacherLiveQuizHost: React.FC<TeacherLiveQuizHostProps> = ({
  initialRoom,
  onExit,
}) => {
  const [room, setRoom] = useState<LiveQuizRoom>(initialRoom);
  const [participants, setParticipants] = useState<LiveQuizParticipant[]>(() =>
    liveQuizService.getParticipants(initialRoom.id)
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(
    initialRoom.timerRemaining ?? initialRoom.defaultTimeSec
  );

  const prevRankingsRef = useRef<Map<string, number>>(new Map());

  // Room ambient music playback & lifecycle
  useEffect(() => {
    if (room.status !== 'finished') {
      soundEffects.playRoomMusic(room.audioConfig);
    } else {
      soundEffects.stopRoomMusic();
      soundEffects.playVictory();
    }

    return () => {
      soundEffects.stopRoomMusic();
    };
  }, [room.status, room.audioConfig?.selectedTrackId, room.audioConfig?.musicEnabled]);

  const handleUpdateAudioConfig = (updated: RoomAudioConfig) => {
    soundEffects.updateLiveRoomConfig(updated);
    const saved = liveQuizService.updateRoomAudioConfig(room.id, updated);
    if (saved) {
      setRoom(saved);
    }
  };

  // Real-time synchronization subscription
  useEffect(() => {
    const unsubscribe = liveQuizService.subscribe((event: RoomEventPayload) => {
      if (event.roomId === room.id || event.type === 'ROOM_UPDATED') {
        const freshRoom = liveQuizService.getRoomById(room.id);
        if (freshRoom) {
          setRoom(freshRoom);
        }
        const freshParts = liveQuizService.getParticipants(room.id);
        setParticipants(freshParts);
      }
    });

    return () => unsubscribe();
  }, [room.id]);

  // Synchronized countdown timer when in progress
  useEffect(() => {
    if (room.status !== 'in_progress' || room.isTimerPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          soundEffects.playWrong();
          liveQuizService.endCurrentQuestion(room.id);
          return 0;
        }
        if (prev <= 5) {
          soundEffects.playTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [room.status, room.isTimerPaused, room.currentQuestionIndex, room.id]);

  // Sync timeLeft when question starts or changes
  useEffect(() => {
    if (room.status === 'in_progress') {
      const q = room.questions[room.currentQuestionIndex];
      const duration = q?.timeSec || room.defaultTimeSec;
      setTimeLeft(duration);
    }
  }, [room.currentQuestionIndex, room.status, room.defaultTimeSec, room.questions]);

  // Copy code helper
  const handleCopyCode = () => {
    soundEffects.playClick();
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add demo bots for instant testing
  const handleAddDemoBots = () => {
    soundEffects.playClick();
    liveQuizService.addDemoBotParticipants(room.id, 3);
    const updated = liveQuizService.getParticipants(room.id);
    setParticipants(updated);
    soundEffects.playCorrect();
  };

  // Start quiz from lobby
  const handleStartQuiz = () => {
    soundEffects.playClick();
    soundEffects.playRankUp();
    const started = liveQuizService.startQuiz(room.id);
    if (started) {
      setRoom(started);
    }
  };

  // End question prematurely
  const handleEndQuestion = () => {
    soundEffects.playClick();
    const ended = liveQuizService.endCurrentQuestion(room.id);
    if (ended) setRoom(ended);
  };

  // Toggle pause
  const handleTogglePause = () => {
    soundEffects.playClick();
    const updated = liveQuizService.togglePauseTimer(room.id);
    if (updated) setRoom(updated);
  };

  // Show partial ranking
  const handleShowRanking = () => {
    soundEffects.playClick();
    soundEffects.playRankUp();
    const updated = liveQuizService.showPartialRanking(room.id);
    if (updated) setRoom(updated);
  };

  // Next question
  const handleNextQuestion = () => {
    soundEffects.playClick();
    const updated = liveQuizService.nextQuestion(room.id);
    if (updated) setRoom(updated);
  };

  // End room
  const handleEndRoom = () => {
    if (window.confirm('Deseja realmente encerrar esta sala de quiz ao vivo?')) {
      soundEffects.playClick();
      liveQuizService.finishQuiz(room.id);
      onExit();
    }
  };

  // Current question data
  const currentQ = room.questions[room.currentQuestionIndex] || room.questions[0];

  // Answers statistics
  const currentAnswers = participants.filter(
    (p) => p.lastAnswer && p.lastAnswer.questionIndex === room.currentQuestionIndex
  );
  const correctCount = currentAnswers.filter((p) => p.lastAnswer?.isCorrect).length;
  const wrongCount = currentAnswers.filter((p) => !p.lastAnswer?.isCorrect).length;
  const pendingCount = Math.max(0, participants.length - currentAnswers.length);

  // Automatically end question if all active participants have answered
  useEffect(() => {
    if (
      room.status === 'in_progress' &&
      participants.length > 0 &&
      currentAnswers.length >= participants.length
    ) {
      const timer = setTimeout(() => {
        liveQuizService.endCurrentQuestion(room.id);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentAnswers.length, participants.length, room.status, room.id]);

  // Ranked participants
  const rankedParticipants = liveQuizService.sortAndRankParticipants(participants);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-5xl mx-auto shadow-2xl space-y-6 text-white">
      {/* Host Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              Painel do Professor • Sala ao Vivo
            </span>
            <h2 className="text-xl font-black text-white">{room.name}</h2>
          </div>
        </div>

        {/* Room Code Badge */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 px-4 py-2 rounded-2xl border border-indigo-500/30 flex items-center gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Código da Sala</span>
              <span className="text-xl font-black tracking-wider text-cyan-400 font-mono">
                {room.code}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Copiar Código"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick Room Audio Control */}
          <button
            type="button"
            onClick={() => {
              soundEffects.playClick();
              setShowAudioModal(true);
            }}
            className="p-2.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-2 cursor-pointer"
            title="Configurar Música e Efeitos Sonoros"
          >
            <Music className="w-5 h-5 text-indigo-400" />
            <div className="text-left hidden md:block">
              <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
                Áudio da Sala
              </span>
              <span className="text-xs font-bold text-indigo-200">
                {room.audioConfig?.musicEnabled
                  ? room.audioConfig.trackTitle
                  : 'Música Mudo'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-500/30 text-indigo-300">
              {room.audioConfig?.musicEnabled
                ? `${Math.round((room.audioConfig.volume ?? 0.5) * 100)}%`
                : 'OFF'}
            </span>
          </button>

          <button
            onClick={handleEndRoom}
            className="p-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
            title="Encerrar Partida"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Audio Modal */}
      {showAudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    Controle de Áudio da Sala ao Vivo
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ajuste a música e efeitos em tempo real para todos os alunos conectados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAudioModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <RoomAudioSettingsSection
              config={room.audioConfig || DEFAULT_ROOM_AUDIO_CONFIG}
              onChange={handleUpdateAudioConfig}
              showSaveButton={true}
              onSave={() => {
                soundEffects.playClick();
                setShowAudioModal(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 1: LOBBY / SALA DE ESPERA                                           */}
      {/* ========================================================================= */}
      {room.status === 'waiting' && (
        <div className="space-y-8 py-4">
          {/* Big Code Callout Banner */}
          <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/70 to-cyan-950/60 p-8 rounded-3xl border border-indigo-500/30 text-center space-y-4 shadow-xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
              <Sparkles className="w-3.5 h-3.5" /> AGUARDANDO PARTICIPANTES
            </div>

            <div>
              <p className="text-sm text-slate-300">Peça para os alunos acessarem a área do aluno e digitarem:</p>
              <div className="text-5xl sm:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-300 font-mono mt-2 select-all">
                {room.code}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300">
                📚 {room.questions.length} Perguntas
              </span>
              <span className="text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-slate-300">
                ⏱️ {room.defaultTimeSec}s por Pergunta
              </span>
              <span className="text-xs bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-700 text-amber-300">
                ⭐ {room.xpRules.startingXp} XP Inicial
              </span>
            </div>
          </div>

          {/* Connected Participants Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-400" />
                Participantes Conectados ({participants.length})
              </h3>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddDemoBots}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Bot className="w-4 h-4 text-cyan-400" />
                  + Adicionar Alunos de Teste (Demonstração)
                </button>
              </div>
            </div>

            {participants.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400 text-sm">
                Nenhum participante conectado ainda. Compartilhe o código <strong>{room.code}</strong> com a turma!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center gap-3 animate-in fade-in"
                  >
                    <span className="text-2xl">{p.avatar || '👨‍🎓'}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Pronto na sala
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Launch Quiz Button */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={handleStartQuiz}
              disabled={participants.length === 0}
              className={`px-8 py-4 rounded-2xl text-base font-black tracking-wider uppercase flex items-center gap-3 shadow-xl transition-all ${
                participants.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:scale-105 shadow-emerald-500/30 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              INICIAR QUIZ COM A TURMA
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 2: PERGUNTA EM ANDAMENTO                                            */}
      {/* ========================================================================= */}
      {room.status === 'in_progress' && (
        <div className="space-y-6">
          {/* Progress & Live Controls Bar */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
                Questão {room.currentQuestionIndex + 1} de {room.questions.length}
              </span>

              {/* Synchronized Timer */}
              <div
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-lg font-black transition-colors ${
                  timeLeft <= 5
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                    : 'bg-slate-900 text-amber-400 border border-slate-800'
                }`}
              >
                <Clock className="w-5 h-5" />
                <span>{timeLeft}s</span>
              </div>
            </div>

            {/* Answer Stats */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {currentAnswers.length}/{participants.length} responderam
                </span>
              </div>
              <div className="text-slate-400 hidden sm:block">
                <span>{pendingCount} pendentes</span>
              </div>
            </div>

            {/* Teacher Gameplay Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePause}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                {room.isTimerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                {room.isTimerPaused ? 'Retomar' : 'Pausar'}
              </button>

              <button
                onClick={handleEndQuestion}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-black text-white shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Finalizar Pergunta
              </button>
            </div>
          </div>

          {/* Question Display */}
          <div className="bg-slate-950/80 p-6 rounded-3xl border border-slate-800 space-y-5">
            <h3 className="text-xl font-black text-white leading-relaxed text-center sm:text-left">
              {currentQ.question}
            </h3>

            {currentQ.image && (
              <div className="flex justify-center my-4">
                <img
                  src={currentQ.image}
                  alt="Ilustração da questão"
                  className="max-h-60 rounded-2xl border border-slate-800 shadow-lg object-contain"
                />
              </div>
            )}

            {/* Alternatives Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const colors = [
                  'bg-rose-500/10 border-rose-500/30 text-rose-200',
                  'bg-blue-500/10 border-blue-500/30 text-blue-200',
                  'bg-amber-500/10 border-amber-500/30 text-amber-200',
                  'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
                ];
                const letters = ['A', 'B', 'C', 'D'];
                const isCorrect = optIdx === currentQ.correctIndex;

                return (
                  <div
                    key={optIdx}
                    className={`p-4 rounded-2xl border flex items-center gap-3 ${colors[optIdx % colors.length]}`}
                  >
                    <span className="w-8 h-8 rounded-xl bg-slate-900/90 font-black text-xs flex items-center justify-center border border-white/10 shrink-0">
                      {letters[optIdx]}
                    </span>
                    <span className="text-sm font-semibold">{opt}</span>
                    {isCorrect && (
                      <span className="ml-auto text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        Gabarito
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Answers Stream */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Alunos que já responderam:
            </span>
            <div className="flex flex-wrap gap-2">
              {currentAnswers.map((p) => (
                <span
                  key={p.id}
                  className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 animate-in fade-in"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 3: RESULTADO DA PERGUNTA (QUESTION ENDED)                           */}
      {/* ========================================================================= */}
      {room.status === 'question_ended' && (
        <div className="space-y-6">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Resultado da Questão {room.currentQuestionIndex + 1}
              </span>
              <button
                onClick={handleShowRanking}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                VER RANKING ATUALIZADO
              </button>
            </div>

            <h3 className="text-lg font-bold text-white">{currentQ.question}</h3>

            {/* Correct Alternative Announcement */}
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs text-emerald-300 font-bold block">Resposta Correta:</span>
                <span className="text-base font-black text-white">
                  {['A', 'B', 'C', 'D'][currentQ.correctIndex]}) {currentQ.options[currentQ.correctIndex]}
                </span>
              </div>
            </div>

            {/* Quick Stats: X Acertaram / Y Erraram */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-2xl font-black text-emerald-400 block">{correctCount}</span>
                <span className="text-xs text-slate-400 font-semibold">Alunos acertaram</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-2xl font-black text-rose-400 block">{wrongCount}</span>
                <span className="text-xs text-slate-400 font-semibold">Alunos erraram</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center col-span-2 sm:col-span-1">
                <span className="text-2xl font-black text-cyan-400 block">
                  {participants.length > 0
                    ? Math.round((correctCount / participants.length) * 100)
                    : 0}
                  %
                </span>
                <span className="text-xs text-slate-400 font-semibold">Taxa de acerto</span>
              </div>
            </div>

            {/* Detailed Students Outcome List */}
            <div className="pt-2 space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Detalhamento dos Participantes:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {participants.map((p) => {
                  const ans = p.lastAnswer;
                  const isCorrect = ans?.isCorrect;
                  return (
                    <div
                      key={p.id}
                      className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span>{p.avatar || '👨‍🎓'}</span>
                        <span className="font-semibold text-white">{p.name}</span>
                      </div>
                      {ans ? (
                        <span
                          className={`font-bold flex items-center gap-1 ${
                            isCorrect ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Acertou (+{ans.xpDelta} XP)
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Errou ({ans.xpDelta} XP)
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500">Não respondeu</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 4: RANKING PARCIAL COM ANIMAÇÃO DE ULTRAPASSAGEM                    */}
      {/* ========================================================================= */}
      {room.status === 'showing_ranking' && (
        <div className="space-y-6">
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-black text-white">🏆 RANKING EM TEMPO REAL</h3>
              </div>

              {room.currentQuestionIndex + 1 < room.questions.length ? (
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-blue-500/30 flex items-center gap-2"
                >
                  <span>PRÓXIMA PERGUNTA ({room.currentQuestionIndex + 2}/{room.questions.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-amber-300" />
                  <span>FINALIZAR E VER PÓDIO</span>
                </button>
              )}
            </div>

            {/* Ranking List Ordered by Total XP */}
            <div className="space-y-2.5">
              {rankedParticipants.map((p, idx) => {
                const rank = idx + 1;
                const medal =
                  rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}º`;

                return (
                  <div
                    key={p.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      rank === 1
                        ? 'bg-amber-500/10 border-amber-500/30 shadow-md shadow-amber-500/10'
                        : rank === 2
                        ? 'bg-slate-800/80 border-slate-700'
                        : rank === 3
                        ? 'bg-amber-950/20 border-amber-700/30'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold w-7 text-center">{medal}</span>
                      <span className="text-2xl">{p.avatar || '👨‍🎓'}</span>
                      <div>
                        <span className="text-sm font-bold text-white block">{p.name}</span>
                        <span className="text-[11px] text-slate-400">
                          {p.correctCount} acertos • {p.wrongCount} erros
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Overtake / Rank Delta Indicator */}
                      {p.rankDelta && p.rankDelta > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                          <TrendingUp className="w-3.5 h-3.5" /> +{p.rankDelta}
                        </span>
                      ) : p.rankDelta && p.rankDelta < 0 ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/30">
                          <TrendingDown className="w-3.5 h-3.5" /> {p.rankDelta}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs flex items-center gap-1">
                          <Minus className="w-3 h-3" />
                        </span>
                      )}

                      {/* Total XP Score */}
                      <span className="text-base font-black text-amber-400 font-mono">
                        {p.xp.toLocaleString('pt-BR')} XP
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATE 5: QUIZ FINALIZADO — PÓDIO & RELATÓRIO                              */}
      {/* ========================================================================= */}
      {room.status === 'finished' && (
        <div className="space-y-8 text-center py-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-2">
              <Sparkles className="w-4 h-4" /> PARTIDA CONCLUÍDA
            </div>
            <h2 className="text-3xl font-black text-white">🎉 QUIZ FINALIZADO COM SUCESSO!</h2>
            <p className="text-sm text-slate-400 mt-1">
              Todos os pontos de XP acumulados foram registrados e computados.
            </p>
          </div>

          {/* Podium (Top 3) */}
          {rankedParticipants.length >= 2 && (
            <div className="flex items-end justify-center gap-3 sm:gap-6 pt-6 pb-4">
              {/* 2nd Place */}
              {rankedParticipants[1] && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl mb-1">{rankedParticipants[1].avatar}</span>
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">
                    {rankedParticipants[1].name}
                  </span>
                  <span className="text-xs text-amber-300 font-mono font-bold mb-2">
                    {rankedParticipants[1].xp} XP
                  </span>
                  <div className="w-24 sm:w-28 h-28 bg-slate-800 border-t-4 border-slate-400 rounded-t-2xl flex flex-col items-center justify-center shadow-lg">
                    <span className="text-2xl">🥈</span>
                    <span className="text-xs font-bold text-slate-300">2º Lugar</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {rankedParticipants[0] && (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-1 animate-bounce">{rankedParticipants[0].avatar}</span>
                  <span className="text-sm font-black text-white truncate max-w-[120px]">
                    {rankedParticipants[0].name}
                  </span>
                  <span className="text-sm text-amber-300 font-mono font-black mb-2">
                    {rankedParticipants[0].xp} XP
                  </span>
                  <div className="w-28 sm:w-36 h-36 bg-gradient-to-t from-amber-600/50 to-amber-500/80 border-t-4 border-amber-300 rounded-t-2xl flex flex-col items-center justify-center shadow-xl shadow-amber-500/20">
                    <span className="text-3xl">🥇</span>
                    <span className="text-xs font-black text-white uppercase tracking-wider">
                      1º Campeão
                    </span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {rankedParticipants[2] && (
                <div className="flex flex-col items-center">
                  <span className="text-3xl mb-1">{rankedParticipants[2].avatar}</span>
                  <span className="text-xs font-bold text-white truncate max-w-[100px]">
                    {rankedParticipants[2].name}
                  </span>
                  <span className="text-xs text-amber-300 font-mono font-bold mb-2">
                    {rankedParticipants[2].xp} XP
                  </span>
                  <div className="w-24 sm:w-28 h-20 bg-amber-950/40 border-t-4 border-amber-700 rounded-t-2xl flex flex-col items-center justify-center shadow-lg">
                    <span className="text-2xl">🥉</span>
                    <span className="text-xs font-bold text-amber-200">3º Lugar</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Final Results Table */}
          <div className="bg-slate-950 p-5 rounded-3xl border border-slate-800 text-left space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Classificação Geral Final
            </h4>
            <div className="divide-y divide-slate-800/80">
              {rankedParticipants.map((p, idx) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-400 w-5">{idx + 1}º</span>
                    <span className="text-base">{p.avatar}</span>
                    <span className="font-bold text-white">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-emerald-400 font-semibold">{p.correctCount} acertos</span>
                    <span className="text-rose-400 font-semibold">{p.wrongCount} erros</span>
                    <span className="font-mono font-black text-amber-400">
                      {p.xp.toLocaleString('pt-BR')} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onExit}
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Voltar ao Gerenciador de Quizzes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
