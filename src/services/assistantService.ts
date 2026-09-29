/**
 * Assistant Service for GAMEINFOR
 * Provides client-side interface to /api/assistant/chat,
 * Full Web Speech Recognition + MediaRecorder fallback for reliable voice input,
 * and Speech Synthesis for voice responses.
 */

import { nexusVoiceService } from './nexusVoiceService';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isHintOnly?: boolean;
}

export interface AssistantContext {
  isTakingActivity?: boolean;
  activityType?: 'quiz' | 'exercise' | 'assignment' | 'general';
  activityTitle?: string;
  currentQuestionText?: string;
  topic?: string;
  studentName?: string;
  studentLevel?: number;
  studentXp?: number;
}

export interface AssistantChatResponse {
  text: string;
  recognizedQuestion?: string;
  mode: 'normal' | 'hint_only';
  isTakingActivity: boolean;
  error?: string;
}

export interface VoiceRecordingResult {
  transcript?: string;
  audioBase64?: string;
  audioMimeType?: string;
}

class AssistantService {
  private recognition: any = null;
  private isRecognitionSupported = false;
  private isSynthesisSupported = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private voiceEnabled = true;

  // MediaRecorder state
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.isRecognitionSupported = Boolean(SpeechRecognition);
      this.isSynthesisSupported = 'speechSynthesis' in window;

      // Restore voice preference from localStorage
      const stored = localStorage.getItem('gameinfor_assistant_voice_enabled');
      if (stored !== null) {
        this.voiceEnabled = stored === 'true';
      }
    }
  }

  public isVoiceSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      (this.isRecognitionSupported || Boolean(navigator?.mediaDevices?.getUserMedia))
    );
  }

  public isVoiceSynthesisSupported(): boolean {
    return this.isSynthesisSupported;
  }

  public getVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  public setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gameinfor_assistant_voice_enabled', String(enabled));
    }
    if (!enabled) {
      this.stopSpeaking();
    }
  }

  /**
   * Request microphone permission explicitly via getUserMedia
   */
  public async requestMicrophonePermission(): Promise<{
    granted: boolean;
    stream?: MediaStream;
    error?: string;
  }> {
    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      return {
        granted: false,
        error: 'Seu navegador não oferece suporte para gravação de microfone.',
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      return { granted: true, stream };
    } catch (err: any) {
      let friendlyMsg = 'Não foi possível acessar o microfone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMsg =
          'Permissão de microfone negada. Por favor, autorize o microfone no ícone de cadeado do navegador para falar com o assistente.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMsg = 'Nenhum microfone foi encontrado no seu dispositivo.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        friendlyMsg = 'O microfone está em uso por outro aplicativo.';
      }
      return { granted: false, error: friendlyMsg };
    }
  }

  /**
   * Send a query (text or audio) to the backend assistant endpoint.
   */
  public async sendMessage(
    message: string,
    history: ChatMessage[],
    context: AssistantContext,
    audioPayload?: { audioBase64?: string; audioMimeType?: string }
  ): Promise<AssistantChatResponse> {
    try {
      const payloadHistory = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // NOTE: We never send the correct answer or solution key in the context payload!
      const safeContext: AssistantContext = {
        isTakingActivity: Boolean(context.isTakingActivity),
        activityType: context.activityType || 'general',
        activityTitle: context.activityTitle || 'Atividade',
        currentQuestionText: context.currentQuestionText || '',
        topic: context.topic || 'Informática',
        studentName: context.studentName || 'Aluno',
        studentLevel: context.studentLevel || 1,
      };

      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message || '',
          audioBase64: audioPayload?.audioBase64,
          audioMimeType: audioPayload?.audioMimeType,
          history: payloadHistory,
          context: safeContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro do servidor: ${response.status}`);
      }

      const data: AssistantChatResponse = await response.json();
      return data;
    } catch (err: any) {
      console.error('[assistantService] Falha na requisição:', err);
      return {
        text:
          'Não consegui me conectar com o servidor no momento. ' +
          'Se você estiver estudando para uma atividade, lembre-se de analisar as opções com calma e relacionar com o que vimos nas aulas!',
        mode: context.isTakingActivity ? 'hint_only' : 'normal',
        isTakingActivity: Boolean(context.isTakingActivity),
        error: err.message,
      };
    }
  }

  /**
   * Start listening with dual engine:
   * 1. SpeechRecognition for instant live transcript
   * 2. MediaRecorder for audio capture fallback
   */
  public async startListening(
    onLiveTranscript: (transcript: string, isFinal: boolean) => void,
    onReady: () => void,
    onError: (errorMessage: string) => void,
    onComplete: (result: VoiceRecordingResult) => void
  ): Promise<() => void> {
    this.stopSpeaking();

    // 1. Request microphone access
    const permResult = await this.requestMicrophonePermission();
    if (!permResult.granted || !permResult.stream) {
      onError(permResult.error || 'Permissão de microfone necessária.');
      return () => {};
    }

    this.mediaStream = permResult.stream;
    this.audioChunks = [];
    let recognizedTranscript = '';
    let isStopped = false;

    // 2. Initialize MediaRecorder (handles audio capture across all browsers)
    try {
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);

      this.mediaRecorder = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      recorder.start(200); // Collect data every 200ms
    } catch (recorderErr) {
      console.warn('MediaRecorder init fallback:', recorderErr);
    }

    // 3. Initialize Web Speech API for real-time speech-to-text preview
    if (this.isRecognitionSupported && typeof window !== 'undefined') {
      try {
        const SpeechRecognition =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'pt-BR';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        this.recognition.onresult = (event: any) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }

          if (final) {
            recognizedTranscript = final;
            onLiveTranscript(final, true);
          } else if (interim) {
            onLiveTranscript(interim, false);
          }
        };

        this.recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition warning:', e.error);
          // Don't abort immediately because MediaRecorder might still capture audio!
        };

        this.recognition.onend = () => {
          // If recognition ended naturally, finish listening
          if (!isStopped) {
            stopFunction();
          }
        };

        this.recognition.start();
      } catch (recErr) {
        console.warn('SpeechRecognition start warning:', recErr);
      }
    }

    onReady();

    // 4. Return the stop function that finalizes audio or text
    const stopFunction = async () => {
      if (isStopped) return;
      isStopped = true;

      // Stop speech recognition
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch {}
        this.recognition = null;
      }

      // Stop MediaRecorder and collect Blob
      let audioBlob: Blob | null = null;
      let audioBase64: string | undefined = undefined;
      const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          if (!this.mediaRecorder) return resolve();
          this.mediaRecorder.onstop = () => resolve();
          try {
            this.mediaRecorder.stop();
          } catch {
            resolve();
          }
        });
      }

      // Stop microphone stream tracks
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }

      if (this.audioChunks.length > 0) {
        audioBlob = new Blob(this.audioChunks, { type: mimeType });
        this.audioChunks = [];

        try {
          audioBase64 = await this.blobToBase64(audioBlob);
        } catch (b64Err) {
          console.warn('Error converting blob to base64:', b64Err);
        }
      }

      onComplete({
        transcript: recognizedTranscript.trim(),
        audioBase64,
        audioMimeType: mimeType,
      });
    };

    return stopFunction;
  }

  /**
   * Helper: Convert Blob to base64 string
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/xxx;base64, prefix
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {}
      this.mediaRecorder = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  /**
   * Speak text using Nexus Voice Service
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    nexusVoiceService.speak(text, onStart, onEnd, onError);
  }

  public stopSpeaking(): void {
    nexusVoiceService.stopSpeaking();
  }
}

export const assistantService = new AssistantService();
