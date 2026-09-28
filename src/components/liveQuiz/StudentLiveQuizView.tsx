import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Users,
  LogOut,
  HelpCircle,
  Award,
  Zap,
  Volume2,
  VolumeX,
  Volume1,
  Music,
  Sliders,
  X,
} from 'lucide-react';
import { LiveQuizRoom, LiveQuizParticipant } from '../../types';
import { liveQuizService, RoomEventPayload } from '../../services/liveQuizService';
import { soundEffects } from '../../utils/soundEffects';
import { useGameinfor } from '../../context/GameinforContext';

interface StudentLiveQuizViewProps {
  onBackToQuizzes: () => void;
}

const AVATAR_OPTIONS = ['👨‍💻', '👩‍🎓', '🚀', '⭐', '🎯', '🎨', '⚡', '🦊', '🦁', '💡'];

export const StudentLiveQuizView: React.FC<StudentLiveQuizViewProps> = ({ onBackToQuizzes }) => {
  const { currentUser } = useGameinfor();

  // Entrance state
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [studentNameInput, setStudentNameInput] = useState(currentUser.nickname || currentUser.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Active game session
  const [currentRoom, setCurrentRoom] = useState<LiveQuizRoom | null>(null);
  const [myParticipant, setMyParticipant] = useState<LiveQuizParticipant | null>(null);
  const [allParticipants, setAllParticipants] = useState<LiveQuizParticipant[]>([]);

  // In-question student interaction
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);

  // Previous rank tracker for climb animation
  const prevRankRef = useRef<number | null>(null);

  // Student local audio preferences
  const [studentVolume, setStudentVolume] = useState<number>(0.75);
  const [studentMuted, setStudentMuted] = useState<boolean>(false);
  const [studentMusicEnabled, setStudentMusicEnabled] = useState<boolean>(true);
  const [studentEffectsEnabled, setStudentEffectsEnabled] = useState<boolean>(true);
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);

  // Synchronize audio playback with room state
  useEffect(() => {
    if (currentRoom && currentRoom.status !== 'finished') {
      const effectiveMultiplier = studentMuted || !studentMusicEnabled ? 0 : studentVolume;
      soundEffects.playRoomMusic(currentRoom.audioConfig, effectiveMultiplier);
    } else if (currentRoom && currentRoom.status === 'finished') {
      soundEffects.stopRoomMusic();
      if (!studentMuted && studentEffectsEnabled) {
        soundEffects.playVictory();
      }
    } else {
      soundEffects.stopRoomMusic();
    }

    return () => {
      soundEffects.stopRoomMusic();
    };
  }, [
    currentRoom?.status,
    currentRoom?.audioConfig?.selectedTrackId,
    currentRoom?.audioConfig?.musicEnabled,
    currentRoom?.audioConfig?.volume,
    studentVolume,
    studentMuted,
    studentMusicEnabled,
  ]);

  const handleStudentVolumeChange = (val: number) => {
    setStudentVolume(val);
    if (val > 0 && studentMuted) {
      setStudentMuted(false);
    }
    const mult = studentMuted || !studentMusicEnabled ? 0 : val;
    soundEffects.setRoomLocalVolumeMultiplier(mult);
  };

  const handleToggleStudentMute = () => {
    soundEffects.playClick();
    const nextMuted = !studentMuted;
    setStudentMuted(nextMuted);
    const mult = nextMuted || !studentMusicEnabled ? 0 : studentVolume;
    soundEffects.setRoomLocalVolumeMultiplier(mult);
  };

  // List of active rooms available on platform for quick 1-click test
  const availableRooms = liveQuizService.getRooms().filter((r) => r.status !== 'finished');

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = liveQuizService.subscribe((event: RoomEventPayload) => {
      if (!currentRoom) return;

      if (event.roomId === currentRoom.id || event.type === 'ROOM_UPDATED') {
        const freshRoom = liveQuizService.getRoomById(currentRoom.id);
        if (freshRoom) {
          setCurrentRoom(freshRoom);
        }
        const parts = liveQuizService.getParticipants(currentRoom.id);
        setAllParticipants(parts);

        if (myParticipant) {
          const me = parts.find((p) => p.id === myParticipant.id);
          if (me) {
            setMyParticipant(me);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [currentRoom, myParticipant]);

  // Synchronize timer when question is active
  useEffect(() => {
    if (!currentRoom || currentRoom.status !== 'in_progress' || currentRoom.isTimerPaused) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        if (prev <= 5) {
          if (!studentMuted && studentEffectsEnabled) {
            soundEffects.playTick();
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRoom?.status, currentRoom?.isTimerPaused, currentRoom?.currentQuestionIndex, studentMuted, studentEffectsEnabled]);

  // Reset answer state on new question
  useEffect(() => {
    if (currentRoom?.status === 'in_progress') {
      const q = currentRoom.questions[currentRoom.currentQuestionIndex];
      const duration = q?.timeSec || currentRoom.defaultTimeSec;
      setTimeLeft(duration);
      setSelectedOptionIndex(null);
      setHasSubmittedAnswer(false);
    }
  }, [currentRoom?.currentQuestionIndex, currentRoom?.status]);

  // Join Room Handler
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setJoinError(null);

    if (!roomCodeInput.trim()) {
      setJoinError('Informe o código da sala fornecido pelo professor.');
      return;
    }

    if (!studentNameInput.trim()) {
      setJoinError('Informe seu nome ou apelido para a partida.');
      return;
    }

    const result = liveQuizService.joinRoom({
      roomCode: roomCodeInput,
      studentName: studentNameInput,
      avatar: selectedAvatar,
      participantId: currentUser.role === 'aluno' ? currentUser.id : undefined,
    });

    if ('error' in result) {
      soundEffects.playWrong();
      setJoinError(result.error);
    } else {
      soundEffects.playCorrect();
      setCurrentRoom(result.room);
      setMyParticipant(result.participant);
      prevRankRef.current = result.participant.currentRank;
      setAllParticipants(liveQuizService.getParticipants(result.room.id));
    }
  };

  // Submit answer
  const handleAnswer = (optIndex: number) => {
    if (hasSubmittedAnswer || !currentRoom || currentRoom.status !== 'in_progress' || !myParticipant) {
      return;
    }

    soundEffects.playClick();
    setSelectedOptionIndex(optIndex);
    setHasSubmittedAnswer(true);

    const submissionResult = liveQuizService.submitAnswer({
      roomId: currentRoom.id,
      participantId: myParticipant.id,
      questionIndex: currentRoom.currentQuestionIndex,
      optionIndex: optIndex,
    });

    if (submissionResult) {
      setMyParticipant(submissionResult.participant);
      if (submissionResult.isCorrect) {
        if (!studentMuted && studentEffectsEnabled) {
          soundEffects.playCorrect();
        }
      } else {
        if (!studentMuted && studentEffectsEnabled) {
          soundEffects.playWrong();
        }
      }
    }
  };

  // Leave room
  const handleLeaveRoom = () => {
    soundEffects.playClick();
    setCurrentRoom(null);
    setMyParticipant(null);
  };

  // Current Question
  const currentQ = currentRoom?.questions[currentRoom.currentQuestionIndex];

  // =========================================================================
  // SCREEN 1: ENTRAR EM UMA SALA AO VIVO
  // =========================================================================
  if (!currentRoom || !myParticipant) {
    return (
      <div className="max-w-md mx-auto py-4 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Brain className="w-7 h-7 text-cyan-400" />
              </div>
            </div>
            <h2 className="text-2xl font-black text-white">Entrar em uma Sala de Quiz</h2>
            <p className="text-xs text-slate-400">
              Digite o código fornecido pelo professor para participar da rodada ao vivo.
            </p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            {/* Room Code */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Código da Sala *
              </label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="Ex: GAME-4821"
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-2xl px-4 py-3 text-center text-xl font-black tracking-widest text-cyan-300 font-mono focus:outline-none transition-colors"
                required
                autoFocus
              />
            </div>

            {/* Student Nickname (safe for minors) */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Seu Nome ou Apelido *
              </label>
              <input
                type="text"
                value={studentNameInput}
                onChange={(e) => setStudentNameInput(e.target.value)}
                placeholder="Ex: Maria Eduarda"
                maxLength={24}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none transition-colors"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                🔒 Privacidade: Não solicitamos dados pessoais como CPF, telefone ou e-mail.
              </p>
            </div>

            {/* Avatar Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Escolha seu Avatar
              </label>
              <div className="grid grid-cols-5 gap-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedAvatar(av);
                    }}
                    className={`h-11 rounded-xl text-xl flex items-center justify-center border transition-all ${
                      selectedAvatar === av
                        ? 'bg-cyan-500/20 border-cyan-400 scale-105 shadow-md shadow-cyan-500/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-2xl text-sm font-black tracking-wider uppercase shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all mt-2"
            >
              <Zap className="w-4 h-4" />
              ENTRAR NA SALA
            </button>
          </form>

          {/* Quick Rooms Helper for direct testing */}
          {availableRooms.length > 0 && (
            <div className="border-t border-slate-800/80 pt-4 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                Salas ativas agora para teste rápido:
              </span>
              <div className="space-y-1.5">
                {availableRooms.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      soundEffects.playClick();
                      setRoomCodeInput(r.code);
                    }}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between transition-colors text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-white block truncate">{r.name}</span>
                      <span className="text-[10px] text-slate-400">{r.teacherName}</span>
                    </div>
                    <span className="font-mono font-black text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20 shrink-0">
                      {r.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onBackToQuizzes}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Voltar aos Quizzes Individuais
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // ROOM SCREENS RENDERER
  // =========================================================================
  const renderRoomScreen = () => {
    if (currentRoom.status === 'waiting') {
      return (
        <div className="max-w-lg mx-auto py-4 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            VOCÊ ESTÁ NA SALA!
          </div>

          <div>
            <span className="text-4xl mb-2 block animate-bounce">{myParticipant.avatar}</span>
            <h2 className="text-2xl font-black text-white">{myParticipant.name}</h2>
            <p className="text-xs text-slate-400 mt-1">
              {currentRoom.name}
            </p>
            <span className="inline-block mt-2 font-mono font-bold text-xs bg-slate-950 px-3 py-1 rounded-xl text-cyan-400 border border-slate-800">
              Código: {currentRoom.code}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-200">
            ⏳ O professor <strong>{currentRoom.teacherName}</strong> está organizando a atividade.
            Fique atento, a primeira pergunta começará em instantes!
          </div>

          {/* Connected Participants Count */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              Participantes na sala: {allParticipants.length}
            </span>

            <div className="flex flex-wrap justify-center gap-2 max-h-36 overflow-y-auto p-1">
              {allParticipants.map((p) => (
                <span
                  key={p.id}
                  className={`text-xs px-2.5 py-1 rounded-xl flex items-center gap-1.5 border ${
                    p.id === myParticipant.id
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}
                >
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                </span>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={handleLeaveRoom}
              className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 mx-auto"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair da sala
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 3: PERGUNTA EM ANDAMENTO
  // =========================================================================
  if (currentRoom.status === 'in_progress' && currentQ) {
    const isTimeUrgent = timeLeft <= 5;

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Top Header & Synchronized Timer */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{myParticipant.avatar}</span>
            <div>
              <span className="text-xs font-bold text-white block">{myParticipant.name}</span>
              <span className="text-[11px] font-mono font-black text-amber-400">
                {myParticipant.xp} XP
              </span>
            </div>
          </div>

          {/* Synchronized Timer */}
          <div
            className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-mono text-xl font-black shadow-inner transition-colors ${
              isTimeUrgent
                ? 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/50 animate-pulse'
                : 'bg-slate-950 text-amber-400 border border-slate-800'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>{timeLeft}s</span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Questão
            </span>
            <span className="text-xs font-black text-indigo-400">
              {currentRoom.currentQuestionIndex + 1} de {currentRoom.questions.length}
            </span>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-4">
          <h3 className="text-xl sm:text-2xl font-black text-white leading-relaxed text-center">
            {currentQ.question}
          </h3>

          {currentQ.image && (
            <div className="flex justify-center my-3">
              <img
                src={currentQ.image}
                alt="Ilustração da pergunta"
                className="max-h-60 rounded-2xl border border-slate-800 shadow-md object-contain"
              />
            </div>
          )}

          {/* Feedback banner once student clicks */}
          {hasSubmittedAnswer && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl text-center text-xs font-bold text-emerald-300 animate-in fade-in flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Resposta registrada! Aguarde o encerramento do cronômetro...
            </div>
          )}

          {/* 4 Interactive Alternatives [A], [B], [C], [D] */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map((opt, optIdx) => {
              const letters = ['A', 'B', 'C', 'D'];
              const isSelected = selectedOptionIndex === optIdx;

              const buttonStyles = [
                'hover:border-rose-500/80 hover:bg-rose-500/20 active:scale-95',
                'hover:border-blue-500/80 hover:bg-blue-500/20 active:scale-95',
                'hover:border-amber-500/80 hover:bg-amber-500/20 active:scale-95',
                'hover:border-emerald-500/80 hover:bg-emerald-500/20 active:scale-95',
              ];

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={hasSubmittedAnswer || timeLeft === 0}
                  onClick={() => handleAnswer(optIdx)}
                  className={`p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/30 border-cyan-400 shadow-lg shadow-cyan-500/30 scale-102 ring-2 ring-cyan-400/50'
                      : hasSubmittedAnswer
                      ? 'bg-slate-950/50 border-slate-800/80 opacity-60 cursor-not-allowed'
                      : `bg-slate-950 border-slate-800 ${buttonStyles[optIdx % buttonStyles.length]}`
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {letters[optIdx]}
                  </span>
                  <span className="text-sm font-bold text-white">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 4: RESULTADO DA PERGUNTA (QUESTION ENDED)
  // =========================================================================
  if (currentRoom.status === 'question_ended' && currentQ) {
    const lastAns = myParticipant.lastAnswer;
    const isCorrect = lastAns?.isCorrect;

    return (
      <div className="max-w-md mx-auto py-4 space-y-6 animate-in fade-in">
        <div
          className={`border rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 ${
            isCorrect
              ? 'bg-gradient-to-b from-emerald-950/60 to-slate-900 border-emerald-500/40'
              : 'bg-gradient-to-b from-rose-950/60 to-slate-900 border-rose-500/40'
          }`}
        >
          {/* Correct / Wrong Hero Icon */}
          <div className="space-y-2">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl shadow-xl ${
                isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
              }`}
            >
              {isCorrect ? '✓' : '✗'}
            </div>
            <h2 className="text-2xl font-black text-white">
              {isCorrect ? 'RESPOSTA CORRETA!' : 'RESPOSTA INCORRETA'}
            </h2>
            <span
              className={`inline-block font-black text-lg font-mono px-4 py-1 rounded-full ${
                isCorrect
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {isCorrect ? `+${lastAns?.xpDelta || 100} XP` : `${lastAns?.xpDelta || -30} XP`}
            </span>
          </div>

          {/* Ranking Position Indicator */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="text-left">
              <span className="text-[11px] text-slate-400 font-bold block">Sua Posição no Momento:</span>
              <span className="text-xl font-black text-white font-mono">
                {myParticipant.currentRank}º Lugar
              </span>
            </div>

            {myParticipant.rankDelta && myParticipant.rankDelta > 0 ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                <TrendingUp className="w-4 h-4" /> Subiu {myParticipant.rankDelta} posições!
              </span>
            ) : myParticipant.rankDelta && myParticipant.rankDelta < 0 ? (
              <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-xl border border-rose-500/30">
                <TrendingDown className="w-4 h-4" /> Caiu {Math.abs(myParticipant.rankDelta)} posições
              </span>
            ) : (
              <span className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                Manteve a posição
              </span>
            )}
          </div>

          {/* Question Explanation */}
          <div className="text-left p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
            <span className="font-bold text-cyan-400 block">Explicação Didática:</span>
            <p className="text-slate-300 leading-relaxed">
              {currentQ.explanation || 'Acompanhe as dicas e atalhos na lousa do professor.'}
            </p>
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Aguardando o professor avançar para o ranking ou próxima pergunta...
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 5: RANKING PARCIAL COM ULTRAPASSAGENS
  // =========================================================================
  if (currentRoom.status === 'showing_ranking') {
    const sorted = liveQuizService.sortAndRankParticipants(allParticipants);

    return (
      <div className="max-w-md mx-auto py-4 space-y-5 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-black text-white text-base">RANKING ATUALIZADO</h3>
            </div>
            <span className="text-xs font-bold text-amber-400 font-mono">
              Seu XP: {myParticipant.xp}
            </span>
          </div>

          <div className="space-y-2">
            {sorted.map((p, idx) => {
              const rank = idx + 1;
              const isMe = p.id === myParticipant.id;

              return (
                <div
                  key={p.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    isMe
                      ? 'bg-cyan-500/10 border-cyan-400 shadow-md shadow-cyan-500/20'
                      : rank === 1
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs w-5 text-slate-400">
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}º`}
                    </span>
                    <span>{p.avatar}</span>
                    <span className={`text-xs font-bold ${isMe ? 'text-cyan-300' : 'text-white'}`}>
                      {p.name} {isMe && '(Você)'}
                    </span>
                  </div>

                  <span className="text-xs font-black text-amber-400 font-mono">
                    {p.xp.toLocaleString('pt-BR')} XP
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-400 text-center pt-2">
            Professor está prestes a liberar a próxima questão...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SCREEN 6: RESULTADO FINAL INDIVIDUAL DO ALUNO
  // =========================================================================
  if (currentRoom.status === 'finished') {
    const totalQ = currentRoom.questions.length;
    const gainedXp = myParticipant.correctCount * currentRoom.xpRules.correctXp;
    const lostXp = myParticipant.wrongCount * Math.abs(currentRoom.xpRules.wrongXp);

    return (
      <div className="max-w-md mx-auto py-4 space-y-6 animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div>
            <span className="text-4xl block mb-2">{myParticipant.avatar}</span>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30 mb-2">
              <Trophy className="w-4 h-4" /> SEU RESULTADO INDIVIDUAL
            </div>
            <h2 className="text-2xl font-black text-white">{myParticipant.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{currentRoom.name}</p>
          </div>

          {/* Final Position & Total XP Badge */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-blue-950/60 border border-indigo-500/30 space-y-2">
            <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider block">
              Posição Final Conquistada
            </span>
            <div className="text-3xl font-black text-white">
              {myParticipant.currentRank === 1
                ? '🥇 1º Lugar (Campeão!)'
                : myParticipant.currentRank === 2
                ? '🥈 2º Lugar'
                : myParticipant.currentRank === 3
                ? '🥉 3º Lugar'
                : `${myParticipant.currentRank}º Lugar`}
            </div>
            <div className="text-lg font-mono font-black text-amber-400 pt-1">
              {myParticipant.xp.toLocaleString('pt-BR')} XP Final
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">Perguntas</span>
              <span className="text-lg font-black text-white">{totalQ}</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">Acertos</span>
              <span className="text-lg font-black text-emerald-400">
                {myParticipant.correctCount}
              </span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">XP Ganho</span>
              <span className="text-lg font-black text-emerald-400">+{gainedXp} XP</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">XP Perdido</span>
              <span className="text-lg font-black text-rose-400">-{lostXp} XP</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                soundEffects.playClick();
                setCurrentRoom(null);
                setMyParticipant(null);
                onBackToQuizzes();
              }}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all"
            >
              Voltar aos Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

  return (
    <div className="relative">
      {/* Student Top Bar Local Audio Trigger */}
      <div className="max-w-2xl mx-auto flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">
            Sala: <span className="text-white">{currentRoom.name}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            soundEffects.playClick();
            setIsAudioModalOpen(true);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-lg backdrop-blur-md transition-all cursor-pointer ${
            studentMuted
              ? 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-white'
              : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40 hover:border-indigo-400 hover:shadow-indigo-500/20'
          }`}
          title="Ajustar Áudio Local"
        >
          {studentMuted ? (
            <VolumeX className="w-4 h-4 text-rose-400" />
          ) : studentVolume < 0.4 ? (
            <Volume1 className="w-4 h-4 text-indigo-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-indigo-400" />
          )}
          <span className="text-xs font-bold font-mono">
            {studentMuted ? 'Mudo' : `${Math.round(studentVolume * 100)}%`}
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline border-l border-slate-700 pl-2">
            🎵 {currentRoom.audioConfig?.musicEnabled ? currentRoom.audioConfig.trackTitle : 'Sem música'}
          </span>
        </button>
      </div>

      {renderRoomScreen()}

      {/* Student Local Audio Settings Modal */}
      {isAudioModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Controle Local de Áudio</h3>
                  <p className="text-xs text-slate-400">Ajuste seu volume individual nesta partida</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAudioModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Track Info */}
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <Music className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Música Definida pelo Professor
                  </span>
                  <span className="text-xs font-bold text-white">
                    {currentRoom?.audioConfig?.musicEnabled
                      ? currentRoom.audioConfig.trackTitle
                      : '🔇 Sala sem música ambiente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Master Volume Slider */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-300">Volume Individual</span>
                <span className="text-indigo-400 font-mono">
                  {studentMuted ? '0% (Mudo)' : `${Math.round(studentVolume * 100)}%`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleToggleStudentMute}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {studentMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={studentMuted ? 0 : studentVolume}
                  onChange={(e) => handleStudentVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Independent Toggles: Music and Effects */}
            <div className="space-y-3">
              {/* Toggle Music */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Music className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Música da Sala</span>
                    <span className="text-[11px] text-slate-400">Trilha ambiente de fundo</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setStudentMusicEnabled(!studentMusicEnabled);
                  }}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                    studentMusicEnabled && !studentMuted ? 'bg-indigo-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      studentMusicEnabled && !studentMuted ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle Sound Effects */}
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Efeitos Sonoros</span>
                    <span className="text-[11px] text-slate-400">Sons de acertos, erros e contagem</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setStudentEffectsEnabled(!studentEffectsEnabled);
                  }}
                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                    studentEffectsEnabled && !studentMuted ? 'bg-emerald-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      studentEffectsEnabled && !studentMuted ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setIsAudioModalOpen(false);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-indigo-600/30"
              >
                Pronto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
