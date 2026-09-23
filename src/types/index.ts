export type UserRole = 'aluno' | 'professor' | 'admin';

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
  email: string;
  role: UserRole;
  avatar: string;
  xp: number;
  level: number;
  projectId?: string;
  projectName?: string;
  classId?: string;
  className?: string;
  joinedAt: string;
  phone?: string;
  bio?: string;
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
  submittedAt: string;
  status: 'pendente' | 'corrigido' | 'revisao';
  grade?: string;
  feedback?: string;
  awardedXp?: number;
  gradedAt?: string;
  gradedBy?: string;
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
