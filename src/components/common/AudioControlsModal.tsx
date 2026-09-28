import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Sliders,
  X,
  Check,
  Play,
  Pause,
  Sparkles,
  Zap,
} from 'lucide-react';
import { soundEffects } from '../../utils/soundEffects';
import { AudioSettings, MusicTrackDefinition } from '../../types';
import { DEFAULT_MUSIC_TRACKS, MUSIC_CATEGORIES } from '../../utils/audioLibrary';

interface AudioControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioControlsModal: React.FC<AudioControlsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<AudioSettings>(soundEffects.getSettings());
  const [activePreviewId, setActivePreviewId] = useState<string | null>(
    soundEffects.getActivePreviewId()
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      setSettings(soundEffects.getSettings());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = soundEffects.subscribePreview((trackId) => {
      setActivePreviewId(trackId);
    });
    return () => {
      unsub();
      soundEffects.stopPreview();
    };
  }, []);

  if (!isOpen) return null;

  const handleToggleEffects = () => {
    const updated = soundEffects.saveSettings({
      interfaceSoundsEnabled: !settings.interfaceSoundsEnabled,
    });
    setSettings(updated);
    if (updated.interfaceSoundsEnabled) {
      soundEffects.playClick();
    }
  };

  const handleToggleMusic = () => {
    const nextState = !settings.musicEnabled;
    const updated = soundEffects.saveSettings({
      musicEnabled: nextState,
    });
    setSettings(updated);
    if (!nextState && activePreviewId) {
      soundEffects.stopPreview();
    }
  };

  const handleEffectsVolume = (val: number) => {
    const updated = soundEffects.saveSettings({
      effectsVolume: val,
    });
    setSettings(updated);
  };

  const handleMusicVolume = (val: number) => {
    const updated = soundEffects.saveSettings({
      musicVolume: val,
    });
    setSettings(updated);
  };

  const handleSelectTrack = (track: MusicTrackDefinition) => {
    soundEffects.playClick();
    const updated = soundEffects.saveSettings({
      selectedTrackId: track.id,
      musicEnabled: true,
    });
    setSettings(updated);
  };

  const handleTogglePreview = (track: MusicTrackDefinition) => {
    soundEffects.playClick();
    if (activePreviewId === track.id) {
      soundEffects.stopPreview();
    } else {
      soundEffects.playTrackPreview(track.id);
    }
  };

  const handleTestSound = () => {
    soundEffects.playClick(100);
    setTimeout(() => soundEffects.playCorrect(), 150);
  };

  const filteredTracks =
    selectedCategory === 'all'
      ? DEFAULT_MUSIC_TRACKS
      : DEFAULT_MUSIC_TRACKS.filter((t) => t.category === selectedCategory);

  const currentTrack = DEFAULT_MUSIC_TRACKS.find(
    (t) => t.id === (settings.selectedTrackId || 'track-arcade')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Áudio & Biblioteca Musical</h3>
              <p className="text-xs text-slate-400">Personalize sons da interface e trilhas musicais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Interface Sounds Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  settings.interfaceSoundsEnabled
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {settings.interfaceSoundsEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Sons da Interface</span>
                <span className="text-xs text-slate-400">
                  Clicks sutis e efeitos ao tocar em botões e cards
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleEffects}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                settings.interfaceSoundsEnabled ? 'bg-blue-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.interfaceSoundsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Effects Volume Slider */}
          {settings.interfaceSoundsEnabled && (
            <div className="space-y-2 px-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Volume dos Efeitos Sonoros</span>
                <span className="text-cyan-400 font-mono">
                  {Math.round(settings.effectsVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.effectsVolume}
                onChange={(e) => handleEffectsVolume(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          )}

          {/* Ambient Music Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl ${
                  settings.musicEnabled
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                <Music className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Música Ambiente</span>
                <span className="text-xs text-slate-400">
                  {settings.musicEnabled && currentTrack
                    ? `Trilha ativa: ${currentTrack.title} (${currentTrack.categoryLabel})`
                    : 'Nenhuma música será reproduzida'}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleMusic}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                settings.musicEnabled ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.musicEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Music Volume Slider */}
          {settings.musicEnabled && (
            <div className="space-y-2 px-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Volume da Música</span>
                <span className="text-purple-400 font-mono">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleMusicVolume(parseFloat(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          )}

          {/* Track Library Selector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Biblioteca de Trilhas
              </span>
              <span className="text-[11px] text-slate-400">
                Escolha o estilo que combina com você
              </span>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todas
              </button>
              {MUSIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Cards List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-1">
              {filteredTracks.map((track) => {
                const isSelected =
                  (settings.selectedTrackId || 'track-arcade') === track.id;
                const isPreviewing = activePreviewId === track.id;

                return (
                  <div
                    key={track.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-sm ring-1 ring-indigo-500/30'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">{track.categoryIcon}</span>
                        <span className="text-[11px] font-bold text-indigo-300 truncate">
                          {track.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{track.description}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {track.category !== 'none' && (
                        <button
                          type="button"
                          onClick={() => handleTogglePreview(track)}
                          className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                            isPreviewing
                              ? 'bg-amber-500 text-slate-950 animate-pulse'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Ouvir prévia"
                        >
                          {isPreviewing ? (
                            <Pause className="w-3.5 h-3.5 fill-current" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                        </button>
                      )}

                      {isSelected ? (
                        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectTrack(track)}
                          className="px-2.5 py-1 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-600 text-indigo-300 hover:text-white rounded-lg border border-indigo-500/20 transition-colors"
                        >
                          Usar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Sound & Footer */}
          <div className="pt-2 flex justify-between items-center border-t border-slate-800/80">
            <button
              onClick={handleTestSound}
              className="text-xs text-slate-400 hover:text-cyan-300 font-medium py-1.5 px-3 rounded-xl border border-slate-800 hover:border-cyan-500/30 transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> Testar Som Suave
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Pronto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
