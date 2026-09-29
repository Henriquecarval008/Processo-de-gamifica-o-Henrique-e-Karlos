/**
 * Modular Interactive Game Room Service for GAMEINFOR (Instituto Ambiente)
 * 
 * Manages:
 * - 6-Digit PIN Room creation by teachers (e.g. "482731")
 * - Multimodal game support:
 *   1. QUIZ: Interactive timed questions with live overtake rank & animated options
 *   2. STOP / ADEDONHA: Letter draw, configurable tech categories, timer, STOP button & urgent countdown, scoring
 *   3. MEMORY GAME: Educational tech concepts card pairs match (CPU, RAM, SSD, GPU, etc.)
 *   4. FORCA TECNOLÓGICA (HANGMAN): Tech terms with didactic tips and letter guessing
 * - Real-Time Waiting Lobby with player avatars and live participant sync
 * - Olympic Podium (1st, 2nd, 3rd) with trophies and validated XP rewards
 * - History and match records
 */

import {
  GameRoomType,
  StopCategory,
  MemoryCard,
  LiveQuizParticipant,
  LiveQuizQuestion,
} from '../types';

export interface HangmanState {
  word: string;
  category: string;
  hint: string;
  guessedLetters: string[];
  maxMistakes: number;
  mistakes: number;
  isSolved: boolean;
  solvedBy?: string;
}

export interface GameRoom {
  id: string;
  pin: string; // 6-digit code, e.g. "482731"
  title: string;
  gameType: GameRoomType;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  status: 'waiting' | 'in_progress' | 'round_ended' | 'finished';
  durationSec: number;
  participants: LiveQuizParticipant[];
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  countdownRemaining?: number; // 3, 2, 1 transition

  // Game-specific configurations & state
  stopState?: {
    currentRound: number;
    totalRounds: number;
    currentLetter: string;
    categories: StopCategory[];
    timePerRoundSec: number;
    roundEndTime?: number;
    stopTriggeredBy?: { id: string; name: string };
    stopCountdownRemaining?: number; // 10s countdown once STOP is called
    submittedAnswers: Record<string, Record<string, string>>; // playerId -> categoryId -> answer
    roundScores: Record<string, number>; // playerId -> points in current round
    totalScores: Record<string, number>; // playerId -> accumulated points
  };

  memoryState?: {
    cards: MemoryCard[];
    flippedCardIds: string[];
    matchedPairIds: string[];
    playerPairsCount: Record<string, number>;
  };

  quizState?: {
    questions: LiveQuizQuestion[];
    currentQuestionIndex: number;
    totalQuestions: number;
    questionStartedAt: number;
    questionDurationSec: number;
    answers: Record<string, Record<number, { selectedIndex: number; isCorrect: boolean; timeMs: number }>>;
  };

  hangmanState?: HangmanState;

  podium?: {
    first?: LiveQuizParticipant;
    second?: LiveQuizParticipant;
    third?: LiveQuizParticipant;
  };
}

const GAME_ROOMS_STORAGE_KEY = 'gameinfor_multiplayer_rooms_v1';
const BROADCAST_CHANNEL_NAME = 'gameinfor_gamerooms_sync_v1';

// Preset vocabulary for games
export const TECH_STOP_CATEGORIES: string[] = [
  'Peça ou Hardware',
  'Software ou Aplicativo',
  'Comando ou Atalho',
  'Termo da Internet / Nuvem',
  'Profissão em Tecnologia',
];

export const TECH_HANGMAN_WORDS = [
  { word: 'PROCESSADOR', category: 'Hardware', hint: 'O cérebro do computador responsável por executar instruções.' },
  { word: 'ALGORITMO', category: 'Programação', hint: 'Sequência lógica e finita de passos para resolver um problema.' },
  { word: 'FIREWALL', category: 'Segurança', hint: 'Dispositivo ou software que protege redes contra invasões não autorizadas.' },
  { word: 'PLANILHA', category: 'Aplicativos', hint: 'Documento composto por linhas e colunas para cálculos e dados.' },
  { word: 'NAVEGADOR', category: 'Internet', hint: 'Programa que permite visualizar e interagir com sites na World Wide Web.' },
  { word: 'CRIPTOGRAFIA', category: 'Segurança', hint: 'Técnica de codificar mensagens para manter a privacidade dos dados.' },
  { word: 'PLACA-MAE', category: 'Hardware', hint: 'Circuito principal que interliga todos os componentes do microcomputador.' },
  { word: 'MEMORIA', category: 'Hardware', hint: 'Componente responsável pelo armazenamento temporário ou permanente.' },
];

