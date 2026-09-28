import React, { useState } from 'react';
import { AVATAR_PRESETS, getAvatarSvgDataUri, AvatarPreset } from '../../data/avatars';
import { X, Check, Sparkles, Shield, User } from 'lucide-react';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarId: string;
  onSaveAvatar: (avatarId: string) => Promise<void> | void;
}

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  isOpen,
  onClose,
  currentAvatarId,
  onSaveAvatar,
}) => {
  const [selectedId, setSelectedId] = useState<string>(currentAvatarId || 'avatar-gamer');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const activePreset: AvatarPreset =
    AVATAR_PRESETS.find((p) => p.id === selectedId) || AVATAR_PRESETS[0];

  const handleConfirm = async () => {
    try {
      setIsSaving(true);
      await onSaveAvatar(selectedId);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar avatar:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/20 text-cyan-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Escolha seu Avatar
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                  GAMEINFOR
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecione uma identidade visual oficial para seu perfil e ranking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Preview Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center gap-4">
            <img
              src={getAvatarSvgDataUri(activePreset.id)}
              alt={activePreset.name}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cyan-400/50 shadow-lg"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{activePreset.name}</span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {activePreset.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activePreset.description}</p>
            </div>
          </div>

          {/* Avatar Grid */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Catálogo Disponível ({AVATAR_PRESETS.length} personagens)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = selectedId === preset.id;
                const isCurrent = currentAvatarId === preset.id;

                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedId(preset.id)}
                    type="button"
                    className={`relative p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 group cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-cyan-400 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-950/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    {/* Badge Indicator */}
                    {isCurrent && (
                      <span className="absolute top-2 left-2 text-[9px] font-bold bg-slate-800/90 text-cyan-300 border border-slate-700 px-1.5 py-0.5 rounded-md">
                        Atual
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <img
                      src={getAvatarSvgDataUri(preset.id)}
                      alt={preset.name}
                      className="w-14 h-14 rounded-xl object-cover transition-transform group-hover:scale-105"
                    />

                    <div>
                      <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-400">{preset.category}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Salvo com segurança no seu perfil</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSaving}
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Salvar Avatar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
