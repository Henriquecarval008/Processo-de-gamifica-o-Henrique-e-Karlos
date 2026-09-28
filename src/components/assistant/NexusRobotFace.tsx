import React, { useEffect, useState } from 'react';
import { NexusEmotion } from '../../types';

export type NexusFaceStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

interface NexusRobotFaceProps {
  status: NexusFaceStatus;
  emotion?: NexusEmotion;
  inputAudioLevel?: number; // 0.0 to 1.0 (microphone voice intensity)
  outputAudioLevel?: number; // 0.0 to 1.0 (assistant speech audio intensity)
  className?: string;
}

export const NexusRobotFace: React.FC<NexusRobotFaceProps> = ({
  status,
  emotion = 'neutro',
  inputAudioLevel = 0,
  outputAudioLevel = 0,
  className = '',
}) => {
  // Simulated organic blinking
  const [isBlinking, setIsBlinking] = useState(false);
  // Micro speech wave tick for mouth movement when speaking
  const [speechTick, setSpeechTick] = useState(0);

  // Organic blink timer (every 4-6 seconds)
  useEffect(() => {
    let timeoutId: any;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        const nextTime = Math.random() * 2500 + 3500;
        timeoutId = setTimeout(triggerBlink, nextTime);
      }, 180);
    };

    timeoutId = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Speech rhythm animation loop
  useEffect(() => {
    if (status !== 'speaking') return;
    const interval = setInterval(() => {
      setSpeechTick((prev) => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, [status]);

  // Normalized reactive values
  const clampedInput = Math.min(Math.max(inputAudioLevel, 0), 1);
  const clampedOutput = Math.min(Math.max(outputAudioLevel, 0), 1);

  // Dynamic colors based on assistant status
  const baseTheme = {
    idle: {
      primary: '#06b6d4', // cyan-500
      secondary: '#0284c7', // sky-600
      accent: '#38bdf8', // sky-400
      glow: 'rgba(6, 182, 212, 0.45)',
      eyeColor: '#22d3ee',
      plateStroke: '#0e7490',
      statusText: 'NEXUS está aguardando...',
    },
    connecting: {
      primary: '#38bdf8',
      secondary: '#2563eb',
      accent: '#60a5fa',
      glow: 'rgba(56, 189, 248, 0.55)',
      eyeColor: '#67e8f9',
      plateStroke: '#0284c7',
      statusText: 'NEXUS está conectando...',
    },
    listening: {
      primary: '#10b981', // emerald-500
      secondary: '#06b6d4', // cyan-500
      accent: '#34d399',
      glow: 'rgba(16, 185, 129, 0.65)',
      eyeColor: '#6ee7b7',
      plateStroke: '#059669',
      statusText: 'NEXUS está ouvindo...',
    },
    thinking: {
      primary: '#a855f7', // purple-500
      secondary: '#6366f1', // indigo-500
      accent: '#c084fc',
      glow: 'rgba(168, 85, 247, 0.6)',
      eyeColor: '#e9d5ff',
      plateStroke: '#9333ea',
      statusText: 'NEXUS está pensando...',
    },
    speaking: {
      primary: '#06b6d4', // vibrant cyan
      secondary: '#3b82f6', // blue
      accent: '#67e8f9',
      glow: 'rgba(6, 182, 212, 0.85)',
      eyeColor: '#a5f3fc',
      plateStroke: '#0891b2',
      statusText: 'NEXUS está falando...',
    },
    error: {
      primary: '#f43f5e', // rose-500
      secondary: '#e11d48',
      accent: '#fb7185',
      glow: 'rgba(244, 63, 94, 0.4)',
      eyeColor: '#fda4af',
      plateStroke: '#be123c',
      statusText: 'NEXUS encontrou um problema de conexão.',
    },
  }[status];

  // Specific emotional state styling
  const emotionMeta = {
    alegria: {
      label: 'Alegria & Sucesso',
      icon: '✨',
      eyeOverride: '#38bdf8',
      glowOverride: 'rgba(251, 191, 36, 0.45)',
    },
    empatia: {
      label: 'Empatia & Acolhimento',
      icon: '🤝',
      eyeOverride: '#2dd4bf',
      glowOverride: 'rgba(45, 212, 191, 0.4)',
    },
    motivacao: {
      label: 'Motivação & Energia',
      icon: '⚡',
      eyeOverride: '#60a5fa',
      glowOverride: 'rgba(96, 165, 250, 0.45)',
    },
    curiosidade: {
      label: 'Curiosidade',
      icon: '💡',
      eyeOverride: '#818cf8',
      glowOverride: 'rgba(129, 140, 248, 0.4)',
    },
    atencao: {
      label: 'Atenção Total',
      icon: '🎯',
      eyeOverride: '#34d399',
      glowOverride: 'rgba(52, 211, 153, 0.45)',
    },
    processamento: {
      label: 'Processamento',
      icon: '🧠',
      eyeOverride: '#c084fc',
      glowOverride: 'rgba(192, 132, 252, 0.5)',
    },
    seriedade: {
      label: 'Segurança & Seriedade',
      icon: '🛡️',
      eyeOverride: '#38bdf8',
      glowOverride: 'rgba(14, 116, 144, 0.45)',
    },
    surpresa: {
      label: 'Surpresa Moderada',
      icon: '😲',
      eyeOverride: '#f59e0b',
      glowOverride: 'rgba(245, 158, 11, 0.5)',
    },
    concentracao: {
      label: 'Concentração & Foco',
      icon: '🧐',
      eyeOverride: '#818cf8',
      glowOverride: 'rgba(129, 140, 248, 0.45)',
    },
    satisfacao: {
      label: 'Satisfação & Sucesso',
      icon: '😊',
      eyeOverride: '#10b981',
      glowOverride: 'rgba(16, 185, 129, 0.5)',
    },
    neutro: {
      label: '',
      icon: '',
      eyeOverride: null,
      glowOverride: null,
    },
  }[emotion];

  const theme = {
    ...baseTheme,
    eyeColor: emotionMeta.eyeOverride || baseTheme.eyeColor,
    glow: emotionMeta.glowOverride || baseTheme.glow,
  };

  // Dynamic speech mouth articulation calculation
  // When speaking, mouth opens and modulates based on outputAudioLevel + sin wave
  const speechMod = Math.sin(speechTick * 0.8) * 0.35 + 0.65;
  const mouthIntensity = status === 'speaking' ? Math.max(clampedOutput * 1.4, 0.15) * speechMod : 0;
  const mouthHeight = Math.min(mouthIntensity * 22, 22);

  // Listening audio reaction on HUD rings and temple sensors
  const listenEnergy = status === 'listening' ? clampedInput * 1.5 : 0;

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Background Radial Glow */}
      <div
        className="absolute w-64 h-64 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${theme.primary} 0%, ${theme.secondary} 40%, transparent 75%)`,
          transform: `scale(${1 + (status === 'speaking' ? clampedOutput * 0.3 : listenEnergy * 0.25)})`,
        }}
      />

      {/* Futuristic SVG Cybernetic Face Viewport */}
      <svg
        viewBox="0 0 320 320"
        className="w-56 h-56 sm:w-64 sm:h-64 drop-shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all duration-300"
      >
        <defs>
          {/* Holographic Glowing Filters */}
          <filter id="nexus-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="eye-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="metal-crest" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="face-plate-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="60%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0b1120" />
          </linearGradient>

          <linearGradient id="jaw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="hud-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={theme.primary} stopOpacity="0.8" />
            <stop offset="100%" stopColor={theme.secondary} stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* ============================================================ */}
        {/* 1. HUD & SCI-FI CALIBRATED RINGS (Around the Face)          */}
        {/* ============================================================ */}
        <g className="hud-layer">
          {/* Outermost Rotating Tech Ring */}
          <circle
            cx="160"
            cy="160"
            r="150"
            fill="none"
            stroke={theme.primary}
            strokeWidth="1.2"
            strokeDasharray="4 8 16 8 32 12"
            strokeOpacity={status === 'error' ? 0.2 : 0.35}
            className={`transition-all duration-700 ${
              status === 'thinking'
                ? 'animate-[spin_4s_linear_infinite]'
                : status === 'speaking'
                ? 'animate-[spin_12s_linear_infinite]'
                : status === 'listening'
                ? 'animate-[spin_8s_linear_infinite]'
                : 'animate-[spin_30s_linear_infinite]'
            }`}
            style={{ transformOrigin: '160px 160px' }}
          />

          {/* Inner Counter-Rotating Bracket Ring */}
          <circle
            cx="160"
            cy="160"
            r="138"
            fill="none"
            stroke={theme.secondary}
            strokeWidth="1.5"
            strokeDasharray="60 40 10 20 80 30"
            strokeOpacity="0.25"
            className="animate-[spin_24s_linear_infinite_reverse]"
            style={{ transformOrigin: '160px 160px' }}
          />

          {/* Calibrated HUD Degree Marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <line
              key={deg}
              x1="160"
              y1="12"
              x2="160"
              y2="18"
              stroke={theme.primary}
              strokeWidth="1.5"
              strokeOpacity="0.4"
              transform={`rotate(${deg} 160 160)`}
            />
          ))}

          {/* Sci-fi HUD Data Labels */}
          <text
            x="160"
            y="26"
            textAnchor="middle"
            fill={theme.accent}
            fontSize="7"
            fontFamily="monospace"
            letterSpacing="2"
            fillOpacity="0.75"
          >
            NEXUS CORE // v3.8 AI
          </text>

          {/* Lateral Status Indicators */}
          <text
            x="24"
            y="162"
            textAnchor="start"
            fill={theme.primary}
            fontSize="6"
            fontFamily="monospace"
            letterSpacing="1"
            fillOpacity="0.6"
          >
            {status === 'speaking' ? 'TX>>' : status === 'listening' ? 'RX<<' : 'SYS'}
          </text>
          <text
            x="296"
            y="162"
            textAnchor="end"
            fill={theme.primary}
            fontSize="6"
            fontFamily="monospace"
            letterSpacing="1"
            fillOpacity="0.6"
          >
            {status.toUpperCase()}
          </text>

          {/* Listening Energy Wave Pulse Arcs */}
          {status === 'listening' && (
            <path
              d="M 28 160 A 132 132 0 0 1 292 160"
              fill="none"
              stroke={theme.primary}
              strokeWidth={1 + listenEnergy * 3}
              strokeDasharray="8 6"
              filter="url(#nexus-glow)"
              opacity={0.4 + listenEnergy * 0.5}
            />
          )}

          {/* Speaking Audio Energy Wave Pulse Arcs */}
          {status === 'speaking' && (
            <path
              d="M 28 160 A 132 132 0 0 0 292 160"
              fill="none"
              stroke={theme.primary}
              strokeWidth={1 + clampedOutput * 3.5}
              strokeDasharray="12 8"
              filter="url(#nexus-glow)"
              opacity={0.5 + clampedOutput * 0.5}
            />
          )}
        </g>

        {/* ============================================================ */}
        {/* 2. ROBOTIC SKULL / FACE BASE STRUCTURE                      */}
        {/* ============================================================ */}
        <g className="robot-chassis">
          {/* Cranium Backplate Outline */}
          <path
            d="M 105 76 
               C 105 60, 130 52, 160 52 
               C 190 52, 215 60, 215 76 
               L 230 110 
               L 236 170 
               L 218 230 
               L 182 264 
               L 160 268 
               L 138 264 
               L 102 230 
               L 84 170 
               L 90 110 Z"
            fill="url(#face-plate-grad)"
            stroke={theme.plateStroke}
            strokeWidth="1.8"
            strokeOpacity="0.8"
          />

          {/* Forehead Titanium Crest & Center Neural Core */}
          <path
            d="M 125 72 L 160 60 L 195 72 L 185 96 L 160 102 L 135 96 Z"
            fill="url(#metal-crest)"
            stroke={theme.primary}
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />

          {/* Central Forehead Core Gem (Neural Processor Node) */}
          <polygon
            points="160,70 168,80 160,90 152,80"
            fill={theme.primary}
            filter="url(#nexus-glow)"
            className={
              status === 'thinking'
                ? 'animate-pulse'
                : status === 'speaking'
                ? 'animate-pulse'
                : ''
            }
          />
          <polygon
            points="160,73 165,80 160,87 155,80"
            fill="#ffffff"
            opacity={status === 'error' ? 0.3 : 0.9}
          />

          {/* Forehead Micro-Circuits (Pulsing data lines) */}
          <g stroke={theme.accent} strokeWidth="1" strokeOpacity="0.6" fill="none">
            <path d="M 135 84 L 110 84 L 102 96" />
            <path d="M 185 84 L 210 84 L 218 96" />
            <circle cx="102" cy="96" r="1.5" fill={theme.accent} />
            <circle cx="218" cy="96" r="1.5" fill={theme.accent} />

            {/* Neural scan pulse traveling on lines when thinking */}
            {status === 'thinking' && (
              <>
                <line
                  x1="120"
                  y1="76"
                  x2="148"
                  y2="76"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  filter="url(#nexus-glow)"
                  className="animate-pulse"
                />
                <line
                  x1="172"
                  y1="76"
                  x2="200"
                  y2="76"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  filter="url(#nexus-glow)"
                  className="animate-pulse"
                />
              </>
            )}
          </g>

          {/* Left & Right Temple Acoustic / Sensor Panels */}
          <g className="temple-panels">
            {/* Left Temple Pod */}
            <path
              d="M 88 112 L 104 116 L 98 160 L 80 154 Z"
              fill="#131e33"
              stroke={theme.plateStroke}
              strokeWidth="1.2"
            />
            {/* Left Sensor Vents */}
            <line x1="86" y1="125" x2="98" y2="128" stroke={theme.primary} strokeWidth="1" opacity="0.6" />
            <line x1="84" y1="135" x2="96" y2="138" stroke={theme.primary} strokeWidth="1" opacity="0.6" />
            <line x1="82" y1="145" x2="94" y2="148" stroke={theme.primary} strokeWidth="1" opacity="0.6" />

            {/* Right Temple Pod */}
            <path
              d="M 232 112 L 216 116 L 222 160 L 240 154 Z"
              fill="#131e33"
              stroke={theme.plateStroke}
              strokeWidth="1.2"
            />
            {/* Right Sensor Vents */}
            <line x1="234" y1="125" x2="222" y2="128" stroke={theme.primary} strokeWidth="1" opacity="0.6" />
            <line x1="236" y1="135" x2="224" y2="138" stroke={theme.primary} strokeWidth="1" opacity="0.6" />
            <line x1="238" y1="145" x2="226" y2="148" stroke={theme.primary} strokeWidth="1" opacity="0.6" />
          </g>

          {/* Brow Ridge (Sculpted masculine robot brow) */}
          <path
            d="M 108 120 
               L 142 122 
               L 160 128 
               L 178 122 
               L 212 120 
               L 218 128 
               L 182 132 
               L 160 136 
               L 138 132 
               L 102 128 Z"
            fill="#1e293b"
            stroke={theme.primary}
            strokeWidth="1.2"
            strokeOpacity="0.7"
          />

          {/* Cybernetic Nose Bridge */}
          <polygon
            points="160,136 166,174 160,180 154,174"
            fill="#0f172a"
            stroke={theme.plateStroke}
            strokeWidth="1"
          />
          <line
            x1="160"
            y1="138"
            x2="160"
            y2="176"
            stroke={theme.primary}
            strokeWidth="1.5"
            strokeOpacity="0.8"
            filter="url(#nexus-glow)"
          />

          {/* Cheek Armor Plates (Left & Right) */}
          <path
            d="M 100 170 L 140 174 L 136 196 L 96 186 Z"
            fill="#111c30"
            stroke={theme.plateStroke}
            strokeWidth="1"
          />
          <path
            d="M 220 170 L 180 174 L 184 196 L 224 186 Z"
            fill="#111c30"
            stroke={theme.plateStroke}
            strokeWidth="1"
          />

          {/* Cheek Acoustic Equalizer Slots (Reactivates when listening or speaking) */}
          <g stroke={theme.accent} strokeWidth="1" strokeOpacity="0.7">
            <line x1="106" y1="178" x2="130" y2="180" />
            <line x1="104" y1="183" x2="126" y2="185" />
            <line x1="214" y1="178" x2="190" y2="180" />
            <line x1="216" y1="183" x2="194" y2="185" />
          </g>

          {/* ============================================================ */}
          {/* 3. DIGITAL LUMINOUS EYES                                     */}
          {/* ============================================================ */}
          <g className="cyber-eyes">
            {/* Left Eye Socket */}
            <polygon
              points="114,134 146,136 142,154 110,150"
              fill="#060c18"
              stroke={theme.plateStroke}
              strokeWidth="1.5"
            />
            {/* Right Eye Socket */}
            <polygon
              points="206,134 174,136 178,154 210,150"
              fill="#060c18"
              stroke={theme.plateStroke}
              strokeWidth="1.5"
            />

            {/* If NOT blinking, render luminous digital eyes */}
            {!isBlinking ? (
              <>
                {/* Left Eye Outer Luminous Ring */}
                <ellipse
                  cx="128"
                  cy="144"
                  rx={status === 'listening' ? '12' : '10'}
                  ry={status === 'listening' ? '7.5' : '6.5'}
                  fill="none"
                  stroke={theme.eyeColor}
                  strokeWidth="1.5"
                  filter="url(#eye-glow)"
                  opacity={status === 'error' ? 0.35 : 0.85}
                  className={status === 'speaking' ? 'animate-pulse' : ''}
                />
                {/* Left Eye Digital Iris/Core */}
                <circle
                  cx="128"
                  cy="144"
                  r={status === 'thinking' ? 3.5 : 4.5}
                  fill={theme.eyeColor}
                  filter="url(#eye-glow)"
                />
                <circle cx="128" cy="144" r="1.8" fill="#ffffff" />
                {/* Tech pupil tick */}
                <line x1="120" y1="144" x2="136" y2="144" stroke={theme.accent} strokeWidth="0.8" opacity="0.7" />

                {/* Right Eye Outer Luminous Ring */}
                <ellipse
                  cx="192"
                  cy="144"
                  rx={status === 'listening' ? '12' : '10'}
                  ry={status === 'listening' ? '7.5' : '6.5'}
                  fill="none"
                  stroke={theme.eyeColor}
                  strokeWidth="1.5"
                  filter="url(#eye-glow)"
                  opacity={status === 'error' ? 0.35 : 0.85}
                  className={status === 'speaking' ? 'animate-pulse' : ''}
                />
                {/* Right Eye Digital Iris/Core */}
                <circle
                  cx="192"
                  cy="144"
                  r={status === 'thinking' ? 3.5 : 4.5}
                  fill={theme.eyeColor}
                  filter="url(#eye-glow)"
                />
                <circle cx="192" cy="144" r="1.8" fill="#ffffff" />
                {/* Tech pupil tick */}
                <line x1="184" y1="144" x2="200" y2="144" stroke={theme.accent} strokeWidth="0.8" opacity="0.7" />
              </>
            ) : (
              /* Blink state: Sleek horizontal cyber slits */
              <>
                <line
                  x1="112"
                  y1="144"
                  x2="144"
                  y2="145"
                  stroke={theme.eyeColor}
                  strokeWidth="1.8"
                  filter="url(#eye-glow)"
                  opacity="0.8"
                />
                <line
                  x1="176"
                  y1="145"
                  x2="208"
                  y2="144"
                  stroke={theme.eyeColor}
                  strokeWidth="1.8"
                  filter="url(#eye-glow)"
                  opacity="0.8"
                />
              </>
            )}

            {/* Neural scan laser beam across eyes when THINKING */}
            {status === 'thinking' && (
              <line
                x1="110"
                y1="144"
                x2="210"
                y2="144"
                stroke="#c084fc"
                strokeWidth="1.2"
                strokeDasharray="15 30"
                filter="url(#eye-glow)"
                className="animate-[spin_2s_linear_infinite]"
                style={{ transformOrigin: '160px 144px' }}
              />
            )}
          </g>

          {/* ============================================================ */}
          {/* 4. JAWLINE & CYBERNETIC VOCALIZER MOUTH                      */}
          {/* ============================================================ */}
          {/* Articulated Jaw Plate (shifts down slightly when speaking) */}
          <g
            style={{
              transform: `translateY(${status === 'speaking' ? mouthHeight * 0.25 : 0}px)`,
              transition: 'transform 80ms ease-out',
            }}
          >
            {/* Chiseled Titanium Chin Plate */}
            <polygon
              points="142,228 178,228 172,256 160,260 148,256"
              fill="url(#jaw-grad)"
              stroke={theme.plateStroke}
              strokeWidth="1.2"
            />
            {/* Center Chin Tech Accent */}
            <line
              x1="160"
              y1="234"
              x2="160"
              y2="252"
              stroke={theme.primary}
              strokeWidth="1.5"
              strokeOpacity="0.7"
              filter="url(#nexus-glow)"
            />

            {/* Lower Jaw Contours */}
            <path
              d="M 120 220 L 142 228 L 148 256 L 126 236 Z"
              fill="#10192a"
              stroke={theme.plateStroke}
              strokeWidth="1"
            />
            <path
              d="M 200 220 L 178 228 L 172 256 L 194 236 Z"
              fill="#10192a"
              stroke={theme.plateStroke}
              strokeWidth="1"
            />
          </g>

          {/* Cybernetic Vocalizer Mouth Grille */}
          <g className="cyber-vocalizer">
            {/* Mouth Recess Housing */}
            <rect
              x="134"
              y={208 - (status === 'speaking' ? mouthHeight * 0.4 : 0)}
              width="52"
              height={Math.max(6, mouthHeight + 6)}
              rx="3"
              fill="#060913"
              stroke={theme.plateStroke}
              strokeWidth="1"
            />

            {status === 'speaking' ? (
              /* REAL-TIME ARTICULATED SPEECH WAVEFORM MOUTH */
              <g filter="url(#nexus-glow)">
                {[-18, -12, -6, 0, 6, 12, 18].map((offset, i) => {
                  const barPhase = Math.sin(speechTick * 0.6 + i * 1.2);
                  const dynamicBarHeight = Math.max(
                    4,
                    mouthHeight * (0.45 + 0.55 * Math.abs(barPhase))
                  );
                  return (
                    <line
                      key={offset}
                      x1={160 + offset}
                      y1={211 - dynamicBarHeight / 2}
                      x2={160 + offset}
                      y2={211 + dynamicBarHeight / 2}
                      stroke={theme.eyeColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  );
                })}
              </g>
            ) : status === 'listening' ? (
              /* LISTENING: Receptive glowing acoustic line reacting to mic */
              <g filter="url(#nexus-glow)">
                <line
                  x1={140 - listenEnergy * 4}
                  y1="211"
                  x2={180 + listenEnergy * 4}
                  y2="211"
                  stroke={theme.primary}
                  strokeWidth={1.5 + listenEnergy * 2}
                  strokeLinecap="round"
                />
              </g>
            ) : (
              /* IDLE / THINKING / ERROR: Sleek cyber slit */
              <line
                x1="142"
                y1="211"
                x2="178"
                y2="211"
                stroke={theme.primary}
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity={status === 'error' ? 0.35 : 0.8}
                filter="url(#nexus-glow)"
                className={status === 'thinking' ? 'animate-pulse' : ''}
              />
            )}
          </g>
        </g>
      </svg>

      {/* Subtitle & State Feedback Typography */}
      <div className="mt-2 text-center flex flex-col items-center">
        <p className="text-sm font-black tracking-wider text-white transition-colors duration-300 drop-shadow-sm">
          {theme.statusText}
        </p>

        {emotion && emotion !== 'neutro' && emotionMeta.label && (
          <div className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[10px] font-bold text-cyan-300 shadow-sm animate-in fade-in">
            <span>{emotionMeta.icon}</span>
            <span>Expressão: {emotionMeta.label}</span>
          </div>
        )}

        <span className="text-[11px] font-semibold text-slate-400 mt-0.5 max-w-[280px]">
          {status === 'speaking'
            ? 'Fale no microfone para interromper naturalmente'
            : status === 'listening'
            ? 'Pode falar naturalmente com o NEXUS'
            : status === 'thinking'
            ? 'Processando resposta pedagógica...'
            : status === 'connecting'
            ? 'Estabelecendo canal neural de voz...'
            : status === 'error'
            ? 'Verifique permissão de microfone ou conexão'
            : 'Assistente inteligente por voz em tempo real'}
        </span>
      </div>
    </div>
  );
};
