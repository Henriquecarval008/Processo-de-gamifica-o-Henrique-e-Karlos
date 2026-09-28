export type UserRole = 'aluno' | 'professor' | 'admin';

export type AcademicStatus = 'em_andamento' | 'recuperacao' | 'aprovado' | 'reprovado';

export interface AcademicHistoryEntry {
  id: string;
  studentId: string;
  studentName: string;
  previousStatus: AcademicStatus;
  newStatus: AcademicStatus;
  reason: string;
  changedBy: string;
  changedById?: string;
  changedAt: string;
}

export type ProjectStatus = 'ativo' | 'planejamento' | 'concluido' | 'pausado';

export interface Project {
  id: string;
  name: string;
  description: string;
  workloadHours: number; // Carga horária total (ex: 40, 60, 80)
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  icon?: string; // Emoji / ícone representativo (ex: 📘, 📗, 📙, 📕, 📒, 💻, 🚀)
  color?: string; // Gradiente / paleta visual
  imageUrl?: string;
  coordinatorId?: string;
  coordinatorName?: string;
  teacherIds?: string[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  nickname: string;
  username?: string;
  email: string;
  role: UserRole;
  cargo?: string;
  avatar: string;
  avatarId?: string;
  xp: number;
  level: number;
  projectId?: string;
  projectName?: string;
  classId?: string;
  className?: string;
  joinedAt: string;
  phone?: string;
  bio?: string;
  isMock?: boolean;
  academicStatus?: AcademicStatus;
}

export type NexusEmotion =
  | 'alegria'
  | 'curiosidade'
  | 'atencao'
  | 'surpresa'
  | 'empatia'
  | 'concentracao'
  | 'seriedade'
  | 'satisfacao'
  | 'motivacao'
  | 'processamento'
  | 'neutro';

export interface AssistantKnowledgeItem {
  id: string;
  category: string;
  title: string;
  content: string;
  active: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export interface LevelConfig {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  badge: string;
  color: string;
  description: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  avgProgress: number;
  schedule: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  durationHours: number;
  modulesCount: number;
}

export interface Module {
  id: string;
  courseId: string;
  title: string;
  order: number;
  description: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  order: number;
  description: string;
  durationMin: number;
  videoUrl?: string;
  completed?: boolean;
  objectives?: string[];
  contentTopics?: string[];
  status?: 'publicada' | 'rascunho' | 'planejada';
  interactiveSteps?: {
    title: string;
    description: string;
    tip?: string;
  }[];
}

export interface Activity {
  id: string;
  projectId?: string;
  projectName?: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  module: string;
  lesson: string;
  dueDate: string;
  xp: number;
  allowFileUpload: boolean;
  supportFileName?: string;
  supportFileType?: string;
  supportFileSize?: string;
  createdAt: string;
}

export interface Submission {
  id: string;
  activityId: string;
  activityTitle: string;
  studentId: string;
  studentName: string;
  studentNickname: string;
  projectId?: string;
  classId: string;
  className: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  fileDataUrl?: string;
  storagePath?: string;
  submittedAt: string;
  status: 'pendente' | 'corrigido' | 'revisao' | 'ajustes';
  grade?: string;
  feedback?: string;
  awardedXp?: number;
  gradedAt?: string;
  gradedBy?: string;
  isMock?: boolean;
}

export interface SharedFile {
  id: string;
  name: string;
  description: string;
  projectId?: string;
  projectName?: string;
  classId: string;
  className: string;
  module: string;
  lesson: string;
  materialType: 'Apostila' | 'Exercício' | 'Apresentação' | 'Planilha Exemplo' | 'Guia Rápido';
  fileType: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'png' | 'jpg';
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
  classId: string;
  className: string;
  module: string;
  timePerQuestionSec: number;
  xp: number;
  active: boolean;
  publishedAt: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  xpEarned: number;
  completedAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: 'geral' | 'excel' | 'quiz' | 'streak';
  unlockedAt?: string;
  unlocked: boolean;
  progress: number;
  maxProgress: number;
}

export type DidacticSectionType =
  | 'intro'
  | 'interface_guide'
  | 'step_by_step'
  | 'visual_table'
  | 'formula_card'
  | 'callout_box'
  | 'practical_exercise'
  | 'final_challenge';

export interface DidacticStep {
  order: number;
  title: string;
  description: string;
  shortcut?: string;
}

export interface DidacticTable {
  columns: string[];
  rows: (string | number)[][];
  footers?: (string | number)[];
  notes?: string;
}

export interface DidacticExercise {
  objective: string;
  instructions: string[];
  expectedResult: string;
  rewardXp?: number;
}

export interface DidacticSection {
  id: string;
  type: DidacticSectionType;
  title: string;
  subtitle?: string;
  content: string;
  highlightVariant?: 'tip' | 'warning' | 'formula' | 'shortcut';
  tableData?: DidacticTable;
  steps?: DidacticStep[];
  exercise?: DidacticExercise;
}

export interface DidacticMaterial {
  id: string;
  title: string;
  projectId?: string;
  projectName?: string;
  courseId: string;
  courseName: string;
  moduleId: string;
  moduleName: string;
  lessonId: string;
  lessonTitle: string;
  targetClassId: string;
  targetClassName: string;
  authorId: string;
  authorName: string;
  summary: string;
  status: 'rascunho' | 'publicado';
  readTimeMin: number;
  createdAt: string;
  publishedAt?: string;
  sections: DidacticSection[];
}

// ==========================================
// LIVE INTERACTIVE QUIZ ROOM (SALA AO VIVO)
// ==========================================

export type LiveQuizRoomStatus =
  | 'waiting'          // Sala de espera / lobby
  | 'in_progress'      // Pergunta ativa
  | 'question_ended'   // Pergunta finalizada, mostrando acertos/erros
  | 'showing_ranking'  // Exibindo ranking parcial com ultrapassagens
  | 'finished';        // Quiz finalizado, pódio e resultado final

export interface LiveQuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string] | string[];
  correctIndex: number;
  explanation?: string;
  image?: string; // Data URL or image path
  timeSec?: number; // Tempo individual da pergunta (se não definido, usa o da sala)
}

