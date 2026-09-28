import { MusicTrackDefinition, MusicCategoryId, RoomAudioConfig } from '../types';

export interface CategoryInfo {
  id: MusicCategoryId;
  label: string;
  icon: string;
}

export const MUSIC_CATEGORIES: CategoryInfo[] = [
  { id: 'relaxing', label: 'Relaxante', icon: '🎧' },
  { id: 'arcade', label: 'Game/Arcade', icon: '🎮' },
  { id: 'energy', label: 'Energia', icon: '⚡' },
  { id: 'cheerful', label: 'Alegre', icon: '🎉' },
  { id: 'suspense', label: 'Suspense', icon: '🎭' },
  { id: 'tech', label: 'Tecnologia', icon: '🚀' },
  { id: 'focus', label: 'Concentração', icon: '📚' },
  { id: 'instrumental', label: 'Instrumental', icon: '🎼' },
  { id: 'none', label: 'Sem música', icon: '🔇' },
];

export const DEFAULT_MUSIC_TRACKS: MusicTrackDefinition[] = [
  {
    id: 'track-relaxing',
    title: 'Lofi Zen Garden',
    category: 'relaxing',
    categoryLabel: 'Relaxante',
    categoryIcon: '🎧',
    description: 'Pads harmônicos suaves, ondas meditativas e acordes calmos para estudo sereno.',
    bpm: 72,
    isSynthesized: true,
  },
  {
    id: 'track-arcade',
    title: '8-Bit Chiptune Quest',
    category: 'arcade',
    categoryLabel: 'Game/Arcade',
    categoryIcon: '🎮',
    description: 'Ritmo nostálgico retrô de 8-bit com arpejos quadrados e energia clássica de fliperama.',
    bpm: 130,
    isSynthesized: true,
  },
  {
    id: 'track-energy',
    title: 'Electro Pulse',
    category: 'energy',
    categoryLabel: 'Energia',
    categoryIcon: '⚡',
    description: 'Batida pulsante de alta dinâmica para desafios rápidos e adrenalina em equipe.',
    bpm: 126,
    isSynthesized: true,
  },
  {
    id: 'track-cheerful',
    title: 'Festa dos Bits',
    category: 'cheerful',
    categoryLabel: 'Alegre',
    categoryIcon: '🎉',
    description: 'Melodia festiva e saltitante em escala maior com sinos limpos e clima celebrativo.',
    bpm: 118,
    isSynthesized: true,
  },
  {
    id: 'track-suspense',
    title: 'Mistério Profundo',
    category: 'suspense',
    categoryLabel: 'Suspense',
    categoryIcon: '🎭',
    description: 'Drones cinematográficos graves e tensão progressiva para momentos de decisão.',
    bpm: 60,
    isSynthesized: true,
  },
  {
    id: 'track-tech',
    title: 'Cyber Grid',
    category: 'tech',
    categoryLabel: 'Tecnologia',
    categoryIcon: '🚀',
    description: 'Arpejos futuristas synthwave e texturas digitais inspiradas na cultura hacker.',
    bpm: 120,
    isSynthesized: true,
  },
  {
    id: 'track-focus',
    title: 'Foco Produtivo',
    category: 'focus',
    categoryLabel: 'Concentração',
    categoryIcon: '📚',
    description: 'Frequências harmônicas suaves e neutras para máxima retenção de conteúdo sem distrações.',
    bpm: 65,
    isSynthesized: true,
  },
  {
    id: 'track-instrumental',
    title: 'Acústico Serenata',
    category: 'instrumental',
    categoryLabel: 'Instrumental',
    categoryIcon: '🎼',
    description: 'Dedilhado acústico harmônico e melodia clássica suave com reverberação acolhedora.',
    bpm: 84,
    isSynthesized: true,
  },
  {
    id: 'track-none',
    title: 'Sem Música (Apenas Efeitos)',
    category: 'none',
    categoryLabel: 'Sem música',
    categoryIcon: '🔇',
    description: 'Ambiente silencioso durante as perguntas, executando apenas os efeitos sonoros.',
    bpm: 0,
    isSynthesized: true,
  },
];

export const DEFAULT_ROOM_AUDIO_CONFIG: RoomAudioConfig = {
  musicEnabled: true,
  selectedTrackId: 'track-arcade',
  trackCategory: 'arcade',
  trackTitle: '8-Bit Chiptune Quest',
  volume: 0.5,
  effectsEnabled: true,
};
