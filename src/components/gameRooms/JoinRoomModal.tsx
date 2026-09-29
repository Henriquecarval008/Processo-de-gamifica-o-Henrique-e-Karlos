import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Gamepad2,
  Users,
} from 'lucide-react';
import { GameRoom, gameRoomService } from '../../services/gameRoomService';
import { useGameinfor } from '../../context/GameinforContext';
import { soundEffects } from '../../utils/soundEffects';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined: (room: GameRoom) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoined,
}) => {
  const { currentUser } = useGameinfor();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewRoom, setPreviewRoom] = useState<GameRoom | null>(null);

  useEffect(() => {
    const clean = pin.trim().replace(/\D/g, '');
    if (clean.length === 6) {
      const found = gameRoomService.getRoomByPin(clean);
      if (found) {
        setPreviewRoom(found);
        setError(null);
      } else {
        setPreviewRoom(null);
        setError('Nenhuma sala ativa encontrada com este código.');
      }
    } else {
      setPreviewRoom(null);
      setError(null);
    }
  }, [pin]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();

    const clean = pin.trim().replace(/\D/g, '');
    if (clean.length !== 6) {
      setError('O PIN deve conter exatamente 6 dígitos numéricos.');
      return;
    }

    const res = gameRoomService.joinRoomByPin(clean, {
      id: currentUser.id,
      name: currentUser.nickname || currentUser.name,
      avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      xp: currentUser.xp,
    });

    if (res.success && res.room) {
      soundEffects.playVictory();
      onJoined(res.room);
      onClose();
    } else {
      setError(res.message || 'Não foi possível entrar na sala.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 mx-auto mb-3 shadow-lg shadow-cyan-500/30">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
              <Gamepad2 className="w-7 h-7" />
            </div>
          </div>
          <h3 className="text-xl font-black text-white">Entrar em uma Sala</h3>
          <p className="text-xs text-slate-400 mt-1">
            Digite o PIN de 6 dígitos projetado pelo seu professor
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full text-center text-3xl font-mono font-black tracking-[0.4em] bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-2xl py-3.5 text-white placeholder-slate-600 outline-none"
              autoFocus
            />
          </div>

          {previewRoom && (
            <div className="p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-3">
              <span className="text-2xl">
                {previewRoom.gameType === 'stop' ? '🛑' : previewRoom.gameType === 'quiz' ? '🧠' : '🎮'}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  Sala Localizada!
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {previewRoom.title}
                </p>
                <p className="text-[11px] text-slate-300">
                  Prof. {previewRoom.teacherName} • {previewRoom.participants.length} jogadores
                </p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pin.trim().length !== 6}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-xs shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer"
          >
            <span>Confirmar Entrada</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
