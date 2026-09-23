import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Project,
  ProjectStatus,
  ClassRoom,
  Course,
  Module,
  Lesson,
  Activity,
  Submission,
  SharedFile,
  Quiz,
  QuizAttempt,
  Achievement,
  LevelConfig,
  DidacticMaterial,
  DidacticSection,
} from '../types';
import {
  initialUsers,
  initialProjects,
  initialClasses,
  initialCourses,
  initialModules,
  initialLessons,
  initialActivities,
  initialSubmissions,
  initialSharedFiles,
  initialQuizzes,
  initialAchievements,
  initialLevels,
  initialDidacticMaterials,
} from '../data/initialData';

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'xp' | 'level-up';
  title: string;
  message: string;
  xpAmount?: number;
}

interface GameinforContextType {
  currentUser: User;
  users: User[];
  projects: Project[];
  activeProjectId: string | 'all';
  activeProject: Project | undefined;
  classes: ClassRoom[];
  courses: Course[];
  modules: Module[];
  lessons: Lesson[];
  activities: Activity[];
  submissions: Submission[];
  sharedFiles: SharedFile[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  achievements: Achievement[];
  levels: LevelConfig[];
  didacticMaterials: DidacticMaterial[];
  notifications: ToastNotification[];
  currentStudentClass: ClassRoom | undefined;

  // Actions
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  updateUserNickname: (nickname: string) => void;
  setActiveProjectId: (projectId: string | 'all') => void;
  createProject: (projectData: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (projectId: string, updatedData: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  toggleProjectStatus: (projectId: string) => void;
  submitActivity: (activityId: string, file: { name: string; type: string; size: string; dataUrl?: string }) => void;
  gradeSubmission: (submissionId: string, grade: string, feedback: string, awardedXp: number) => void;
  uploadTeacherFile: (fileData: {
    name: string;
    description: string;
    classId: string;
    className: string;
    module: string;
    lesson: string;
    materialType: 'Apostila' | 'Exercício' | 'Apresentação' | 'Planilha Exemplo' | 'Guia Rápido';
    fileType: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'png' | 'jpg';
    fileSize: string;
  }) => void;
  createActivity: (activityData: {
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
  }) => void;
  createQuiz: (quizData: {
    title: string;
    description: string;
    classId: string;
    className: string;
    module: string;
    timePerQuestionSec: number;
    xp: number;
    questions: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  }) => void;
  toggleQuizActive: (quizId: string) => void;
  completeQuiz: (quizId: string, score: number, total: number) => number;
  toggleLessonCompleted: (lessonId: string) => void;
  selectedLessonForDetail: Lesson | null;
  openLessonDetail: (lesson: Lesson) => void;
  closeLessonDetail: () => void;
  generateDidacticMaterial: (courseId: string, moduleId: string, lessonId: string, classId: string) => DidacticMaterial;
  updateDidacticMaterial: (materialId: string, updatedData: Partial<DidacticMaterial>) => void;
  publishDidacticMaterial: (materialId: string, targetClassId?: string) => void;
  deleteDidacticMaterial: (materialId: string) => void;
  createClassRoom: (
    name: string,
    projectIdOrCourseId: string,
    courseIdOrCourseName?: string,
    courseNameOrTeacherId?: string,
    teacherIdOrTeacherName?: string,
    teacherNameOrSchedule?: string,
    scheduleParam?: string
  ) => void;
  createUser: (userData: {
    name: string;
    nickname: string;
    email: string;
    role: UserRole;
    classId?: string;
    className?: string;
    projectId?: string;
    projectName?: string;
  }) => void;
  updateLevelConfig: (updatedLevels: LevelConfig[]) => void;
  dismissNotification: (id: string) => void;
  resetAllData: () => void;
}

const GameinforContext = createContext<GameinforContextType | undefined>(undefined);

const STORAGE_KEY = 'gameinfor_platform_state_v1';

export const GameinforProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial or persisted state
  const loadPersisted = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  };

  const persisted = loadPersisted();

  const [projects, setProjects] = useState<Project[]>(() => {
    if (persisted?.projects && Array.isArray(persisted.projects) && persisted.projects.length > 0) {
      return persisted.projects;
    }
    return initialProjects;
  });
  const [activeProjectId, setActiveProjectIdState] = useState<string | 'all'>(
    persisted?.activeProjectId || 'all'
  );

  const [users, setUsers] = useState<User[]>(persisted?.users || initialUsers);
  const [currentUserId, setCurrentUserId] = useState<string>(persisted?.currentUserId || 'user-aluno-1');
  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const baseClasses = persisted?.classes || initialClasses;
    return baseClasses.map((cls: ClassRoom) => {
      if (!cls.projectId) {
        return {
          ...cls,
          projectId: 'proj-crescer-transformar',
          projectName: 'Crescer e Transformar',
        };
      }
      return cls;
    });
  });
  const [courses] = useState<Course[]>(persisted?.courses || initialCourses);
  const [modules] = useState<Module[]>(persisted?.modules || initialModules);
  const [lessons, setLessons] = useState<Lesson[]>(persisted?.lessons || initialLessons);
  const [activities, setActivities] = useState<Activity[]>(persisted?.activities || initialActivities);
  const [submissions, setSubmissions] = useState<Submission[]>(persisted?.submissions || initialSubmissions);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>(persisted?.sharedFiles || initialSharedFiles);
  const [quizzes, setQuizzes] = useState<Quiz[]>(persisted?.quizzes || initialQuizzes);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(persisted?.quizAttempts || []);
  const [achievements, setAchievements] = useState<Achievement[]>(persisted?.achievements || initialAchievements);
  const [levels, setLevels] = useState<LevelConfig[]>(persisted?.levels || initialLevels);
  const [didacticMaterials, setDidacticMaterials] = useState<DidacticMaterial[]>(
    persisted?.didacticMaterials || initialDidacticMaterials
  );
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [selectedLessonForDetail, setSelectedLessonForDetail] = useState<Lesson | null>(null);

  const openLessonDetail = (lesson: Lesson) => setSelectedLessonForDetail(lesson);
  const closeLessonDetail = () => setSelectedLessonForDetail(null);

  // Current active user
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];
  const currentStudentClass = classes.find((c) => c.id === currentUser.classId);
  const activeProject = activeProjectId === 'all' ? undefined : projects.find((p) => p.id === activeProjectId);

  // Save to localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        projects,
        activeProjectId,
        users,
        currentUserId,
        classes,
        courses,
        modules,
        lessons,
        activities,
        submissions,
        sharedFiles,
        quizzes,
        quizAttempts,
        achievements,
        levels,
        didacticMaterials,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // ignore
    }
  }, [projects, activeProjectId, users, currentUserId, classes, courses, modules, lessons, activities, submissions, sharedFiles, quizzes, quizAttempts, achievements, levels, didacticMaterials]);

  const addNotification = (toast: Omit<ToastNotification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setNotifications((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Helper to calculate level based on XP
  const calculateLevel = (xp: number, currentLevels: LevelConfig[]): number => {
    for (let i = currentLevels.length - 1; i >= 0; i--) {
      if (xp >= currentLevels[i].minXp) {
        return currentLevels[i].level;
      }
    }
    return 1;
  };

  // Switch active user
  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      addNotification({
        type: 'info',
        title: 'Perfil Conectado',
        message: `Você agora está visualizando como ${target.name} (${target.role.toUpperCase()})`,
      });
    }
  };

  const switchRole = (role: UserRole) => {
    const target = users.find((u) => u.role === role);
    if (target) {
      switchUser(target.id);
    }
  };

  const updateUserNickname = (nickname: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, nickname } : u))
    );
    addNotification({
      type: 'success',
      title: 'Apelido Atualizado',
      message: `Seu apelido no ranking agora é "${nickname}".`,
    });
  };

  // Projects Management
  const setActiveProjectId = (projId: string | 'all') => {
    setActiveProjectIdState(projId);
  };

  const createProject = (projectData: Omit<Project, 'id' | 'createdAt'>): Project => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newProject: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
      createdAt: formattedDate,
    };
    setProjects((prev) => [newProject, ...prev]);
    addNotification({
      type: 'success',
      title: 'Projeto Criado com Sucesso!',
      message: `"${newProject.name}" foi registrado (${newProject.workloadHours}h).`,
    });
    return newProject;
  };

  const updateProject = (projectId: string, updatedData: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...updatedData } : p))
    );
    if (updatedData.name) {
      setClasses((prev) =>
        prev.map((c) => (c.projectId === projectId ? { ...c, projectName: updatedData.name } : c))
      );
      setActivities((prev) =>
        prev.map((a) => (a.projectId === projectId ? { ...a, projectName: updatedData.name } : a))
      );
      setQuizzes((prev) =>
        prev.map((q) => (q.projectId === projectId ? { ...q, projectName: updatedData.name } : q))
      );
      setDidacticMaterials((prev) =>
        prev.map((m) => (m.projectId === projectId ? { ...m, projectName: updatedData.name } : m))
      );
    }
    addNotification({
      type: 'success',
      title: 'Projeto Atualizado',
      message: 'As alterações do projeto foram salvas com sucesso.',
    });
  };

  const deleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectIdState('all');
    }
    addNotification({
      type: 'info',
      title: 'Projeto Excluído',
      message: 'O projeto foi removido da lista.',
    });
  };

  const toggleProjectStatus = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const nextStatus = p.status === 'ativo' ? 'pausado' : 'ativo';
          return { ...p, status: nextStatus };
        }
        return p;
      })
    );
  };

  // Student Submits Activity
  const submitActivity = (
    activityId: string,
    file: { name: string; type: string; size: string; dataUrl?: string }
  ) => {
    const act = activities.find((a) => a.id === activityId);
    if (!act) return;

    // Check if there is an existing submission for this student and activity
    const existingIndex = submissions.findIndex(
      (s) => s.activityId === activityId && s.studentId === currentUser.id
    );

    const targetClass = classes.find((c) => c.id === (currentUser.classId || act.classId));
    const targetProject = targetClass ? projects.find((p) => p.id === targetClass.projectId) : undefined;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      activityId,
      activityTitle: act.title,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentNickname: currentUser.nickname,
      projectId: act.projectId || targetProject?.id || targetClass?.projectId,
      classId: currentUser.classId || act.classId || 'turma-1',
      className: currentUser.className || act.className,
      fileName: file.name,
      fileType: file.type || 'xlsx',
      fileSize: file.size || '30 KB',
      fileDataUrl: file.dataUrl,
      submittedAt: formattedDate,
      status: 'pendente',
    };

    if (existingIndex >= 0) {
      setSubmissions((prev) => {
        const copy = [...prev];
        copy[existingIndex] = newSub;
        return copy;
      });
    } else {
      setSubmissions((prev) => [newSub, ...prev]);
    }

    addNotification({
      type: 'success',
      title: 'Arquivo enviado com sucesso!',
      message: 'Status atualizado para: 🟡 Aguardando correção do professor.',
    });
  };

  // Teacher Grades Submission
  const gradeSubmission = (
    submissionId: string,
    grade: string,
    feedback: string,
    awardedXp: number
  ) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Update submission
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === submissionId
          ? {
              ...s,
              status: 'corrigido',
              grade,
              feedback,
              awardedXp,
              gradedAt: formattedDate,
              gradedBy: currentUser.name,
            }
          : s
      )
    );

    // Credit XP to student
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === sub.studentId) {
          const newXp = u.xp + awardedXp;
          const newLevel = calculateLevel(newXp, levels);
          return {
            ...u,
            xp: newXp,
            level: newLevel,
          };
        }
        return u;
      })
    );

    // If current student was graded, show celebratory toast
    addNotification({
      type: 'xp',
      title: 'Atividade Corrigida com Sucesso!',
      message: `Status atualizado para 🟢 Corrigido. Foram atribuídos +${awardedXp} XP para ${sub.studentName}.`,
      xpAmount: awardedXp,
    });
  };

  // Teacher Uploads File
  const uploadTeacherFile = (fileData: {
    name: string;
    description: string;
    classId: string;
    className: string;
    module: string;
    lesson: string;
    materialType: 'Apostila' | 'Exercício' | 'Apresentação' | 'Planilha Exemplo' | 'Guia Rápido';
    fileType: 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'png' | 'jpg';
    fileSize: string;
  }) => {
    const targetClass = classes.find((c) => c.id === fileData.classId);
    const targetProject = targetClass ? projects.find((p) => p.id === targetClass.projectId) : undefined;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newFile: SharedFile = {
      id: `file-${Date.now()}`,
      projectId: targetProject?.id || targetClass?.projectId,
      projectName: targetProject?.name || targetClass?.projectName,
      ...fileData,
      uploadedBy: currentUser.name,
      uploadedAt: formattedDate,
    };

    setSharedFiles((prev) => [newFile, ...prev]);
    addNotification({
      type: 'success',
      title: 'Material Publicado!',
      message: `O arquivo "${fileData.name}" foi publicado para a turma "${fileData.className}".`,
    });
  };

  // Teacher Creates Activity
  const createActivity = (activityData: {
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
  }) => {
    const targetClass = classes.find((c) => c.id === activityData.classId);
    const targetProject = targetClass ? projects.find((p) => p.id === targetClass.projectId) : undefined;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newAct: Activity = {
      id: `ativ-${Date.now()}`,
      projectId: targetProject?.id || targetClass?.projectId,
      projectName: targetProject?.name || targetClass?.projectName,
      ...activityData,
      createdAt: formattedDate,
    };

    setActivities((prev) => [newAct, ...prev]);
    addNotification({
      type: 'success',
      title: 'Atividade Criada com Sucesso!',
      message: `"${activityData.title}" (${activityData.xp} XP) foi lançada para os alunos.`,
    });
  };

  // Teacher Creates Quiz
  const createQuiz = (quizData: {
    title: string;
    description: string;
    classId: string;
    className: string;
    module: string;
    timePerQuestionSec: number;
    xp: number;
    questions: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  }) => {
    const targetClass = classes.find((c) => c.id === quizData.classId);
    const targetProject = targetClass ? projects.find((p) => p.id === targetClass.projectId) : undefined;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newQuiz: Quiz = {
      id: `quiz-${Date.now()}`,
      projectId: targetProject?.id || targetClass?.projectId,
      projectName: targetProject?.name || targetClass?.projectName,
      ...quizData,
      active: true,
      publishedAt: formattedDate,
      questions: quizData.questions.map((q, idx) => ({
        id: `q-${Date.now()}-${idx}`,
        ...q,
      })),
    };

    setQuizzes((prev) => [newQuiz, ...prev]);
    addNotification({
      type: 'success',
      title: 'Quiz Criado com Sucesso!',
      message: `"${quizData.title}" foi publicado com ${quizData.questions.length} perguntas e ${quizData.xp} XP.`,
    });
  };

  const toggleQuizActive = (quizId: string) => {
    setQuizzes((prev) =>
      prev.map((q) => (q.id === quizId ? { ...q, active: !q.active } : q))
    );
  };

  // Student Completes Quiz
  const completeQuiz = (quizId: string, score: number, total: number): number => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) return 0;

    const ratio = total > 0 ? score / total : 0;
    const earnedXp = Math.round(quiz.xp * ratio);

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quizId,
      quizTitle: quiz.title,
      studentId: currentUser.id,
      score,
      totalQuestions: total,
      xpEarned: earnedXp,
      completedAt: formattedDate,
    };

    setQuizAttempts((prev) => [attempt, ...prev]);

    // Credit XP to current student
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser.id) {
          const newXp = u.xp + earnedXp;
          const newLevel = calculateLevel(newXp, levels);
          return {
            ...u,
            xp: newXp,
            level: newLevel,
          };
        }
        return u;
      })
    );

    // Check achievement unlock for quiz hunter
    if (ratio >= 1.0) {
      setAchievements((prev) =>
        prev.map((ach) =>
          ach.id === 'ach-4'
            ? { ...ach, unlocked: true, unlockedAt: formattedDate, progress: 5 }
            : ach
        )
      );
    }

    addNotification({
      type: 'xp',
      title: 'Quiz Concluído!',
      message: `Você acertou ${score} de ${total} perguntas e ganhou +${earnedXp} XP!`,
      xpAmount: earnedXp,
    });

    return earnedXp;
  };

  const toggleLessonCompleted = (lessonId: string) => {
    let nowCompleted = false;
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id === lessonId) {
          nowCompleted = !l.completed;
          return { ...l, completed: nowCompleted };
        }
        return l;
      })
    );

    setSelectedLessonForDetail((prev) =>
      prev && prev.id === lessonId ? { ...prev, completed: nowCompleted } : prev
    );

    if (nowCompleted) {
      if (currentUser.role === 'aluno') {
        const earnedXp = 25;
        const newXp = (currentUser.xp || 0) + earnedXp;
        const newLevel = calculateLevel(newXp, levels);

        setUsers((prev) =>
          prev.map((u) =>
            u.id === currentUser.id ? { ...u, xp: newXp, level: newLevel } : u
          )
        );
        setCurrentUser((prev) => ({ ...prev, xp: newXp, level: newLevel }));

        addNotification({
          type: 'xp',
          title: 'Aula Concluída!',
          message: `Parabéns por concluir esta aula! Você ganhou +${earnedXp} XP.`,
          xpAmount: earnedXp,
        });
      } else {
        addNotification({
          type: 'success',
          title: 'Status da Aula Atualizado',
          message: 'A aula foi marcada como concluída.',
        });
      }
    } else {
      addNotification({
        type: 'info',
        title: 'Status da Aula',
        message: 'A conclusão da aula foi desmarcada.',
      });
    }
  };

  const createClassRoom = (
    name: string,
    projectIdOrCourseId: string,
    courseIdOrCourseName?: string,
    courseNameOrTeacherId?: string,
    teacherIdOrTeacherName?: string,
    teacherNameOrSchedule?: string,
    scheduleParam?: string
  ) => {
    let targetProjectId = 'proj-crescer-transformar';
    let targetCourseId = '';
    let targetCourseName = '';
    let targetTeacherId = '';
    let targetTeacherName = '';
    let targetSchedule = '';

    if (scheduleParam !== undefined) {
      targetProjectId = projectIdOrCourseId;
      targetCourseId = courseIdOrCourseName || '';
      targetCourseName = courseNameOrTeacherId || '';
      targetTeacherId = teacherIdOrTeacherName || '';
      targetTeacherName = teacherNameOrSchedule || '';
      targetSchedule = scheduleParam;
    } else {
      targetProjectId = activeProjectId !== 'all' ? activeProjectId : (projects[0]?.id || 'proj-crescer-transformar');
      targetCourseId = projectIdOrCourseId;
      targetCourseName = courseIdOrCourseName || '';
      targetTeacherId = courseNameOrTeacherId || '';
      targetTeacherName = teacherIdOrTeacherName || '';
      targetSchedule = teacherNameOrSchedule || '';
    }

    const proj = projects.find((p) => p.id === targetProjectId) || projects[0];
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newClass: ClassRoom = {
      id: `turma-${Date.now()}`,
      name,
      projectId: proj ? proj.id : targetProjectId,
      projectName: proj ? proj.name : 'Projeto Geral',
      courseId: targetCourseId,
      courseName: targetCourseName,
      teacherId: targetTeacherId,
      teacherName: targetTeacherName,
      studentCount: 0,
      avgProgress: 0,
      schedule: targetSchedule,
      createdAt: formattedDate,
    };

    setClasses((prev) => [newClass, ...prev]);
    addNotification({
      type: 'success',
      title: 'Turma Criada!',
      message: `A turma "${name}" foi vinculada ao projeto "${newClass.projectName}".`,
    });
  };

  const createUser = (userData: {
    name: string;
    nickname: string;
    email: string;
    role: UserRole;
    classId?: string;
    className?: string;
    projectId?: string;
    projectName?: string;
  }) => {
    const targetClass = classes.find((c) => c.id === userData.classId);
    const targetProject = targetClass ? projects.find((p) => p.id === targetClass.projectId) : undefined;
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const newUser: User = {
      id: `user-${Date.now()}`,
      ...userData,
      projectId: userData.projectId || targetProject?.id || targetClass?.projectId,
      projectName: userData.projectName || targetProject?.name || targetClass?.projectName,
      avatar:
        userData.role === 'professor'
          ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80'
          : userData.role === 'admin'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      xp: userData.role === 'aluno' ? 0 : 2500,
      level: 1,
      joinedAt: formattedDate,
    };

    setUsers((prev) => [...prev, newUser]);
    if (userData.classId) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === userData.classId ? { ...c, studentCount: c.studentCount + 1 } : c
        )
      );
    }

    addNotification({
      type: 'success',
      title: 'Usuário Criado!',
      message: `${userData.name} foi adicionado como ${userData.role}.`,
    });
  };

  const updateLevelConfig = (updatedLevels: LevelConfig[]) => {
    setLevels(updatedLevels);
    // Recalculate users level
    setUsers((prev) =>
      prev.map((u) => ({
        ...u,
        level: calculateLevel(u.xp, updatedLevels),
      }))
    );
    addNotification({
      type: 'success',
      title: 'Regras de Gamificação Atualizadas!',
      message: 'Os níveis e faixas de XP foram recalculados em todo o sistema.',
    });
  };

  const generateDidacticMaterial = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    classId: string
  ): DidacticMaterial => {
    const course = courses.find((c) => c.id === courseId);
    const mod = modules.find((m) => m.id === moduleId);
    const lesson = lessons.find((l) => l.id === lessonId);
    const targetClass = classes.find((c) => c.id === classId);
    const targetProject = targetClass?.projectId
      ? projects.find((p) => p.id === targetClass.projectId)
      : (activeProjectId !== 'all' ? projects.find((p) => p.id === activeProjectId) : projects[0]);

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Helper to generate tailored sections based on lesson title/content
    const titleLower = (lesson?.title || '').toLowerCase();
    const isExcel = titleLower.includes('excel') || (mod?.title || '').toLowerCase().includes('excel');

    let sections: DidacticSection[] = [];

    if (titleLower.includes('subtotal') || titleLower.includes('desconto') || titleLower.includes('fórmula') || titleLower.includes('soma')) {
      sections = [
        {
          id: `sec-${Date.now()}-1`,
          type: 'intro',
          title: `1. O que é e Para que Serve: ${lesson?.title || 'Fórmulas e Cálculos'}`,
          subtitle: 'Fundamentos essenciais para organização financeira e automação',
          content: 'No ambiente profissional e educacional, o Excel elimina a necessidade de fazer contas manuais na calculadora. Ao aplicar fórmulas automáticas, qualquer alteração em quantidades ou preços atualiza instantaneamente o subtotal, o desconto e o valor final a pagar.',
        },
        {
          id: `sec-${Date.now()}-2`,
          type: 'callout_box',
          title: 'Dica Prática do Professor',
          content: 'Lembre-se da regra de ouro: no Excel, toda e qualquer fórmula ou função começa obrigatoriamente com o sinal de IGUAL (=). Sem o sinal de igual, o Excel trata o cálculo como um texto comum.',
          highlightVariant: 'tip',
        },
        {
          id: `sec-${Date.now()}-3`,
          type: 'interface_guide',
          title: '2. Anatomia da Tabela e Coordenadas',
          subtitle: 'Linhas (números), Colunas (letras) e Células',
          content: 'Para que a planilha funcione perfeitamente, estruturamos os dados em colunas padronizadas. A primeira linha (cabeçalho) nomeia cada coluna. As linhas seguintes contêm os dados dos produtos ou despesas.',
        },
        {
          id: `sec-${Date.now()}-4`,
          type: 'step_by_step',
          title: '3. Passo a Passo: Construção da Planilha',
          subtitle: 'Siga a sequência para montar a tabela no seu computador',
          content: 'Execute os seguintes passos para criar uma planilha comercial profissional:',
          steps: [
            {
              order: 1,
              title: 'Digitar os Cabeçalhos',
              description: 'Nas células de A1 até F1, digite: Produto, Quantidade, Preço Unitário, Subtotal, Desconto e Total Final.',
            },
            {
              order: 2,
              title: 'Inserir os Produtos e Quantidades',
              description: 'Preencha de A2 até C5 com os itens da sua loja ou escritório com quantidades e preços unitários.',
            },
            {
              order: 3,
              title: 'Escrever a Fórmula de Subtotal',
              description: 'Na célula D2, digite: =B2*C2 (Quantidade multiplicada pelo Preço Unitário) e tecle Enter.',
              shortcut: 'Tecla Enter para confirmar',
            },
            {
              order: 4,
              title: 'Calcular o Desconto',
              description: 'Na célula E2, digite: =D2*10% para calcular o abatimento promocional sobre o subtotal.',
            },
            {
              order: 5,
              title: 'Calcular o Total Líquido',
              description: 'Na célula F2, digite: =D2-E2 (Subtotal menos Desconto).',
            },
            {
              order: 6,
              title: 'Total Geral com a Função =SOMA()',
              description: 'Na célula F6, utilize =SOMA(F2:F5) para obter o faturamento total consolidado.',
              shortcut: 'Atalho: Alt + = (AutoSoma)',
            },
          ],
        },
        {
          id: `sec-${Date.now()}-5`,
          type: 'visual_table',
          title: '4. Modelo Visual da Tabela Pronta',
          subtitle: 'Exemplo formatado com padrão profissional de cores e alinhamento',
          content: 'Confira abaixo como sua planilha deve ficar estruturada no Microsoft Excel:',
          tableData: {
            columns: ['Produto', 'Quantidade', 'Preço Unitário', 'Subtotal', 'Desconto (10%)', 'Total Final'],
            rows: [
              ['Caderno Universitário', '15 un', 'R$ 18,00', 'R$ 270,00', 'R$ 27,00', 'R$ 243,00'],
              ['Caneta Esferográfica Azul', '50 un', 'R$ 2,50', 'R$ 125,00', 'R$ 12,50', 'R$ 112,50'],
              ['Grampeador de Mesa', '4 un', 'R$ 35,00', 'R$ 140,00', 'R$ 14,00', 'R$ 126,00'],
              ['Papel Sulfite A4 (Resma)', '8 un', 'R$ 28,00', 'R$ 224,00', 'R$ 22,40', 'R$ 201,60'],
            ],
            footers: ['TOTAIS CONSOLIDADOS', '77 un', '-', 'R$ 759,00', 'R$ 75,90', 'R$ 683,10'],
            notes: 'Observe que a coluna Total Final deduz exatamente o valor do desconto do subtotal da venda.',
          },
        },
        {
          id: `sec-${Date.now()}-6`,
          type: 'formula_card',
          title: '5. Cartão de Fórmulas e Operadores Utilizados',
          subtitle: 'Guia de consulta rápida para não esquecer a sintaxe',
          content: 'Operadores matemáticos fundamentais no Excel:',
          steps: [
            {
              order: 1,
              title: 'Multiplicação (*)',
              description: '=B2 * C2 multiplica a quantidade da linha pelo preço.',
            },
            {
              order: 2,
              title: 'Subtração (-)',
              description: '=D2 - E2 subtrai o valor do desconto do valor bruto.',
            },
            {
              order: 3,
              title: 'Função de Soma Intervalar',
              description: '=SOMA(F2:F5) soma todos os valores entre a célula F2 e a célula F5 continuamente.',
              shortcut: 'Os dois pontos (:) representam "ATÉ".',
            },
          ],
        },
        {
          id: `sec-${Date.now()}-7`,
          type: 'callout_box',
          title: 'Atenção aos Erros Frequentes',
          content: 'Se o resultado for #VALOR!, verifique se você não digitou letras dentro das células de preço ou quantidade. O Excel só realiza cálculos matemáticos em células preenchidas com números!',
          highlightVariant: 'warning',
        },
        {
          id: `sec-${Date.now()}-8`,
          type: 'practical_exercise',
          title: '6. Exercício Prático Guiado',
          subtitle: 'Atividade de fixação para os alunos executarem no laboratório',
          content: 'Abra o Microsoft Excel e realize o treinamento prático a seguir:',
          exercise: {
            objective: 'Construir a tabela de controle de materiais e aplicar as fórmulas de Subtotal, Desconto e Total Final.',
            instructions: [
              'Abra uma nova pasta de trabalho no Excel.',
              'Monte o cabeçalho e preencha os 4 produtos indicados na tabela visual.',
              'Aplique as fórmulas de Subtotal (=B2*C2), Desconto (=D2*10%) e Total Final (=D2-E2).',
              'Formate as colunas numéricas com o símbolo de Moeda (R$).',
              'No rodapé, use a função =SOMA() para calcular o Total Geral.',
              'Salve o arquivo como "Exercicio_Tabelas_SeuNome.xlsx".',
            ],
            expectedResult: 'O valor da célula do Total Geral de vendas deve totalizar exatamente R$ 683,10.',
            rewardXp: 80,
          },
        },
        {
          id: `sec-${Date.now()}-9`,
          type: 'final_challenge',
          title: '7. Desafio Final para Fixação 🏆',
          subtitle: 'Desafio autônomo com premiação extra de dedicação',
          content: 'Insira um 5º produto à escolha na tabela (ex: "Mochila Executiva", 3 unidades a R$ 90,00). Comprove que a tabela atualiza o desconto e o total consolidado automaticamente sem você precisar reescrever nenhuma fórmula!',
        },
      ];
    } else {
      // General tailored lesson structure
      sections = [
        {
          id: `sec-${Date.now()}-1`,
          type: 'intro',
          title: `1. Introdução: ${lesson?.title || 'Conteúdo da Aula'}`,
          subtitle: `Visão geral do tema abordado no módulo ${mod?.title || 'Informática'}`,
          content: lesson?.description
            ? `${lesson.description} Neste guia didático, você aprenderá de forma simplificada, visual e prática os principais conceitos necessários para dominar este tópico.`
            : 'Nesta aula prática, você aprenderá passo a passo os conceitos e operações essenciais para o uso correto das ferramentas no ambiente corporativo e educacional.',
        },
        {
          id: `sec-${Date.now()}-2`,
          type: 'callout_box',
          title: 'Dica do Instrutor',
          content: 'A informática é uma habilidade prática. Leia com atenção as instruções, anote os principais atalhos e sempre teste os exemplos diretamente no computador.',
          highlightVariant: 'tip',
        },
        {
          id: `sec-${Date.now()}-3`,
          type: 'step_by_step',
          title: '2. Passo a Passo de Execução',
          subtitle: 'Instruções ordenadas de como realizar a tarefa',
          content: 'Siga a sequência abaixo para dominar este conteúdo:',
          steps: [
            {
              order: 1,
              title: 'Preparação do Ambiente',
              description: 'Inicie o programa correspondente e configure o layout de visualização padrão.',
            },
            {
              order: 2,
              title: 'Inserção e Organização de Informações',
              description: 'Organize os elementos em títulos, tópicos e parágrafos ou linhas e colunas.',
            },
            {
              order: 3,
              title: 'Formatação Visual Adequada',
              description: 'Aplique cores sóbrias, fontes legíveis e alinhamentos adequados para leitura corporativa.',
              shortcut: 'Ctrl + B ou Ctrl + S para salvar',
            },
            {
              order: 4,
              title: 'Revisão e Validação',
              description: 'Verifique se não há inconsistências, erros de digitação ou formatação desajustada.',
            },
          ],
        },
        {
          id: `sec-${Date.now()}-4`,
          type: 'visual_table',
          title: '3. Quadro Comparativo e Exemplos',
          subtitle: 'Tabela de referência para consulta rápida',
          content: 'Observe as principais funções e aplicações práticas:',
          tableData: {
            columns: ['Elemento', 'Propósito', 'Atalho Sugerido', 'Resultado Esperado'],
            rows: [
              ['Cabeçalho Principal', 'Identificar o documento', 'Ctrl + N (Negrito)', 'Título em destaque visual'],
              ['Corpo de Dados', 'Estruturar o conteúdo', 'Tab / Setas', 'Alinhamento limpo e padronizado'],
              ['Totalização / Fechamento', 'Consolidar resultados', 'Alt + =', 'Cálculo automatizado sem erros'],
            ],
            notes: 'Utilize este quadro para memorizar a finalidade de cada ferramenta estudada.',
          },
        },
        {
          id: `sec-${Date.now()}-5`,
          type: 'callout_box',
          title: 'Atenção aos Detalhes',
          content: 'Salve seu arquivo com frequência durante o desenvolvimento para nunca perder as alterações efetuadas!',
          highlightVariant: 'warning',
        },
        {
          id: `sec-${Date.now()}-6`,
          type: 'practical_exercise',
          title: '4. Atividade Prática Guiada',
          subtitle: 'Exercício para colocar a mão na massa',
          content: 'Realize o exercício prático detalhado abaixo:',
          exercise: {
            objective: `Compreender e aplicar os conceitos da aula ${lesson?.title || 'do módulo'}.`,
            instructions: [
              'Abra o aplicativo estudado no seu computador.',
              'Reproduza os passos ensinados nesta apostila.',
              'Aplique a formatação visual e os padrões de organização demonstrados.',
              'Salve seu trabalho e apresente para o professor na sala de aula.',
            ],
            expectedResult: 'Trabalho organizado, formatado com clareza e de acordo com as diretrizes da aula.',
            rewardXp: 75,
          },
        },
        {
          id: `sec-${Date.now()}-7`,
          type: 'final_challenge',
          title: '5. Desafio Extra 🏆',
          subtitle: 'Desafio complementar para os alunos mais dedicados',
          content: 'Crie uma variação do exercício utilizando um cenário real do seu cotidiano (por exemplo: lista de compras, controle de mesada ou inventário pessoal).',
        },
      ];
    }

    const newMaterial: DidacticMaterial = {
      id: `mat-${Date.now()}`,
      title: `Apostila Didática: ${lesson?.title || 'Conteúdo da Aula'}`,
      courseId,
      courseName: course?.title || 'Informática Profissional',
      moduleId,
      moduleName: mod?.title || 'Módulo do Curso',
      lessonId,
      lessonTitle: lesson?.title || 'Aula Selecionada',
      targetClassId: classId,
      targetClassName: targetClass?.name || 'Turma Alpha (Manhã)',
      projectId: targetProject?.id || targetClass?.projectId,
      projectName: targetProject?.name || targetClass?.projectName,
      authorId: currentUser.id,
      authorName: currentUser.name || 'Instrutor Henrique',
      summary: `Apostila visual e passo a passo elaborada para iniciantes sobre ${lesson?.title || 'o conteúdo da aula'}.`,
      status: 'rascunho',
      readTimeMin: isExcel ? 12 : 10,
      createdAt: formattedDate,
      sections,
    };

    setDidacticMaterials((prev) => [newMaterial, ...prev]);

    addNotification({
      type: 'success',
      title: 'Material Didático Gerado!',
      message: `A apostila para "${lesson?.title || 'Aula'}" foi gerada em modo Rascunho. Você pode editá-la e publicá-la para a turma.`,
    });

    return newMaterial;
  };

  const updateDidacticMaterial = (materialId: string, updatedData: Partial<DidacticMaterial>) => {
    setDidacticMaterials((prev) =>
      prev.map((m) => (m.id === materialId ? { ...m, ...updatedData } : m))
    );
    addNotification({
      type: 'success',
      title: 'Apostila Atualizada!',
      message: 'As alterações no material didático foram salvas com sucesso.',
    });
  };

  const publishDidacticMaterial = (materialId: string, targetClassId?: string) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    setDidacticMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          const targetClass = targetClassId
            ? classes.find((c) => c.id === targetClassId)
            : classes.find((c) => c.id === m.targetClassId);
          const targetProject = targetClass ? projects.find((p) => p.id === targetClass.projectId) : undefined;

          return {
            ...m,
            status: 'publicado',
            publishedAt: formattedDate,
            targetClassId: targetClassId || m.targetClassId,
            targetClassName: targetClass?.name || m.targetClassName,
            projectId: targetProject?.id || targetClass?.projectId || m.projectId,
            projectName: targetProject?.name || targetClass?.projectName || m.projectName,
          };
        }
        return m;
      })
    );

    addNotification({
      type: 'success',
      title: 'Apostila Publicada para a Turma! 📚',
      message: 'Os alunos já podem visualizar o material didático completo em sua área de estudos.',
    });
  };

  const deleteDidacticMaterial = (materialId: string) => {
    setDidacticMaterials((prev) => prev.filter((m) => m.id !== materialId));
    addNotification({
      type: 'info',
      title: 'Apostila Removida',
      message: 'O material didático foi excluído da plataforma.',
    });
  };

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProjects(initialProjects);
    setActiveProjectIdState('all');
    setUsers(initialUsers);
    setCurrentUserId('user-aluno-1');
    setClasses(initialClasses);
    setLessons(initialLessons);
    setActivities(initialActivities);
    setSubmissions(initialSubmissions);
    setSharedFiles(initialSharedFiles);
    setQuizzes(initialQuizzes);
    setQuizAttempts([]);
    setAchievements(initialAchievements);
    setLevels(initialLevels);
    setDidacticMaterials(initialDidacticMaterials);
    addNotification({
      type: 'info',
      title: 'Dados Restaurados',
      message: 'A plataforma retornou ao estado original com demonstração de turmas e módulos.',
    });
  };

  return (
    <GameinforContext.Provider
      value={{
        currentUser,
        users,
        projects,
        activeProjectId,
        activeProject,
        classes,
        courses,
        modules,
        lessons,
        activities,
        submissions,
        sharedFiles,
        quizzes,
        quizAttempts,
        achievements,
        levels,
        didacticMaterials,
        notifications,
        currentStudentClass,
        switchUser,
        switchRole,
        updateUserNickname,
        setActiveProjectId,
        createProject,
        updateProject,
        deleteProject,
        toggleProjectStatus,
        submitActivity,
        gradeSubmission,
        uploadTeacherFile,
        createActivity,
        createQuiz,
        toggleQuizActive,
        completeQuiz,
        toggleLessonCompleted,
        selectedLessonForDetail,
        openLessonDetail,
        closeLessonDetail,
        generateDidacticMaterial,
        updateDidacticMaterial,
        publishDidacticMaterial,
        deleteDidacticMaterial,
        createClassRoom,
        createUser,
        updateLevelConfig,
        dismissNotification,
        resetAllData,
      }}
    >
      {children}
    </GameinforContext.Provider>
  );
};

export const useGameinfor = () => {
  const context = useContext(GameinforContext);
  if (!context) {
    throw new Error('useGameinfor must be used within a GameinforProvider');
  }
  return context;
};
