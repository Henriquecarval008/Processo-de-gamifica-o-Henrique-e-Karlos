/**
 * Web Audio API Sound Controller & Ambient Music Engine for Gameinfor.
 * - Procedural multi-category royalty-free music engine (8 distinct genres + silence).
 * - Custom MP3/WAV/OGG uploaded track playback support.
 * - Smart Audio Ducking: lowers music during sound effects and smoothly restores it.
 * - Preview system with single-playback enforcement.
 * - Independent volume and mute controls for music and sound effects.
 */
import { AudioSettings, RoomAudioConfig, CustomUploadedTrack } from '../types';
import { DEFAULT_ROOM_AUDIO_CONFIG } from './audioLibrary';

const AUDIO_STORAGE_KEY = 'gameinfor_audio_settings_v2';

const defaultSettings: AudioSettings = {
  interfaceSoundsEnabled: true,
  musicEnabled: true,
  effectsVolume: 0.6,
  musicVolume: 0.5,
  selectedTrackId: 'track-arcade',
};

type PreviewListener = (activeTrackId: string | null) => void;

class SoundController {
  private audioCtx: AudioContext | null = null;
  private settings: AudioSettings = defaultSettings;

  // Sound effects gain node
  private effectsGain: GainNode | null = null;

  // Active room music state
  private activeRoomMusicLoop: number | null = null;
  private activeRoomGain: GainNode | null = null;
  private activeCustomAudio: HTMLAudioElement | null = null;
  private activeCustomAudioGain: GainNode | null = null;
  private activeRoomConfig: RoomAudioConfig | null = null;
  private roomLocalVolumeMultiplier: number = 1.0;

  // Active preview state
  private activePreviewTrackId: string | null = null;
  private previewLoopInterval: number | null = null;
  private previewGain: GainNode | null = null;
  private previewCustomAudio: HTMLAudioElement | null = null;
  private previewListeners: Set<PreviewListener> = new Set();

  // Ducking state
  private isDucked: boolean = false;
  private duckTimeout: number | null = null;

  // Random pitch cache
  private lastPitchVariation: number = 0;

  constructor() {
    this.loadSettings();
  }

  public subscribePreview(listener: PreviewListener): () => void {
    this.previewListeners.add(listener);
    listener(this.activePreviewTrackId);
    return () => {
      this.previewListeners.delete(listener);
    };
  }

  private notifyPreviewListeners() {
    this.previewListeners.forEach((l) => {
      try {
        l(this.activePreviewTrackId);
      } catch (err) {
        console.error('Error in preview listener:', err);
      }
    });
  }

  private initContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public loadSettings(): AudioSettings {
    try {
      const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
      if (saved) {
        this.settings = { ...defaultSettings, ...JSON.parse(saved) };
      }
    } catch {
      this.settings = defaultSettings;
    }
    return this.settings;
  }

  public saveSettings(newSettings: Partial<AudioSettings>): AudioSettings {
    this.settings = { ...this.settings, ...newSettings };
    try {
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // ignore
    }

    if (this.activeRoomConfig) {
      this.updateRoomMusicGain();
    }

    return this.settings;
  }

  public getSettings(): AudioSettings {
    return this.settings;
  }

  // =========================================================================
  // AUDIO DUCKING (Smooth volume reduction during sound effects)
  // =========================================================================

  public duckMusic(durationMs: number = 600) {
    if (!this.audioCtx) return;

    if (this.duckTimeout) {
      clearTimeout(this.duckTimeout);
      this.duckTimeout = null;
    }

    this.isDucked = true;

    // Apply ducking to active music gain
    if (this.activeRoomGain && this.audioCtx) {
      const nominal = this.calculateNominalRoomGain();
      const duckedVolume = nominal * 0.22; // Duck down to 22%
      const now = this.audioCtx.currentTime;
      this.activeRoomGain.gain.cancelScheduledValues(now);
      this.activeRoomGain.gain.setTargetAtTime(duckedVolume, now, 0.05);
    }

    if (this.activeCustomAudio) {
      const nominal = (this.activeRoomConfig?.volume ?? 0.5) * this.roomLocalVolumeMultiplier;
      this.activeCustomAudio.volume = Math.max(0, Math.min(1, nominal * 0.22));
    }

    // Schedule restoration back to nominal volume
    this.duckTimeout = window.setTimeout(() => {
      this.isDucked = false;
      this.restoreDuckedMusic();
    }, durationMs);
  }

