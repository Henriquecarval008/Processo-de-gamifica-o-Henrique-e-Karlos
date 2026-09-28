/**
 * Live Quiz Service & Store for Real-Time Interactive Classroom Quizzes.
 * Provides synchronized multi-participant quiz rooms, real-time events via BroadcastChannel
 * and localStorage, instant XP calculations, overtake detection, and tiebreaker logic.
 */
import {
  LiveQuizRoom,
  LiveQuizParticipant,
  LiveQuizQuestion,
  RoomAudioConfig,
} from '../types';
import { DEFAULT_ROOM_AUDIO_CONFIG } from '../utils/audioLibrary';

const ROOMS_STORAGE_KEY = 'gameinfor_live_rooms_v2';
const BROADCAST_CHANNEL_NAME = 'gameinfor_live_quiz_sync';

export interface RoomEventPayload {
  type:
    | 'ROOM_CREATED'
    | 'ROOM_UPDATED'
    | 'PARTICIPANT_JOINED'
    | 'PARTICIPANT_LEFT'
    | 'QUIZ_STARTED'
    | 'QUESTION_STARTED'
    | 'ANSWER_SUBMITTED'
    | 'QUESTION_ENDED'
    | 'SHOW_RANKING'
    | 'NEXT_QUESTION'
    | 'QUIZ_FINISHED'
    | 'ROOM_DELETED';
  roomId: string;
  data?: unknown;
  timestamp: number;
}

type EventCallback = (event: RoomEventPayload) => void;

