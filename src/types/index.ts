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

export type NexusSubject =
  | 'informatica'
  | 'matematica'
  | 'portugues'
  | 'ciencias'
  | 'historia'
  | 'geografia'
  | 'financeira'
  | 'programacao';

export type NexusLearningMode =
  | 'explicacao'
  | 'professor'
  | 'exercicios'
  | 'revisao'
  | 'profissional';

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

// ==========================================
// SISTEMA DE FREQUÊNCIA (ATTENDANCE)
// ==========================================

export type AttendanceStatus = 'presente' | 'ausente' | 'justificado';

export interface ClassSession {
  id: string;
  classId: string;
  className: string;
  projectId?: string;
  projectName?: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  topic: string;
  status: 'agendada' | 'concluida' | 'cancelada';
  createdAt: string;
  recordedBy?: string;
  recordedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  classId: string;
  studentId: string;
  studentName: string;
  studentNickname?: string;
  studentAvatar?: string;
  status: AttendanceStatus;
  justification?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface StudentAttendanceStats {
  studentId: string;
  studentName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  justifiedCount: number;
  attendancePercentage: number;
}

// ==========================================
// SISTEMA DE CURRÍCULO PROFISSIONAL
// ==========================================

export interface ResumeCourseItem {
  id: string;
  name: string;
  institution: string;
  hours: number;
  year: string;
  completionStatus: 'concluido' | 'em_andamento';
}

export interface ResumeExperienceItem {
  id: string;
  role: string;
  company: string;
  period: string;
  description: string;
}

export interface ResumeProjectItem {
  id: string;
  title: string;
  description: string;
  role: string;
}

export interface ResumeLanguageItem {
  language: string;
  level: 'Básico' | 'Intermediário' | 'Avançado' | 'Fluente';
}

export interface ResumeData {
  id: string;
  studentId: string;
  studentName: string;
  email: string;
  phone: string;
  city: string;
  neighborhood: string;
  professionalObjective: string;
  schooling: string;
  courses: ResumeCourseItem[];
  technicalSkills: string[];
  itKnowledge: string[];
  experiences: ResumeExperienceItem[];
  projectsAndActivities: ResumeProjectItem[];
  languages: ResumeLanguageItem[];
  chosenTemplate: 'moderno' | 'classico' | 'tecnologico' | 'jovem_aprendiz';
  updatedAt: string;
}

export interface ResumeAnalysisResult {
  overallScore: number;
  strengths: string[];
  missingInfo: string[];
  suggestions: string[];
  interviewTips: string[];
}

// ==========================================
// SISTEMA DE AULAS COM PROGRESSO OBRIGATÓRIO
// ==========================================

export type LessonStepType = 'didactic_reading' | 'interactive_mode' | 'practical_exercise' | 'lesson_quiz';

export interface LessonMandatoryStepConfig {
  type: LessonStepType;
  title: string;
  description: string;
  required: boolean;
  minQuizScore?: number;
}

export interface StudentLessonProgress {
  id: string;
  studentId: string;
  lessonId: string;
  moduleId: string;
  courseId: string;
  completedStepTypes: LessonStepType[];
  percentCompleted: number;
  isCompleted: boolean;
  completedAt?: string;
  xpAwarded: boolean;
  xpAmount: number;
  lastAccessedAt: string;
}

// ==========================================
// SISTEMA DE AVALIAÇÕES E PROVAS
// ==========================================

export type EvaluationQuestionType = 'multiple_choice' | 'true_false' | 'open' | 'practical_it';

export interface EvaluationQuestion {
  id: string;
  type: EvaluationQuestionType;
  prompt: string;
  options?: string[];
  correctIndex?: number; // Para objetivas
  expectedAnswer?: string; // Para dissertativas
  points: number;
  explanation?: string;
}

export interface Evaluation {
  id: string;
  title: string;
  classId: string;
  className: string;
  projectId?: string;
  projectName?: string;
  teacherId: string;
  teacherName: string;
  contentSummary: string;
  difficulty: 'facil' | 'intermediario' | 'avancado';
  timeLimitMin: number;
  totalPoints: number;
  questionsCount: number;
  questions: EvaluationQuestion[];
  status: 'rascunho' | 'publicada' | 'encerrada';
  allowReview: boolean;
  maxAttempts: number;
  availableFrom?: string;
  availableUntil?: string;
  createdAt: string;
}

export interface EvaluationSubmission {
  id: string;
  evaluationId: string;
  evaluationTitle: string;
  studentId: string;
  studentName: string;
  answers: Array<{
    questionId: string;
    selectedOption?: number;
    textAnswer?: string;
    isCorrect?: boolean;
    pointsAwarded?: number;
  }>;
  totalScore: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  graded: boolean;
  teacherFeedback?: string;
}

// ==========================================
// SALAS DE JOGOS MULTIPLAYER MODULAR
// ==========================================

export type GameRoomType = 'quiz' | 'stop' | 'memory' | 'hangman' | 'scramble' | 'cards';

export interface StopCategory {
  id: string;
  name: string; // Ex: "Hardware", "Comando Windows", "Peça de Computador", "Site", "Programa"
}

export interface StopRoundState {
  letter: string;
  durationSec: number;
  startedAt: number;
  isRoundActive: boolean;
  categories: StopCategory[];
  playerAnswers: Record<string, Record<string, string>>; // playerId -> categoryId -> answer
}

export interface MemoryCard {
  id: string;
  pairId: string;
  label: string;
  concept: string;
  icon?: string;
  image?: string;
  isFlipped: boolean;
  isMatched: boolean;
}

// ==========================================
// RELATÓRIOS MENSAIS DOCENTES
// ==========================================

export interface MonthlyReportData {
  id: string;
  projectId: string;
  projectName: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  month: number;
  year: number;
  classesCount: number;
  contentsTaught: string[];
  activitiesCompleted: string[];
  enrolledStudentsCount: number;
  attendanceRate: number;
  presentTotal: number;
  absentTotal: number;
  justifiedTotal: number;
  evaluationsSummary: Array<{ title: string; avgScore: number; studentCount: number }>;
  teacherNotes: string;
  generatedAt: string;
}