export const DEFAULT_QUIZ_QUESTIONS: LiveQuizQuestion[] = [
  {
    id: 'gq-1',
    question: 'Qual caractere é OBRIGATÓRIO para iniciar qualquer cálculo ou fórmula no Microsoft Excel?',
    options: ['Sinal de mais (+)', 'Sinal de arroba (@)', 'Sinal de igual (=)', 'Sinal de asterisco (*)'],
    correctIndex: 2,
    timeSec: 25,
    explanation: 'Toda fórmula no Excel deve iniciar estritamente com o sinal de igual (=).',
  },
  {
    id: 'gq-2',
    question: 'Qual atalho universal de teclado no Windows desfaz a última alteração realizada?',
    options: ['Ctrl + C', 'Ctrl + Z', 'Ctrl + V', 'Ctrl + S'],
    correctIndex: 1,
    timeSec: 20,
    explanation: 'Ctrl + Z é o comando padrão para desfazer ações.',
  },
  {
    id: 'gq-3',
    question: 'Qual componente físico é responsável por manter os dados carregados temporariamente enquanto o PC está ligado?',
    options: ['Disco Rígido (HD)', 'Fonte de Alimentação', 'Memória RAM', 'Gabinete'],
    correctIndex: 2,
    timeSec: 25,
    explanation: 'A Memória RAM é volátil e guarda dados operacionais de alta velocidade em tempo de execução.',
  },
  {
    id: 'gq-4',
    question: 'Qual destas extensões corresponde a uma pasta de trabalho moderna do Microsoft Excel?',
    options: ['.docx', '.xlsx', '.pptx', '.pdf'],
    correctIndex: 1,
    timeSec: 20,
    explanation: '.xlsx é a extensão oficial das planilhas do Microsoft Excel.',
  },
  {
    id: 'gq-5',
    question: 'Qual recurso protege o computador contra tráfego não autorizado vindo da Internet?',
    options: ['Firewall', 'Paint', 'Bloco de Notas', 'Calculadora'],
    correctIndex: 0,
    timeSec: 20,
    explanation: 'O Firewall inspeciona e filtra pacotes de dados para barrar acessos nocivos.',
  },
];

