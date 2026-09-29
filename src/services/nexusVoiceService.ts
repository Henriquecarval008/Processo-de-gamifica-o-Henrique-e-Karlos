/**
 * NEXUS Voice Service
 * 
 * Manages:
 * - Voice catalog (Original NEXUS Prime, NEXUS Fenrir, System voices, Cove placeholder, Custom voice)
 * - User audio preferences (voice ID, speechEnabled, volume, rate, pitch)
 * - Playback, sample testing, interruption, and repeat of last response
 * - Persistent storage via localStorage
 */

export interface NexusVoiceOption {
  id: string;
  name: string;
  category: 'nexus_original' | 'gemini_live' | 'system_webspeech' | 'cove_openai' | 'custom_licensed';
  gender: 'masculino' | 'feminino' | 'neutro';
  description: string;
  isAvailable: boolean;
  statusNote?: string;
  sampleText?: string;
  systemVoiceURI?: string;
}

export interface NexusVoiceSettings {
  selectedVoiceId: string;
  speechEnabled: boolean;
  volume: number; // 0.0 to 1.0
  rate: number;   // 0.75 to 1.5
  pitch: number;  // 0.8 to 1.2
}

const STORAGE_SETTINGS_KEY = 'nexus_voice_settings_v2';
const DEFAULT_SETTINGS: NexusVoiceSettings = {
  selectedVoiceId: 'nexus-prime',
  speechEnabled: true,
  volume: 0.9,
  rate: 1.05,
  pitch: 0.95, // slightly deeper masculine tone
};

class NexusVoiceService {
  private settings: NexusVoiceSettings;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private lastSpokenText: string = '';
  private systemVoices: SpeechSynthesisVoice[] = [];
  private listeners: Set<(settings: NexusVoiceSettings) => void> = new Set();

