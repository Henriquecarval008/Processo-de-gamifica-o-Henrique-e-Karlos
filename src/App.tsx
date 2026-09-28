/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameinforProvider, useGameinfor } from './context/GameinforContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { soundEffects } from './utils/soundEffects';

// Student Components
import { StudentHome } from './components/student/StudentHome';
import { StudentActivities } from './components/student/StudentActivities';
import { StudentQuizzes } from './components/student/StudentQuizzes';
import { StudentRanking } from './components/student/StudentRanking';
import { StudentAchievements } from './components/student/StudentAchievements';
import { StudentCurriculum } from './components/student/StudentCurriculum';
import { StudentProfile } from './components/student/StudentProfile';

// Teacher Components
import { TeacherHome } from './components/teacher/TeacherHome';
import { TeacherClasses } from './components/teacher/TeacherClasses';
import { TeacherStudents } from './components/teacher/TeacherStudents';
import { TeacherContents } from './components/teacher/TeacherContents';
import { TeacherMaterialGenerator } from './components/teacher/TeacherMaterialGenerator';
import { TeacherActivities } from './components/teacher/TeacherActivities';
import { TeacherFiles } from './components/teacher/TeacherFiles';
import { TeacherQuizzes } from './components/teacher/TeacherQuizzes';
import { TeacherGamification } from './components/teacher/TeacherGamification';
import { TeacherPerformance } from './components/teacher/TeacherPerformance';
import { TeacherSettings } from './components/teacher/TeacherSettings';

// Admin & Shared Components
import { AdminPanel } from './components/admin/AdminPanel';
import { ProjectsManager } from './components/common/ProjectsManager';
import { LessonDetailModal } from './components/common/LessonDetailModal';
import { TeacherAuthModal } from './components/auth/TeacherAuthModal';
import { StudentAuthModal } from './components/auth/StudentAuthModal';
import { UnifiedAccessModal } from './components/auth/UnifiedAccessModal';
import { PasswordResetModal } from './components/auth/PasswordResetModal';
import { GameinforVoiceAssistant } from './components/assistant/GameinforVoiceAssistant';

