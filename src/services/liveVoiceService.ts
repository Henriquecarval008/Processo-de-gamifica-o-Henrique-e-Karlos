/**
 * Live Voice Service for GAMEINFOR
 * Implements real-time bidirectional audio conversation via Gemini Live API WebSocket (/live).
 * Features:
 * - Accurate diagnostic error detection for microphone (NotAllowedError, NotFoundError, etc.)
 * - Continuous 16kHz PCM audio streaming
 * - High-fidelity 24kHz PCM audio playback queue
 * - Instant barge-in interruption (clearing audio queue when user speaks or Gemini emits interrupted)
 * - Real-time Audio Analyser for holographic visualizer
 */

export type MicDiagnosticErrorType =
  | 'microphonePermissionDenied'
  | 'microphonePermissionPending'
  | 'microphoneNotFound'
  | 'microphoneBusy'
  | 'microphoneInsecureContext'
  | 'connectionError'
  | 'unknownError';

export interface MicDiagnosticResult {
  success: boolean;
  errorType?: MicDiagnosticErrorType;
  friendlyMessage?: string;
  stream?: MediaStream;
}

export interface LiveVoiceCallbacks {
  onStatusChange: (status: 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error') => void;
  onError: (errorType: MicDiagnosticErrorType, friendlyMessage: string) => void;
  onTranscript: (text: string, role: 'user' | 'assistant') => void;
  onInterrupted: () => void;
  onAudioLevel: (inputLevel: number, outputLevel: number) => void;
}

export interface LiveConversationContext {
  studentName?: string;
  studentLevel?: number;
  studentXp?: number;
  isTakingActivity?: boolean;
  activityTitle?: string;
  currentQuestionText?: string;
  topic?: string;
}

class LiveVoiceService {
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private callbacks: LiveVoiceCallbacks | null = null;

  private isConnected = false;
  private isCapturing = false;
  private isSpeaking = false;
  private nextPlayTime = 0;
  private scheduledSources: AudioBufferSourceNode[] = [];
  private animFrameId: number | null = null;

  /**
   * Precise diagnostic check and acquisition of microphone
   */
  public async diagnoseAndAcquireMicrophone(onPending?: () => void): Promise<MicDiagnosticResult> {
    // 1. Check secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      return {
        success: false,
        errorType: 'microphoneInsecureContext',
        friendlyMessage: 'O acesso ao microfone exige uma conexão segura.',
      };
    }