class GameRoomService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(rooms: GameRoom[]) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = () => {
          this.notifyListeners();
        };
      } catch {
        // BroadcastChannel fallback
      }
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === GAME_ROOMS_STORAGE_KEY) {
          this.notifyListeners();
        }
      });
    }

    // Seed default rooms if empty
    this.seedDefaultRoomsIfEmpty();
  }

  public subscribe(callback: (rooms: GameRoom[]) => void): () => void {
    this.listeners.add(callback);
    callback(this.getRooms());
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const rooms = this.getRooms();
    this.listeners.forEach((cb) => {
      try {
        cb(rooms);
      } catch (err) {
        console.error('Error in GameRoom listener:', err);
      }
    });
  }

  private broadcast() {
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'SYNC', timestamp: Date.now() });
      } catch {
        // fallback
      }
    }
    this.notifyListeners();
  }

  public getRooms(): GameRoom[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(GAME_ROOMS_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return [];
  }

  private saveRooms(rooms: GameRoom[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GAME_ROOMS_STORAGE_KEY, JSON.stringify(rooms));
      this.broadcast();
    } catch (e) {
      console.warn('Erro ao salvar salas de jogos:', e);
    }
  }

  private generate6DigitPin(existingRooms: GameRoom[]): string {
    const existingPins = new Set(existingRooms.map((r) => r.pin));
    for (let attempts = 0; attempts < 1000; attempts++) {
      const pin = Math.floor(100000 + Math.random() * 900000).toString();
      if (!existingPins.has(pin)) return pin;
    }
    return '482731';
  }

  private seedDefaultRoomsIfEmpty() {
    const rooms = this.getRooms();
    if (rooms.length === 0) {
      // 1. Sala Stop
      const stopRoom: GameRoom = {
        id: 'room-demo-stop',
        pin: '482731',
        title: 'Super Desafio Stop de Informática',
        gameType: 'stop',
        classId: 'turma-1',
        className: 'Turma Alpha (Manhã)',
        teacherId: 'user-prof-1',
        teacherName: 'Instrutor Henrique',
        status: 'waiting',
        durationSec: 60,
        participants: [
          {
            id: 'user-aluno-1',
            roomId: 'room-demo-stop',
            name: 'Lucas Silva',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            xp: 550,
            correctCount: 4,
            wrongCount: 0,
            totalAnswerTimeMs: 12000,
            previousRank: 1,
            currentRank: 1,
            joinedAt: Date.now() - 90000,
          },
          {
            id: 'user-aluno-2',
            name: 'Beatriz Lima',
            roomId: 'room-demo-stop',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
            xp: 480,
            correctCount: 3,
            wrongCount: 1,
            totalAnswerTimeMs: 15000,
            previousRank: 2,
            currentRank: 2,
            joinedAt: Date.now() - 60000,
          },
          {
            id: 'user-aluno-3',
            name: 'Gabriel Costa',
            roomId: 'room-demo-stop',
            avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
            xp: 420,
            correctCount: 3,
            wrongCount: 0,
            totalAnswerTimeMs: 18000,
            previousRank: 3,
            currentRank: 3,
            joinedAt: Date.now() - 40000,
          },
        ],
        createdAt: Date.now() - 180000,
        stopState: {
          currentRound: 1,
          totalRounds: 3,
          currentLetter: 'P',
          timePerRoundSec: 60,
          categories: TECH_STOP_CATEGORIES.map((name, i) => ({ id: `cat-${i + 1}`, name })),
          submittedAnswers: {},
          roundScores: {},
          totalScores: {},
        },
      };

      // 2. Sala Quiz
      const quizRoom: GameRoom = {
        id: 'room-demo-quiz',
        pin: '591420',
        title: 'Quiz Relâmpago: Atalhos & Fórmulas',
        gameType: 'quiz',
        classId: 'turma-1',
        className: 'Turma Alpha (Manhã)',
        teacherId: 'user-prof-1',
        teacherName: 'Instrutor Henrique',
        status: 'waiting',
        durationSec: 25,
        participants: [
          {
            id: 'user-aluno-1',
            roomId: 'room-demo-quiz',
            name: 'Lucas Silva',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            xp: 550,
            correctCount: 0,
            wrongCount: 0,
            totalAnswerTimeMs: 0,
            previousRank: 1,
            currentRank: 1,
            joinedAt: Date.now() - 30000,
          },
        ],
        createdAt: Date.now() - 100000,
        quizState: {
          questions: DEFAULT_QUIZ_QUESTIONS,
          currentQuestionIndex: 0,
          totalQuestions: DEFAULT_QUIZ_QUESTIONS.length,
          questionStartedAt: 0,
          questionDurationSec: 25,
          answers: {},
        },
      };

      this.saveRooms([stopRoom, quizRoom]);
    }
  }

  public getRoomByPin(pin: string): GameRoom | undefined {
    const cleanPin = pin.trim().replace(/\D/g, '');
    return this.getRooms().find((r) => r.pin === cleanPin && r.status !== 'finished');
  }

  public getRoomById(roomId: string): GameRoom | undefined {
    return this.getRooms().find((r) => r.id === roomId);
  }

  /**
   * Teacher creates a new multiplayer room with a unique 6-digit PIN
   */
  public createRoom(params: {
    title: string;
    gameType: GameRoomType;
    classId: string;
    className: string;
    teacherId: string;
    teacherName: string;
    durationSec?: number;
    stopCategories?: string[];
    quizQuestions?: LiveQuizQuestion[];
  }): GameRoom {
    const rooms = this.getRooms();
    const pin = this.generate6DigitPin(rooms);
    const roomId = `room-${Date.now()}`;

    // Memory cards deck generator
    const memoryConcepts = [
      { id: 'pair-1', label: 'CPU', concept: 'Processador / Cérebro do Computador', icon: '🧠' },
      { id: 'pair-2', label: 'Memória RAM', concept: 'Armazenamento Temporário de Alta Velocidade', icon: '⚡' },
      { id: 'pair-3', label: 'SSD NVMe', concept: 'Armazenamento de Alta Velocidade sem Partes Móveis', icon: '💾' },
      { id: 'pair-4', label: 'Placa-Mãe', concept: 'Circuito que Conecta todos os Componentes', icon: '🔌' },
      { id: 'pair-5', label: 'Navegador Web', concept: 'Programa para Navegação na Internet', icon: '🌐' },
      { id: 'pair-6', label: 'Firewall', concept: 'Proteção contra Invasões e Ameaças', icon: '🛡️' },
    ];

    const memoryCards: MemoryCard[] = [];
    memoryConcepts.forEach((c) => {
      memoryCards.push({
        id: `card-${c.id}-a`,
        pairId: c.id,
        label: c.label,
        concept: c.concept,
        icon: c.icon,
        isFlipped: false,
        isMatched: false,
      });
      memoryCards.push({
        id: `card-${c.id}-b`,
        pairId: c.id,
        label: c.label,
        concept: c.concept,
        icon: c.icon,
        isFlipped: false,
        isMatched: false,
      });
    });
    memoryCards.sort(() => Math.random() - 0.5);

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'M', 'P', 'R', 'S', 'T'];
    const randomLetter = letters[Math.floor(Math.random() * letters.length)];

    const chosenStopCategories = (params.stopCategories && params.stopCategories.length > 0)
      ? params.stopCategories
      : TECH_STOP_CATEGORIES;

    const chosenHangman = TECH_HANGMAN_WORDS[Math.floor(Math.random() * TECH_HANGMAN_WORDS.length)];

    const newRoom: GameRoom = {
      id: roomId,
      pin,
      title: params.title,
      gameType: params.gameType,
      classId: params.classId,
      className: params.className,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      status: 'waiting',
      durationSec: params.durationSec || 60,
      participants: [],
      createdAt: Date.now(),
      stopState:
        params.gameType === 'stop'
          ? {
              currentRound: 1,
              totalRounds: 3,
              currentLetter: randomLetter,
              timePerRoundSec: params.durationSec || 60,
              categories: chosenStopCategories.map((name, i) => ({ id: `cat-${i + 1}`, name })),
              submittedAnswers: {},
              roundScores: {},
              totalScores: {},
            }
          : undefined,
      memoryState:
        params.gameType === 'memory'
          ? {
              cards: memoryCards,
              flippedCardIds: [],
              matchedPairIds: [],
              playerPairsCount: {},
            }
          : undefined,
      quizState:
        params.gameType === 'quiz'
          ? {
              questions: params.quizQuestions && params.quizQuestions.length > 0 ? params.quizQuestions : DEFAULT_QUIZ_QUESTIONS,
              currentQuestionIndex: 0,
              totalQuestions: (params.quizQuestions && params.quizQuestions.length > 0 ? params.quizQuestions : DEFAULT_QUIZ_QUESTIONS).length,
              questionStartedAt: 0,
              questionDurationSec: params.durationSec || 25,
              answers: {},
            }
          : undefined,
      hangmanState:
        params.gameType === 'hangman'
          ? {
              word: chosenHangman.word,
              category: chosenHangman.category,
              hint: chosenHangman.hint,
              guessedLetters: [],
              maxMistakes: 6,
              mistakes: 0,
              isSolved: false,
            }
          : undefined,
    };

    rooms.unshift(newRoom);
    this.saveRooms(rooms);
    return newRoom;
  }

  /**
   * Student enters a game room by 6-digit PIN code
   */
  public joinRoomByPin(
    pin: string,
    student: { id: string; name: string; avatar: string; xp: number }
  ): { success: boolean; room?: GameRoom; message?: string } {
    const cleanPin = pin.trim().replace(/\D/g, '');
    const rooms = this.getRooms();
    const roomIdx = rooms.findIndex((r) => r.pin === cleanPin);

    if (roomIdx === -1) {
      return { success: false, message: 'Nenhuma sala ativa encontrada com este código PIN.' };
    }

    const room = rooms[roomIdx];

    if (room.status === 'finished') {
      return { success: false, message: 'Esta sala de jogos já foi finalizada pelo professor.' };
    }

    // Check if student already in room
    const existingPIdx = room.participants.findIndex((p) => p.id === student.id);
    if (existingPIdx === -1) {
      const participant: LiveQuizParticipant = {
        id: student.id,
        roomId: room.id,
        name: student.name,
        avatar: student.avatar,
        xp: 0, // In-room points
        correctCount: 0,
        wrongCount: 0,
        totalAnswerTimeMs: 0,
        previousRank: room.participants.length + 1,
        currentRank: room.participants.length + 1,
        joinedAt: Date.now(),
      };
      room.participants.push(participant);
      rooms[roomIdx] = room;
      this.saveRooms(rooms);
    }

    return { success: true, room };
  }

  /**
   * Remove / kick a participant by teacher
   */
  public removeParticipant(roomId: string, participantId: string): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return undefined;

    room.participants = room.participants.filter((p) => p.id !== participantId);
    this.saveRooms(rooms);
    return room;
  }

  /**
   * Student leaves the room voluntarily
   */
  public leaveRoom(roomId: string, studentId: string): boolean {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return false;

    room.participants = room.participants.filter((p) => p.id !== studentId);
    this.saveRooms(rooms);
    return true;
  }

  /**
   * Teacher starts the game match for all participants (triggers 3s countdown transition)
   */
  public startGame(roomId: string): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return undefined;

    room.status = 'in_progress';
    room.startedAt = Date.now();
    room.countdownRemaining = 3;

    if (room.stopState) {
      room.stopState.roundEndTime = Date.now() + room.stopState.timePerRoundSec * 1000 + 3000;
      room.stopState.stopTriggeredBy = undefined;
      room.stopState.stopCountdownRemaining = undefined;
      room.stopState.submittedAnswers = {};
      room.stopState.roundScores = {};
    }

    if (room.quizState) {
      room.quizState.currentQuestionIndex = 0;
      room.quizState.questionStartedAt = Date.now() + 3000;
      room.quizState.answers = {};
    }

    this.saveRooms(rooms);

    // Run transition countdown
    let count = 3;
    const interval = setInterval(() => {
      count--;
      const freshRooms = this.getRooms();
      const freshRoom = freshRooms.find((r) => r.id === roomId);
      if (freshRoom) {
        freshRoom.countdownRemaining = count > 0 ? count : undefined;
        this.saveRooms(freshRooms);
      }
      if (count <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return room;
  }

  /**
   * Student hits STOP button in Adedonha / Stop
   */
  public triggerStop(roomId: string, studentId: string, studentName: string): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.stopState || room.status !== 'in_progress') return undefined;

    // First one to call STOP gets a bonus of 25 XP
    if (!room.stopState.stopTriggeredBy) {
      room.stopState.stopTriggeredBy = { id: studentId, name: studentName };
      room.stopState.stopCountdownRemaining = 10;
      room.stopState.roundEndTime = Date.now() + 10000;

      const p = room.participants.find((pt) => pt.id === studentId);
      if (p) p.xp += 25; // Bonus for pressing STOP first!

      this.saveRooms(rooms);

      // 10-second countdown for all players to finish
      let rem = 10;
      const countTimer = setInterval(() => {
        rem--;
        const currentRooms = this.getRooms();
        const curRoom = currentRooms.find((r) => r.id === roomId);
        if (curRoom && curRoom.stopState) {
          curRoom.stopState.stopCountdownRemaining = rem;
          if (rem <= 0) {
            clearInterval(countTimer);
            this.endStopRound(roomId);
          } else {
            this.saveRooms(currentRooms);
          }
        } else {
          clearInterval(countTimer);
        }
      }, 1000);
    }

    return room;
  }

  /**
   * End current Stop round and calculate scores
   */
  public endStopRound(roomId: string): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.stopState) return undefined;

    const stop = room.stopState;
    const targetLetter = stop.currentLetter.toLowerCase();

    // Map answers for uniqueness check
    // categoryId -> answer -> count of students with this answer
    const answerCounts: Record<string, Record<string, number>> = {};

    Object.entries(stop.submittedAnswers).forEach(([, answers]) => {
      Object.entries(answers).forEach(([catId, val]) => {
        const clean = val.trim().toLowerCase();
        if (clean.length > 0 && clean.startsWith(targetLetter)) {
          if (!answerCounts[catId]) answerCounts[catId] = {};
          answerCounts[catId][clean] = (answerCounts[catId][clean] || 0) + 1;
        }
      });
    });

    // Score: 10 pts for unique valid answer, 5 pts if repeated, 0 if invalid
    room.participants.forEach((p) => {
      const answers = stop.submittedAnswers[p.id] || {};
      let roundScore = 0;

      Object.entries(answers).forEach(([catId, val]) => {
        const clean = val.trim().toLowerCase();
        if (clean.length > 0 && clean.startsWith(targetLetter)) {
          const occ = answerCounts[catId]?.[clean] || 1;
          if (occ === 1) {
            roundScore += 10; // Unique answer
          } else {
            roundScore += 5; // Duplicate answer
          }
          p.correctCount++;
        }
      });

      stop.roundScores[p.id] = (stop.roundScores[p.id] || 0) + roundScore;
      stop.totalScores[p.id] = (stop.totalScores[p.id] || 0) + roundScore;
      p.xp += roundScore;
    });

    // Re-rank participants
    room.participants.sort((a, b) => b.xp - a.xp);
    room.participants.forEach((p, idx) => {
      p.previousRank = p.currentRank;
      p.currentRank = idx + 1;
    });

    if (stop.currentRound >= stop.totalRounds) {
      // Final round, finish game
      this.endGame(roomId);
    } else {
      room.status = 'round_ended';
      this.saveRooms(rooms);
    }

    return room;
  }

  /**
   * Advance to next Stop round
   */
  public nextStopRound(roomId: string): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.stopState) return undefined;

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'I', 'M', 'P', 'R', 'S', 'T'];
    const currentLetter = room.stopState.currentLetter;
    const remainingLetters = letters.filter((l) => l !== currentLetter);
    const newLetter = remainingLetters[Math.floor(Math.random() * remainingLetters.length)] || 'C';

    room.stopState.currentRound += 1;
    room.stopState.currentLetter = newLetter;
    room.stopState.roundEndTime = Date.now() + room.stopState.timePerRoundSec * 1000;
    room.stopState.stopTriggeredBy = undefined;
    room.stopState.stopCountdownRemaining = undefined;
    room.stopState.submittedAnswers = {};
    room.stopState.roundScores = {};
    room.status = 'in_progress';

    this.saveRooms(rooms);
    return room;
  }

  /**
   * Student submits answers for Stop / Adedonha
   */
  public submitStopAnswers(
    roomId: string,
    studentId: string,
    answers: Record<string, string>
  ): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.stopState) return undefined;

    room.stopState.submittedAnswers[studentId] = answers;
    this.saveRooms(rooms);
    return room;
  }

  /**
   * Submit Quiz answer
   */
  public submitQuizAnswer(
    roomId: string,
    studentId: string,
    questionIndex: number,
    selectedIndex: number,
    timeMs: number
  ): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.quizState) return undefined;

    const q = room.quizState.questions[questionIndex];
    if (!q) return room;

    const isCorrect = selectedIndex === q.correctIndex;
    if (!room.quizState.answers[studentId]) {
      room.quizState.answers[studentId] = {};
    }

    room.quizState.answers[studentId][questionIndex] = {
      selectedIndex,
      isCorrect,
      timeMs,
    };

    // Calculate score with speed bonus
    const p = room.participants.find((pt) => pt.id === studentId);
    if (p) {
      if (isCorrect) {
        // Speed multiplier: max 100 base + up to 50 for quick answer
        const maxTimeMs = (q.timeSec || 25) * 1000;
        const timeFactor = Math.max(0, (maxTimeMs - timeMs) / maxTimeMs);
        const pts = Math.round(100 + timeFactor * 50);
        p.xp += pts;
        p.correctCount++;
      } else {
        p.wrongCount++;
      }
      p.totalAnswerTimeMs += timeMs;
    }

    // Sort rankings
    room.participants.sort((a, b) => b.xp - a.xp);
    room.participants.forEach((pt, i) => {
      pt.previousRank = pt.currentRank;
      pt.currentRank = i + 1;
    });

    this.saveRooms(rooms);
    return room;
  }

  /**
   * Advance to next question in Quiz
   */
  public nextQuizQuestion(roomId: string): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.quizState) return undefined;

    const nextIdx = room.quizState.currentQuestionIndex + 1;
    if (nextIdx >= room.quizState.totalQuestions) {
      this.endGame(roomId);
      return this.getRoomById(roomId);
    }

    room.quizState.currentQuestionIndex = nextIdx;
    room.quizState.questionStartedAt = Date.now();
    this.saveRooms(rooms);
    return room;
  }

  /**
   * Flip card in Memory Game
   */
  public flipMemoryCard(roomId: string, studentId: string, cardId: string): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.memoryState) return undefined;

    const mem = room.memoryState;
    const card = mem.cards.find((c) => c.id === cardId);
    if (!card || card.isMatched || card.isFlipped || mem.flippedCardIds.length >= 2) {
      return room;
    }

    card.isFlipped = true;
    mem.flippedCardIds.push(cardId);

    // If 2 cards flipped, check pair
    if (mem.flippedCardIds.length === 2) {
      const c1 = mem.cards.find((c) => c.id === mem.flippedCardIds[0])!;
      const c2 = mem.cards.find((c) => c.id === mem.flippedCardIds[1])!;

      if (c1.pairId === c2.pairId) {
        c1.isMatched = true;
        c2.isMatched = true;
        mem.matchedPairIds.push(c1.pairId);
        mem.playerPairsCount[studentId] = (mem.playerPairsCount[studentId] || 0) + 1;

        // Reward student
        const p = room.participants.find((pt) => pt.id === studentId);
        if (p) {
          p.xp += 60;
          p.correctCount++;
        }

        mem.flippedCardIds = [];

        // Check if all cards matched
        if (mem.matchedPairIds.length === mem.cards.length / 2) {
          this.endGame(roomId);
          return this.getRoomById(roomId);
        }
      } else {
        setTimeout(() => {
          c1.isFlipped = false;
          c2.isFlipped = false;
          mem.flippedCardIds = [];
          this.saveRooms(this.getRooms());
        }, 1200);
      }
    }

    this.saveRooms(rooms);
    return room;
  }

  /**
   * Guess a letter in Hangman
   */
  public guessHangmanLetter(roomId: string, letter: string, studentId: string): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room || !room.hangmanState) return undefined;

    const hang = room.hangmanState;
    const upper = letter.toUpperCase();
    if (hang.guessedLetters.includes(upper) || hang.isSolved || hang.mistakes >= hang.maxMistakes) {
      return room;
    }

    hang.guessedLetters.push(upper);
    const p = room.participants.find((pt) => pt.id === studentId);

    if (hang.word.includes(upper)) {
      if (p) p.xp += 15;

      // Check if word is fully solved
      const isComplete = hang.word.split('').every((char) => char === ' ' || char === '-' || hang.guessedLetters.includes(char));
      if (isComplete) {
        hang.isSolved = true;
        hang.solvedBy = p?.name;
        if (p) p.xp += 80;
        this.endGame(roomId);
      }
    } else {
      hang.mistakes++;
      if (hang.mistakes >= hang.maxMistakes) {
        this.endGame(roomId);
      }
    }

    this.saveRooms(rooms);
    return room;
  }

  /**
   * Finalize the game and calculate the Olympic Podium (1st, 2nd, 3rd)
   */
  public endGame(roomId: string): GameRoom | undefined {
    const rooms = this.getRooms();
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return undefined;

    room.status = 'finished';
    room.finishedAt = Date.now();

    // Sort participants by total XP/Score
    const sorted = [...room.participants].sort((a, b) => b.xp - a.xp);

    room.podium = {
      first: sorted[0],
      second: sorted[1],
      third: sorted[2],
    };

    this.saveRooms(rooms);
    return room;
  }

  public deleteRoom(roomId: string): boolean {
    const rooms = this.getRooms();
    const idx = rooms.findIndex((r) => r.id === roomId);
    if (idx === -1) return false;
    rooms.splice(idx, 1);
    this.saveRooms(rooms);
    return true;
  }
}

export const gameRoomService = new GameRoomService();
