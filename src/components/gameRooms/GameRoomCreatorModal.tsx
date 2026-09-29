import React, { useState } from 'react';
import {
  X,
  Plus,
  Sparkles,
  Gamepad2,
  Clock,
  Users,
  CheckCircle2,
  Brain,
  HelpCircle,
} from 'lucide-react';
import { GameRoom, gameRoomService, TECH_STOP_CATEGORIES } from '../../services/gameRoomService';
import { GameRoomType } from '../../types';
import { soundEffects } from '../../utils/soundEffects';

interface GameRoomCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  classes: Array<{ id: string; name: string }>;
  onRoomCreated: (room: GameRoom) => void;
}

export const GameRoomCreatorModal: React.FC<GameRoomCreatorModalProps> = ({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  classes,
  onRoomCreated,
}) => {
  const [gameType, setGameType] = useState<GameRoomType>('stop');
  const [title, setTitle] = useState('Desafio Tecnológico de Informática');
  const [classId, setClassId] = useState(classes[0]?.id || 'turma-1');
  const [durationSec, setDurationSec] = useState(60);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playVictory();

    const selectedClass = classes.find((c) => c.id === classId);
    const className = selectedClass ? selectedClass.name : 'Turma Alpha';

    const newRoom = gameRoomService.createRoom({
      title: title.trim() || 'Nova Sala de Jogos',
      gameType,
      classId,
      className,
      teacherId,
      teacherName,
      durationSec,
      stopCategories: TECH_STOP_CATEGORIES,
    });

    onRoomCreated(newRoom);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-cyan-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Criar Nova Sala Multiplayer</h2>
              <p className="text-xs text-slate-400">Gere um código PIN de 6 dígitos para os alunos entrarem</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Game Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Escolha o Jogo da Partida
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setGameType('stop');
                  setTitle('Super Stop de Informática');
                  setDurationSec(60);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gameType === 'stop'
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-2xl mb-1">🛑</div>
                <div className="font-extrabold text-sm text-white">Adedonha / Stop</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Letras sorteadas, categorias tech e botão STOP!
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setGameType('quiz');
                  setTitle('Quiz Relâmpago de Informática');
                  setDurationSec(25);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gameType === 'quiz'
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-2xl mb-1">🧠</div>
                <div className="font-extrabold text-sm text-white">Quiz Competitivo</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Perguntas de múltipla escolha sincronizadas ao vivo.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setGameType('memory');
                  setTitle('Desafio de Memória: Conceitos de TI');
                  setDurationSec(45);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gameType === 'memory'
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-2xl mb-1">🃏</div>
                <div className="font-extrabold text-sm text-white">Jogo da Memória</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pares de conceitos fundamentais de hardware e redes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setGameType('hangman');
                  setTitle('Forca de Palavras de Informática');
                  setDurationSec(45);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  gameType === 'hangman'
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-500/20'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-2xl mb-1">🔤</div>
                <div className="font-extrabold text-sm text-white">Forca Tecnológica</div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Adivinhe o termo misterioso com dicas didáticas.
                </p>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Título da Sala
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-cyan-400 outline-none"
              placeholder="Ex: Revisão de Atalhos e Componentes"
              required
            />
          </div>

          {/* Turma & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Turma Destino
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-400 outline-none"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tempo por Rodada (Segundos)
              </label>
              <input
                type="number"
                min={15}
                max={180}
                value={durationSec}
                onChange={(e) => setDurationSec(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:border-cyan-400 outline-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-cyan-500/25 transition-transform hover:scale-[1.02] cursor-pointer"
            >
              Gerar PIN e Abrir Sala
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