  private restoreDuckedMusic() {
    if (!this.audioCtx) return;
    if (this.activeRoomGain) {
      const nominal = this.calculateNominalRoomGain();
      const now = this.audioCtx.currentTime;
      this.activeRoomGain.gain.cancelScheduledValues(now);
      this.activeRoomGain.gain.setTargetAtTime(nominal, now, 0.25);
    }
    if (this.activeCustomAudio) {
      const nominal = (this.activeRoomConfig?.volume ?? 0.5) * this.roomLocalVolumeMultiplier;
      this.activeCustomAudio.volume = Math.max(0, Math.min(1, nominal));
    }
  }

  private calculateNominalRoomGain(): number {
    if (!this.activeRoomConfig || !this.activeRoomConfig.musicEnabled) return 0;
    const baseRoomVol = this.activeRoomConfig.volume ?? 0.5;
    const globalSetting = this.settings.musicEnabled ? this.settings.musicVolume : 0;
    // Base synth master gain scalar: 0.18 for comfortable acoustic presence
    return baseRoomVol * this.roomLocalVolumeMultiplier * globalSetting * 0.18;
  }

  private updateRoomMusicGain() {
    if (!this.audioCtx) return;
    const target = this.isDucked
      ? this.calculateNominalRoomGain() * 0.22
      : this.calculateNominalRoomGain();

    if (this.activeRoomGain) {
      this.activeRoomGain.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.1);
    }

