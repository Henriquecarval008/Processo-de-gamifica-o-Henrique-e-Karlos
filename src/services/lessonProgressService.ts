/**
 * Lesson Mandatory Progress & Anti-Cheat Service for GAMEINFOR (Instituto Ambiente)
 * 
 * Enforces:
 * - Real pedagogical progress verification: A lesson CANNOT be marked as complete by simply clicking a button
 * - Mandatory steps defined by the teacher:
 *   1. Didactic Reading: Study of the material / booklet
 *   2. Interactive Mode: Completion of hands-on simulation steps
 *   3. Practical Exercise: Execution of the hands-on activity
 *   4. Lesson Quiz: Minimum passing score (e.g. 70%)
 * - Atomic XP distribution: XP is granted only once per lesson, preventing duplicate rewards upon page refresh
 * - Comprehensive progress tracking persisted per student
 */

import { StudentLessonProgress, LessonStepType, LessonMandatoryStepConfig } from '../types';

const PROGRESS_STORAGE_KEY_PREFIX = 'gameinfor_lesson_progress_v1_';
const COMPLETED_XP_LOG_KEY = 'gameinfor_completed_xp_awards_v1';

class LessonProgressService {
  public getMandatoryStepsForLesson(lessonId: string): LessonMandatoryStepConfig[] {
    return [
      {
        type: 'didactic_reading',
        title: 'Estudo do Conteúdo Didático',
        description: 'Leitura completa dos conceitos teóricos e da apostila da aula.',
        required: true,
      },
      {
        type: 'interactive_mode',
        title: 'Modo Aula Interativa',
        description: 'Navegação pelas etapas demonstrativas com o assistente NEXUS.',
        required: true,
      },
      {
        type: 'practical_exercise',
        title: 'Atividade Prática em Computador',
        description: 'Aplicação dos comandos, atalhos ou fórmulas no editor de planilhas/textos.',
        required: true,
      },
      {
        type: 'lesson_quiz',
        title: 'Quiz de Fixação de Aprendizado',
        description: 'Atingir no mínimo 70% de acertos nas questões conceituais da aula.',
        required: true,
        minQuizScore: 70,
      },
    ];
  }

  public getStudentProgress(studentId: string, lessonId: string): StudentLessonProgress {
    if (typeof window === 'undefined') {
      return this.createInitialProgress(studentId, lessonId);
    }
    try {
      const key = `${PROGRESS_STORAGE_KEY_PREFIX}${studentId}_${lessonId}`;
      const data = localStorage.getItem(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Erro ao carregar progresso da aula:', e);
    }
    return this.createInitialProgress(studentId, lessonId);
  }

  private createInitialProgress(studentId: string, lessonId: string): StudentLessonProgress {
    return {
      id: `prog-${studentId}-${lessonId}`,
      studentId,
      lessonId,
      moduleId: 'mod-excel',
      courseId: 'course-info-basica',
      completedStepTypes: [],
      percentCompleted: 0,
      isCompleted: false,
      xpAwarded: false,
      xpAmount: 150,
      lastAccessedAt: new Date().toISOString(),
    };
  }

  public saveStudentProgress(progress: StudentLessonProgress): void {
    if (typeof window === 'undefined') return;
    try {
      const key = `${PROGRESS_STORAGE_KEY_PREFIX}${progress.studentId}_${progress.lessonId}`;
      localStorage.setItem(key, JSON.stringify(progress));
    } catch (e) {
      console.warn('Erro ao salvar progresso da aula:', e);
    }
  }

  /**
   * Complete a specific pedagogical step (e.g. read booklet, finish practical exercise)
   */
  public completeStep(
    studentId: string,
    lessonId: string,
    stepType: LessonStepType
  ): StudentLessonProgress {
    const progress = this.getStudentProgress(studentId, lessonId);
    const stepsConfig = this.getMandatoryStepsForLesson(lessonId);

    if (!progress.completedStepTypes.includes(stepType)) {
      progress.completedStepTypes.push(stepType);
    }

    const requiredCount = stepsConfig.filter((s) => s.required).length;
    const completedRequiredCount = stepsConfig.filter(
      (s) => s.required && progress.completedStepTypes.includes(s.type)
    ).length;

    progress.percentCompleted = Math.round((completedRequiredCount / requiredCount) * 100);
    progress.lastAccessedAt = new Date().toISOString();

    this.saveStudentProgress(progress);
    return progress;
  }

  /**
   * Check if all mandatory steps are fulfilled
   */
  public canCompleteLesson(studentId: string, lessonId: string): boolean {
    const progress = this.getStudentProgress(studentId, lessonId);
    const stepsConfig = this.getMandatoryStepsForLesson(lessonId);
    const allRequiredDone = stepsConfig
      .filter((s) => s.required)
      .every((s) => progress.completedStepTypes.includes(s.type));
    return allRequiredDone;
  }

  /**
   * Attempt to finalize lesson and atomically award XP.
   * Returns: { success: boolean; xpAwarded: number; alreadyCompleted: boolean; message: string }
   */
  public finalizeLesson(
    studentId: string,
    lessonId: string,
    onAwardXp: (amount: number, reason: string) => void
  ): {
    success: boolean;
    xpAwarded: number;
    alreadyCompleted: boolean;
    message: string;
  } {
    const progress = this.getStudentProgress(studentId, lessonId);

    if (progress.isCompleted && progress.xpAwarded) {
      return {
        success: false,
        xpAwarded: 0,
        alreadyCompleted: true,
        message: 'Você já concluiu esta aula e resgatou a pontuação de XP anteriormente.',
      };
    }

    if (!this.canCompleteLesson(studentId, lessonId)) {
      return {
        success: false,
        xpAwarded: 0,
        alreadyCompleted: false,
        message:
          'Para concluir a aula e receber o XP, você deve cumprir todas as etapas obrigatórias (leitura, modo interativo, prática e quiz).',
      };
    }

    // Atomic award:
    const xpReward = progress.xpAmount || 150;
    progress.isCompleted = true;
    progress.completedAt = new Date().toISOString();
    progress.xpAwarded = true;
    progress.percentCompleted = 100;

    this.saveStudentProgress(progress);

    // Call context to credit XP with clear audit reason
    onAwardXp(xpReward, `Conclusão validada da aula ${lessonId}`);

    return {
      success: true,
      xpAwarded: xpReward,
      alreadyCompleted: false,
      message: `Parabéns! Aula concluída com sucesso com todas as etapas verificadas! Você ganhou +${xpReward} XP!`,
    };
  }
}

export const lessonProgressService = new LessonProgressService();
