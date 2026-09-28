import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Volume2,
  VolumeX,
  Volume1,
  Play,
  Pause,
  Upload,
  Trash2,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
  Sliders,
  Radio,
  FileAudio,
  Info,
} from 'lucide-react';
import {
  RoomAudioConfig,
  MusicCategoryId,
  MusicTrackDefinition,
  CustomUploadedTrack,
} from '../../types';
import {
  MUSIC_CATEGORIES,
  DEFAULT_MUSIC_TRACKS,
} from '../../utils/audioLibrary';
import { soundEffects } from '../../utils/soundEffects';

interface RoomAudioSettingsSectionProps {
  config: RoomAudioConfig;
  onChange: (updated: RoomAudioConfig) => void;
  title?: string;
  subtitle?: string;
  showSaveButton?: boolean;
  onSave?: () => void;
}

export const RoomAudioSettingsSection: React.FC<RoomAudioSettingsSectionProps> = ({
  config,
  onChange,
  title = '🎵 Música Ambiente da Atividade',
  subtitle = 'Escolha a música que será reproduzida durante a atividade.',
  showSaveButton = false,
  onSave,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePreviewId, setActivePreviewId] = useState<string | null>(
    soundEffects.getActivePreviewId()
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to preview playback state changes
  useEffect(() => {
    const unsub = soundEffects.subscribePreview((trackId) => {
      setActivePreviewId(trackId);
    });
    return () => {
      unsub();
      soundEffects.stopPreview();
    };
  }, []);

  const handleToggleMusicEnabled = () => {
    soundEffects.playClick();
    const nextState = !config.musicEnabled;
    onChange({
      ...config,
      musicEnabled: nextState,
    });
    if (!nextState && activePreviewId) {
      soundEffects.stopPreview();
    }
  };

  const handleToggleEffectsEnabled = () => {
    soundEffects.playClick();
    onChange({
      ...config,
      effectsEnabled: !config.effectsEnabled,
    });
  };

  const handleVolumeChange = (newVolume: number) => {
    onChange({
      ...config,
      volume: newVolume,
    });
  };

  const handleSelectTrack = (track: MusicTrackDefinition) => {
    soundEffects.playClick();
    onChange({
      ...config,
      selectedTrackId: track.id,
      trackCategory: track.category,
      trackTitle: track.title,
    });
  };

  const handleTogglePreview = (track: MusicTrackDefinition) => {
    soundEffects.playClick();
    if (activePreviewId === track.id) {
      soundEffects.stopPreview();
    } else {
      soundEffects.playTrackPreview(track.id);
    }
  };

  const handleCustomPreview = () => {
    soundEffects.playClick();
    if (!config.customTrack) return;
    if (activePreviewId === 'track-custom') {
      soundEffects.stopPreview();
    } else {
      soundEffects.playTrackPreview('track-custom', config.customTrack);
    }
  };

  const handleSelectCustomTrack = () => {
    if (!config.customTrack) return;
    soundEffects.playClick();
    onChange({
      ...config,
      selectedTrackId: 'track-custom',
      trackCategory: 'custom',
      trackTitle: config.customTrack.name,
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    // Validate type: mp3, wav, ogg
    const validExtensions = ['mp3', 'wav', 'ogg'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const isAudioType = file.type.startsWith('audio/') || validExtensions.includes(extension);

    if (!isAudioType) {
      setUploadError('Formato inválido. Por favor, envie arquivos em MP3, WAV ou OGG.');
      return;
    }

    // Validate size: max 15MB
    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError('O arquivo excede o limite máximo de 15 MB.');
      return;
    }

    soundEffects.playClick();
    const reader = new FileReader();
    reader.onload = () => {
      const custom: CustomUploadedTrack = {
        name: file.name,
        type: extension || 'mp3',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        dataUrl: reader.result as string,
      };

      onChange({
        ...config,
        selectedTrackId: 'track-custom',
        trackCategory: 'custom',
        trackTitle: file.name,
        customTrack: custom,
        musicEnabled: true,
      });

      soundEffects.playCorrect();
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveCustomTrack = () => {
    soundEffects.playClick();
    if (activePreviewId === 'track-custom') {
      soundEffects.stopPreview();
    }
    onChange({
      ...config,
      selectedTrackId: 'track-arcade',
      trackCategory: 'arcade',
      trackTitle: '8-Bit Chiptune Quest',
      customTrack: undefined,
    });
  };

  const handleTestDucking = () => {
    soundEffects.playCorrect();
  };

  // Filtered tracks
  const filteredTracks =
    selectedCategory === 'all'
      ? DEFAULT_MUSIC_TRACKS
      : DEFAULT_MUSIC_TRACKS.filter((t) => t.category === selectedCategory);

  const isCustomSelected = config.selectedTrackId === 'track-custom';

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-5 sm:p-7 space-y-6 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Music className="w-5 h-5" />
            </span>
            {title}
          </h3>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>

        {/* ON / OFF Switch */}
        <div className="flex items-center gap-3 bg-slate-900 px-4 py-2.5 rounded-2xl border border-slate-800">
          <span className="text-xs font-bold text-slate-300">
            {config.musicEnabled ? '🎵 Música Ativada' : '🔇 Música Desligada'}
          </span>
          <button
            type="button"
            onClick={handleToggleMusicEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
              config.musicEnabled ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.musicEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {!config.musicEnabled ? (
        <div className="p-6 bg-slate-900/60 rounded-2xl border border-dashed border-slate-800 text-center space-y-2">
          <VolumeX className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">Nenhuma música será reproduzida.</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            A atividade ocorrerá sem trilha sonora ambiente de fundo. Os efeitos sonoros das perguntas continuarão ativos conforme a configuração abaixo.
          </p>
          <button
            type="button"
            onClick={handleToggleMusicEnabled}
            className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1"
          >
            <Music className="w-3.5 h-3.5" /> Ativar música ambiente
          </button>
        </div>
      ) : (
        <>
          {/* Categorias Tabs */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Categorias Musicais
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-800">
              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedCategory('all');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                ✨ Todas as Músicas
              </button>
              {MUSIC_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playClick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredTracks.map((track) => {
              const isSelected = config.selectedTrackId === track.id;
              const isPreviewing = activePreviewId === track.id;

              return (
                <div
                  key={track.id}
                  className={`rounded-2xl p-4 transition-all border flex flex-col justify-between relative group ${
                    isSelected
                      ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Top Row: Category + BPM */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[11px] font-bold text-indigo-300/90 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-1">
                        <span>{track.categoryIcon}</span>
                        <span>{track.categoryLabel}</span>
                      </span>

                      {track.bpm && track.bpm > 0 ? (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                          {track.bpm} BPM
                        </span>
                      ) : null}
                    </div>

                    {/* Title & Description */}
                    <h4 className="text-sm font-black text-white flex items-center gap-1.5">
                      🎵 {track.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {track.description}
                    </p>
                  </div>

                  {/* Actions Row */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {/* Preview Button */}
                    {track.category !== 'none' ? (
                      <button
                        type="button"
                        onClick={() => handleTogglePreview(track)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                          isPreviewing
                            ? 'bg-amber-500 text-slate-950 animate-pulse shadow-md shadow-amber-500/30 font-black'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isPreviewing ? (
                          <>
                            <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" /> Ouvir prévia
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">Mudo</span>
                    )}

                    {/* Select Button */}
                    {isSelected ? (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Selecionada
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectTrack(track)}
                        className="text-xs font-bold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-500/30 transition-all cursor-pointer"
                      >
                        Selecionar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section: Upload de música própria */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  + Adicionar minha música
                </h4>
                <p className="text-xs text-slate-400">
                  Envie sua própria trilha sonora para a atividade. Formatos recomendados:{' '}
                  <strong className="text-slate-300">MP3, WAV ou OGG</strong> (máx. 15 MB).
                </p>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mp3,audio/wav,audio/ogg,audio/mpeg,.mp3,.wav,.ogg"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="custom-music-file-upload"
                />
                <label
                  htmlFor="custom-music-file-upload"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-cyan-500/20 inline-flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Selecionar Arquivo
                </label>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Custom Track Card if present */}
            {config.customTrack && (
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isCustomSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 ring-1 ring-cyan-500/30'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FileAudio className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                        Minha Música
                      </span>
                      <span className="text-[10px] text-slate-400">({config.customTrack.size})</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5 break-all">
                      {config.customTrack.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCustomPreview}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                      activePreviewId === 'track-custom'
                        ? 'bg-amber-500 text-slate-950 animate-pulse font-black'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {activePreviewId === 'track-custom' ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> Ouvir
                      </>
                    )}
                  </button>

                  {isCustomSelected ? (
                    <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Usando nesta atividade
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSelectCustomTrack}
                      className="text-xs font-bold text-cyan-300 hover:text-white bg-cyan-500/20 hover:bg-cyan-600 px-3 py-1.5 rounded-xl border border-cyan-500/30 transition-all cursor-pointer"
                    >
                      ✓ Usar nesta atividade
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleRemoveCustomTrack}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Remover música"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Copyright Disclaimer */}
            <div className="flex items-center gap-2 text-xs text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-xl">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Aviso de Direitos Autorais:</strong> Use apenas músicas que você tenha autorização para utilizar. A biblioteca padrão da plataforma utiliza apenas composições royalty-free e licenciadas.
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Volume da Música da Atividade
              </span>
              <span className="text-sm font-mono font-black text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                {Math.round(config.volume * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleVolumeChange(0)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <VolumeX className="w-4 h-4" />
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />

              <button
                type="button"
                onClick={() => handleVolumeChange(1)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Independent Sound Effects Toggle & Ducking Info */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                config.effectsEnabled
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                🔊 Efeitos Sonoros das Perguntas
              </span>
              <span className="text-xs text-slate-400">
                Suspense, Acerto (+100 XP), Erro, Contagem regressiva, Vitória e Ultrapassagens no ranking
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleEffectsEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                config.effectsEnabled ? 'bg-emerald-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.effectsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {config.effectsEnabled && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <strong>Sistema de Ducking Ativo:</strong> O volume da música reduz automaticamente ao tocar efeitos para manter a clareza sonora.
            </span>
            <button
              type="button"
              onClick={handleTestDucking}
              className="text-xs font-bold text-cyan-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              🔊 Testar Som
            </button>
          </div>
        )}
      </div>

      {showSaveButton && onSave && (
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" /> Salvar Configuração de Áudio
          </button>
        </div>
      )}
    </div>
  );
};
