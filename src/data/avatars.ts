export interface AvatarPreset {
  id: string;
  name: string;
  category: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  iconName: string;
  emoji: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'avatar-gamer',
    name: 'Pro Gamer',
    category: 'Games',
    description: 'Focado em estratégia, agilidade e altos scores.',
    primaryColor: '#8b5cf6',
    secondaryColor: '#3b82f6',
    accentColor: '#06b6d4',
    iconName: 'Gamepad2',
    emoji: '🎮',
  },
  {
    id: 'avatar-ninja',
    name: 'Cyber Ninja',
    category: 'Ação',
    description: 'Rápido, silencioso e mestre nas teclas de atalho.',
    primaryColor: '#ef4444',
    secondaryColor: '#1e1b4b',
    accentColor: '#f97316',
    iconName: 'Zap',
    emoji: '🥷',
  },
  {
    id: 'avatar-programador',
    name: 'Dev Full-Stack',
    category: 'Tecnologia',
    description: 'Transforma café e lógica em sistemas incríveis.',
    primaryColor: '#10b981',
    secondaryColor: '#064e3b',
    accentColor: '#34d399',
    iconName: 'Code2',
    emoji: '💻',
  },
  {
    id: 'avatar-astronauta',
    name: 'Cosmonauta Tech',
    category: 'Exploração',
    description: 'Explorando novas fronteiras no universo digital.',
    primaryColor: '#0284c7',
    secondaryColor: '#172554',
    accentColor: '#38bdf8',
    iconName: 'Rocket',
    emoji: '🚀',
  },
  {
    id: 'avatar-robot',
    name: 'Androide IA',
    category: 'Futuro',
    description: 'Processamento veloz e inteligência algorítmica.',
    primaryColor: '#06b6d4',
    secondaryColor: '#0f172a',
    accentColor: '#a855f7',
    iconName: 'Bot',
    emoji: '🤖',
  },
  {
    id: 'avatar-tecnologia',
    name: 'Engenheiro de Hardware',
    category: 'Tecnologia',
    description: 'Domina circuitos, placas e arquitetura de computadores.',
    primaryColor: '#f59e0b',
    secondaryColor: '#451a03',
    accentColor: '#fbbf24',
    iconName: 'Cpu',
    emoji: '⚡',
  },
  {
    id: 'avatar-cientista',
    name: 'Cientista de Dados',
    category: 'Ciência',
    description: 'Curioso, analítico e apaixonado por descobertas.',
    primaryColor: '#6366f1',
    secondaryColor: '#312e81',
    accentColor: '#818cf8',
    iconName: 'Atom',
    emoji: '🔬',
  },
  {
    id: 'avatar-artista',
    name: 'Designer Criativo',
    category: 'Arte & UI',
    description: 'Harmoniza cores, vetores e experiências visuais.',
    primaryColor: '#ec4899',
    secondaryColor: '#831843',
    accentColor: '#f472b6',
    iconName: 'Palette',
    emoji: '🎨',
  },
  {
    id: 'avatar-aventureiro',
    name: 'Explorador Digital',
    category: 'Aventura',
    description: 'Descobre novos conhecimentos em cada desafio.',
    primaryColor: '#14b8a6',
    secondaryColor: '#134e4a',
    accentColor: '#2dd4bf',
    iconName: 'Compass',
    emoji: '🧭',
  },
  {
    id: 'avatar-esportista',
    name: 'Atleta E-Sports',
    category: 'Competição',
    description: 'Determinação, trabalho em equipe e busca pela vitória.',
    primaryColor: '#eab308',
    secondaryColor: '#713f12',
    accentColor: '#fef08a',
    iconName: 'Trophy',
    emoji: '🏆',
  },
  {
    id: 'avatar-mago',
    name: 'Mago do Código',
    category: 'Fantasia',
    description: 'Faz códigos funcionarem como pura mágica.',
    primaryColor: '#a855f7',
    secondaryColor: '#3b0764',
    accentColor: '#c084fc',
    iconName: 'Sparkles',
    emoji: '🧙‍♂️',
  },
  {
    id: 'avatar-hacker',
    name: 'Especialista Cyber',
    category: 'Segurança',
    description: 'Protegendo dados e sistemas contra ameaças virtuais.',
    primaryColor: '#22c55e',
    secondaryColor: '#052e16',
    accentColor: '#86efac',
    iconName: 'Terminal',
    emoji: '🛡️',
  },
];

/**
 * Generates an SVG Data URI for an avatar preset so it can be rendered anywhere as an <img> src.
 */
export function getAvatarSvgDataUri(avatarId: string): string {
  const preset = AVATAR_PRESETS.find((p) => p.id === avatarId) || AVATAR_PRESETS[0];

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="grad-${preset.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${preset.primaryColor}" />
      <stop offset="100%" stop-color="${preset.secondaryColor}" />
    </linearGradient>
    <radialGradient id="glow-${preset.id}" cx="50%" cy="30%" r="70%">
      <stop offset="0%" stop-color="${preset.accentColor}" stop-opacity="0.5" />
      <stop offset="100%" stop-color="${preset.secondaryColor}" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow-${preset.id}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
    </filter>
  </defs>
  
  <!-- Outer Background Ring -->
  <rect width="120" height="120" rx="30" fill="url(#grad-${preset.id})" />
  <rect width="120" height="120" rx="30" fill="url(#glow-${preset.id})" />
  
  <!-- Inner Border Accent -->
  <rect x="4" y="4" width="112" height="112" rx="26" fill="none" stroke="${preset.accentColor}" stroke-opacity="0.4" stroke-width="2" />
  
  <!-- Central Badge Disc -->
  <circle cx="60" cy="58" r="38" fill="#0f172a" fill-opacity="0.55" stroke="${preset.accentColor}" stroke-width="2" filter="url(#shadow-${preset.id})" />
  
  <!-- Stylized Emoji / Icon Representation -->
  <text x="60" y="69" font-size="40" text-anchor="middle" dominant-baseline="middle" font-family="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif">
    ${preset.emoji}
  </text>
  
  <!-- Bottom Name Banner Ribbon -->
  <rect x="18" y="94" width="84" height="18" rx="9" fill="#020617" fill-opacity="0.85" stroke="${preset.accentColor}" stroke-opacity="0.5" stroke-width="1" />
  <text x="60" y="106" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, sans-serif" letter-spacing="0.5">
    ${preset.name.toUpperCase()}
  </text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function getAvatarPreset(avatarId?: string): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === avatarId) || AVATAR_PRESETS[0];
}
