import React, { useState, useEffect } from 'react';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Square,
  RotateCcw,
  Check,
  Sparkles,
  Radio,
  Sliders,
  AlertCircle,
  Lock,
  Headphones,
  Zap,
} from 'lucide-react';
import {
  nexusVoiceService,
  NexusVoiceOption,
  NexusVoiceSettings,
} from '../../services/nexusVoiceService';
import { soundEffects } from '../../utils/soundEffects';

interface NexusVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepeatLastResponse?: () => void;
}

export const NexusVoiceSettingsModal: React.FC<NexusVoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  onRepeatLastResponse,
}) => {
  const [settings, setSettings] = useState<NexusVoiceSettings>(() =>
    nexusVoiceService.getSettings()
  );
  const [voices, setVoices] = useState<NexusVoiceOption[]>(() =>
    nexusVoiceService.getAvailableVoices()
  );
  const [testingVoiceId, setTestingVoiceId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = nexusVoiceService.subscribe((updated) => {
      setSettings(updated);
      setVoices(nexusVoiceService.getAvailableVoices());
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleSelectVoice = (voiceId: string) => {
    soundEffects.playClick();
    nexusVoiceService.updateSettings({ selectedVoiceId: voiceId });
  };

  const handleTestVoice = (voiceId: string) => {
    soundEffects.playClick();
    setTestingVoiceId(voiceId);
    nexusVoiceService.testVoice(
      voiceId,
      () => {},
      () => setTestingVoiceId(null)
    );
  };

  const handleToggleSpeech = () => {
    soundEffects.playClick();
    nexusVoiceService.updateSettings({ speechEnabled: !settings.speechEnabled });
  };

  const handleVolumeChange = (vol: number) => {
    nexusVoiceService.updateSettings({ volume: vol });
  };

  const handleRateChange = (rate: number) => {
    soundEffects.playClick();
    nexusVoiceService.updateSettings({ rate });
  };

  const handleResetDefault = () => {
    soundEffects.playClick();
    nexusVoiceService.resetToDefault();
  };

  const handleStopSpeaking = () => {
    soundEffects.playClick();
    nexusVoiceService.stopSpeaking();
    setTestingVoiceId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-7 max-w-xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -left-20 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-md shadow-cyan-500/30">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                <Headphones className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Vozes do NEXUS</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Síntese Vocal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Escolha a voz do assistente e ajuste as preferências de áudio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 relative z-10 text-xs">
          {/* Quick Audio Controls Section */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="font-extrabold text-white text-xs">Controles de Reprodução</span>
              </div>
              <button
                onClick={handleToggleSpeech}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 transition-all ${
                  settings.speechEnabled
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {settings.speechEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{settings.speechEnabled ? 'Fala Ativada' : 'Mudo (Somente Texto)'}</span>
              </button>
            </div>

            {/* Volume Slider */}
            <div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1 font-semibold">
                <span>Volume de Saída</span>
                <span className="text-cyan-400 font-mono font-bold">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.volume}
                disabled={!settings.speechEnabled}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
              />
            </div>

            {/* Speed Rate Buttons */}
            <div>
              <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1.5 font-semibold">
                <span>Velocidade da Fala</span>
                <span className="text-cyan-400 font-mono font-bold">{settings.rate}x</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[0.85, 1.0, 1.15, 1.3].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleRateChange(r)}
                    className={`py-1.5 rounded-xl font-bold text-[11px] border transition-all ${
                      settings.rate === r
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {r === 1.0 ? '1.0x (Normal)' : `${r}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* Global Stop / Repeat Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
              <button
                onClick={handleStopSpeaking}
                className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Interromper Fala</span>
              </button>
              {onRepeatLastResponse && (
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    onRepeatLastResponse();
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-cyan-950 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Repetir Última Resposta</span>
                </button>
              )}
            </div>
          </div>

          {/* Voice List Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Catálogo de Vozes Disponíveis
              </span>
              <button
                onClick={handleResetDefault}
                className="text-[11px] text-slate-400 hover:text-cyan-400 font-semibold transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Voz Padrão</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {voices.map((voice) => {
                const isSelected = settings.selectedVoiceId === voice.id;
                const isTesting = testingVoiceId === voice.id;

                return (
                  <div
                    key={voice.id}
                    onClick={() => {
                      if (voice.isAvailable) handleSelectVoice(voice.id);
                    }}
                    className={`p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/80 shadow-lg shadow-cyan-950/50'
                        : voice.isAvailable
                        ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 cursor-pointer'
                        : 'bg-slate-950/30 border-slate-850 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-extrabold text-sm text-white truncate">
                            {voice.name}
                          </span>
                          {voice.category === 'nexus_original' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Oficial do Robô
                            </span>
                          )}
                          {voice.category === 'gemini_live' && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              Gemini Live
                            </span>
                          )}
                          {!voice.isAvailable && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Em Homologação
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                          {voice.description}
                        </p>

                        {voice.statusNote && (
                          <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-[10px] text-amber-300 flex items-center gap-1.5 mb-2">
                            <AlertCircle className="w-3 h-3 shrink-0 text-amber-400" />
                            <span>{voice.statusNote}</span>
                          </div>
                        )}
                      </div>

                      {/* Select / Active Badge & Test Button */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {voice.isAvailable ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTestVoice(voice.id);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                                isTesting
                                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 animate-pulse'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              }`}
                              title="Ouvir demonstração desta voz"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>{isTesting ? 'Ouvindo...' : 'Amostra'}</span>
                            </button>

                            {isSelected && (
                              <span className="text-[10px] font-black text-cyan-400 flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Voz Ativa
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Indisponível
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between relative z-10">
          <span className="text-[11px] text-slate-500">
            Preferências salvas automaticamente no dispositivo.
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
