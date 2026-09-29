import React, { useState, useEffect, useRef } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  liveVoiceService,
  MicDiagnosticErrorType,
} from '../../services/liveVoiceService';
import { assistantService, ChatMessage } from '../../services/assistantService';
import { nexusVoiceService } from '../../services/nexusVoiceService';
import { soundEffects } from '../../utils/soundEffects';
import {
  Bot,
  Mic,
  MicOff,
  Radio,
  Square,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Send,
  MessageSquare,
  Activity,
  Zap,
  CheckCircle,
  Headphones,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Briefcase,
  Terminal,
  HelpCircle,
  Sliders,
  Flame,
  Check,
  Info,
} from 'lucide-react';
import { NexusRobotFace, NexusFaceStatus } from './NexusRobotFace';
import { NexusCyberBackground } from './NexusCyberBackground';
import { NexusVoiceSettingsModal } from './NexusVoiceSettingsModal';
import { NexusTaskAutomationModal } from './NexusTaskAutomationModal';
import { NexusEmotion, NexusSubject, NexusLearningMode } from '../../types';

export const GameinforVoiceAssistant: React.FC = () => {
  const {
    currentUser,
    isAssistantOpen,
    closeAssistant,
    openAssistant,
    toggleAssistant,
    assistantContext,
    assistantInitialPrompt,
    clearAssistantInitialPrompt,
  } = useGameinfor();

  // Mode: 'live' (Real-time Gemini Live Voice) | 'text' (Interactive Chat)
  const [activeMode, setActiveMode] = useState<'live' | 'text'>('live');

  // Assistant State
  const [liveStatus, setLiveStatus] = useState<NexusFaceStatus>('idle');
  const [currentEmotion, setCurrentEmotion] = useState<NexusEmotion>('neutro');
  const [micErrorType, setMicErrorType] = useState<MicDiagnosticErrorType | null>(null);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [micTestSuccess, setMicTestSuccess] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);

  // Settings & Modals
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Text Mode Voice Dictation
  const [isRecordingInTextMode, setIsRecordingInTextMode] = useState(false);
  const stopTextRecordingRef = useRef<(() => void) | null>(null);

  // Multidisciplinary Subject & Learning Mode
  const [activeSubject, setActiveSubject] = useState<NexusSubject>('informatica');
  const [activeLearningMode, setActiveLearningMode] = useState<NexusLearningMode>('explicacao');

  // Live Transcripts
  const [liveTranscripts, setLiveTranscripts] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; text: string; timestamp: string }>
  >([]);

  // Text Mode Chat History
  const [textMessages, setTextMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Olá, ' +
        (currentUser.nickname || currentUser.name.split(' ')[0] || 'estudante') +
        '! Eu sou o NEXUS, assistente inteligente cyber educacional do Instituto Ambiente. Estou online e pronto para apoiar seus estudos. Sobre qual área ou dúvida gostaria de conversar?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [textInput, setTextInput] = useState('');
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [isTextSpeaking, setIsTextSpeaking] = useState(false);

  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  const textEndRef = useRef<HTMLDivElement>(null);

  const isTakingActivity = Boolean(assistantContext?.isTakingActivity);

  // Auto-scroll transcripts & chat
  useEffect(() => {
    transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    textEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveTranscripts, textMessages, liveStatus]);

  // Handle incoming initial prompt from context (e.g., clicking "Dica do Tutor" on a Quiz)
  useEffect(() => {
    if (assistantInitialPrompt && isAssistantOpen) {
      if (activeMode === 'live' && liveVoiceService.getIsActive()) {
        liveVoiceService.sendTextMessage(assistantInitialPrompt);
      } else {
        handleSendTextMessage(assistantInitialPrompt);
      }
      clearAssistantInitialPrompt();
    }
  }, [assistantInitialPrompt, isAssistantOpen]);

  // Clean disconnect on unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      liveVoiceService.stopSession();
      nexusVoiceService.stopSpeaking();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      liveVoiceService.stopSession();
      nexusVoiceService.stopSpeaking();
    };
  }, []);

  // Synchronize emotion tags from incoming assistant text
  const extractEmotionFromText = (rawText: string): { clean: string; emotion: NexusEmotion | null } => {
    const emotionMatch = rawText.match(/\[EMOTION:\s*([a-zA-Z_]+)\]/i);
    if (emotionMatch && emotionMatch[1]) {
      const parsed = emotionMatch[1].toLowerCase() as NexusEmotion;
      const clean = rawText.replace(/\[EMOTION:\s*[a-zA-Z_]+\]/gi, '').trim();
      return { clean, emotion: parsed };
    }
    return { clean: rawText, emotion: null };
  };

  // Test Microphone Diagnostic
  const handleTestMicrophone = async () => {
    soundEffects.playClick();
    setIsTestingMic(true);
    setMicErrorType(null);
    setMicErrorMessage(null);
    setMicTestSuccess(false);

    const result = await liveVoiceService.diagnoseAndAcquireMicrophone();
    setIsTestingMic(false);

    if (result.success) {
      setMicTestSuccess(true);
      soundEffects.playCorrect();
      setTimeout(() => setMicTestSuccess(false), 5000);
    } else {
      soundEffects.playWrong();
      setMicErrorType(result.errorType || 'unknownError');
      setMicErrorMessage(result.friendlyMessage || 'Erro ao testar microfone.');
    }
  };

  // Start Real-Time Live Voice Session
  const handleStartLiveConversation = async () => {
    soundEffects.playClick();
    setMicErrorType(null);
    setMicErrorMessage(null);
    nexusVoiceService.stopSpeaking();

    const started = await liveVoiceService.startLiveSession(
      {
        onStatusChange: (status: NexusFaceStatus) => {
          setLiveStatus(status);
          if (status === 'speaking') {
            setCurrentEmotion('satisfacao');
          } else if (status === 'listening') {
            setCurrentEmotion('atencao');
          } else if (status === 'thinking') {
            setCurrentEmotion('processamento');
          }
        },
        onError: (errorType: MicDiagnosticErrorType, friendlyMsg: string) => {
          setMicErrorType(errorType);
          setMicErrorMessage(friendlyMsg);
          setLiveStatus('error');
          soundEffects.playWrong();
        },
        onTranscript: (text: string, role: 'user' | 'assistant') => {
          const { clean, emotion } = extractEmotionFromText(text);
          if (emotion) setCurrentEmotion(emotion);

          setLiveTranscripts((prev) => [
            ...prev,
            {
              id: `tr-${Date.now()}-${Math.random()}`,
              role,
              text: clean,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        },
        onInterrupted: () => {
          soundEffects.playClick();
        },
        onAudioLevel: (inLevel: number, outLevel: number) => {
          setInputAudioLevel(inLevel);
          setOutputAudioLevel(outLevel);
        },
      },
      {
        studentName: currentUser.nickname || currentUser.name.split(' ')[0],
        studentLevel: currentUser.level,
        studentXp: currentUser.xp,
        isTakingActivity: assistantContext.isTakingActivity,
        activityTitle: assistantContext.activityTitle,
        currentQuestionText: assistantContext.currentQuestionText,
        topic: assistantContext.topic || activeSubject,
      },
      true
    );

    if (started) {
      soundEffects.playCorrect();
    }
  };

  // Stop Live Voice Session
  const handleStopLiveConversation = () => {
    soundEffects.playClick();
    liveVoiceService.stopSession();
    setLiveStatus('idle');
    setInputAudioLevel(0);
    setOutputAudioLevel(0);
    setCurrentEmotion('neutro');
  };

  // Manual interrupt of assistant speech
  const handleManualInterrupt = () => {
    soundEffects.playClick();
    if (activeMode === 'live') {
      liveVoiceService.handleInterruption();
    } else {
      nexusVoiceService.stopSpeaking();
      setIsTextSpeaking(false);
      setOutputAudioLevel(0);
    }
  };

  // Send Text Mode Message
  const handleSendTextMessage = async (customText?: string) => {
    const messageToSend = (customText || textInput).trim();
    if (!messageToSend || isTextLoading) return;

    soundEffects.playClick();
    if (!customText) setTextInput('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTextMessages((prev) => [...prev, userMsg]);
    setIsTextLoading(true);
    setCurrentEmotion('processamento');
    nexusVoiceService.stopSpeaking();
    setIsTextSpeaking(false);

    try {
      const response = await assistantService.sendMessage(
        messageToSend,
        textMessages,
        {
          isTakingActivity: assistantContext.isTakingActivity,
          activityType: assistantContext.activityType,
          activityTitle: assistantContext.activityTitle,
          currentQuestionText: assistantContext.currentQuestionText,
          topic: `[Disciplina: ${activeSubject.toUpperCase()}] [Modo: ${activeLearningMode.toUpperCase()}] ${assistantContext.topic || ''}`,
          studentName: currentUser.nickname || currentUser.name.split(' ')[0],
          studentLevel: currentUser.level,
          studentXp: currentUser.xp,
        }
      );

      setIsTextLoading(false);
      const { clean, emotion } = extractEmotionFromText(response.text);
      if (emotion) setCurrentEmotion(emotion);
      else setCurrentEmotion('satisfacao');

      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        role: 'assistant',
        content: clean,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isHintOnly: response.mode === 'hint_only',
      };

      setTextMessages((prev) => [...prev, assistantMsg]);

      // If speech is enabled in Nexus Voice Service, speak response naturally!
      if (nexusVoiceService.getSettings().speechEnabled) {
        setIsTextSpeaking(true);
        // Simulate output audio amplitude modulation for the cyber face equalizer
        const audioInterval = setInterval(() => {
          setOutputAudioLevel(Math.random() * 0.7 + 0.2);
        }, 120);

        nexusVoiceService.speak(
          clean,
          () => {
            setIsTextSpeaking(true);
          },
          () => {
            clearInterval(audioInterval);
            setIsTextSpeaking(false);
            setOutputAudioLevel(0);
          },
          () => {
            clearInterval(audioInterval);
            setIsTextSpeaking(false);
            setOutputAudioLevel(0);
          }
        );
      }
    } catch (err: any) {
      setIsTextLoading(false);
      setCurrentEmotion('seriedade');
      setTextMessages((prev) => [
        ...prev,
        {
          id: `assist-err-${Date.now()}`,
          role: 'assistant',
          content: 'Desculpe, ocorreu uma instabilidade na conexão. Pode repetir sua pergunta?',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Toggle microphone dictation in Text Chat Mode
  const handleToggleTextVoiceRecording = async () => {
    if (isRecordingInTextMode) {
      soundEffects.playClick();
      if (stopTextRecordingRef.current) {
        stopTextRecordingRef.current();
        stopTextRecordingRef.current = null;
      }
      setIsRecordingInTextMode(false);
      setInputAudioLevel(0);
      return;
    }

    soundEffects.playClick();
    setIsRecordingInTextMode(true);
    setCurrentEmotion('atencao');

    try {
      const stopFn = await assistantService.startListening(
        (transcript, isFinal) => {
          setTextInput(transcript);
          setInputAudioLevel(0.65);
        },
        () => {
          // Ready
        },
        (errMsg) => {
          setIsRecordingInTextMode(false);
          setInputAudioLevel(0);
          setMicErrorMessage(errMsg);
          setMicErrorType('microphoneNotFound');
        },
        (result) => {
          setIsRecordingInTextMode(false);
          setInputAudioLevel(0);
          if (result.transcript) {
            setTextInput(result.transcript);
          }
        }
      );
      stopTextRecordingRef.current = stopFn;
    } catch (e) {
      setIsRecordingInTextMode(false);
      setInputAudioLevel(0);
    }
  };

  // Determine current active robot visual status
  const currentFaceStatus: NexusFaceStatus =
    activeMode === 'live'
      ? liveStatus
      : isRecordingInTextMode
      ? 'listening'
      : isTextLoading
      ? 'thinking'
      : isTextSpeaking
      ? 'speaking'
      : 'idle';

  return (
    <>
      {/* Minimized Floating Cyber Bot Trigger */}
      {!isAssistantOpen && (
        <button
          onClick={openAssistant}
          className="fixed bottom-6 right-6 z-40 group flex items-center gap-3 bg-slate-950/95 hover:bg-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 p-2.5 sm:px-4 sm:py-3 rounded-full shadow-2xl shadow-cyan-950/60 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Abrir Assistente Inteligente NEXUS"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center text-cyan-400 group-hover:text-cyan-300">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-slate-950 animate-ping" />
          </div>

          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-wide">NEXUS</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                CYBER AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Tutor Multidisciplinar</p>
          </div>
        </button>
      )}

      {/* Main Expanded Assistant Modal */}
      {isAssistantOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-slate-950/98 border border-slate-700/80 shadow-2xl backdrop-blur-2xl ${
            isExpanded
              ? 'inset-2 sm:inset-6 rounded-3xl'
              : 'bottom-3 right-3 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[500px] h-[660px] max-h-[90vh] rounded-3xl'
          }`}
        >
          {/* Top Bar / Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-800/80 bg-slate-900/80 rounded-t-3xl relative z-20">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-300 ${
                  currentFaceStatus === 'speaking'
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white ring-4 ring-cyan-400/40 animate-pulse'
                    : currentFaceStatus === 'listening'
                    ? 'bg-gradient-to-br from-emerald-400 to-cyan-600 text-white ring-4 ring-emerald-400/40'
                    : currentFaceStatus === 'thinking'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white ring-4 ring-purple-400/40 animate-spin'
                    : currentFaceStatus === 'error'
                    ? 'bg-gradient-to-br from-rose-500 to-amber-700 text-white ring-4 ring-rose-500/30'
                    : 'bg-gradient-to-br from-slate-800 to-cyan-900 text-cyan-300 ring-2 ring-slate-700'
                }`}
              >
                <Bot className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white tracking-wider">NEXUS</h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shrink-0">
                    <Radio className="w-2.5 h-2.5 text-cyan-400" />
                    {activeMode === 'live' ? 'Voz em Tempo Real' : 'Chat Inteligente'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">
                  {currentFaceStatus === 'listening'
                    ? 'Ouvindo sua pergunta...'
                    : currentFaceStatus === 'thinking'
                    ? 'Processando resposta...'
                    : currentFaceStatus === 'speaking'
                    ? 'Explicando...'
                    : 'Pronto para apoiar seus estudos.'}
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {/* Central de Automação & Tarefas Autorizadas */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setIsAutomationModalOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700/80 hover:border-amber-500/40 text-[10px] font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Central de Tarefas Autorizadas"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Tarefas</span>
              </button>

              {/* Vozes do NEXUS Button */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  setIsVoiceSettingsOpen(true);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700/80 hover:border-cyan-500/40 text-[10px] font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="Configurar Vozes do NEXUS e Áudio"
              >
                <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Vozes</span>
              </button>

              {/* Mode Switcher: Live Voice vs Text Chat */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveMode('live');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    activeMode === 'live'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>Voz</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    if (liveStatus !== 'idle') handleStopLiveConversation();
                    setActiveMode('text');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    activeMode === 'text'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Texto</span>
                </button>
              </div>

              {/* Expand / Minimize Window */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isExpanded ? 'Restaurar tamanho' : 'Expandir tela cheia'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  handleStopLiveConversation();
                  closeAssistant();
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Fechar assistente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Multidisciplinary Toolbar (Subject & Learning Mode) */}
          <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 relative z-20 text-[11px]">
            {/* Subject Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold text-[10px] uppercase">Área:</span>
              <select
                value={activeSubject}
                onChange={(e) => {
                  soundEffects.playClick();
                  setActiveSubject(e.target.value as NexusSubject);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-300 font-bold outline-none text-[11px]"
              >
                <option value="informatica">💻 Informática & TI</option>
                <option value="matematica">📐 Matemática & Lógica</option>
                <option value="portugues">📖 Língua Portuguesa</option>
                <option value="ciencias">🔬 Ciências & Biologia</option>
                <option value="historia">🏛️ História</option>
                <option value="geografia">🌍 Geografia & Meio Ambiente</option>
                <option value="financeira">💰 Educação Financeira</option>
                <option value="programacao">⌨️ Programação & IA</option>
              </select>
            </div>

            {/* Learning Mode Badges */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {[
                { id: 'explicacao', label: '💡 Explicação' },
                { id: 'professor', label: '👨‍🏫 Modo Aula' },
                { id: 'exercicios', label: '✍️ Exercícios' },
                { id: 'revisao', label: '🔄 Revisão' },
                { id: 'profissional', label: '💼 Carreira' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveLearningMode(m.id as NexusLearningMode);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                    activeLearningMode === m.id
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Teacher Support Quick Badge */}
            {currentUser.role === 'professor' && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <GraduationCap className="w-3 h-3" />
                Apoio Docente
              </span>
            )}
          </div>

          {/* Diagnostic Error Banner if microphone error */}
          {micErrorType && (
            <div className="px-4 py-2.5 bg-rose-950/80 border-b border-rose-500/40 text-xs text-rose-200 flex items-center justify-between gap-3 animate-in fade-in z-20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{micErrorMessage || 'Problema com o microfone.'}</span>
              </div>
              <button
                onClick={handleTestMicrophone}
                className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shrink-0 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 1: LIVE VOICE CONVERSATION                               */}
          {/* ============================================================ */}
          {activeMode === 'live' && (
            <div
              className={`flex-1 flex min-h-0 ${
                isExpanded ? 'flex-col lg:flex-row' : 'flex-col'
              }`}
            >
              {/* Central Futuristic Cyber Robot Pane */}
              <div
                className={`relative flex flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80 p-4 ${
                  isExpanded ? 'lg:w-[480px] shrink-0' : 'w-full min-h-[300px]'
                }`}
              >
                {/* Cyber Interactive Background Environment */}
                <NexusCyberBackground
                  status={currentFaceStatus}
                  inputAudioLevel={inputAudioLevel}
                  outputAudioLevel={outputAudioLevel}
                />

                {/* Upgraded Cyber Robot Face */}
                <div className="relative z-10 w-full flex justify-center">
                  <NexusRobotFace
                    status={currentFaceStatus}
                    emotion={currentEmotion}
                    inputAudioLevel={inputAudioLevel}
                    outputAudioLevel={outputAudioLevel}
                    className="max-w-[280px] sm:max-w-[320px]"
                  />
                </div>

                {/* Status & Audio Activity Indicator */}
                <div className="relative z-10 mt-3 flex items-center gap-2">
                  {liveStatus === 'listening' ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 shadow-sm animate-in fade-in">
                      <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>Microfone Ativo</span>
                      <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-75"
                          style={{ width: `${Math.min(inputAudioLevel * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : liveStatus === 'speaking' ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 shadow-sm animate-in fade-in">
                      <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse" />
                      <span>Sintetizador Vocal</span>
                      <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-75"
                          style={{ width: `${Math.min(outputAudioLevel * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[10px] font-medium text-slate-400">
                      <Mic className="w-2.5 h-2.5 text-slate-500" />
                      <span>NEXUS Pronto para Ouvir</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons (Start, Stop, Interrupt) */}
                <div className="relative z-10 mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  {liveStatus === 'idle' || liveStatus === 'error' ? (
                    <>
                      <button
                        onClick={handleStartLiveConversation}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Começar conversa por voz</span>
                      </button>
                      <button
                        onClick={handleTestMicrophone}
                        disabled={isTestingMic}
                        className="px-3.5 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                        title="Verificar permissão do microfone"
                      >
                        <Activity className={`w-4 h-4 text-cyan-400 ${isTestingMic ? 'animate-spin' : ''}`} />
                        <span>{isTestingMic ? 'Verificando...' : 'Testar Mic'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {liveStatus === 'speaking' && (
                        <button
                          onClick={handleManualInterrupt}
                          className="px-4 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/20"
                          title="Interromper fala do assistente"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>Interromper Fala</span>
                        </button>
                      )}

                      <button
                        onClick={handleStopLiveConversation}
                        className="px-5 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                        title="Encerrar sessão de voz"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Encerrar conversa</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Transcripts Stream (Visual Aid) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 text-xs bg-slate-950/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between pb-1 border-b border-slate-800/60">
                  <span>Transcrição ao Vivo:</span>
                  <span className="text-slate-600">Apoio Visual da Fala</span>
                </div>

                {liveTranscripts.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <p>As falas da conversa em tempo real aparecerão aqui.</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Clique em "Começar conversa por voz" e fale naturalmente com o NEXUS.
                    </p>
                  </div>
                ) : (
                  liveTranscripts.map((item) => (
                    <div
                      key={item.id}
                      className={`flex flex-col ${
                        item.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1">
                        <span className="font-bold text-slate-300">
                          {item.role === 'user'
                            ? currentUser.nickname || currentUser.name.split(' ')[0]
                            : 'NEXUS'}
                        </span>
                        <span className="text-slate-600">• {item.timestamp}</span>
                      </div>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          item.role === 'user'
                            ? 'bg-cyan-600 text-white rounded-br-none shadow-md shadow-cyan-600/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none shadow-md'
                        }`}
                      >
                        {item.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptsEndRef} />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* MODE 2: INTERACTIVE TEXT CHAT (With Cyber Robot Visual)      */}
          {/* ============================================================ */}
          {activeMode === 'text' && (
            <div
              className={`flex-1 flex min-h-0 ${
                isExpanded ? 'flex-col lg:flex-row' : 'flex-col'
              }`}
            >
              {/* Left Cyber Robot Pane in Expanded View */}
              <div
                className={`relative flex flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800/80 p-4 ${
                  isExpanded ? 'lg:w-[380px] shrink-0' : 'hidden'
                }`}
              >
                <NexusCyberBackground
                  status={currentFaceStatus}
                  outputAudioLevel={outputAudioLevel}
                />
                <div className="relative z-10 w-full flex justify-center">
                  <NexusRobotFace
                    status={currentFaceStatus}
                    emotion={currentEmotion}
                    outputAudioLevel={outputAudioLevel}
                    className="max-w-[260px]"
                  />
                </div>
                <div className="relative z-10 mt-3 text-center">
                  <span className="text-xs font-bold text-white block">
                    NEXUS Cyber Tutor
                  </span>
                  <span className="text-[10px] text-cyan-400">
                    {isTextLoading
                      ? 'Processando resposta...'
                      : isTextSpeaking
                      ? 'Falando...'
                      : isRecordingInTextMode
                      ? 'Ouvindo sua voz...'
                      : 'Aguardando sua pergunta.'}
                  </span>
                </div>
              </div>

              {/* Chat Messages History */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Sleek Compact Cyber Header in normal non-expanded view */}
                {!isExpanded && (
                  <div className="px-4 py-2 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between gap-3 relative overflow-hidden">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center overflow-hidden shadow-inner">
                        <Bot className={`w-4 h-4 ${currentFaceStatus === 'speaking' ? 'text-cyan-300 animate-pulse' : currentFaceStatus === 'listening' ? 'text-emerald-400 animate-bounce' : 'text-cyan-400'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-white">NEXUS ROBOT</span>
                          <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-black ${
                            currentFaceStatus === 'listening'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : currentFaceStatus === 'thinking'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : currentFaceStatus === 'speaking'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {currentFaceStatus === 'listening' ? '● OUVINDO' : currentFaceStatus === 'thinking' ? 'PROCESSANDO' : currentFaceStatus === 'speaking' ? 'FALANDO' : 'PRONTO'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {isRecordingInTextMode
                            ? 'Fale sua dúvida no microfone...'
                            : isTextSpeaking
                            ? 'Reproduzindo áudio natural...'
                            : 'Assistente e tutor cyber educacional'}
                        </p>
                      </div>
                    </div>

                    {isTextSpeaking && (
                      <button
                        onClick={handleManualInterrupt}
                        className="px-2.5 py-1 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 transition-colors"
                        title="Interromper voz do robô"
                      >
                        <Square className="w-3 h-3 fill-white" />
                        <span>Parar Fala</span>
                      </button>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
                  {textMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-1.5">
                        <span className="font-bold text-slate-300">
                          {msg.role === 'user'
                            ? currentUser.nickname || currentUser.name.split(' ')[0]
                            : 'NEXUS'}
                        </span>
                        <span className="text-slate-600">• {msg.timestamp}</span>
                        {msg.isHintOnly && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Pista Pedagógica
                          </span>
                        )}
                      </div>

                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-none shadow-md shadow-cyan-600/20'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none shadow-md'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {/* Thinking Loading Indicator */}
                  {isTextLoading && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-400 text-xs w-fit animate-pulse">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                      <span>NEXUS está pensando na melhor explicação...</span>
                    </div>
                  )}

                  <div ref={textEndRef} />
                </div>

                {/* Pedagogical Quick Suggestion Chips (Educational Modes) */}
                <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                  <span className="text-slate-500 font-bold uppercase shrink-0">Ajuda Rápida:</span>
                  <button
                    type="button"
                    onClick={() => handleSendTextMessage('Pode me explicar esse conceito em etapas didáticas numeradas?')}
                    disabled={isTextLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 shrink-0 transition-colors cursor-pointer"
                  >
                    💡 Em Etapas
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendTextMessage('Proponha um exercício ou desafio rápido sobre isso para eu resolver.')}
                    disabled={isTextLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-800 shrink-0 transition-colors cursor-pointer"
                  >
                    ✍️ Criar Exercício
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendTextMessage('Poderia me dar um exemplo prático do dia a dia sobre esse assunto?')}
                    disabled={isTextLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 shrink-0 transition-colors cursor-pointer"
                  >
                    🔍 Exemplo Prático
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendTextMessage('Não entendi perfeitamente. Pode reformular de forma mais simples?')}
                    disabled={isTextLoading}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 shrink-0 transition-colors cursor-pointer"
                  >
                    🔄 Mais Simples
                  </button>
                </div>

                {/* Teacher Support Quick Prompts if teacher */}
                {currentUser.role === 'professor' && (
                  <div className="px-4 py-1.5 bg-indigo-950/20 border-t border-indigo-500/20 flex items-center gap-1.5 overflow-x-auto text-[10px]">
                    <span className="text-indigo-400 font-bold uppercase shrink-0">Docente:</span>
                    <button
                      onClick={() => handleSendTextMessage('Gere um plano de aula completo sobre a disciplina ativa.')}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 shrink-0 transition-colors cursor-pointer"
                    >
                      Plano de Aula
                    </button>
                    <button
                      onClick={() => handleSendTextMessage('Crie 3 questões de fixação com gabarito para a turma.')}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 shrink-0 transition-colors cursor-pointer"
                    >
                      3 Questões Avaliativas
                    </button>
                    <button
                      onClick={() => handleSendTextMessage('Como explicar este tema de forma muito simples e prática?')}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 shrink-0 transition-colors cursor-pointer"
                    >
                      Exemplo Didático
                    </button>
                  </div>
                )}

                {/* Text Input Footer */}
                <div className="p-3 sm:p-4 bg-slate-950/90 border-t border-slate-800/80">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendTextMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    {/* Voice Dictation Button inside Text Mode */}
                    <button
                      type="button"
                      onClick={handleToggleTextVoiceRecording}
                      disabled={isTextLoading}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        isRecordingInTextMode
                          ? 'bg-emerald-600 border-emerald-400 text-white animate-pulse shadow-lg shadow-emerald-500/30'
                          : 'bg-slate-900 border-slate-700/80 hover:border-cyan-400 text-cyan-400 hover:text-cyan-300'
                      }`}
                      title={isRecordingInTextMode ? 'Clique para parar e transcrever' : 'Falar pergunta por microfone'}
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={
                        isRecordingInTextMode
                          ? 'Ouvindo sua voz... fale agora...'
                          : `Pergunte sobre ${activeSubject} no modo ${activeLearningMode}...`
                      }
                      disabled={isTextLoading}
                      className={`flex-1 bg-slate-900 border rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-cyan-400 outline-none transition-colors ${
                        isRecordingInTextMode ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-700/80'
                      }`}
                    />

                    {/* Interrupt speech button if talking */}
                    {isTextSpeaking && (
                      <button
                        type="button"
                        onClick={handleManualInterrupt}
                        className="p-3 rounded-2xl bg-amber-600/80 hover:bg-amber-500 text-white transition-colors cursor-pointer"
                        title="Interromper fala"
                      >
                        <Square className="w-4 h-4 fill-white" />
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={!textInput.trim() || isTextLoading}
                      className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-cyan-500/25 cursor-pointer"
                      title="Enviar mensagem"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Authorized Task Automation Modal */}
      <NexusTaskAutomationModal
        isOpen={isAutomationModalOpen}
        onClose={() => setIsAutomationModalOpen(false)}
      />

      {/* Voice Selection Settings Modal ("Vozes do NEXUS") */}
      <NexusVoiceSettingsModal
        isOpen={isVoiceSettingsOpen}
        onClose={() => setIsVoiceSettingsOpen(false)}
        onRepeatLastResponse={() => {
          nexusVoiceService.repeatLastResponse();
        }}
      />
    </>
  );
};