class LiveQuizService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<EventCallback> = new Set();
  private timerIntervals: Map<string, number> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.channel.onmessage = (event: MessageEvent<RoomEventPayload>) => {
        this.notifyListeners(event.data);
      };
    }

    // Storage event fallback for cross-tab updates
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === ROOMS_STORAGE_KEY) {
          this.notifyListeners({
            type: 'ROOM_UPDATED',
            roomId: '',
            timestamp: Date.now(),
          });
        }
      });
    }

    // Initial seed rooms if none exist
    this.seedDefaultRoomsIfEmpty();
  }

  public subscribe(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: RoomEventPayload) {
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error('Error in LiveQuiz listener:', err);
      }
    });
  }

  private broadcast(type: RoomEventPayload['type'], roomId: string, data?: unknown) {
    const payload: RoomEventPayload = {
      type,
      roomId,
      data,
      timestamp: Date.now(),
    };
    if (this.channel) {
      try {
        this.channel.postMessage(payload);
      } catch {
        // BroadcastChannel error fallback
      }
    }
    this.notifyListeners(payload);
  }

  // Storage Helpers
  public getRooms(): LiveQuizRoom[] {
    try {
      const data = localStorage.getItem(ROOMS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveRooms(rooms: LiveQuizRoom[]) {
    try {
      localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms));
    } catch {
      // ignore
    }
  }

  public getRoomById(roomId: string): LiveQuizRoom | null {
    const rooms = this.getRooms();
    return rooms.find((r) => r.id === roomId) || null;
  }

  public getRoomByCode(code: string): LiveQuizRoom | null {
    const clean = code.trim().toUpperCase();
    const rooms = this.getRooms();
    return (
      rooms.find(
        (r) =>
          r.code.toUpperCase() === clean ||
          r.code.replace('GAME-', '').toUpperCase() === clean.replace('GAME-', '')
      ) || null
    );
  }

  private getParticipantsStorageKey(roomId: string): string {
    return `gameinfor_live_participants_${roomId}`;
  }

  public getParticipants(roomId: string): LiveQuizParticipant[] {
    try {
      const data = localStorage.getItem(this.getParticipantsStorageKey(roomId));
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return [];
  }

  private saveParticipants(roomId: string, participants: LiveQuizParticipant[]) {
    try {
      localStorage.setItem(
        this.getParticipantsStorageKey(roomId),
        JSON.stringify(participants)
      );
    } catch {
      // ignore
    }
  }

  /**
   * Sort participants using rigorous tiebreaker rules:
   * 1. Total XP (highest to lowest)
   * 2. Number of correct answers (highest to lowest)
   * 3. Total answer time (lowest to highest - faster is better)
   * 4. Join order
   */
  public sortAndRankParticipants(participants: LiveQuizParticipant[]): LiveQuizParticipant[] {
    const sorted = [...participants].sort((a, b) => {
      // 1. Total XP
      if (b.xp !== a.xp) {
        return b.xp - a.xp;
      }
      // 2. Correct answers
      if (b.correctCount !== a.correctCount) {
        return b.correctCount - a.correctCount;
      }
      // 3. Total time taken (faster wins tie)
      if (a.totalAnswerTimeMs !== b.totalAnswerTimeMs) {
        return a.totalAnswerTimeMs - b.totalAnswerTimeMs;
      }
      // 4. Join order
      return a.joinedAt - b.joinedAt;
    });

    return sorted.map((p, idx) => {
      const newRank = idx + 1;
      const prevRank = p.currentRank || newRank;
      const rankDelta = prevRank - newRank; // positive means climbed up
      return {
        ...p,
        previousRank: prevRank,
        currentRank: newRank,
        rankDelta,
      };
    });
  }

  /**
   * Generate a friendly game code like "GAME-4821"
   */
  public generateRoomCode(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `GAME-${num}`;
  }

  /**
   * Seed default quiz room for immediate review & test
   */
  private seedDefaultRoomsIfEmpty() {
    const existing = this.getRooms();
    if (existing.length === 0) {
      const defaultRoomId = 'room-informatica-demo';
      const defaultRoom: LiveQuizRoom = {
        id: defaultRoomId,
        code: 'GAME-4821',
        name: 'Revisão de Informática Básica & Excel',
        lessonTitle: 'Aula 04 — Fórmulas e Interface do Excel',
        description:
          'Sala ao vivo com perguntas interativas de informática essencial, fórmulas, interface e atalhos.',
        teacherId: 'user-prof-1',
        teacherName: 'Prof. Carlos Silva',
        status: 'waiting',
        defaultTimeSec: 30,
        allowImages: true,
        currentQuestionIndex: 0,
        xpRules: {
          startingXp: 1000,
          correctXp: 100,
          wrongXp: -30,
          speedBonus: true,
        },
        audioConfig: { ...DEFAULT_ROOM_AUDIO_CONFIG },
        questions: [
          {
            id: 'q-1',
            question: 'Qual programa é utilizado principalmente para criar planilhas eletrônicas e cálculos?',
            options: ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Paint'],
            correctIndex: 1,
            timeSec: 30,
            explanation: 'O Microsoft Excel é a ferramenta líder para criação e manipulação de planilhas de cálculo.',
          },
          {
            id: 'q-2',
            question: 'Qual caractere OBRIGATÓRIO deve iniciar qualquer fórmula no Microsoft Excel?',
            options: ['Sinal de mais (+)', 'Sinal de arroba (@)', 'Sinal de igual (=)', 'Sinal de cifrão ($)'],
            correctIndex: 2,
            timeSec: 25,
            explanation: 'Toda fórmula de cálculo no Excel deve iniciar impreterivelmente com o sinal de igual (=).',
          },
          {
            id: 'q-3',
            question: 'Qual fórmula calcula corretamente a média aritmética dos valores contidos de B2 até B10?',
            options: ['=MEDIA(B2:B10)', '=MED(B2..B10)', '=CALCULAR_MEDIA(B2;B10)', '=SOMA(B2:B10)/TOTAL'],
            correctIndex: 0,
            timeSec: 30,
            explanation: 'A função =MEDIA(B2:B10) soma os valores do intervalo e divide pela quantidade de células.',
          },
          {
            id: 'q-4',
            question: 'Qual é a principal função do atalho de teclado Ctrl + Z no Windows e nos programas de escritório?',
            options: ['Fechar o programa atual', 'Desfazer a última ação realizada', 'Salvar o arquivo no disco', 'Imprimir o documento'],
            correctIndex: 1,
            timeSec: 20,
            explanation: 'O atalho universal Ctrl + Z serve para desfazer instantaneamente a última edição ou comando.',
          },
          {
            id: 'q-5',
            question: 'No Excel, qual operador representa a multiplicação entre duas células?',
            options: ['x (letra x)', '* (asterisco)', '. (ponto)', '^ (circunflexo)'],
            correctIndex: 1,
            timeSec: 25,
            explanation: 'O asterisco (*) é o operador aritmético de multiplicação nas planilhas (ex: =A1*B1).',
          },
        ],
        createdAt: Date.now() - 3600000,
        updatedAt: Date.now(),
      };

      this.saveRooms([defaultRoom]);

      // Seed 3 active sample participants so ranking and overtakes can be demonstrated immediately
      const sampleParticipants: LiveQuizParticipant[] = [
        {
          id: 'part-joao',
          roomId: defaultRoomId,
          name: 'João Pedro',
          avatar: '👨‍💻',
          xp: 1000,
          correctCount: 0,
          wrongCount: 0,
          totalAnswerTimeMs: 0,
          previousRank: 1,
          currentRank: 1,
          rankDelta: 0,
          joinedAt: Date.now() - 300000,
          isBot: true,
        },
        {
          id: 'part-maria',
          roomId: defaultRoomId,
          name: 'Maria Eduarda',
          avatar: '👩‍🎓',
          xp: 1000,
          correctCount: 0,
          wrongCount: 0,
          totalAnswerTimeMs: 0,
          previousRank: 2,
          currentRank: 2,
          rankDelta: 0,
          joinedAt: Date.now() - 250000,
          isBot: true,
        },
        {
          id: 'part-pedro',
          roomId: defaultRoomId,
          name: 'Pedro Henrique',
          avatar: '🚀',
          xp: 1000,
          correctCount: 0,
          wrongCount: 0,
          totalAnswerTimeMs: 0,
          previousRank: 3,
          currentRank: 3,
          rankDelta: 0,
          joinedAt: Date.now() - 200000,
          isBot: true,
        },
      ];

      this.saveParticipants(defaultRoomId, sampleParticipants);
    }
  }

  // ==========================================
  // ROOM CRUD OPERATIONS
  // ==========================================

  public createRoom(params: {
    name: string;
    lessonTitle?: string;
    description?: string;
    teacherId: string;
    teacherName: string;
    defaultTimeSec: number;
    allowImages: boolean;
    questions: LiveQuizQuestion[];
    slidesMaterial?: {
      name: string;
      type: string;
      size: string;
      dataUrl?: string;
      uploadedAt: string;
    };
    xpRules?: {
      startingXp?: number;
      correctXp?: number;
      wrongXp?: number;
      speedBonus?: boolean;
    };
    audioConfig?: RoomAudioConfig;
  }): LiveQuizRoom {
    const roomId = 'room-' + Date.now();
    const code = this.generateRoomCode();

    const newRoom: LiveQuizRoom = {
      id: roomId,
      code,
      name: params.name.trim(),
      lessonTitle: params.lessonTitle?.trim() || 'Aula de Informática',
      description: params.description?.trim() || '',
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      status: 'waiting',
      defaultTimeSec: params.defaultTimeSec || 30,
      allowImages: params.allowImages ?? true,
      currentQuestionIndex: 0,
      slidesMaterial: params.slidesMaterial,
      xpRules: {
        startingXp: params.xpRules?.startingXp ?? 1000,
        correctXp: params.xpRules?.correctXp ?? 100,
        wrongXp: params.xpRules?.wrongXp ?? -30,
        speedBonus: params.xpRules?.speedBonus ?? true,
      },
      audioConfig: params.audioConfig || { ...DEFAULT_ROOM_AUDIO_CONFIG },
      questions: params.questions,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const rooms = this.getRooms();
    rooms.unshift(newRoom);
    this.saveRooms(rooms);

    this.broadcast('ROOM_CREATED', roomId, newRoom);
    return newRoom;
  }

  public updateRoom(roomId: string, partial: Partial<LiveQuizRoom>): LiveQuizRoom | null {
    const rooms = this.getRooms();
    const idx = rooms.findIndex((r) => r.id === roomId);
    if (idx === -1) return null;

    rooms[idx] = {
      ...rooms[idx],
      ...partial,
      updatedAt: Date.now(),
    };

    this.saveRooms(rooms);
    this.broadcast('ROOM_UPDATED', roomId, rooms[idx]);
    return rooms[idx];
  }

  public updateRoomAudioConfig(
    roomId: string,
    audioConfig: RoomAudioConfig
  ): LiveQuizRoom | null {
    return this.updateRoom(roomId, { audioConfig });
  }

  public deleteRoom(roomId: string) {
    const rooms = this.getRooms().filter((r) => r.id !== roomId);
    this.saveRooms(rooms);
    try {
      localStorage.removeItem(this.getParticipantsStorageKey(roomId));
    } catch {}
    this.broadcast('ROOM_DELETED', roomId);
  }

  // ==========================================
  // PARTICIPANT ACTIONS
  // ==========================================

  public joinRoom(params: {
    roomCode: string;
    studentName: string;
    avatar?: string;
    participantId?: string;
  }): { room: LiveQuizRoom; participant: LiveQuizParticipant } | { error: string } {
    const room = this.getRoomByCode(params.roomCode);
    if (!room) {
      return { error: 'Código da sala não encontrado. Verifique o código informado!' };
    }

    if (room.status === 'finished') {
      return { error: 'Esta partida de quiz já foi encerrada pelo professor.' };
    }

    const participants = this.getParticipants(room.id);
    const id = params.participantId || 'part-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    // Check if participant already exists in room by ID or name
    let existing = participants.find(
      (p) => p.id === id || p.name.trim().toLowerCase() === params.studentName.trim().toLowerCase()
    );

    if (existing) {
      return { room, participant: existing };
    }

    const newParticipant: LiveQuizParticipant = {
      id,
      roomId: room.id,
      name: params.studentName.trim(),
      avatar: params.avatar || '🎮',
      xp: room.xpRules.startingXp,
      correctCount: 0,
      wrongCount: 0,
      totalAnswerTimeMs: 0,
      previousRank: participants.length + 1,
      currentRank: participants.length + 1,
      rankDelta: 0,
      joinedAt: Date.now(),
    };

    participants.push(newParticipant);
    const ranked = this.sortAndRankParticipants(participants);
    this.saveParticipants(room.id, ranked);

    const savedParticipant = ranked.find((p) => p.id === id) || newParticipant;
    this.broadcast('PARTICIPANT_JOINED', room.id, savedParticipant);

    return { room, participant: savedParticipant };
  }

  public addDemoBotParticipants(roomId: string, count: number = 3) {
    const botNames = [
      { name: 'Lucas Ferreira', avatar: '💻' },
      { name: 'Beatriz Costa', avatar: '⭐' },
      { name: 'Gabriel Santos', avatar: '🎯' },
      { name: 'Camila Lima', avatar: '🎨' },
      { name: 'Mateus Oliveira', avatar: '⚡' },
    ];

    const room = this.getRoomById(roomId);
    if (!room) return;

    const participants = this.getParticipants(roomId);

    for (let i = 0; i < count; i++) {
      const template = botNames[i % botNames.length];
      const botId = `bot-${Date.now()}-${i}`;
      if (!participants.some((p) => p.name === template.name)) {
        participants.push({
          id: botId,
          roomId,
          name: template.name,
          avatar: template.avatar,
          xp: room.xpRules.startingXp,
          correctCount: 0,
          wrongCount: 0,
          totalAnswerTimeMs: 0,
          previousRank: participants.length + 1,
          currentRank: participants.length + 1,
          rankDelta: 0,
          joinedAt: Date.now() + i * 10,
          isBot: true,
        });
      }
    }

    const ranked = this.sortAndRankParticipants(participants);
    this.saveParticipants(roomId, ranked);
    this.broadcast('ROOM_UPDATED', roomId);
  }

  // ==========================================
  // GAMEPLAY ENGINE
  // ==========================================

  /**
   * Teacher starts the quiz session
   */
  public startQuiz(roomId: string): LiveQuizRoom | null {
    const room = this.getRoomById(roomId);
    if (!room || room.questions.length === 0) return null;

    const firstQuestion = room.questions[0];
    const duration = firstQuestion.timeSec || room.defaultTimeSec;

    const updated = this.updateRoom(roomId, {
      status: 'in_progress',
      currentQuestionIndex: 0,
      currentQuestionStartedAt: Date.now(),
      currentQuestionDuration: duration,
      timerRemaining: duration,
      isTimerPaused: false,
    });

    // Also trigger bot auto-responses after a realistic delay
    this.scheduleBotResponses(roomId, 0, duration);

    this.broadcast('QUIZ_STARTED', roomId, updated);
    return updated;
  }

  /**
   * Student submits their answer for the active question
   */
  public submitAnswer(params: {
    roomId: string;
    participantId: string;
    questionIndex: number;
    optionIndex: number;
  }): { participant: LiveQuizParticipant; isCorrect: boolean; xpDelta: number } | null {
    const room = this.getRoomById(params.roomId);
    if (!room || room.status !== 'in_progress') return null;

    const question = room.questions[params.questionIndex];
    if (!question) return null;

    const participants = this.getParticipants(params.roomId);
    const pIdx = participants.findIndex((p) => p.id === params.participantId);
    if (pIdx === -1) return null;

    const participant = participants[pIdx];

    // Disallow duplicate answers for the same question
    if (participant.lastAnswer && participant.lastAnswer.questionIndex === params.questionIndex) {
      return {
        participant,
        isCorrect: participant.lastAnswer.isCorrect,
        xpDelta: participant.lastAnswer.xpDelta,
      };
    }

    const isCorrect = params.optionIndex === question.correctIndex;
    const startTime = room.currentQuestionStartedAt || Date.now();
    const elapsedMs = Math.max(200, Date.now() - startTime);
    const durationSec = room.currentQuestionDuration || room.defaultTimeSec;
    const timeTakenSec = Math.min(durationSec, Math.round(elapsedMs / 100) / 10);

    let xpDelta = 0;
    if (isCorrect) {
      // Base XP
      xpDelta = room.xpRules.correctXp;

      // Speed bonus: up to +30 XP if answered very fast
      if (room.xpRules.speedBonus && durationSec > 0) {
        const remainingFraction = Math.max(0, (durationSec - timeTakenSec) / durationSec);
        const bonus = Math.round(remainingFraction * 30);
        xpDelta += bonus;
      }
    } else {
      // Wrong answer deduction
      xpDelta = room.xpRules.wrongXp; // e.g. -30 XP
    }

    const newXp = Math.max(0, participant.xp + xpDelta);

    participants[pIdx] = {
      ...participant,
      xp: newXp,
      correctCount: isCorrect ? participant.correctCount + 1 : participant.correctCount,
      wrongCount: !isCorrect ? participant.wrongCount + 1 : participant.wrongCount,
      totalAnswerTimeMs: participant.totalAnswerTimeMs + elapsedMs,
      lastAnswer: {
        questionIndex: params.questionIndex,
        optionIndex: params.optionIndex,
        isCorrect,
        timeTakenSec,
        xpDelta,
        answeredAt: Date.now(),
      },
    };

    // Re-rank participants based on updated XP and tiebreakers
    const ranked = this.sortAndRankParticipants(participants);
    this.saveParticipants(params.roomId, ranked);

    const updatedParticipant = ranked.find((p) => p.id === params.participantId)!;

    this.broadcast('ANSWER_SUBMITTED', params.roomId, {
      participantId: params.participantId,
      isCorrect,
      xpDelta,
    });

    return {
      participant: updatedParticipant,
      isCorrect,
      xpDelta,
    };
  }

  /**
   * End the current question (reveal correct answer and results)
   */
  public endCurrentQuestion(roomId: string): LiveQuizRoom | null {
    const room = this.getRoomById(roomId);
    if (!room) return null;

    // Refresh ranks before revealing
    const participants = this.getParticipants(roomId);
    const ranked = this.sortAndRankParticipants(participants);
    this.saveParticipants(roomId, ranked);

    const updated = this.updateRoom(roomId, {
      status: 'question_ended',
      timerRemaining: 0,
      isTimerPaused: false,
    });

    this.broadcast('QUESTION_ENDED', roomId, updated);
    return updated;
  }

  /**
   * Transition to partial ranking view with overtake animations
   */
  public showPartialRanking(roomId: string): LiveQuizRoom | null {
    const room = this.getRoomById(roomId);
    if (!room) return null;

    const updated = this.updateRoom(roomId, {
      status: 'showing_ranking',
    });

    this.broadcast('SHOW_RANKING', roomId, updated);
    return updated;
  }

  /**
   * Advance to the next question or finish quiz if last
   */
  public nextQuestion(roomId: string): LiveQuizRoom | null {
    const room = this.getRoomById(roomId);
    if (!room) return null;

    const nextIndex = room.currentQuestionIndex + 1;

    if (nextIndex >= room.questions.length) {
      // Quiz finished!
      return this.finishQuiz(roomId);
    }

    const nextQ = room.questions[nextIndex];
    const duration = nextQ.timeSec || room.defaultTimeSec;

    // Reset last answers for participants for the new question round
    const participants = this.getParticipants(roomId);
    const refreshedParticipants = participants.map((p) => ({
      ...p,
      previousRank: p.currentRank,
      rankDelta: 0,
    }));
    this.saveParticipants(roomId, refreshedParticipants);

    const updated = this.updateRoom(roomId, {
      status: 'in_progress',
      currentQuestionIndex: nextIndex,
      currentQuestionStartedAt: Date.now(),
      currentQuestionDuration: duration,
      timerRemaining: duration,
      isTimerPaused: false,
    });

    this.scheduleBotResponses(roomId, nextIndex, duration);

    this.broadcast('NEXT_QUESTION', roomId, updated);
    return updated;
  }

  /**
   * Finish the quiz room and calculate podium
   */
  public finishQuiz(roomId: string): LiveQuizRoom | null {
    const room = this.getRoomById(roomId);
    if (!room) return null;

    const participants = this.getParticipants(roomId);
    const finalRanked = this.sortAndRankParticipants(participants);
    this.saveParticipants(roomId, finalRanked);

    const updated = this.updateRoom(roomId, {
      status: 'finished',
      timerRemaining: 0,
    });

    this.broadcast('QUIZ_FINISHED', roomId, {
      room: updated,
      finalRanked,
    });

    return updated;
  }

  /**
   * Pause / Resume question timer
   */
  public togglePauseTimer(roomId: string): LiveQuizRoom | null {
    const room = this.getRoomById(roomId);
    if (!room) return null;

    const isPaused = !room.isTimerPaused;
    const updated = this.updateRoom(roomId, {
      isTimerPaused: isPaused,
    });

    this.broadcast('ROOM_UPDATED', roomId, updated);
    return updated;
  }

  /**
   * Automatically simulate realistic bot answers during live testing
   */
  private scheduleBotResponses(roomId: string, questionIndex: number, durationSec: number) {
    const participants = this.getParticipants(roomId);
    const bots = participants.filter((p) => p.isBot);

    bots.forEach((bot, index) => {
      // Varied response time (between 2s and durationSec - 2s)
      const delayMs = 1500 + index * 2200 + Math.random() * 2000;
      if (delayMs < durationSec * 1000) {
        setTimeout(() => {
          const currentRoom = this.getRoomById(roomId);
          if (
            currentRoom &&
            currentRoom.status === 'in_progress' &&
            currentRoom.currentQuestionIndex === questionIndex
          ) {
            const question = currentRoom.questions[questionIndex];
            if (question) {
              // 75% probability of bot picking correct answer
              const isCorrect = Math.random() < 0.75;
              let chosenOption = question.correctIndex;
              if (!isCorrect) {
                const incorrectIndices = question.options
                  .map((_, i) => i)
                  .filter((i) => i !== question.correctIndex);
                chosenOption =
                  incorrectIndices[Math.floor(Math.random() * incorrectIndices.length)];
              }

              this.submitAnswer({
                roomId,
                participantId: bot.id,
                questionIndex,
                optionIndex: chosenOption,
              });
            }
          }
        }, delayMs);
      }
    });
  }
}

export const liveQuizService = new LiveQuizService();
