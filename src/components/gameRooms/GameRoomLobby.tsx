import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  Play,
  LogOut,
  Sparkles,
  Gamepad2,
  Trash2,
  Shield,
  Clock,
  Radio,
  Share2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameRoom } from '../../services/gameRoomService';
import { soundEffects } from '../../utils/soundEffects';

interface GameRoomLobbyProps {
  room: GameRoom;
  isTeacher: boolean;
  currentUserId: string;
  onStartGame?: () => void;
  onLeaveRoom: () => void;
  onKickParticipant?: (participantId: string) => void;
}

export const GameRoomLobby: React.FC<GameRoomLobbyProps> = ({
  room,
  isTeacher,
  currentUserId,
  onStartGame,
  onLeaveRoom,
  onKickParticipant,
}) => {
  const [copied, setCopied] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);

  const handleCopyPin = () => {
    soundEffects.playClick();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(room.pin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const getGameBadge = () => {
    switch (room.gameType) {
      case 'stop':
        return { label: 'Adedonha / Stop', color: 'from-amber-500 to-orange-500', icon: '🛑' };
      case 'quiz':
        return { label: 'Quiz Competitivo', color: 'from-blue-500 to-cyan-500', icon: '🧠' };
      case 'memory':
        return { label: 'Jogo da Memória Tech', color: 'from-emerald-500 to-teal-500', icon: '🃏' };
      case 'hangman':
        return { label: 'Forca Tecnológica', color: 'from-purple-500 to-pink-500', icon: '🔤' };
      default:
        return { label: 'Desafio Multiplayer', color: 'from-indigo-500 to-cyan-500', icon: '🎮' };
    }
  };

  const badge = getGameBadge();

  return (
    <div className="relative min-h-[600px] flex flex-col justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden">
      {/* Ambient background particles */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Countdown overlay when starting */}
      {room.countdownRemaining !== undefined && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in">
          <span className="text-xl sm:text-2xl font-black text-cyan-400 uppercase tracking-widest mb-2 animate-bounce">
            Preparar...
          </span>
          <div className="w-36 h-36 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-1 flex items-center justify-center shadow-2xl shadow-cyan-500/50 animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
              <span className="text-7xl font-black text-white">{room.countdownRemaining}</span>
            </div>
          </div>
          <p className="text-sm font-semibold text-slate-300 mt-6 animate-pulse">
            A partida começará em instantes para todos os jogadores!
          </p>
        </div>
      )}

      {/* Top Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r ${badge.color} shadow-sm flex items-center gap-1.5`}
            >
              <span>{badge.icon}</span>
              {badge.label}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700">
              {room.className}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {room.title}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>Professor(a): <strong className="text-slate-200">{room.teacherName}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              {room.durationSec}s por rodada
            </span>
          </p>
        </div>

        {/* 6-Digit PIN Display & Controls */}
        <div className="flex items-center gap-3">
          <div
            onClick={handleCopyPin}
            className="group cursor-pointer bg-slate-950/90 hover:bg-slate-950 border-2 border-cyan-500/40 hover:border-cyan-400 px-5 py-3 rounded-2xl flex items-center gap-4 transition-all shadow-xl shadow-cyan-950/40"
            title="Clique para copiar o PIN da sala"
          >
            <div>
              <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-extrabold flex items-center gap-1">
                <span>CÓDIGO DA SALA (PIN)</span>
                {copied && <span className="text-emerald-400">• COPIADO!</span>}
              </div>
              <div className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white group-hover:text-cyan-300 transition-colors">
                {room.pin.slice(0, 3)} {room.pin.slice(3)}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </div>
          </div>

          <button
            onClick={onLeaveRoom}
            className="p-3 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-400 text-slate-400 border border-slate-700 transition-colors"
            title="Sair da sala"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Players Grid */}
      <div className="relative z-10 flex-1 my-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-black text-white">
              Jogadores Conectados ({room.participants.length})
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Sincronização em tempo real</span>
          </div>
        </div>

        {room.participants.length === 0 ? (
          <div className="min-h-[220px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 animate-pulse">
              <Radio className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Aguardando a entrada dos alunos...</h4>
            <p className="text-xs text-slate-400 max-w-md">
              Peça para os alunos abrirem o GAMEINFOR, clicarem em{' '}
              <strong className="text-cyan-300">"ENTRAR EM UMA SALA"</strong> e digitarem o código PIN{' '}
              <strong className="text-white font-mono text-sm">{room.pin}</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[360px] overflow-y-auto pr-1">
            {room.participants.map((player) => {
              const isMe = player.id === currentUserId;
              return (
                <div
                  key={player.id}
                  className={`group relative bg-slate-950/80 rounded-2xl p-3 border transition-all flex flex-col items-center text-center ${
                    isMe
                      ? 'border-cyan-500 shadow-md shadow-cyan-500/20 bg-cyan-950/20'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative mb-2">
                    <img
                      src={player.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={player.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-700 group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
                  </div>
                  <span className="text-xs font-extrabold text-white truncate max-w-[130px] block">
                    {player.name}
                  </span>
                  <span className="text-[10px] text-cyan-400 font-bold mt-0.5">
                    {isMe ? '⭐ Você' : 'Conectado'}
                  </span>

                  {/* Teacher can kick participant */}
                  {isTeacher && onKickParticipant && (
                    <button
                      onClick={() => onKickParticipant(player.id)}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-red-950 text-red-400 hover:bg-red-900 border border-red-800 transition-opacity"
                      title="Remover jogador da sala"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      <div className="relative z-10 border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Partida gamificada com concessão de XP aos vencedores</span>
        </div>

        {isTeacher ? (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onStartGame}
              disabled={room.participants.length === 0}
              className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              Iniciar Partida Agora ({room.participants.length})
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-slate-950/70 border border-cyan-500/30 px-5 py-3 rounded-2xl">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-bold text-slate-200">
              Aguardando o professor iniciar a partida... Prepare-se! 🚀
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
