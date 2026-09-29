import React, { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  Play,
  SkipForward,
  LogOut,
  Trophy,
  Sparkles,
  Flame,
  Award,
  Clock,
  Trash2,
  Maximize2,
  Minimize2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { GameRoom, gameRoomService } from '../../services/gameRoomService';
import { GameRoomLobby } from './GameRoomLobby';
import { soundEffects } from '../../utils/soundEffects';

interface TeacherGameRoomHostProps {
  initialRoom: GameRoom;
  onExit: () => void;
}

export const TeacherGameRoomHost: React.FC<TeacherGameRoomHostProps> = ({
  initialRoom,
  onExit,
}) => {
  const [room, setRoom] = useState<GameRoom>(initialRoom);
  const [copiedPin, setCopiedPin] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  // Subscribe to live room updates
  useEffect(() => {
    const unsub = gameRoomService.subscribe((rooms) => {
      const fresh = rooms.find((r) => r.id === room.id);
      if (fresh) {
        setRoom(fresh);
      }
    });

    return () => unsub();
  }, [room.id]);

  const handleCopyPin = () => {
    soundEffects.playClick();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(room.pin);
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    }
  };

  const handleStartGame = () => {
    soundEffects.playClick();
    const updated = gameRoomService.startGame(room.id);
    if (updated) setRoom(updated);
  };

  const handleKickParticipant = (participantId: string) => {
    soundEffects.playWrong();
    const updated = gameRoomService.removeParticipant(room.id, participantId);
    if (updated) setRoom(updated);
  };

  const handleEndStopRound = () => {
    soundEffects.playClick();
    const updated = gameRoomService.endStopRound(room.id);
    if (updated) setRoom(updated);
  };

  const handleNextStopRound = () => {
    soundEffects.playVictory();
    const updated = gameRoomService.nextStopRound(room.id);
    if (updated) setRoom(updated);
  };

  const handleNextQuizQuestion = () => {
    soundEffects.playClick();
    const updated = gameRoomService.nextQuizQuestion(room.id);
    if (updated) setRoom(updated);
  };

  const handleEndGame = () => {
    soundEffects.playVictory();
    const updated = gameRoomService.endGame(room.id);
    if (updated) setRoom(updated);
  };

  // ============================================================
  // LOBBY STATE (Waiting for students to join)
  // ============================================================
  if (room.status === 'waiting') {
    return (
      <div className="space-y-4">
        {/* Full Projector Mode Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-5 py-3 rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Painel do Professor • Sala Aberta para Conexão dos Alunos</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              {isProjectorMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              {isProjectorMode ? 'Sair do Modo Projetor' : 'Modo Telão Projetor'}
            </button>
          </div>
        </div>

        {/* Projector Giant PIN Banner if enabled */}
        {isProjectorMode && (
          <div className="bg-gradient-to-r from-cyan-950 via-slate-950 to-blue-950 border-2 border-cyan-500 rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95">
            <span className="text-sm font-extrabold uppercase tracking-widest text-cyan-400 block mb-2">
              Acesse o GAMEINFOR no seu dispositivo e digite o PIN:
            </span>
            <div className="text-7xl sm:text-9xl font-black font-mono tracking-[0.3em] text-white my-4 drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]">
              {room.pin}
            </div>
            <p className="text-sm text-slate-300">
              {room.participants.length} aluno(s) aguardando no lobby
            </p>
          </div>
        )}

        <GameRoomLobby
          room={room}
          isTeacher={true}
          currentUserId={room.teacherId}
          onStartGame={handleStartGame}
          onLeaveRoom={onExit}
          onKickParticipant={handleKickParticipant}
        />
      </div>
    );
  }

  // ============================================================
  // FINISHED / PODIUM & PERFORMANCE REPORT
  // ============================================================
  if (room.status === 'finished') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-4">
        {/* Top Finished Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            Partida Concluída com Sucesso!
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Pódio & Relatório de Desempenho
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            {room.title} • {room.className} • {room.participants.length} alunos participantes
          </p>

          {/* Olympic Podium Display */}
          <div className="flex items-end justify-center gap-4 my-8 max-w-md mx-auto h-52">
            {room.podium?.second && (
              <div className="flex-1 flex flex-col items-center">
                <img
                  src={room.podium.second.avatar}
                  alt="2nd"
                  className="w-12 h-12 rounded-full border-2 border-slate-400 object-cover mb-1"
                />
                <span className="text-xs font-bold text-slate-200 truncate max-w-[100px]">
                  {room.podium.second.name}
                </span>
                <span className="text-[10px] text-slate-400 font-bold mb-1">
                  {room.podium.second.xp} pts
                </span>
                <div className="w-full bg-slate-700 h-24 rounded-t-2xl flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">2º</span>
                  <span className="text-[9px] text-slate-300 uppercase font-black">Prata</span>
                </div>
              </div>
            )}

            {room.podium?.first && (
              <div className="flex-1 flex flex-col items-center">
                <span className="text-xl animate-bounce">👑</span>
                <img
                  src={room.podium.first.avatar}
                  alt="1st"
                  className="w-16 h-16 rounded-full border-4 border-amber-400 object-cover shadow-lg shadow-amber-500/40 mb-1"
                />
                <span className="text-xs font-black text-amber-300 truncate max-w-[110px]">
                  {room.podium.first.name}
                </span>
                <span className="text-[10px] text-amber-400 font-bold mb-1">
                  {room.podium.first.xp} pts
                </span>
                <div className="w-full bg-gradient-to-t from-amber-600 to-yellow-400 h-32 rounded-t-2xl flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-950">1º</span>
                  <span className="text-[9px] text-slate-950 uppercase font-black">Campeão</span>
                </div>
              </div>
            )}

            {room.podium?.third && (
              <div className="flex-1 flex flex-col items-center">
                <img
                  src={room.podium.third.avatar}
                  alt="3rd"
                  className="w-10 h-10 rounded-full border-2 border-amber-700 object-cover mb-1"
                />
                <span className="text-xs font-bold text-slate-200 truncate max-w-[90px]">
                  {room.podium.third.name}
                </span>
                <span className="text-[10px] text-amber-600 font-bold mb-1">
                  {room.podium.third.xp} pts
                </span>
                <div className="w-full bg-amber-900 h-18 rounded-t-2xl flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-white">3º</span>
                  <span className="text-[9px] text-amber-200 uppercase font-black">Bronze</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Participants Performance Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              Tabela de Pontuação & Respostas da Turma
            </h3>
            <span className="text-xs text-slate-400">
              Total de alunos: {room.participants.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Colocação</th>
                  <th className="py-2.5 px-3">Aluno</th>
                  <th className="py-2.5 px-3 text-right">Pontos / XP</th>
                  <th className="py-2.5 px-3 text-right">Acertos</th>
                  <th className="py-2.5 px-3 text-right">Tempo Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {room.participants.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold">
                      {idx === 0 ? '🥇 1º' : idx === 1 ? '🥈 2º' : idx === 2 ? '🥉 3º' : `${idx + 1}º`}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.avatar}
                          alt={p.name}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                        <span className="font-bold text-white">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-amber-400 font-mono">
                      {p.xp} pts
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      {p.correctCount}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {p.totalAnswerTimeMs > 0 ? `${(p.totalAnswerTimeMs / 1000).toFixed(1)}s` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={onExit}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Fechar e Voltar ao Painel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ACTIVE MATCH - STOP / ADEDONHA TEACHER CONTROL
  // ============================================================
  if (room.gameType === 'stop' && room.stopState) {
    const stop = room.stopState;
    const isRoundEnded = room.status === 'round_ended';

    return (
      <div className="space-y-4 max-w-4xl mx-auto py-4">
        {/* Teacher Command Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🛑 Stop Rodada {stop.currentRound} de {stop.totalRounds}
              </span>
              <span className="text-xs text-slate-400">PIN: {room.pin}</span>
            </div>
            <h2 className="text-lg font-black text-white">
              Letra Ativa Sorteada:{' '}
              <span className="text-amber-400 font-mono text-2xl font-black">
                {stop.currentLetter}
              </span>
            </h2>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {!isRoundEnded ? (
              <button
                onClick={handleEndStopRound}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>Encerrar Rodada</span>
              </button>
            ) : stop.currentRound < stop.totalRounds ? (
              <button
                onClick={handleNextStopRound}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
                <span>Próxima Rodada (Nova Letra)</span>
              </button>
            ) : (
              <button
                onClick={handleEndGame}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Finalizar Jogo e Ver Pódio</span>
              </button>
            )}

            <button
              onClick={handleEndGame}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Encerrar Partida Imediatamente"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Answers Grid */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Monitoramento de Respostas dos Alunos em Tempo Real
            </h3>
            {stop.stopTriggeredBy && (
              <span className="px-2.5 py-1 rounded-full bg-red-950 text-red-400 border border-red-800 text-[10px] font-black uppercase animate-pulse">
                🛑 STOP chamado por {stop.stopTriggeredBy.name}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {room.participants.map((player) => {
              const answers = stop.submittedAnswers[player.id] || {};
              const filledCount = Object.values(answers).filter((v) => v.trim().length > 0).length;

              return (
                <div
                  key={player.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={player.avatar}
                        alt={player.name}
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                      <span className="text-xs font-bold text-white">{player.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      {filledCount}/{stop.categories.length} preenchidas
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {stop.categories.map((cat) => {
                      const ans = answers[cat.id];
                      return (
                        <div key={cat.id} className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 block font-semibold">
                            {cat.name}
                          </span>
                          <span className="font-bold text-slate-200 truncate block mt-0.5">
                            {ans ? ans : <span className="text-slate-600 italic">vazio</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // ACTIVE MATCH - QUIZ TEACHER CONTROL
  // ============================================================
  if (room.gameType === 'quiz' && room.quizState) {
    const qState = room.quizState;
    const q = qState.questions[qState.currentQuestionIndex];

    return (
      <div className="space-y-4 max-w-4xl mx-auto py-4">
        {/* Command Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex items-center justify-between">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Quiz Pergunta {qState.currentQuestionIndex + 1} de {qState.totalQuestions}
            </span>
            <h2 className="text-base font-bold text-white mt-1">
              Controle da Pergunta ao Vivo
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNextQuizQuestion}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
            >
              <span>{qState.currentQuestionIndex + 1 >= qState.totalQuestions ? 'Ver Pódio Final' : 'Próxima Pergunta'}</span>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Display */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl">
          <span className="text-xs uppercase tracking-widest text-cyan-400 font-extrabold block mb-2">
            Pergunta Atual na Tela dos Alunos
          </span>
          <h2 className="text-2xl font-black text-white mb-6">
            {q.question}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {q.options.map((opt, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border font-bold text-sm flex items-center justify-between ${
                  idx === q.correctIndex
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                }`}
              >
                <span>{opt}</span>
                {idx === q.correctIndex && <Check className="w-5 h-5 text-emerald-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 text-center text-slate-400">
      Carregando sala de jogos...
    </div>
  );
};
