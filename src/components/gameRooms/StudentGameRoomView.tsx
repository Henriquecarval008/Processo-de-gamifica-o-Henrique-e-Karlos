import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  Sparkles,
  Users,
  LogOut,
  AlertCircle,
  HelpCircle,
  Award,
  Zap,
  Check,
  Send,
  Radio,
  Flame,
} from 'lucide-react';
import { GameRoom, gameRoomService } from '../../services/gameRoomService';
import { GameRoomLobby } from './GameRoomLobby';
import { useGameinfor } from '../../context/GameinforContext';
import { soundEffects } from '../../utils/soundEffects';

interface StudentGameRoomViewProps {
  initialPin?: string;
  onExit: () => void;
}

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&w=150&q=80',
];

export const StudentGameRoomView: React.FC<StudentGameRoomViewProps> = ({
  initialPin = '',
  onExit,
}) => {
  const { currentUser, addXp } = useGameinfor();

  // Entrance states
  const [pinInput, setPinInput] = useState(initialPin);
  const [studentName, setStudentName] = useState(currentUser.nickname || currentUser.name || 'Aluno Tech');
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar || AVATAR_OPTIONS[0]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [foundRoomPreview, setFoundRoomPreview] = useState<GameRoom | null>(null);

  // Active room state
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [xpAwarded, setXpAwarded] = useState(false);

  // Stop / Adedonha Student Inputs
  const [stopAnswers, setStopAnswers] = useState<Record<string, string>>({});
  const [hasTriggeredStop, setHasTriggeredStop] = useState(false);

  // Quiz Student Interaction
  const [quizSelectedOption, setQuizSelectedOption] = useState<number | null>(null);
  const [quizAnswerTimeMs, setQuizAnswerTimeMs] = useState(0);
  const questionStartTimeRef = useRef(Date.now());

  // Listen to room updates
  useEffect(() => {
    const unsub = gameRoomService.subscribe((rooms) => {
      if (currentRoom) {
        const fresh = rooms.find((r) => r.id === currentRoom.id);
        if (fresh) {
          setCurrentRoom(fresh);
        } else {
          // Room deleted or ended
          setCurrentRoom(null);
        }
      }
    });

    return () => unsub();
  }, [currentRoom]);

  // Real-time lookup as student types PIN
  useEffect(() => {
    const clean = pinInput.trim().replace(/\D/g, '');
    if (clean.length === 6) {
      const room = gameRoomService.getRoomByPin(clean);
      if (room) {
        setFoundRoomPreview(room);
        setJoinError(null);
      } else {
        setFoundRoomPreview(null);
        setJoinError('Nenhuma sala ativa encontrada com este código PIN.');
      }
    } else {
      setFoundRoomPreview(null);
      setJoinError(null);
    }
  }, [pinInput]);

  // Handle Join Room confirmation
  const handleConfirmJoin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    soundEffects.playClick();
    const clean = pinInput.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      setJoinError('O código da sala deve possuir exatamente 6 dígitos.');
      return;
    }

    const res = gameRoomService.joinRoomByPin(clean, {
      id: currentUser.id,
      name: studentName.trim() || currentUser.name,
      avatar: selectedAvatar,
      xp: currentUser.xp,
    });

    if (res.success && res.room) {
      soundEffects.playVictory();
      setCurrentRoom(res.room);
      setJoinError(null);
    } else {
      setJoinError(res.message || 'Erro ao entrar na sala.');
    }
  };

  // Handle Stop category input changes
  const handleStopInputChange = (catId: string, val: string) => {
    const updated = { ...stopAnswers, [catId]: val };
    setStopAnswers(updated);
    if (currentRoom) {
      gameRoomService.submitStopAnswers(currentRoom.id, currentUser.id, updated);
    }
  };

  // Student presses STOP button
  const handleHitStop = () => {
    if (!currentRoom || hasTriggeredStop) return;
    soundEffects.playVictory();
    setHasTriggeredStop(true);
    gameRoomService.triggerStop(currentRoom.id, currentUser.id, studentName);
  };

  // Student selects Quiz answer
  const handleSelectQuizOption = (optIdx: number) => {
    if (!currentRoom || !currentRoom.quizState || quizSelectedOption !== null) return;
    const elapsed = Date.now() - questionStartTimeRef.current;
    setQuizSelectedOption(optIdx);
    setQuizAnswerTimeMs(elapsed);

    const qIdx = currentRoom.quizState.currentQuestionIndex;
    const q = currentRoom.quizState.questions[qIdx];
    if (q && optIdx === q.correctIndex) {
      soundEffects.playCorrect();
    } else {
      soundEffects.playWrong();
    }

    gameRoomService.submitQuizAnswer(currentRoom.id, currentUser.id, qIdx, optIdx, elapsed);
  };

  // Reset quiz state when question changes
  useEffect(() => {
    if (currentRoom?.quizState) {
      setQuizSelectedOption(null);
      questionStartTimeRef.current = Date.now();
    }
  }, [currentRoom?.quizState?.currentQuestionIndex]);

  // Claim XP on game finish
  const handleClaimXp = (amount: number) => {
    if (xpAwarded) return;
    soundEffects.playVictory();
    addXp(amount);
    setXpAwarded(true);
  };

  // ============================================================
  // SCREEN 1: PIN Input & Entry Screen
  // ============================================================
  if (!currentRoom) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 mx-auto mb-3 shadow-lg shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Entrar em uma Sala de Jogos
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Digite o código PIN de 6 dígitos projetado ou compartilhado pelo seu professor.
            </p>
          </div>

          <form onSubmit={handleConfirmJoin} className="space-y-5">
            {/* PIN Input Box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 text-center">
                Código da Sala (PIN)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-3xl sm:text-4xl font-mono font-black tracking-[0.4em] bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-2xl py-4 text-white placeholder-slate-600 transition-all outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Room Found Preview Card */}
            {foundRoomPreview && (
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-lg">
                    {foundRoomPreview.gameType === 'stop' ? '🛑' : foundRoomPreview.gameType === 'quiz' ? '🧠' : '🎮'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                      Sala Encontrada!
                    </span>
                    <h4 className="text-sm font-bold text-white truncate">
                      {foundRoomPreview.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Prof. {foundRoomPreview.teacherName} • {foundRoomPreview.participants.length} conectados
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                </div>
              </div>
            )}

            {/* Error Message */}
            {joinError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{joinError}</span>
              </div>
            )}

            {/* Nickname & Avatar selection */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Seu Nome ou Apelido no Jogo
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  maxLength={25}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-400 outline-none"
                  placeholder="Como você quer aparecer no ranking?"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Escolha seu Avatar
                </label>
                <div className="flex items-center gap-2 justify-center">
                  {AVATAR_OPTIONS.map((avUrl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSelectedAvatar(avUrl)}
                      className={`relative rounded-xl p-0.5 transition-all ${
                        selectedAvatar === avUrl
                          ? 'ring-2 ring-cyan-400 scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={avUrl}
                        alt="Avatar"
                        className="w-10 h-10 rounded-[10px] object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onExit}
                className="w-1/3 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={pinInput.trim().length !== 6}
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Confirmar e Entrar na Sala</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ============================================================
  // SCREEN 2: Waiting Lobby
  // ============================================================
  if (currentRoom.status === 'waiting') {
    return (
      <GameRoomLobby
        room={currentRoom}
        isTeacher={false}
        currentUserId={currentUser.id}
        onLeaveRoom={() => {
          gameRoomService.leaveRoom(currentRoom.id, currentUser.id);
          setCurrentRoom(null);
        }}
      />
    );
  }

  // ============================================================
  // SCREEN 3: Finished / Podium View
  // ============================================================
  if (currentRoom.status === 'finished') {
    const myParticipant = currentRoom.participants.find((p) => p.id === currentUser.id);
    const myRank = myParticipant?.currentRank || currentRoom.participants.findIndex((p) => p.id === currentUser.id) + 1;
    const isWinner = myRank === 1;

    // Calculate awarded XP
    const earnedXp = myRank === 1 ? 150 : myRank === 2 ? 100 : myRank === 3 ? 75 : 40;

    return (
      <div className="max-w-2xl mx-auto py-6 px-4">
        <div className="bg-gradient-to-b from-slate-900 via-indigo-950/60 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            Pódio dos Campeões • Partida Finalizada
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            {isWinner ? '🎉 Parabéns, Você Venceu! 👑' : 'Excelente Partida! 👏'}
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto mb-6">
            Você conquistou o <strong className="text-amber-300">{myRank}º Lugar</strong> com{' '}
            <strong className="text-cyan-300">{myParticipant?.xp || 0} pontos</strong> na sala{' '}
            <strong className="text-white">{currentRoom.title}</strong>.
          </p>

          {/* Olympic Podium Display (1st, 2nd, 3rd) */}
          <div className="flex items-end justify-center gap-3 sm:gap-4 my-8 max-w-md mx-auto h-56">
            {/* 2nd Place */}
            {currentRoom.podium?.second && (
              <div className="flex-1 flex flex-col items-center">
                <img
                  src={currentRoom.podium.second.avatar || AVATAR_OPTIONS[1]}
                  alt="2nd"
                  className="w-12 h-12 rounded-full border-2 border-slate-400 object-cover mb-1"
                />
                <span className="text-[11px] font-bold text-slate-200 truncate max-w-[90px]">
                  {currentRoom.podium.second.name}
                </span>
                <span className="text-[10px] text-slate-400 font-bold mb-1">
                  {currentRoom.podium.second.xp} pts
                </span>
                <div className="w-full bg-gradient-to-t from-slate-700 to-slate-500 h-28 rounded-t-2xl flex flex-col items-center justify-center shadow-lg border-t-2 border-slate-300">
                  <span className="text-2xl font-black text-white">2º</span>
                  <span className="text-[10px] text-slate-200 uppercase font-black">Prata</span>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {currentRoom.podium?.first && (
              <div className="flex-1 flex flex-col items-center">
                <div className="relative mb-1">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl animate-bounce">
                    👑
                  </span>
                  <img
                    src={currentRoom.podium.first.avatar || AVATAR_OPTIONS[0]}
                    alt="1st"
                    className="w-16 h-16 rounded-full border-4 border-amber-400 object-cover shadow-lg shadow-amber-500/40"
                  />
                </div>
                <span className="text-xs font-black text-amber-300 truncate max-w-[100px]">
                  {currentRoom.podium.first.name}
                </span>
                <span className="text-[10px] text-amber-400 font-bold mb-1">
                  {currentRoom.podium.first.xp} pts
                </span>
                <div className="w-full bg-gradient-to-t from-amber-600 via-amber-500 to-yellow-400 h-36 rounded-t-2xl flex flex-col items-center justify-center shadow-2xl border-t-2 border-yellow-200">
                  <span className="text-3xl font-black text-slate-950">1º</span>
                  <span className="text-[10px] text-slate-950 uppercase font-black">Campeão</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {currentRoom.podium?.third && (
              <div className="flex-1 flex flex-col items-center">
                <img
                  src={currentRoom.podium.third.avatar || AVATAR_OPTIONS[2]}
                  alt="3rd"
                  className="w-11 h-11 rounded-full border-2 border-amber-700 object-cover mb-1"
                />
                <span className="text-[11px] font-bold text-slate-200 truncate max-w-[90px]">
                  {currentRoom.podium.third.name}
                </span>
                <span className="text-[10px] text-amber-600 font-bold mb-1">
                  {currentRoom.podium.third.xp} pts
                </span>
                <div className="w-full bg-gradient-to-t from-amber-900 to-amber-700 h-20 rounded-t-2xl flex flex-col items-center justify-center shadow-lg border-t-2 border-amber-500">
                  <span className="text-xl font-black text-white">3º</span>
                  <span className="text-[10px] text-amber-200 uppercase font-black">Bronze</span>
                </div>
              </div>
            )}
          </div>

          {/* XP Claim Card */}
          <div className="bg-slate-950/80 border border-amber-500/30 p-4 rounded-2xl max-w-sm mx-auto mb-6">
            <span className="text-xs font-bold text-slate-400">Sua Recompensa de Participação</span>
            <div className="text-2xl font-black text-amber-400 flex items-center justify-center gap-1.5 mt-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              +{earnedXp} XP do GAMEINFOR
            </div>
            {!xpAwarded ? (
              <button
                onClick={() => handleClaimXp(earnedXp)}
                className="mt-3 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
              >
                Coletar e Salvar no Meu Perfil
              </button>
            ) : (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400">
                <Check className="w-4 h-4" />
                XP Adicionado com Sucesso!
              </div>
            )}
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              setCurrentRoom(null);
              onExit();
            }}
            className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
          >
            Sair e Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // SCREEN 4: Active Gameplay - STOP / ADEDONHA
  // ============================================================
  if (currentRoom.gameType === 'stop' && currentRoom.stopState) {
    const stop = currentRoom.stopState;
    const isRoundEnded = currentRoom.status === 'round_ended';
    const targetLetter = stop.currentLetter;
    const isStopTriggered = !!stop.stopTriggeredBy;

    // Check if student filled all categories
    const allFilled = stop.categories.every((cat) => (stopAnswers[cat.id] || '').trim().length > 0);

    return (
      <div className="max-w-3xl mx-auto py-4 px-2 sm:px-4 space-y-4">
        {/* Urgent Stop Announcement Banner */}
        {isStopTriggered && !isRoundEnded && (
          <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              <div>
                <span className="text-xs uppercase tracking-wider font-black">
                  {stop.stopTriggeredBy?.id === currentUser.id ? 'Você chamou STOP!' : `${stop.stopTriggeredBy?.name} chamou STOP!`}
                </span>
                <p className="text-sm font-black">
                  Contagem regressiva final para envio das respostas:
                </p>
              </div>
            </div>
            <div className="w-14 h-14 rounded-xl bg-slate-950 flex items-center justify-center text-3xl font-black font-mono text-yellow-300 border-2 border-yellow-400">
              {stop.stopCountdownRemaining ?? 10}s
            </div>
          </div>
        )}

        {/* Letter & Round Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Rodada {stop.currentRound} de {stop.totalRounds}
              </span>
              <span className="text-xs text-slate-400">{currentRoom.title}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Todas as respostas devem começar com a letra:
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-500 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <span className="text-4xl font-black text-amber-400 font-mono">
                  {targetLetter}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* If round ended, show round results review */}
        {isRoundEnded ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto text-xl">
              📝
            </div>
            <h3 className="text-xl font-black text-white">Rodada {stop.currentRound} Finalizada!</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              O professor está revisando as respostas e em instantes iniciará a próxima rodada com uma nova letra sorteada.
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 max-w-sm mx-auto">
              <span className="text-xs text-slate-400 font-semibold">Sua Pontuação na Rodada</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                +{stop.roundScores[currentUser.id] || 0} Pontos
              </div>
            </div>

            <div className="text-xs text-slate-400 animate-pulse">
              Aguardando o professor avançar a partida...
            </div>
          </div>
        ) : (
          /* Active Round Form */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stop.categories.map((cat) => {
                const val = stopAnswers[cat.id] || '';
                const startsCorrect = val.trim().toLowerCase().startsWith(targetLetter.toLowerCase());
                const isValid = val.trim().length > 1 && startsCorrect;

                return (
                  <div
                    key={cat.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 focus-within:border-cyan-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        {cat.name}
                      </label>
                      {val.trim().length > 0 && (
                        <span
                          className={`text-[10px] font-bold flex items-center gap-1 ${
                            isValid ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {isValid ? <Check className="w-3.5 h-3.5" /> : 'Inicia com ' + targetLetter + '?'}
                        </span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={val}
                      disabled={isStopTriggered && (stop.stopCountdownRemaining ?? 10) <= 0}
                      onChange={(e) => handleStopInputChange(cat.id, e.target.value)}
                      placeholder={`Ex: palavra com "${targetLetter}"...`}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-cyan-400 outline-none"
                    />
                  </div>
                );
              })}
            </div>

            {/* Giant STOP Button */}
            <div className="pt-3">
              <button
                type="button"
                onClick={handleHitStop}
                disabled={isStopTriggered}
                className={`w-full py-4 rounded-2xl font-black text-base shadow-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isStopTriggered
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                    : allFilled
                    ? 'bg-gradient-to-r from-red-600 via-rose-500 to-red-600 hover:from-red-500 hover:to-rose-400 text-white shadow-red-600/40 animate-pulse hover:scale-[1.02]'
                    : 'bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-500/40'
                }`}
              >
                <span className="text-xl">🛑</span>
                <span>{isStopTriggered ? 'STOP JÁ FOI ACIONADO!' : 'APERTE STOP! (TERMINAR RODADA)'}</span>
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2">
                Assim que você preencher as categorias, aperte STOP para iniciar a contagem regressiva de 10s e ganhar pontos extras!
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // SCREEN 5: Active Gameplay - QUIZ COMPETITIVO
  // ============================================================
  if (currentRoom.gameType === 'quiz' && currentRoom.quizState) {
    const qState = currentRoom.quizState;
    const q = qState.questions[qState.currentQuestionIndex];

    const OPTION_COLORS = [
      'bg-red-600 hover:bg-red-500 border-red-500 shadow-red-600/20',
      'bg-blue-600 hover:bg-blue-500 border-blue-500 shadow-blue-600/20',
      'bg-amber-600 hover:bg-amber-500 border-amber-500 shadow-amber-600/20',
      'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 shadow-emerald-600/20',
    ];

    const OPTION_SHAPES = ['▲', '◆', '●', '■'];

    return (
      <div className="max-w-3xl mx-auto py-4 px-2 sm:px-4 space-y-4">
        {/* Header Question Tracker */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Pergunta {qState.currentQuestionIndex + 1} de {qState.totalQuestions}
            </span>
            <span className="text-xs text-slate-400">{currentRoom.title}</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Resposta rápida = Mais XP</span>
          </div>
        </div>

        {/* Central Question Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl">
          <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
            {q.question}
          </h2>
        </div>

        {/* 4 Interactive Choice Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {q.options.map((opt, idx) => {
            const isSelected = quizSelectedOption === idx;
            const hasAnswered = quizSelectedOption !== null;
            const isCorrect = idx === q.correctIndex;

            let extraClasses = OPTION_COLORS[idx % 4];
            if (hasAnswered) {
              if (isCorrect) {
                extraClasses = 'bg-emerald-600 border-emerald-400 ring-2 ring-emerald-300 shadow-emerald-500/40';
              } else if (isSelected) {
                extraClasses = 'bg-red-700 border-red-500 opacity-80';
              } else {
                extraClasses = 'bg-slate-900 border-slate-800 opacity-40';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={hasAnswered}
                onClick={() => handleSelectQuizOption(idx)}
                className={`min-h-[90px] p-5 rounded-2xl border text-left text-white font-bold text-sm sm:text-base flex items-center gap-4 transition-all shadow-lg cursor-pointer ${extraClasses} ${
                  !hasAnswered ? 'hover:scale-[1.02]' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center font-black text-lg shrink-0">
                  {OPTION_SHAPES[idx % 4]}
                </div>
                <span className="flex-1 leading-snug">{opt}</span>
                {hasAnswered && isCorrect && <Check className="w-6 h-6 text-white shrink-0" />}
                {hasAnswered && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-white shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Feedback After Selection */}
        {quizSelectedOption !== null && (
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center animate-in fade-in">
            {quizSelectedOption === q.correctIndex ? (
              <div className="text-emerald-400 font-black text-sm flex items-center justify-center gap-1.5">
                <Check className="w-4 h-4" />
                Correto! Resposta em {(quizAnswerTimeMs / 1000).toFixed(1)}s (+XP garantido)
              </div>
            ) : (
              <div className="text-red-400 font-black text-sm flex items-center justify-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Incorreto! A resposta certa era: {q.options[q.correctIndex]}
              </div>
            )}
            {q.explanation && (
              <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
                {q.explanation}
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-2">
              Aguarde o professor avançar para a próxima pergunta...
            </p>
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="p-8 text-center text-slate-400">
      Carregando partida...
    </div>
  );
};