export interface LiveQuizParticipant {
  id: string;
  roomId: string;
  name: string;
  avatar: string;
  xp: number;
  correctCount: number;
  wrongCount: number;
  totalAnswerTimeMs: number;
  lastAnswer?: {
    questionIndex: number;
    optionIndex: number;
    isCorrect: boolean;
    timeTakenSec: number;
    xpDelta: number;
    answeredAt: number;
  };
  previousRank: number;
  currentRank: number;
  rankDelta?: number; // >0 subiu, <0 desceu, 0 manteve
  joinedAt: number;
  isBot?: boolean;
}

export interface LiveQuizRoom {
  id: string;
  code: string; // Ex: GAME-4821
  name: string; // Ex: "Revisão de Informática Básica"
  lessonTitle?: string;
  description?: string;
  teacherId: string;
  teacherName: string;
  status: LiveQuizRoomStatus;
  defaultTimeSec: number; // Ex: 30 segundos
  allowImages: boolean;
  questions: LiveQuizQuestion[];
  currentQuestionIndex: number;
  currentQuestionStartedAt?: number; // Timestamp ms
  currentQuestionDuration?: number; // Em segundos para a pergunta atual
  timerRemaining?: number; // Segundos restantes sincronizados
  isTimerPaused?: boolean;
  slidesMaterial?: {
    name: string;
    type: string;
    size: string;
    dataUrl?: string;
    uploadedAt: string;
  };
  xpRules: {
    startingXp: number; // Padrão: 1000 XP
    correctXp: number;  // Padrão: +100 XP
    wrongXp: number;    // Padrão: -30 XP
    speedBonus: boolean;// Bônus por resposta rápida
  };
  audioConfig?: RoomAudioConfig;
  createdAt: number;
  updatedAt: number;
}

export type MusicCategoryId =
  | 'relaxing'
  | 'arcade'
  | 'energy'
  | 'cheerful'
  | 'suspense'
  | 'tech'
  | 'focus'
  | 'instrumental'
  | 'none'
  | 'custom';

export interface MusicTrackDefinition {
  id: string;
  title: string;
  category: MusicCategoryId;
  categoryLabel: string;
  categoryIcon: string;
  description: string;
  bpm?: number;
  isSynthesized?: boolean;
}

export interface CustomUploadedTrack {
  name: string;
  type: string;
  size: string;
  dataUrl: string;
  duration?: number;
}

export interface RoomAudioConfig {
  musicEnabled: boolean;
  selectedTrackId: string;
  trackCategory: MusicCategoryId;
  trackTitle: string;
  volume: number; // 0.0 a 1.0 (0% a 100%)
  effectsEnabled: boolean;
  customTrack?: CustomUploadedTrack;
}

export interface AudioSettings {
  interfaceSoundsEnabled: boolean;
  musicEnabled: boolean;
  effectsVolume: number; // 0.0 a 1.0
  musicVolume: number;   // 0.0 a 1.0
  selectedTrackId?: string;
}

