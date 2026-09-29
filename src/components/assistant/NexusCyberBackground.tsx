import React, { useEffect, useRef } from 'react';
import { NexusFaceStatus } from './NexusRobotFace';

interface NexusCyberBackgroundProps {
  status: NexusFaceStatus;
  inputAudioLevel?: number;
  outputAudioLevel?: number;
  className?: string;
  showHolographicPanels?: boolean;
}

export const NexusCyberBackground: React.FC<NexusCyberBackgroundProps> = ({
  status,
  inputAudioLevel = 0,
  outputAudioLevel = 0,
  className = '',
  showHolographicPanels = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Status visual color configurations
  const theme = {
    idle: {
      primary: '#06b6d4', // cyan-500
      secondary: '#0284c7', // sky-600
      ambient: 'rgba(6, 182, 212, 0.12)',
      ringColor: 'rgba(6, 182, 212, 0.25)',
      statusLabel: 'SISTEMA EM ESPERA • NÚCLEO ESTÁVEL',
    },
    connecting: {
      primary: '#38bdf8', // sky-400
      secondary: '#2563eb',
      ambient: 'rgba(56, 189, 248, 0.18)',
      ringColor: 'rgba(56, 189, 248, 0.35)',
      statusLabel: 'ESTABELECENDO CANAL NEURAL...',
    },
    listening: {
      primary: '#10b981', // emerald-500
      secondary: '#06b6d4',
      ambient: 'rgba(16, 185, 129, 0.22)',
      ringColor: 'rgba(16, 185, 129, 0.45)',
      statusLabel: 'MICROFONE ATIVO • CAPTURANDO VOZ',
    },
    thinking: {
      primary: '#a855f7', // purple-500
      secondary: '#6366f1',
      ambient: 'rgba(168, 85, 247, 0.25)',
      ringColor: 'rgba(168, 85, 247, 0.45)',
      statusLabel: 'PROCESSANDO RACIOCÍNIO DIDÁTICO...',
    },
    speaking: {
      primary: '#22d3ee', // bright cyan
      secondary: '#3b82f6',
      ambient: 'rgba(34, 211, 238, 0.28)',
      ringColor: 'rgba(34, 211, 238, 0.55)',
      statusLabel: 'SÍNTESE VOCAL ATIVA • RESPONDENDO',
    },
    error: {
      primary: '#f43f5e', // rose-500
      secondary: '#e11d48',
      ambient: 'rgba(244, 63, 94, 0.2)',
      ringColor: 'rgba(244, 63, 94, 0.4)',
      statusLabel: 'CONEXÃO INTERROMPIDA • RECONECTANDO',
    },
  }[status];

  // Canvas cyber particles & grid animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Subtle floating digital particles
    const particleCount = 28;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: -Math.random() * 0.5 - 0.2,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    let tick = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Perspective Cyber Grid Floor (Subtle horizon)
      const gridHorizonY = height * 0.72;
      ctx.save();
      ctx.strokeStyle = status === 'listening' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(6, 182, 212, 0.1)';
      ctx.lineWidth = 1;

      // Perspective vertical rays
      const rays = 12;
      for (let i = 0; i <= rays; i++) {
        const xOffset = ((i - rays / 2) / (rays / 2)) * (width * 0.65);
        ctx.beginPath();
        ctx.moveTo(centerX + xOffset * 0.2, gridHorizonY);
        ctx.lineTo(centerX + xOffset * 1.5, height);
        ctx.stroke();
      }

      // Horizontal lines with exponential distance
      const lines = 6;
      for (let j = 1; j <= lines; j++) {
        const y = gridHorizonY + Math.pow(j / lines, 2) * (height - gridHorizonY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Concentric Holographic Sonic / Aura Rings
      const energyLevel =
        status === 'speaking'
          ? Math.max(outputAudioLevel, 0.15)
          : status === 'listening'
          ? Math.max(inputAudioLevel, 0.15)
          : 0.05;

      const baseRadius = Math.min(width, height) * 0.28;
      const ringCount = status === 'speaking' ? 3 : 2;

      ctx.save();
      for (let r = 0; r < ringCount; r++) {
        const dynamicPulse = Math.sin(tick * 0.05 + r * 1.2) * 6;
        const radius = baseRadius + r * 22 + energyLevel * 25 + dynamicPulse;

        ctx.strokeStyle = theme.ringColor;
        ctx.lineWidth = r === 0 ? 1.5 : 1;
        ctx.setLineDash(r === 1 ? [4, 6] : status === 'thinking' ? [6, 12] : []);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Floating Digital Particles
      ctx.save();
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        ctx.fillStyle = theme.primary;
        ctx.globalAlpha = p.opacity * (status === 'thinking' ? 1.2 : 0.7);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [status, inputAudioLevel, outputAudioLevel, theme]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}>
      {/* Deep Space Radial Gradient Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 45%, ${theme.ambient} 0%, rgba(15, 23, 42, 0.75) 45%, rgba(2, 6, 23, 0.98) 100%)`,
        }}
      />

      {/* Dynamic Animated Canvas Grid & Particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Subtle Scanline Holographic Overlay */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
          backgroundSize: '100% 4px, 6px 100%',
        }}
      />

      {/* Top Floating Cyber Telemetry Bar */}
      {showHolographicPanels && (
        <div className="absolute top-2 inset-x-4 flex items-center justify-between text-[9px] font-mono tracking-widest text-cyan-500/70 border-b border-cyan-500/20 pb-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-extrabold">{theme.statusLabel}</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-slate-500">
            <span>NEURAL CORE: ONLINE</span>
            <span>LATÊNCIA: 12ms</span>
            <span className="text-cyan-400">v2.5 CYBER</span>
          </div>
        </div>
      )}

      {/* Side Holographic HUD Brackets */}
      {showHolographicPanels && (
        <>
          <div className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-cyan-500/40 space-y-1">
            <div className="w-4 h-1 bg-cyan-500/40" />
            <div>SYS.01</div>
            <div>FREQ.48K</div>
            <div className="w-2 h-0.5 bg-cyan-500/40" />
          </div>

          <div className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 text-right text-[9px] font-mono text-cyan-500/40 space-y-1">
            <div className="w-4 h-1 bg-cyan-500/40 ml-auto" />
            <div>VOX.SYNC</div>
            <div>AI.READY</div>
            <div className="w-2 h-0.5 bg-cyan-500/40 ml-auto" />
          </div>
        </>
      )}
    </div>
  );
};