  constructor() {
    this.settings = this.loadSettings();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadSystemVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadSystemVoices();
      };
    }
  }

  private loadSettings(): NexusVoiceSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  }

  private saveSettings(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(this.settings));
      this.listeners.forEach((cb) => cb(this.settings));
    } catch {}
  }

  private loadSystemVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.systemVoices = window.speechSynthesis.getVoices();
  }

  public subscribe(cb: (settings: NexusVoiceSettings) => void): () => void {
    this.listeners.add(cb);
    cb(this.settings);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public getSettings(): NexusVoiceSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<NexusVoiceSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.saveSettings();
  }

  public resetToDefault(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
  }

  /**
   * Complete list of voices with availability status
   */
  public getAvailableVoices(): NexusVoiceOption[] {
    const list: NexusVoiceOption[] = [
      {
        id: 'nexus-prime',
        name: 'NEXUS Prime (Voz Original)',
        category: 'nexus_original',
        gender: 'masculino',
        description: 'Voz masculina nativa do NEXUS, profunda, natural e acolhedora para aprendizado contínuo.',
        isAvailable: true,
        sampleText: 'Olá! Eu sou o Nexus, assistente de inteligência artificial do GAMEINFOR. Como posso apoiar seus estudos hoje?',
      },
      {
        id: 'nexus-fenrir',
        name: 'NEXUS Fenrir (Dinâmica & Rápida)',
        category: 'gemini_live',
        gender: 'masculino',
        description: 'Voz masculina jovem e ágil, com entonação focada em explicações rápidas e desafios de código.',
        isAvailable: true,
        sampleText: 'Pronto para o próximo desafio! Qual conceito ou atividade vamos revisar agora?',
      },
    ];

    // Detect system Brazilian Portuguese masculine or generic voices
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const ptVoices = this.systemVoices.filter(
        (v) => v.lang === 'pt-BR' || v.lang.startsWith('pt')
      );

      ptVoices.forEach((v, index) => {
        const isMale =
          v.name.toLowerCase().includes('daniel') ||
          v.name.toLowerCase().includes('ricardo') ||
          v.name.toLowerCase().includes('felipe') ||
          v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('homem') ||
          index === 0;

        list.push({
          id: `sys-${v.name}`,
          name: `${v.name} (${v.lang})`,
          category: 'system_webspeech',
          gender: isMale ? 'masculino' : 'neutro',
          description: `Voz local do dispositivo (${v.name}). Utiliza síntese nativa de alta velocidade.`,
          isAvailable: true,
          systemVoiceURI: v.voiceURI,
          sampleText: 'Olá! Esta é uma demonstração da voz sintetizada localmente no seu navegador.',
        });
      });
    }

    // Future & Partner Voices (clearly marked with real status)
    list.push({
      id: 'voice-cove-openai',
      name: 'Voz Cove (ChatGPT / OpenAI)',
      category: 'cove_openai',
      gender: 'masculino',
      description: 'Voz masculina conversacional famosa do ChatGPT. Arquitetura pronta para conexão via endpoint autorizado.',
      isAvailable: false,
      statusNote: 'Em homologação. Requer configuração de chave de API externa autorizada da OpenAI.',
      sampleText: 'Esta é uma amostra da tonalidade Cove para assistentes conversacionais.',
    });

    list.push({
      id: 'voice-custom-dubbing',
      name: 'Voz Personalizada (Dublador Licenciado)',
      category: 'custom_licensed',
      gender: 'masculino',
      description: 'Módulo para voz customizada por IA de dublador institucional mediante licenciamento.',
      isAvailable: false,
      statusNote: 'Preparado na arquitetura para futuro upload de modelo de voz com autorização prévia.',
      sampleText: 'Demonstração de modelo neural de voz customizada do Instituto Ambiente.',
    });

    return list;
  }

  /**
   * Speak response with selected voice settings
   */
  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    if (!this.settings.speechEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();
    this.lastSpokenText = text;

    // Clean text from markdown formatting
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#+\s/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[•–—]/g, ' ')
      .trim();

    if (!cleanText) {
      if (onEnd) onEnd();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.volume = this.settings.volume;
      utterance.rate = this.settings.rate;
      utterance.pitch = this.settings.pitch;

      // Match chosen voice
      const voices = window.speechSynthesis.getVoices();
      if (this.settings.selectedVoiceId.startsWith('sys-')) {
        const sysName = this.settings.selectedVoiceId.replace('sys-', '');
        const matched = voices.find((v) => v.name === sysName);
        if (matched) utterance.voice = matched;
      } else {
        // For nexus-prime or fenrir, pick best available PT-BR voice
        const ptVoices = voices.filter((v) => v.lang === 'pt-BR' || v.lang.startsWith('pt'));
        const maleVoice =
          ptVoices.find(
            (v) =>
              v.name.toLowerCase().includes('daniel') ||
              v.name.toLowerCase().includes('ricardo') ||
              v.name.toLowerCase().includes('male')
          ) ||
          ptVoices[0] ||
          voices[0];

        if (maleVoice) utterance.voice = maleVoice;

        if (this.settings.selectedVoiceId === 'nexus-fenrir') {
          utterance.rate = Math.min(this.settings.rate * 1.1, 1.4);
          utterance.pitch = Math.min(this.settings.pitch * 1.05, 1.2);
        }
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        this.currentUtterance = null;
        if (onError) onError(e);
        if (onEnd) onEnd();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      if (onError) onError(e);
      if (onEnd) onEnd();
    }
  }

  public stopSpeaking(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
      this.currentUtterance = null;
    }
  }

  /**
   * Test a specific voice sample immediately
   */
  public testVoice(
    voiceId: string,
    onStart?: () => void,
    onEnd?: () => void
  ): void {
    const voice = this.getAvailableVoices().find((v) => v.id === voiceId);
    if (!voice || !voice.isAvailable) {
      if (onEnd) onEnd();
      return;
    }

    const previousVoice = this.settings.selectedVoiceId;
    this.settings.selectedVoiceId = voiceId;
    const sample = voice.sampleText || 'Olá! Eu sou o Nexus, assistente educacional.';

    this.speak(
      sample,
      onStart,
      () => {
        this.settings.selectedVoiceId = previousVoice;
        if (onEnd) onEnd();
      },
      () => {
        this.settings.selectedVoiceId = previousVoice;
        if (onEnd) onEnd();
      }
    );
  }

  /**
   * Repeat the last assistant response
   */
  public repeatLastResponse(onStart?: () => void, onEnd?: () => void): void {
    if (!this.lastSpokenText) return;
    this.speak(this.lastSpokenText, onStart, onEnd);
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }
}

export const nexusVoiceService = new NexusVoiceService();
