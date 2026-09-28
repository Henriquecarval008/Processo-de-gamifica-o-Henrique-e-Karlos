import React, { useState, useEffect, useRef } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  liveVoiceService,
  MicDiagnosticErrorType,
} from '../../services/liveVoiceService';
import { assistantService, ChatMessage } from '../../services/assistantService';
import { soundEffects } from '../../utils/soundEffects';
import {
  Bot,
  Mic,
  MicOff,
  Radio,
  Square,
  Sparkles,
  ShieldAlert,
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
  User,
  Smile,
} from 'lucide-react';
import { NexusRobotFace } from './NexusRobotFace';
import { RealisticHumanAvatar3D } from './RealisticHumanAvatar3D';
import { NexusEmotion } from '../../types';

type LiveVoiceStatus = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'error';

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

  // Avatar Appearance Model: 'human' (Realistic 3D Human Avatar) | 'robot' (Legacy Cyber Robot)
  const [avatarModel, setAvatarModel] = useState<'human' | 'robot'>('human');
  // Current Emotional State
  const [currentEmotion, setCurrentEmotion] = useState<NexusEmotion>('neutro');
  // Show 3D Avatar in Text Chat Mode
  const [showAvatarInTextMode, setShowAvatarInTextMode] = useState(true);

  // Live Voice State
  const [liveStatus, setLiveStatus] = useState<LiveVoiceStatus>('idle');
  const [micErrorType, setMicErrorType] = useState<MicDiagnosticErrorType | null>(null);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [micTestSuccess, setMicTestSuccess] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [inputAudioLevel, setInputAudioLevel] = useState(0);
  const [outputAudioLevel, setOutputAudioLevel] = useState(0);

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
        (currentUser.nickname || currentUser.name.split(' ')[0] || 'aluno') +
        '. Eu sou o Nexus, assistente do GAMEINFOR. Estou pronto. O que vamos aprender hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [textInput, setTextInput] = useState('');
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const transcriptsEndRef = useRef<HTMLDivElement>(null);
  const textEndRef = useRef<HTMLDivElement>(null);

  const isTakingActivity = Boolean(assistantContext?.isTakingActivity);

  // Auto-scroll transcripts
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

  // Clean disconnect on unmount or closing window
  useEffect(() => {
    const handleBeforeUnload = () => {
      liveVoiceService.stopSession();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      liveVoiceService.stopSession();
    };
  }, []);

  /**
   * Start Live Voice Continuous Conversation
   */
  const handleStartLiveConversation = async () => {
    soundEffects.playClick();
    setMicErrorType(null);
    setMicErrorMessage(null);

    const studentFirstName = currentUser.nickname || currentUser.name.split(' ')[0] || 'aluno';

    await liveVoiceService.startLiveSession(
      {
        onStatusChange: (newStatus) => {
          setLiveStatus(newStatus);
        },
        onError: (errType, friendlyMsg) => {
          setMicErrorType(errType);
          setMicErrorMessage(friendlyMsg);
          setLiveStatus('error');
        },
        onTranscript: (text, role) => {
          setLiveTranscripts((prev) => {
            // Append or update existing turn
            const last = prev[prev.length - 1];
            if (last && last.role === role) {
              return [
                ...prev.slice(0, -1),
                { ...last, text: last.text + ' ' + text },
              ];
            }
            return [
              ...prev,
              {
                id: `live-tx-${Date.now()}-${Math.random()}`,
                role,
                text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ];
          });
        },
        onInterrupted: () => {
          // Barge-in occurred
          setLiveStatus('listening');
        },
        onAudioLevel: (inLevel, outLevel) => {
          setInputAudioLevel(inLevel);
          setOutputAudioLevel(outLevel);
        },
      },
      {
        studentName: studentFirstName,
        studentLevel: currentUser.level,
        studentXp: currentUser.xp,
        isTakingActivity,
        activityTitle: assistantContext?.activityTitle,
        currentQuestionText: assistantContext?.currentQuestionText,
        topic: assistantContext?.topic,
      },
      true // send initial dynamic greeting once
    );
  };

  /**
   * Diagnostic test of microphone access prior to live session
   */
  const handleTestMicrophone = async () => {
    soundEffects.playClick();
    setMicErrorType(null);
    setMicErrorMessage(null);
    setMicTestSuccess(false);
    setIsTestingMic(true);

    const result = await liveVoiceService.testMicrophoneAccess(() => {
      setMicErrorType('microphonePermissionPending');
      setMicErrorMessage('Autorize o microfone para começar a conversa.');
    });

    setIsTestingMic(false);

    if (result.success) {
      setMicTestSuccess(true);
      setMicErrorType(null);
      setMicErrorMessage(null);
      setTimeout(() => setMicTestSuccess(false), 5000);
    } else {
      setMicTestSuccess(false);
      setMicErrorType(result.errorType || 'unknownError');
      setMicErrorMessage(result.friendlyMessage || 'Não foi possível acessar o microfone. Tente novamente.');
    }
  };

  /**
   * End Live Voice Conversation
   */
  const handleStopLiveConversation = () => {
    soundEffects.playClick();
    liveVoiceService.stopSession();
    setLiveStatus('idle');
    setInputAudioLevel(0);
    setOutputAudioLevel(0);
  };

  /**
   * Manual Barge-in Interruption
   */
  const handleManualInterrupt = () => {
    soundEffects.playClick();
    liveVoiceService.handleInterruption();
    setLiveStatus('listening');
  };

  /**
   * Text Chat Mode handler
   */
  const handleSendTextMessage = async (customText?: string) => {
    const text = (customText !== undefined ? customText : textInput).trim();
    if (!text || isTextLoading) return;

    soundEffects.playClick();

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...textMessages, userMsg];
    setTextMessages(newHistory);
    setTextInput('');
    setIsTextLoading(true);

    try {
      const response = await assistantService.sendMessage(text, newHistory, {
        isTakingActivity,
        activityType: assistantContext?.activityType,
        activityTitle: assistantContext?.activityTitle,
        currentQuestionText: assistantContext?.currentQuestionText,
        topic: assistantContext?.topic,
        studentName: currentUser.nickname || currentUser.name,
        studentLevel: currentUser.level,
        studentXp: currentUser.xp,
      });

      const assistantMsg: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isHintOnly: response.mode === 'hint_only',
      };

      setTextMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Erro na mensagem de texto:', e);
    } finally {
      setIsTextLoading(false);
    }
  };

  // Holographic visualizer energy scale calculation
  const orbScale =
    liveStatus === 'speaking'
      ? 1 + Math.min(outputAudioLevel * 1.8, 0.45)
      : liveStatus === 'listening'
      ? 1 + Math.min(inputAudioLevel * 1.4, 0.35)
      : 1;

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      {!isAssistantOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
          <div
            onClick={openAssistant}
            className="cursor-pointer hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/90 border border-slate-700/80 backdrop-blur-md text-xs font-semibold text-slate-200 shadow-xl hover:border-cyan-500/50 transition-all hover:scale-105"
          >
            {isTakingActivity ? (
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                NEXUS (Modo Dica Ativo)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                NEXUS — Assistente GAMEINFOR
              </span>
            )}
          </div>

          <button
            onClick={() => {
              soundEffects.playClick();
              toggleAssistant();
            }}
            className={`relative p-4 rounded-2xl shadow-2xl transition-all duration-300 flex items-center justify-center group ${
              isTakingActivity
                ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 text-white ring-4 ring-amber-500/30 hover:scale-110 shadow-amber-500/20'
                : 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-800 text-white ring-4 ring-cyan-500/30 hover:scale-110 shadow-cyan-500/30'
            }`}
            title="Abrir NEXUS — Assistente Inteligente GAMEINFOR"
            aria-label="Abrir NEXUS — Assistente Inteligente GAMEINFOR"
          >
            <Bot className="w-7 h-7 text-white transition-transform group-hover:rotate-6" />

            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isTakingActivity ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-4 w-4 border-2 border-slate-900 ${
                  isTakingActivity ? 'bg-amber-500' : 'bg-cyan-400'
                }`}
              />
            </span>
          </button>
        </div>
      )}

      {/* Futuristic Assistant Modal Window */}
      {isAssistantOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 flex flex-col bg-slate-950/95 border border-slate-700/80 shadow-2xl backdrop-blur-2xl ${
            isExpanded
              ? 'inset-3 sm:inset-8 rounded-3xl'
              : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[480px] h-[640px] max-h-[88vh] rounded-3xl'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/70 rounded-t-3xl">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-all duration-300 ${
                  liveStatus === 'speaking'
                    ? 'bg-gradient-to-br from-cyan-400 to-blue-600 text-white ring-4 ring-cyan-400/40 shadow-cyan-500/30 animate-pulse'
                    : liveStatus === 'listening'
                    ? 'bg-gradient-to-br from-emerald-400 to-cyan-600 text-white ring-4 ring-emerald-400/40 shadow-emerald-500/30'
                    : liveStatus === 'thinking'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white ring-4 ring-purple-400/40 animate-spin'
                    : liveStatus === 'error'
                    ? 'bg-gradient-to-br from-rose-500 to-amber-700 text-white ring-4 ring-rose-500/30'
                    : 'bg-gradient-to-br from-slate-800 to-cyan-900 text-cyan-300 ring-2 ring-slate-700'
                }`}
              >
                <Bot className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white tracking-wider">NEXUS</h3>
                  <span className="text-[11px] font-semibold text-slate-400 truncate">
                    Assistente GAMEINFOR
                  </span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 shrink-0">
                    <Radio className="w-2.5 h-2.5 text-cyan-400" />
                    Live Voice
                  </span>
                </div>

                <div className="text-[11px] flex items-center gap-1.5 mt-0.5">
                  {liveStatus === 'idle' && (
                    <span className="text-slate-300 font-medium">NEXUS está pronto.</span>
                  )}
                  {liveStatus === 'connecting' && (
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />
                      NEXUS está conectando...
                    </span>
                  )}
                  {liveStatus === 'listening' && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      NEXUS está ouvindo...
                    </span>
                  )}
                  {liveStatus === 'thinking' && (
                    <span className="text-purple-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 animate-spin text-purple-400" />
                      NEXUS está pensando...
                    </span>
                  )}
                  {liveStatus === 'speaking' && (
                    <span className="text-cyan-300 font-bold flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-cyan-300 animate-pulse" />
                      NEXUS está falando...
                    </span>
                  )}
                  {liveStatus === 'error' && (
                    <span className="text-rose-400 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      {micErrorType === 'connectionError'
                        ? 'NEXUS está com dificuldade para se conectar.'
                        : micErrorMessage || 'NEXUS está com dificuldade para se conectar.'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mode Switcher & Controls */}
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {/* Avatar Model Switcher */}
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px] font-bold">
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setAvatarModel('human');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    avatarModel === 'human'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Avatar Humano 3D Realista com Rastreamento Facial"
                >
                  <User className="w-3 h-3 text-cyan-200" />
                  <span>Humano 3D</span>
                </button>
                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setAvatarModel('robot');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    avatarModel === 'robot'
                      ? 'bg-slate-800 text-cyan-300 shadow-sm border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Avatar Robô Cibernético"
                >
                  <Bot className="w-3 h-3" />
                  <span>Robô Cyber</span>
                </button>
              </div>

              {/* Interaction Mode Switcher */}
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
                  <span>Voz Direta</span>
                </button>

                <button
                  onClick={() => {
                    soundEffects.playClick();
                    setActiveMode('text');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    activeMode === 'text'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Chat Texto</span>
                </button>
              </div>

              {/* Expand / Minimize */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="hidden sm:inline-flex p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title={isExpanded ? 'Restaurar tamanho' : 'Expandir tela'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close */}
              <button
                onClick={() => {
                  soundEffects.playClick();
                  handleStopLiveConversation();
                  closeAssistant();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Fechar assistente"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Context Banner (XP protection rules in activities) */}
          {isTakingActivity ? (
            <div className="px-4 py-2.5 bg-amber-950/40 border-b border-amber-500/30 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-300">
                  Proteção de Atividade com XP Ativa
                </p>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Para garantir seu aprendizado, o assistente explicará conceitos e dará pistas reflexivas, sem revelar a resposta ou a alternativa correta!
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-1.5 bg-slate-900/40 border-b border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Voz bidirecional em tempo real. Pode falar naturalmente e interromper a qualquer momento!
              </span>
              <span className="text-[10px] text-cyan-400 font-bold shrink-0 ml-2">
                Nível {currentUser.level}
              </span>
            </div>
          )}

          {/* Diagnostic Error Banner with Targeted Advice */}
          {micErrorMessage && (
            <div
              className={`px-4 py-2.5 border-b text-xs flex items-start justify-between gap-3 animate-in fade-in ${
                micErrorType === 'microphonePermissionPending'
                  ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    micErrorType === 'microphonePermissionPending' ? 'text-amber-400 animate-pulse' : 'text-rose-400'
                  }`}
                />
                <div>
                  <p
                    className={`font-bold ${
                      micErrorType === 'microphonePermissionPending' ? 'text-amber-300' : 'text-rose-300'
                    }`}
                  >
                    {micErrorType === 'microphonePermissionPending'
                      ? 'Solicitação Pendente'
                      : micErrorType === 'connectionError'
                      ? 'Erro de Conexão com a IA'
                      : 'Diagnóstico do Microfone'}
                  </p>
                  <p className="text-[11px] leading-relaxed mt-0.5">{micErrorMessage}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleTestMicrophone}
                  disabled={isTestingMic}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold transition-colors"
                >
                  {isTestingMic ? 'Testando...' : 'Testar Mic'}
                </button>
                <button
                  onClick={handleStartLiveConversation}
                  className="px-3 py-1 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold transition-colors shadow-sm"
                >
                  Tentar Iniciar
                </button>
              </div>
            </div>
          )}

          {/* Microphone Test Success Banner */}
          {micTestSuccess && (
            <div className="px-4 py-2.5 bg-emerald-950/70 border-b border-emerald-500/40 text-xs text-emerald-200 flex items-center justify-between gap-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold text-[11px]">
                  Microfone acessado e autorizado com sucesso! Pronto para conversar por voz.
                </span>
              </div>
              <button
                onClick={handleStartLiveConversation}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shrink-0 transition-colors shadow-sm"
              >
                Iniciar Conversa
              </button>
            </div>
          )}

          {/* MODE: LIVE VOICE CONVERSATION */}
          {activeMode === 'live' && (
            <div
              className={`flex-1 flex min-h-0 ${
                isExpanded ? 'flex-col lg:flex-row' : 'flex-col'
              }`}
            >
              {/* Central Futuristic NEXUS Avatar Pane */}
              <div
                className={`flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-900/60 to-slate-950/80 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-4 ${
                  isExpanded ? 'lg:w-[460px] shrink-0' : 'w-full'
                }`}
              >
                {avatarModel === 'human' ? (
                  <RealisticHumanAvatar3D
                    status={liveStatus}
                    emotion={currentEmotion}
                    inputAudioLevel={inputAudioLevel}
                    outputAudioLevel={outputAudioLevel}
                    onEmotionChange={(emo) => setCurrentEmotion(emo)}
                    className="w-full max-w-[420px]"
                  />
                ) : (
                  <NexusRobotFace
                    status={liveStatus}
                    emotion={currentEmotion}
                    inputAudioLevel={inputAudioLevel}
                    outputAudioLevel={outputAudioLevel}
                  />
                )}

                {/* Discrete Audio & Microphone Activity Indicator */}
                <div className="mt-3 flex items-center gap-2">
                  {liveStatus === 'listening' ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 shadow-sm animate-in fade-in">
                      <Mic className="w-3 h-3 text-emerald-400 animate-pulse" />
                      <span>Microfone Ativo</span>
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 transition-all duration-75"
                          style={{ width: `${Math.min(inputAudioLevel * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : liveStatus === 'speaking' ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 shadow-sm animate-in fade-in">
                      <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse" />
                      <span>Áudio Sintetizado</span>
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 transition-all duration-75"
                          style={{ width: `${Math.min(outputAudioLevel * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] font-medium text-slate-400">
                      <Mic className="w-2.5 h-2.5 text-slate-500" />
                      <span>Microfone Pronto</span>
                    </div>
                  )}
                </div>

                {/* Real-time Voice Controls (Start, Stop, Interrupt) */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                  {liveStatus === 'idle' || liveStatus === 'error' ? (
                    <>
                      <button
                        onClick={handleStartLiveConversation}
                        className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-cyan-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Começar conversa por voz</span>
                      </button>
                      <button
                        onClick={handleTestMicrophone}
                        disabled={isTestingMic}
                        className="px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md"
                        title="Verificar permissão e dispositivo de microfone"
                      >
                        <Activity className={`w-4 h-4 text-cyan-400 ${isTestingMic ? 'animate-spin' : ''}`} />
                        <span>{isTestingMic ? 'Verificando...' : 'Testar Microfone'}</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {liveStatus === 'speaking' && (
                        <button
                          onClick={handleManualInterrupt}
                          className="px-4 py-2.5 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/20"
                          title="Interromper a fala atual do assistente"
                        >
                          <Square className="w-3.5 h-3.5 fill-white" />
                          <span>Interromper Fala</span>
                        </button>
                      )}

                      <button
                        onClick={handleStopLiveConversation}
                        className="px-5 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                        title="Desligar microfone e encerrar sessão de voz"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                        <span>Encerrar conversa</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Live Transcripts Stream (Visual Aid) */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 text-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between pb-1 border-b border-slate-800/60">
                  <span>Transcrição em Tempo Real:</span>
                  <span className="text-slate-600">Apoio Visual</span>
                </div>

                {liveTranscripts.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    <p>As falas da conversa em tempo real aparecerão aqui.</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Clique em "Começar conversa por voz" e fale naturalmente com o assistente.
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
                        <span>• {item.timestamp}</span>
                      </div>
                      <div
                        className={`p-3 rounded-2xl max-w-[90%] leading-relaxed ${
                          item.role === 'user'
                            ? 'bg-blue-600/30 border border-blue-500/40 text-blue-100 rounded-tr-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
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

          {/* MODE: TRADITIONAL TEXT CHAT */}
          {activeMode === 'text' && (
            <div
              className={`flex-1 flex min-h-0 ${
                isExpanded ? 'flex-col lg:flex-row' : 'flex-col'
              }`}
            >
              {/* Optional 3D Avatar Pane in Text Mode */}
              {showAvatarInTextMode && (
                <div
                  className={`flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-b from-slate-900/60 to-slate-950/80 border-b lg:border-b-0 lg:border-r border-slate-800/80 p-3 ${
                    isExpanded ? 'lg:w-[420px] shrink-0' : 'w-full shrink-0'
                  }`}
                >
                  <div className="w-full flex items-center justify-between mb-1.5 px-1">
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      Presença Visual Interativa
                    </span>
                    {!isExpanded && (
                      <button
                        onClick={() => setShowAvatarInTextMode(false)}
                        className="text-[10px] font-semibold text-slate-500 hover:text-slate-300"
                      >
                        Ocultar
                      </button>
                    )}
                  </div>

                  {avatarModel === 'human' ? (
                    <RealisticHumanAvatar3D
                      status={isTextLoading ? 'thinking' : 'idle'}
                      emotion={currentEmotion}
                      inputAudioLevel={0}
                      outputAudioLevel={isTextLoading ? 0.35 : 0}
                      onEmotionChange={(emo) => setCurrentEmotion(emo)}
                      className="w-full max-w-[380px]"
                    />
                  ) : (
                    <NexusRobotFace
                      status={isTextLoading ? 'thinking' : 'idle'}
                      emotion={currentEmotion}
                      inputAudioLevel={0}
                      outputAudioLevel={isTextLoading ? 0.35 : 0}
                    />
                  )}
                </div>
              )}

              {/* Message History & Input Container */}
              <div className="flex-1 flex flex-col min-h-0">
                {!showAvatarInTextMode && !isExpanded && (
                  <div className="px-4 py-1.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Avatar minimizado</span>
                    <button
                      onClick={() => setShowAvatarInTextMode(true)}
                      className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1"
                    >
                      <User className="w-3 h-3" />
                      <span>Exibir Avatar 3D</span>
                    </button>
                  </div>
                )}

                {/* Message History List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 text-xs">
                {textMessages.map((msg) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2.5 ${
                        isAssistant ? 'justify-start' : 'justify-end'
                      }`}
                    >
                      {isAssistant && (
                        <div className="w-7 h-7 rounded-xl bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 leading-relaxed relative group shadow-md ${
                          isAssistant
                            ? 'bg-slate-900/90 border border-slate-800 text-slate-200'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                        }`}
                      >
                        {isAssistant && msg.isHintOnly && (
                          <div className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                            <ShieldAlert className="w-3 h-3 text-amber-400" />
                            Dica Conceitual (XP Protegido)
                          </div>
                        )}

                        <div className="whitespace-pre-wrap font-normal">
                          {msg.content}
                        </div>

                        <div
                          className={`mt-1.5 text-[10px] ${
                            isAssistant ? 'text-slate-500' : 'text-blue-200'
                          }`}
                        >
                          {msg.timestamp}
                        </div>
                      </div>

                      {!isAssistant && (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-7 h-7 rounded-xl object-cover ring-1 ring-blue-500/40 shrink-0 mt-0.5"
                        />
                      )}
                    </div>
                  );
                })}

                {isTextLoading && (
                  <div className="flex items-center gap-2 text-cyan-300 text-xs p-2.5 bg-slate-900/60 rounded-xl border border-slate-800">
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span className="font-semibold">NEXUS está pensando...</span>
                  </div>
                )}
                <div ref={textEndRef} />
              </div>

              {/* Text Input Footer */}
              <div className="p-3.5 border-t border-slate-800 bg-slate-900/90 rounded-b-3xl">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendTextMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Digite sua dúvida ou chame o Nexus..."
                    disabled={isTextLoading}
                    className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || isTextLoading}
                    className={`p-3 rounded-2xl transition-all flex items-center justify-center shrink-0 ${
                      textInput.trim() && !isTextLoading
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
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
    </>
  );
};
