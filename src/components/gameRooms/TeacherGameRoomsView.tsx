import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Plus,
  Play,
  Users,
  Copy,
  Check,
  Trophy,
  Trash2,
  Sparkles,
  Clock,
  Radio,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { GameRoom, gameRoomService } from '../../services/gameRoomService';
import { TeacherGameRoomHost } from './TeacherGameRoomHost';
import { GameRoomCreatorModal } from './GameRoomCreatorModal';
import { useGameinfor } from '../../context/GameinforContext';
import { soundEffects } from '../../utils/soundEffects';

export const TeacherGameRoomsView: React.FC = () => {
  const { currentUser, classes } = useGameinfor();
  const [rooms, setRooms] = useState<GameRoom[]>(() => gameRoomService.getRooms());
  const [activeHostRoom, setActiveHostRoom] = useState<GameRoom | null>(null);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);

  useEffect(() => {
    const unsub = gameRoomService.subscribe((updated) => {
      setRooms(updated);
      if (activeHostRoom) {
        const fresh = updated.find((r) => r.id === activeHostRoom.id);
        if (fresh) setActiveHostRoom(fresh);
      }
    });

    return () => unsub();
  }, [activeHostRoom]);

  const handleCopyPin = (pin: string) => {
    soundEffects.playClick();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(pin);
      setCopiedPin(pin);
      setTimeout(() => setCopiedPin(null), 2000);
    }
  };

  const handleDeleteRoom = (roomId: string) => {
    soundEffects.playWrong();
    gameRoomService.deleteRoom(roomId);
  };

  // If hosting an active room
  if (activeHostRoom) {
    return (
      <TeacherGameRoomHost
        initialRoom={activeHostRoom}
        onExit={() => setActiveHostRoom(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/20 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Salas Multiplayer com Código PIN
              </span>
              <span className="text-xs text-slate-400">Estilo Kahoot & Gamificação</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Salas de Jogos em Tempo Real
            </h1>
            <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
              Crie salas de aula interativas para <strong className="text-amber-300">Adedonha / Stop</strong>,{' '}
              <strong className="text-cyan-300">Quiz de Informática</strong>,{' '}
              <strong className="text-emerald-300">Jogo da Memória</strong> e{' '}
              <strong className="text-purple-300">Forca Tecnológica</strong>. Os alunos entram instantaneamente pelo PIN de 6 dígitos!
            </p>
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              setIsCreatorModalOpen(true);
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Nova Sala (Gerar PIN)</span>
          </button>
        </div>
      </div>

      {/* Active and Finished Rooms Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Salas Criadas ({rooms.length})
          </h3>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-3">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Nenhuma sala criada no momento</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Clique em "Criar Nova Sala" para iniciar uma partida de Adedonha/Stop ou Quiz com seus alunos.
            </p>
            <button
              onClick={() => setIsCreatorModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs"
            >
              Criar Primeira Sala
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const isWaiting = room.status === 'waiting';
              const isFinished = room.status === 'finished';

              return (
                <div
                  key={room.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Top Status & PIN */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          isWaiting
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 animate-pulse'
                            : isFinished
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {isWaiting ? 'Aguardando Alunos' : isFinished ? 'Finalizada' : 'Em Andamento'}
                      </span>

                      {/* 6-Digit PIN with Copy */}
                      <button
                        onClick={() => handleCopyPin(room.pin)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500 text-xs font-mono font-black text-cyan-400 transition-colors"
                        title="Copiar PIN"
                      >
                        <span>PIN: {room.pin}</span>
                        {copiedPin === room.pin ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500 group-hover:text-cyan-400" />
                        )}
                      </button>
                    </div>

                    <h4 className="text-base font-extrabold text-white leading-snug mb-1">
                      {room.title}
                    </h4>
                    <p className="text-xs text-slate-400 mb-3">
                      Jogo: <strong className="text-slate-200 uppercase">{room.gameType}</strong> • {room.className}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-slate-400 py-2 border-t border-slate-800/80 mb-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-cyan-400" />
                        {room.participants.length} conectados
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {room.durationSec}s
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                    <button
                      onClick={() => {
                        soundEffects.playClick();
                        setActiveHostRoom(room);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isFinished ? 'Ver Relatório & Pódio' : 'Abrir Painel do Telão'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteRoom(room.id)}
                      className="p-2.5 rounded-xl bg-slate-950 hover:bg-red-950/60 hover:text-red-400 text-slate-500 border border-slate-800 transition-colors"
                      title="Excluir Sala"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal to create room */}
      <GameRoomCreatorModal
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)}
        teacherId={currentUser.id}
        teacherName={currentUser.name}
        classes={classes}
        onRoomCreated={(newRoom) => {
          setActiveHostRoom(newRoom);
        }}
      />
    </div>
  );
};