    // 2. Check if mediaDevices API is available
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return {
        success: false,
        errorType: 'microphoneNotFound',
        friendlyMessage: 'Nenhum microfone foi encontrado neste computador.',
      };
    }

    // 3. Check browser permissions query if available
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const permStatus = await navigator.permissions.query({ name: 'microphone' as any }).catch(() => null);
        if (permStatus && permStatus.state === 'denied') {
          return {
            success: false,
            errorType: 'microphonePermissionDenied',
            friendlyMessage: 'Permissão do microfone bloqueada. Clique no ícone de cadeado do navegador e permita o microfone.',
          };
        }
        if (permStatus && permStatus.state === 'prompt') {
          onPending?.();
        }
      }
    } catch {
      // Ignore permission query error
    }

    onPending?.();

    // 4. Request audio stream with fallback handling
    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (constraintErr: any) {
        const cName = constraintErr?.name || '';
        // If it's a security or permission error, propagate directly
        if (
          cName === 'NotAllowedError' ||
          cName === 'PermissionDeniedError' ||
          cName === 'SecurityError' ||
          cName === 'NotFoundError' ||
          cName === 'DevicesNotFoundError'
        ) {
          throw constraintErr;
        }
        // If overconstrained or device settings rejected, retry with basic audio: true
        console.warn('[LiveVoiceService] Falha nas restrições avançadas de áudio, usando fallback básico:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      return {
        success: true,
        stream,
      };
    } catch (err: any) {
      console.warn('[LiveVoiceService] Erro detalhado no getUserMedia:', err);

      const errName = err?.name || '';

      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        return {
          success: false,
          errorType: 'microphonePermissionDenied',
          friendlyMessage: 'Permissão do microfone bloqueada. Clique no ícone de cadeado do navegador e permita o microfone.',
        };
      }

      if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        return {
          success: false,
          errorType: 'microphoneNotFound',
          friendlyMessage: 'Nenhum microfone foi encontrado neste computador.',
        };
      }

      if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        return {
          success: false,
          errorType: 'microphoneBusy',
          friendlyMessage: 'O microfone está sendo utilizado por outro aplicativo.',
        };
      }

      if (errName === 'SecurityError') {
        return {
          success: false,
          errorType: 'microphoneInsecureContext',
          friendlyMessage: 'O acesso ao microfone exige uma conexão segura.',
        };
      }

      if (errName === 'OverconstrainedError') {
        return {
          success: false,
          errorType: 'unknownError',
          friendlyMessage: 'Não foi possível acessar o microfone. Tente novamente.',
        };
      }

      return {
        success: false,
        errorType: 'unknownError',
        friendlyMessage: 'Não foi possível acessar o microfone. Tente novamente.',
      };
    }
  }

  /**
   * Diagnostic test of microphone access without starting full Gemini Live session
   */
  public async testMicrophoneAccess(onPending?: () => void): Promise<MicDiagnosticResult> {
    const result = await this.diagnoseAndAcquireMicrophone(onPending);
    if (result.success && result.stream) {
      // Immediately stop all tracks to release hardware
      result.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
    }
    return result;
  }

  /**
   * Connect to Gemini Live API WebSocket and start continuous real-time session
   */
  public async startLiveSession(
    callbacks: LiveVoiceCallbacks,
    context: LiveConversationContext,
    sendGreeting = true
  ): Promise<boolean> {
    this.stopSession();
    this.callbacks = callbacks;
    callbacks.onStatusChange('connecting');

    // 1. Acquire and diagnose microphone FIRST before any WebSocket connection
    const micResult = await this.diagnoseAndAcquireMicrophone(() => {
      callbacks.onError(
        'microphonePermissionPending',
        'Autorize o microfone para começar a conversa.'
      );
    });

    if (!micResult.success || !micResult.stream) {
      callbacks.onError(
        micResult.errorType || 'unknownError',
        micResult.friendlyMessage || 'Não foi possível acessar o microfone. Tente novamente.'
      );
      callbacks.onStatusChange('error');
      return false;
    }

    this.mediaStream = micResult.stream;

    // 2. Open WebSocket connection to /live ONLY after microphone is confirmed
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/live`;

    try {
      this.ws = new WebSocket(wsUrl);
    } catch (wsErr) {
      console.error('[LiveVoiceService] Erro ao criar WebSocket:', wsErr);
      callbacks.onError('connectionError', 'Problema de conexão com o servidor de voz.');
      callbacks.onStatusChange('error');
      this.cleanupMedia();
      return false;
    }

    return new Promise((resolve) => {
      if (!this.ws) return resolve(false);

      this.ws.onopen = () => {
        this.isConnected = true;

        // Send initialization payload to server
        this.ws?.send(
          JSON.stringify({
            type: 'init',
            context,
            sendGreeting,
          })
        );
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'ready') {
            // Live session ready, start continuous audio capture & playback
            this.setupAudioPipelines();
            this.callbacks?.onStatusChange('listening');
            resolve(true);
            return;
          }

          if (data.type === 'audio' && data.audio) {
            // Received 24kHz PCM audio chunk from Gemini Live
            this.enqueueAudioChunk(data.audio);
            return;
          }

          if (data.type === 'transcript' && data.text) {
            this.callbacks?.onTranscript(data.text, data.role || 'assistant');
            return;
          }

          if (data.type === 'interrupted') {
            this.handleInterruption();
            return;
          }

          if (data.type === 'turn_complete') {
            // Model finished generating turn
            // If nothing is actively playing, switch back to listening
            if (this.scheduledSources.length === 0) {
              this.isSpeaking = false;
              this.callbacks?.onStatusChange('listening');
            }
            return;
          }

          if (data.type === 'error') {
            console.warn('[LiveVoiceService] Erro recebido da Live API:', data.error);
            this.callbacks?.onError('connectionError', data.error || 'Erro na sessão de voz em tempo real.');
            this.callbacks?.onStatusChange('error');
            return;
          }
        } catch (parseErr) {
          console.error('[LiveVoiceService] Erro ao processar mensagem WebSocket:', parseErr);
        }
      };

      this.ws.onerror = (e) => {
        console.error('[LiveVoiceService] WebSocket error:', e);
        this.callbacks?.onError('connectionError', 'Problema de conexão com o servidor. Verifique sua rede e tente novamente.');
        this.callbacks?.onStatusChange('error');
        this.stopSession();
        resolve(false);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.isCapturing) {
          this.callbacks?.onStatusChange('idle');
        }
        this.stopSession();
      };
    });
  }

  /**
   * Setup AudioContext pipelines for 16kHz capture and 24kHz playback
   */
  private setupAudioPipelines(): void {
    if (!this.mediaStream) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;

      // Output context for playback (24kHz is standard Gemini Live output sample rate)
      this.outputAudioCtx = new AudioCtx({ sampleRate: 24000 });
      this.outputAnalyser = this.outputAudioCtx.createAnalyser();
      this.outputAnalyser.fftSize = 64;
      this.outputAnalyser.connect(this.outputAudioCtx.destination);
      this.nextPlayTime = this.outputAudioCtx.currentTime;

      // Input context for mic capture
      this.inputAudioCtx = new AudioCtx({ sampleRate: 16000 });
      const source = this.inputAudioCtx.createMediaStreamSource(this.mediaStream);

      this.inputAnalyser = this.inputAudioCtx.createAnalyser();
      this.inputAnalyser.fftSize = 64;
      source.connect(this.inputAnalyser);

      // ScriptProcessor buffer size: 2048 gives ~128ms chunks at 16kHz
      this.scriptProcessor = this.inputAudioCtx.createScriptProcessor(2048, 1, 1);
      source.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.inputAudioCtx.destination);

      this.isCapturing = true;

      this.scriptProcessor.onaudioprocess = (e) => {
        if (!this.isCapturing || !this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // Convert Float32 to 16-bit linear PCM little-endian
        const pcm16 = new Int16Array(inputData.length);
        let sumSquares = 0;

        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          sumSquares += s * s;
        }

        const rms = Math.sqrt(sumSquares / inputData.length);

        // Client-side Barge-in VAD: If the student speaks firmly while the assistant is speaking,
        // instantly cut the output audio locally!
        if (this.isSpeaking && rms > 0.045) {
          this.handleInterruption();
          this.ws.send(JSON.stringify({ type: 'interrupt' }));
        }

        // Convert Int16Array to base64
        const buffer = pcm16.buffer;
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Audio = btoa(binary);

        // Send realtime audio chunk
        this.ws.send(
          JSON.stringify({
            type: 'audio',
            audio: base64Audio,
          })
        );
      };

      // Start level monitoring loop for UI visualizer
      this.startLevelLoop();
    } catch (pipelineErr) {
      console.error('[LiveVoiceService] Erro ao configurar pipelines de áudio:', pipelineErr);
    }
  }

  /**
   * Monitor audio levels for both mic input and model output to drive the holographic orb
   */
  private startLevelLoop(): void {
    const inputBuf = new Uint8Array(32);
    const outputBuf = new Uint8Array(32);

    const updateLevels = () => {
      if (!this.isCapturing) return;

      let inLevel = 0;
      let outLevel = 0;

      if (this.inputAnalyser) {
        this.inputAnalyser.getByteFrequencyData(inputBuf);
        let sum = 0;
        for (let i = 0; i < inputBuf.length; i++) sum += inputBuf[i];
        inLevel = sum / (inputBuf.length * 255);
      }

      if (this.outputAnalyser && this.isSpeaking) {
        this.outputAnalyser.getByteFrequencyData(outputBuf);
        let sum = 0;
        for (let i = 0; i < outputBuf.length; i++) sum += outputBuf[i];
        outLevel = sum / (outputBuf.length * 255);
      }

      this.callbacks?.onAudioLevel(inLevel, outLevel);
      this.animFrameId = requestAnimationFrame(updateLevels);
    };

    this.animFrameId = requestAnimationFrame(updateLevels);
  }

  /**
   * Playback raw 24kHz PCM chunks from Gemini Live without latency or clicks
   */
  private enqueueAudioChunk(base64Audio: string): void {
    if (!this.outputAudioCtx || !this.outputAnalyser) return;

    try {
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = this.outputAudioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const sourceNode = this.outputAudioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(this.outputAnalyser);

      const currentTime = this.outputAudioCtx.currentTime;
      const startTime = Math.max(currentTime, this.nextPlayTime);
      sourceNode.start(startTime);
      this.nextPlayTime = startTime + audioBuffer.duration;

      this.scheduledSources.push(sourceNode);

      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.callbacks?.onStatusChange('speaking');
      }

      sourceNode.onended = () => {
        const idx = this.scheduledSources.indexOf(sourceNode);
        if (idx !== -1) {
          this.scheduledSources.splice(idx, 1);
        }

        // If all scheduled chunks have completed
        if (this.scheduledSources.length === 0 && this.outputAudioCtx) {
          if (this.outputAudioCtx.currentTime >= this.nextPlayTime - 0.05) {
            this.isSpeaking = false;
            this.callbacks?.onStatusChange('listening');
          }
        }
      };
    } catch (decodeErr) {
      console.warn('[LiveVoiceService] Erro ao decodificar chunk PCM:', decodeErr);
    }
  }

  /**
   * Interruption (Barge-in): Immediately stop output playback and clear queue
   */
  public handleInterruption(): void {
    if (this.scheduledSources.length > 0) {
      for (const source of this.scheduledSources) {
        try {
          source.stop();
          source.disconnect();
        } catch {}
      }
      this.scheduledSources = [];
    }

    if (this.outputAudioCtx) {
      this.nextPlayTime = this.outputAudioCtx.currentTime;
    }

    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.callbacks?.onStatusChange('listening');
      this.callbacks?.onInterrupted();
    }
  }

  /**
   * Send text prompt into the current live session
   */
  public sendTextMessage(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.handleInterruption();
    this.callbacks?.onStatusChange('thinking');
    this.ws.send(JSON.stringify({ type: 'text', text }));
  }

  /**
   * Cleanly stop session, release microphone tracks and audio context resources
   */
  public stopSession(): void {
    this.isCapturing = false;
    this.isConnected = false;
    this.isSpeaking = false;

    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.handleInterruption();

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch {}
      this.scriptProcessor = null;
    }

    if (this.inputAudioCtx) {
      try {
        this.inputAudioCtx.close();
      } catch {}
      this.inputAudioCtx = null;
    }

    if (this.outputAudioCtx) {
      try {
        this.outputAudioCtx.close();
      } catch {}
      this.outputAudioCtx = null;
    }

    this.cleanupMedia();

    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }

    this.callbacks?.onStatusChange('idle');
  }

  private cleanupMedia(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.mediaStream = null;
    }
  }

  public getIsActive(): boolean {
    return this.isCapturing && this.isConnected;
  }
}

export const liveVoiceService = new LiveVoiceService();