    if (this.activeCustomAudio) {
      const targetVol = this.isDucked
        ? (this.activeRoomConfig?.volume ?? 0.5) * this.roomLocalVolumeMultiplier * 0.22
        : (this.activeRoomConfig?.volume ?? 0.5) * this.roomLocalVolumeMultiplier;
      this.activeCustomAudio.volume = Math.max(0, Math.min(1, targetVol));
    }
  }

  // =========================================================================
  // SOUND EFFECTS (Clicks, Correct, Wrong, RankUp, Countdown, Suspense, Cheer)
  // =========================================================================

  public playClick(pitchOffset: number = 0) {
    if (!this.settings.interfaceSoundsEnabled || this.settings.effectsVolume <= 0) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      let variation = (Math.random() - 0.5) * 40;
      if (Math.abs(variation - this.lastPitchVariation) < 10) {
        variation += 20;
      }
      this.lastPitchVariation = variation;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, ctx.currentTime);

      const baseFreq = 820 + variation + pitchOffset;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, ctx.currentTime + 0.038);

      const now = ctx.currentTime;
      const vol = this.settings.effectsVolume * 0.15;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // ignore
    }
  }

  public playCardOpen() {
    if (!this.settings.interfaceSoundsEnabled || this.settings.effectsVolume <= 0) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.value = 3000;

      const now = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.06);

      const vol = this.settings.effectsVolume * 0.18;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.085);
    } catch {
      // ignore
    }
  }

  /**
   * Sound effect for correct answer (+100 XP)
   */
  public playCorrect() {
    if (!this.settings.interfaceSoundsEnabled || this.settings.effectsVolume <= 0) return;
    try {
      this.duckMusic(650);
      const ctx = this.initContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = ctx.currentTime;
      const vol = this.settings.effectsVolume * 0.25;

      notes.forEach((freq, idx) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        const startTime = now + idx * 0.055;

        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, startTime);

        noteGain.gain.setValueAtTime(0.0001, startTime);
        noteGain.gain.linearRampToValueAtTime(vol, startTime + 0.01);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.26);

        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);

        noteOsc.start(startTime);
        noteOsc.stop(startTime + 0.28);
      });
    } catch {
      // ignore
    }
  }

  public playAcerto() {
    this.playCorrect();
  }

  /**
   * Sound effect for wrong answer
   */
  public playWrong() {
    if (!this.settings.interfaceSoundsEnabled || this.settings.effectsVolume <= 0) return;
    try {
      this.duckMusic(550);
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.16);

      const vol = this.settings.effectsVolume * 0.22;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // ignore
    }
  }

  public playErro() {
    this.playWrong();
  }

  /**
   * Rank up / Overtake fanfare
   */
  public playRankUp() {
    if (!this.settings.interfaceSoundsEnabled || this.settings.effectsVolume <= 0) return;
    try {
      this.duckMusic(800);
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880];
      const vol = this.settings.effectsVolume * 0.24;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + idx * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.27);
      });
    } catch {
      // ignore
    }
  }

  /**
   * Countdown second tick
   */
  public playTick() {
    if (!this.settings.interfaceSoundsEnabled || this.settings.effectsVolume <= 0) return;
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);

      const vol = this.settings.effectsVolume * 0.12;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // ignore
    }
  }

  /**
   * Suspense effect for dramatic questions
   */
  public playSuspense() {
    if (!this.settings.interfaceSoundsEnabled || this.settings.effectsVolume <= 0) return;
    try {
      this.duckMusic(1200);
      const ctx = this.initContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now);
      filter.Q.setValueAtTime(3, now);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.8);

      const vol = this.settings.effectsVolume * 0.18;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.2);
    } catch {
      // ignore
    }
  }

  /**
   * Victory / final quiz champion fanfare
   */
  public playVictory() {
    if (!this.settings.interfaceSoundsEnabled || this.settings.effectsVolume <= 0) return;
    try {
      this.duckMusic(1800);
      const ctx = this.initContext();
      if (!ctx) return;

      const notes = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 1046.5, d: 0.35 },
        { f: 880, d: 0.12 },
        { f: 1046.5, d: 0.5 },
      ];

      const now = ctx.currentTime;
      let offset = 0;
      const vol = this.settings.effectsVolume * 0.28;

      notes.forEach((item) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + offset;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, t);

        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + item.d);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + item.d + 0.02);

        offset += item.d * 0.85;
      });
    } catch {
      // ignore
    }
  }

  // =========================================================================
  // MULTI-GENRE PROCEDURAL MUSIC SYNTHESIZERS (8 Distinct Categories + None)
  // =========================================================================

  private createTrackSynthesizer(
    trackId: string,
    destinationGain: GainNode
  ): { step: () => void; intervalMs: number } {
    const ctx = this.audioCtx;
    if (!ctx) return { step: () => {}, intervalMs: 1000 };

    switch (trackId) {
      case 'track-relaxing': {
        // Lofi Zen Garden: Pentatonic calm chords, warm lowpass filter, gentle bells
        const chords = [
          [261.63, 329.63, 392.0, 523.25], // C Major
          [220.0, 261.63, 329.63, 440.0], // A minor
          [174.61, 220.0, 261.63, 349.23], // F Major
          [196.0, 246.94, 293.66, 392.0], // G Major
        ];
        let idx = 0;
        return {
          intervalMs: 4000,
          step: () => {
            if (!this.audioCtx) return;
            const currentChord = chords[idx % chords.length];
            idx++;
            currentChord.forEach((freq, noteIdx) => {
              if (!this.audioCtx) return;
              const now = this.audioCtx.currentTime + noteIdx * 0.04;
              const osc = this.audioCtx.createOscillator();
              const noteGain = this.audioCtx.createGain();
              const filter = this.audioCtx.createBiquadFilter();

              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(680, now);

              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now);

              noteGain.gain.setValueAtTime(0.0001, now);
              noteGain.gain.linearRampToValueAtTime(0.12, now + 0.8);
              noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

              osc.connect(filter);
              filter.connect(noteGain);
              noteGain.connect(destinationGain);

              osc.start(now);
              osc.stop(now + 4.0);
            });
          },
        };
      }

      case 'track-arcade': {
        // 8-Bit Chiptune Quest: Square-wave arpeggio, retro game bassline, 130 BPM
        const patterns = [
          [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 392.0, 523.25],
          [220.0, 261.63, 329.63, 440.0, 329.63, 261.63, 329.63, 440.0],
          [174.61, 220.0, 261.63, 349.23, 261.63, 220.0, 261.63, 349.23],
          [196.0, 246.94, 293.66, 392.0, 293.66, 246.94, 293.66, 392.0],
        ];
        let bar = 0;
        return {
          intervalMs: 1850,
          step: () => {
            if (!this.audioCtx) return;
            const currentPattern = patterns[bar % patterns.length];
            bar++;
            const stepDuration = 0.22;
            currentPattern.forEach((freq, i) => {
              if (!this.audioCtx) return;
              const now = this.audioCtx.currentTime + i * stepDuration;
              const osc = this.audioCtx.createOscillator();
              const noteGain = this.audioCtx.createGain();

              osc.type = 'square';
              osc.frequency.setValueAtTime(freq, now);

              // 8-bit snappy envelope
              noteGain.gain.setValueAtTime(0.0001, now);
              noteGain.gain.linearRampToValueAtTime(0.07, now + 0.015);
              noteGain.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration * 0.85);

              osc.connect(noteGain);
              noteGain.connect(destinationGain);

              osc.start(now);
              osc.stop(now + stepDuration);
            });
          },
        };
      }

      case 'track-energy': {
        // Electro Pulse: Driving bass pulse, 126 BPM, filtered sawtooth energizer
        const bassFreqs = [110.0, 110.0, 130.81, 146.83, 110.0, 110.0, 164.81, 146.83];
        let stepCount = 0;
        return {
          intervalMs: 1900,
          step: () => {
            if (!this.audioCtx) return;
            const stepDur = 0.235;
            bassFreqs.forEach((freq, idx) => {
              if (!this.audioCtx) return;
              const now = this.audioCtx.currentTime + idx * stepDur;
              const osc = this.audioCtx.createOscillator();
              const gain = this.audioCtx.createGain();
              const filter = this.audioCtx.createBiquadFilter();

              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(950, now);
              filter.frequency.exponentialRampToValueAtTime(300, now + stepDur * 0.8);

              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(freq, now);

              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.linearRampToValueAtTime(0.13, now + 0.015);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + stepDur * 0.9);

              osc.connect(filter);
              filter.connect(gain);
              gain.connect(destinationGain);

              osc.start(now);
              osc.stop(now + stepDur);
            });
            stepCount++;
          },
        };
      }

      case 'track-cheerful': {
        // Festa dos Bits: Joyful, bright marimba-style melody in C Major
        const melody = [
          [523.25, 659.25],
          [587.33, 698.46],
          [659.25, 783.99],
          [783.99, 1046.5],
        ];
        let seq = 0;
        return {
          intervalMs: 1600,
          step: () => {
            if (!this.audioCtx) return;
            const currentNotes = melody[seq % melody.length];
            seq++;
            currentNotes.forEach((freq, i) => {
              if (!this.audioCtx) return;
              const now = this.audioCtx.currentTime + i * 0.18;
              const osc = this.audioCtx.createOscillator();
              const gain = this.audioCtx.createGain();

              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, now);

              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

              osc.connect(gain);
              gain.connect(destinationGain);

              osc.start(now);
              osc.stop(now + 0.4);
            });
          },
        };
      }

      case 'track-suspense': {
        // Mistério Profundo: Low suspense drone with subtle detuning and tension
        const drones = [
          [65.41, 130.81, 155.56], // C minor chord drone
          [58.27, 116.54, 146.83], // Bb chord drone
          [61.74, 123.47, 155.56], // Bdim drone
          [65.41, 130.81, 196.0],  // Cm power drone
        ];
        let dIdx = 0;
        return {
          intervalMs: 3800,
          step: () => {
            if (!this.audioCtx) return;
            const chord = drones[dIdx % drones.length];
            dIdx++;
            chord.forEach((freq) => {
              if (!this.audioCtx) return;
              const now = this.audioCtx.currentTime;
              const osc = this.audioCtx.createOscillator();
              const gain = this.audioCtx.createGain();
              const filter = this.audioCtx.createBiquadFilter();

              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(450, now);

              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now);

              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.linearRampToValueAtTime(0.14, now + 0.9);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

              osc.connect(filter);
              filter.connect(gain);
              gain.connect(destinationGain);

              osc.start(now);
              osc.stop(now + 3.8);
            });
          },
        };
      }

      case 'track-tech': {
        // Cyber Grid: Futuristic synthwave 16th arpeggios in D minor
        const techNotes = [293.66, 349.23, 440.0, 587.33, 440.0, 349.23, 392.0, 329.63];
        let tStep = 0;
        return {
          intervalMs: 1700,
          step: () => {
            if (!this.audioCtx) return;
            const stepTime = 0.2;
            techNotes.forEach((f, idx) => {
              if (!this.audioCtx) return;
              const now = this.audioCtx.currentTime + idx * stepTime;
              const osc = this.audioCtx.createOscillator();
              const gain = this.audioCtx.createGain();
              const filter = this.audioCtx.createBiquadFilter();

              filter.type = 'bandpass';
              filter.frequency.setValueAtTime(1200, now);
              filter.Q.setValueAtTime(2.5, now);

              osc.type = 'sawtooth';
              osc.frequency.setValueAtTime(f, now);

              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + stepTime * 0.85);

              osc.connect(filter);
              filter.connect(gain);
              gain.connect(destinationGain);

              osc.start(now);
              osc.stop(now + stepTime);
            });
            tStep++;
          },
        };
      }

      case 'track-focus': {
        // Foco Produtivo: 432Hz ambient chord harmonies for deep non-distracting concentration
        const focusChords = [
          [216.0, 272.0, 324.0, 432.0],
          [192.0, 240.0, 288.0, 384.0],
          [226.0, 284.0, 340.0, 452.0],
          [216.0, 272.0, 324.0, 432.0],
        ];
        let fIdx = 0;
        return {
          intervalMs: 4500,
          step: () => {
            if (!this.audioCtx) return;
            const chord = focusChords[fIdx % focusChords.length];
            fIdx++;
            chord.forEach((freq) => {
              if (!this.audioCtx) return;
              const now = this.audioCtx.currentTime;
              const osc = this.audioCtx.createOscillator();
              const gain = this.audioCtx.createGain();

              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, now);

              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.linearRampToValueAtTime(0.09, now + 1.2);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);

              osc.connect(gain);
              gain.connect(destinationGain);

              osc.start(now);
              osc.stop(now + 4.4);
            });
          },
        };
      }

      case 'track-instrumental': {
        // Acústico Serenata: Plucked string simulation with harmonics
        const acousticPicks = [
          [196.0, 246.94, 293.66, 392.0, 493.88], // G Major
          [164.81, 220.0, 261.63, 329.63, 440.0], // E minor
          [174.61, 220.0, 261.63, 349.23, 440.0], // F Major
          [196.0, 246.94, 293.66, 392.0, 587.33], // G7
        ];
        let aIdx = 0;
        return {
          intervalMs: 2500,
          step: () => {
            if (!this.audioCtx) return;
            const picks = acousticPicks[aIdx % acousticPicks.length];
            aIdx++;
            picks.forEach((freq, noteIndex) => {
              if (!this.audioCtx) return;
              const now = this.audioCtx.currentTime + noteIndex * 0.16;
              const osc = this.audioCtx.createOscillator();
              const gain = this.audioCtx.createGain();
              const filter = this.audioCtx.createBiquadFilter();

              filter.type = 'lowpass';
              filter.frequency.setValueAtTime(2200, now);

              osc.type = 'triangle';
              osc.frequency.setValueAtTime(freq, now);

              gain.gain.setValueAtTime(0.0001, now);
              gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

              osc.connect(filter);
              filter.connect(gain);
              gain.connect(destinationGain);

              osc.start(now);
              osc.stop(now + 0.95);
            });
          },
        };
      }

      case 'track-none':
      default: {
        return {
          intervalMs: 10000,
          step: () => {},
        };
      }
    }
  }

  // =========================================================================
  // PREVIEW SYSTEM (Audition tracks with single-playback enforcement)
  // =========================================================================

  public toggleTrackPreview(
    trackId: string,
    customTrack?: CustomUploadedTrack
  ) {
    if (this.activePreviewTrackId === trackId) {
      this.stopPreview();
    } else {
      this.playTrackPreview(trackId, customTrack);
    }
  }

  public playTrackPreview(trackId: string, customTrack?: CustomUploadedTrack) {
    // 1. Stop any currently active preview first (strictly single playback!)
    this.stopPreview();

    // 2. Stop any background room music temporarily while previewing so they don't clash
    const wasRoomPlaying = !!this.activeRoomMusicLoop || !!this.activeCustomAudio;
    if (wasRoomPlaying) {
      this.stopRoomMusic();
    }

    const ctx = this.initContext();
    if (!ctx) return;

    this.activePreviewTrackId = trackId;
    this.notifyPreviewListeners();

    // If 'none' chosen, preview just stops
    if (trackId === 'track-none') {
      return;
    }

    // Custom uploaded audio preview
    if (trackId === 'track-custom' && customTrack?.dataUrl) {
      try {
        const audio = new Audio(customTrack.dataUrl);
        audio.volume = Math.max(0, Math.min(1, this.settings.musicVolume * 0.7));
        audio.loop = true;
        audio.play().catch(() => {});
        this.previewCustomAudio = audio;
      } catch (err) {
        console.error('Error playing custom audio preview:', err);
      }
      return;
    }

    // Synthesized procedural preview
    this.previewGain = ctx.createGain();
    const previewVolume = this.settings.musicVolume * 0.22;
    this.previewGain.gain.setValueAtTime(previewVolume, ctx.currentTime);
    this.previewGain.connect(ctx.destination);

    const synth = this.createTrackSynthesizer(trackId, this.previewGain);
    synth.step(); // Immediate start
    this.previewLoopInterval = window.setInterval(() => {
      synth.step();
    }, synth.intervalMs);
  }

  public stopPreview() {
    if (this.previewLoopInterval) {
      clearInterval(this.previewLoopInterval);
      this.previewLoopInterval = null;
    }
    if (this.previewGain && this.audioCtx) {
      try {
        this.previewGain.gain.setTargetAtTime(0.0001, this.audioCtx.currentTime, 0.05);
      } catch {
        // ignore
      }
      this.previewGain = null;
    }
    if (this.previewCustomAudio) {
      try {
        this.previewCustomAudio.pause();
        this.previewCustomAudio.src = '';
      } catch {
        // ignore
      }
      this.previewCustomAudio = null;
    }
    this.activePreviewTrackId = null;
    this.notifyPreviewListeners();
  }

  public getActivePreviewId(): string | null {
    return this.activePreviewTrackId;
  }

  // =========================================================================
  // ROOM LIVE MUSIC PLAYBACK (For Teacher Host & Connected Students)
  // =========================================================================

  public playRoomMusic(
    config: RoomAudioConfig | undefined,
    localMultiplier: number = 1.0
  ) {
    const effectiveConfig = config || DEFAULT_ROOM_AUDIO_CONFIG;
    this.activeRoomConfig = effectiveConfig;
    this.roomLocalVolumeMultiplier = localMultiplier;

    // If preview is active, don't interrupt preview until preview is stopped
    if (this.activePreviewTrackId) {
      return;
    }

    // Stop current room music first
    this.stopRoomMusic();

    if (!effectiveConfig.musicEnabled || effectiveConfig.selectedTrackId === 'track-none') {
      return;
    }

    const ctx = this.initContext();
    if (!ctx) return;

    // If custom track
    if (
      effectiveConfig.selectedTrackId === 'track-custom' &&
      effectiveConfig.customTrack?.dataUrl
    ) {
      try {
        const audio = new Audio(effectiveConfig.customTrack.dataUrl);
        const nominal = (effectiveConfig.volume ?? 0.5) * this.roomLocalVolumeMultiplier;
        audio.volume = Math.max(0, Math.min(1, nominal));
        audio.loop = true;
        audio.play().catch(() => {});
        this.activeCustomAudio = audio;
      } catch (err) {
        console.error('Error starting room custom audio:', err);
      }
      return;
    }

    // Synthesized procedural room music
    this.activeRoomGain = ctx.createGain();
    const gainValue = this.calculateNominalRoomGain();
    this.activeRoomGain.gain.setValueAtTime(gainValue, ctx.currentTime);
    this.activeRoomGain.connect(ctx.destination);

    const synth = this.createTrackSynthesizer(
      effectiveConfig.selectedTrackId,
      this.activeRoomGain
    );
    synth.step(); // Immediate start

    this.activeRoomMusicLoop = window.setInterval(() => {
      synth.step();
    }, synth.intervalMs);
  }

  public stopRoomMusic() {
    if (this.activeRoomMusicLoop) {
      clearInterval(this.activeRoomMusicLoop);
      this.activeRoomMusicLoop = null;
    }
    if (this.activeRoomGain && this.audioCtx) {
      try {
        this.activeRoomGain.gain.setTargetAtTime(0.0001, this.audioCtx.currentTime, 0.05);
      } catch {
        // ignore
      }
      this.activeRoomGain = null;
    }
    if (this.activeCustomAudio) {
      try {
        this.activeCustomAudio.pause();
        this.activeCustomAudio.src = '';
      } catch {
        // ignore
      }
      this.activeCustomAudio = null;
    }
  }

  public setRoomLocalVolumeMultiplier(multiplier: number) {
    this.roomLocalVolumeMultiplier = Math.max(0, Math.min(1, multiplier));
    this.updateRoomMusicGain();
  }

  public updateLiveRoomConfig(newConfig: RoomAudioConfig) {
    const trackChanged =
      !this.activeRoomConfig ||
      this.activeRoomConfig.selectedTrackId !== newConfig.selectedTrackId ||
      this.activeRoomConfig.musicEnabled !== newConfig.musicEnabled;

    this.activeRoomConfig = newConfig;

    if (trackChanged) {
      this.playRoomMusic(newConfig, this.roomLocalVolumeMultiplier);
    } else {
      this.updateRoomMusicGain();
    }
  }

  // Legacy compatibility for simple toggle
  public startAmbientMusic() {
    this.playRoomMusic(DEFAULT_ROOM_AUDIO_CONFIG);
  }

  public stopAmbientMusic() {
    this.stopRoomMusic();
  }
}

export const soundEffects = new SoundController();