const AppContent: React.FC = () => {
  const {
    currentUser,
    selectedLessonForDetail,
    closeLessonDetail,
    authenticatedTeacher,
    isUnifiedAccessModalOpen,
    unifiedAccessInitialTab,
    closeUnifiedAccessModal,
    loginAdminSession,
    isTeacherAuthModalOpen,
    teacherAuthInitialStep,
    closeTeacherAuthModal,
    loginTeacherSession,
    openTeacherAuthModal,
    openPasswordResetModal,
    isStudentAuthModalOpen,
    studentAuthInitialTab,
    closeStudentAuthModal,
    loginStudentSession,
    isPasswordResetModalOpen,
    closePasswordResetModal,
    handlePasswordResetSuccess,
    passwordResetEmail,
  } = useGameinfor();

  // Tab State depending on current role
  const getDefaultTab = (role: string) => {
    if (role === 'professor') return 'prof-inicio';
    if (role === 'admin') return 'admin-dashboard';
    return 'aluno-inicio';
  };

  const [activeTab, setActiveTab] = useState<string>(() =>
    getDefaultTab(currentUser.role)
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);

  // Sync activeTab if user role switches
  const [previousRole, setPreviousRole] = useState(currentUser.role);
  if (currentUser.role !== previousRole) {
    setPreviousRole(currentUser.role);
    setActiveTab(getDefaultTab(currentUser.role));
  }

  // Route Permission Protection (Visibilidade != Permissão)
  useEffect(() => {
    if (!authenticatedTeacher) {
      if (activeTab.startsWith('prof-') || activeTab.startsWith('admin-')) {
        setActiveTab('aluno-inicio');
      }
    } else if (currentUser.role === 'professor') {
      if (activeTab.startsWith('admin-')) {
        setActiveTab('prof-inicio');
      }
    }
  }, [currentUser.role, authenticatedTeacher, activeTab]);

  // Global Interactive Sounds Listener (Web Audio API subtle clicks)
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isInteractive = target.closest(
        'button, a, input[type="radio"], input[type="checkbox"], select, [role="button"], [data-clickable="true"], .clickable, [data-sound="click"]'
      );
      if (isInteractive) {
        soundEffects.playClick();
      }
    };

    document.addEventListener('click', handleGlobalClick, { capture: true, passive: true });
    return () => {
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  const handleTabChange = (tabId: string) => {
    // Validate role permissions before allowing tab switch
    if (tabId.startsWith('prof-') || tabId.startsWith('admin-')) {
      if (!authenticatedTeacher) {
        openTeacherAuthModal('login');
        return;
      }
    }
    if (currentUser.role === 'professor' && tabId.startsWith('admin-') && authenticatedTeacher?.role !== 'admin') {
      return;
    }

    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Render view based on active tab
  const renderMainContent = () => {
    // Aluno Views
    if (activeTab === 'aluno-inicio') return <StudentHome onNavigate={handleTabChange} />;
    if (activeTab === 'aluno-atividades') return <StudentActivities />;
    if (activeTab === 'aluno-quizzes') return <StudentQuizzes />;
    if (activeTab === 'aluno-ranking') return <StudentRanking />;
    if (activeTab === 'aluno-conquistas') return <StudentAchievements />;
    if (activeTab === 'aluno-curriculo') return <StudentCurriculum />;
    if (activeTab === 'aluno-perfil') return <StudentProfile />;

    // Projects Manager (Common to Teacher & Admin)
    if (activeTab === 'prof-projetos' || activeTab === 'admin-projetos') {
      return <ProjectsManager onNavigateToTab={handleTabChange} />;
    }

    // Professor Views
    if (activeTab === 'prof-inicio') return <TeacherHome onNavigate={handleTabChange} />;
    if (activeTab === 'prof-turmas') {
      return (
        <TeacherClasses
          onSelectStudent={(stId) => {
            setSelectedStudentId(stId);
            handleTabChange('prof-alunos');
          }}
        />
      );
    }
    if (activeTab === 'prof-alunos') {
      return <TeacherStudents initialSelectedStudentId={selectedStudentId} />;
    }
    if (activeTab === 'prof-conteudos') return <TeacherContents />;
    if (activeTab === 'prof-materiais') return <TeacherMaterialGenerator />;
    if (activeTab === 'prof-atividades') return <TeacherActivities />;
    if (activeTab === 'prof-arquivos') return <TeacherFiles />;
    if (activeTab === 'prof-quizzes') return <TeacherQuizzes />;
    if (activeTab === 'prof-gamificacao') return <TeacherGamification />;
    if (activeTab === 'prof-desempenho') return <TeacherPerformance />;
    if (activeTab === 'prof-config') return <TeacherSettings />;

    // Admin Views
    if (activeTab.startsWith('admin-')) {
      return <AdminPanel currentTab={activeTab} onNavigateToTab={handleTabChange} />;
    }

    // Fallback
    return <StudentHome onNavigate={handleTabChange} />;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <ToastContainer />

      {/* Main Top Header */}
      <Header
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        onNavigateToTab={handleTabChange}
      />

      <div className="flex-1 flex w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 min-w-0 pb-16">{renderMainContent()}</main>
      </div>

      {/* Global Lesson Detail Modal */}
      {selectedLessonForDetail && (
        <LessonDetailModal
          lesson={selectedLessonForDetail}
          onClose={closeLessonDetail}
          onNavigateTab={handleTabChange}
        />
      )}

      {/* Reorganized Unified Access Modal (Admin: Henrique Carvalho & Karlos, Professor, Aluno) */}
      <UnifiedAccessModal
        isOpen={isUnifiedAccessModalOpen}
        onClose={closeUnifiedAccessModal}
        initialRoleTab={unifiedAccessInitialTab}
        onSuccessAdmin={(session) => {
          loginAdminSession(session);
          handleTabChange('admin-dashboard');
        }}
        onSuccessTeacher={(session) => {
          loginTeacherSession(session);
          handleTabChange('prof-inicio');
        }}
        onSuccessStudent={(session) => {
          loginStudentSession(session);
          handleTabChange('aluno-inicio');
        }}
        onForgotPassword={(email) => {
          openPasswordResetModal(email);
        }}
      />

      {/* Secure Teacher Authentication & Account Recovery Modal (Fallback & Legacy Direct Links) */}
      <TeacherAuthModal
        isOpen={isTeacherAuthModalOpen}
        onClose={closeTeacherAuthModal}
        onSuccess={loginTeacherSession}
        initialStep={teacherAuthInitialStep}
      />

      {/* Exclusive Password Reset Modal for Supabase Auth Recovery Flow */}
      <PasswordResetModal
        isOpen={isPasswordResetModalOpen}
        onClose={closePasswordResetModal}
        onSuccess={handlePasswordResetSuccess}
        accountEmail={passwordResetEmail}
      />

      {/* Student Authentication Modal */}
      <StudentAuthModal
        isOpen={isStudentAuthModalOpen}
        onClose={closeStudentAuthModal}
        onSuccess={loginStudentSession}
        initialTab={studentAuthInitialTab}
        onOpenTeacherAuth={() => openTeacherAuthModal('login')}
      />

      {/* Intelligent Interactive Virtual Tutor & Voice Assistant */}
      <GameinforVoiceAssistant />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        GAMEINFOR — Plataforma Gamificada de Informática Profissional & Educacional
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <GameinforProvider>
      <AppContent />
    </GameinforProvider>
  );
}
