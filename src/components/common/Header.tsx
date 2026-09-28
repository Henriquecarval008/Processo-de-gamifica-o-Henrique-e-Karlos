import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Gamepad2,
  Trophy,
  Sparkles,
  Users,
  ShieldCheck,
  ChevronDown,
  RotateCcw,
  BookOpen,
  Menu,
  FolderKanban,
  Check,
  Volume2,
  Lock,
  LogOut,
  UserPlus,
  Smile,
  GraduationCap,
  UserCheck,
  Bot,
} from 'lucide-react';
import { UserRole } from '../../types';
import { AudioControlsModal } from './AudioControlsModal';
import { AvatarSelector } from './AvatarSelector';
import { soundEffects } from '../../utils/soundEffects';

interface HeaderProps {
  onToggleMobileMenu?: () => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onNavigateToTab }) => {
  const {
    currentUser,
    users,
    levels,
    switchUser,
    switchRole,
    submissions,
    projects,
    activeProjectId,
    activeProject,
    setActiveProjectId,
    authenticatedTeacher,
    authenticatedStudent,
    isAuthenticated,
    logoutUser,
    logoutTeacher,
    openUnifiedAccessModal,
    openTeacherAuthModal,
    openStudentAuthModal,
    updateUserAvatar,
    openAssistant,
    isAssistantOpen,
    assistantContext,
  } = useGameinfor();

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [audioModalOpen, setAudioModalOpen] = useState(false);
  const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);

  const handleSelectRole = (role: UserRole) => {
    soundEffects.playClick();
    if (role === 'aluno') {
      switchRole('aluno');
      return;
    }

    if (role === 'professor') {
      if (authenticatedTeacher) {
        switchRole('professor');
      } else {
        openUnifiedAccessModal('professor');
      }
      return;
    }

    if (role === 'admin') {
      if (authenticatedTeacher && authenticatedTeacher.role === 'admin') {
        switchRole('admin');
      } else {
        openUnifiedAccessModal('admin');
      }
    }
  };

  // Find level info for current user
  const currentLevelInfo = levels.find((l) => l.level === currentUser.level) || levels[0];
  const nextLevelInfo = levels.find((l) => l.level === currentUser.level + 1);

  // Calculate progress in current level
  let xpProgress = 100;
  if (nextLevelInfo) {
    const range = nextLevelInfo.minXp - currentLevelInfo.minXp;
    const currentInLevel = Math.max(0, currentUser.xp - currentLevelInfo.minXp);
    xpProgress = Math.min(100, Math.round((currentInLevel / range) * 100));
  }

  // Pending submissions for teacher
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'pendente').length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Mobile hamburger + Logo & Brand */}
          <div className="flex items-center gap-3">
            {onToggleMobileMenu && (
              <button
                onClick={onToggleMobileMenu}
                className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                aria-label="Abrir Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                  GAMEINFOR
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  EDU
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Plataforma Educacional Gamificada
              </p>
            </div>
          </div>

          {/* Center: Role Switcher (Visibilidade != Permissão) */}
          <div className="hidden md:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 px-2 font-medium">Áreas:</span>
            <button
              onClick={() => handleSelectRole('aluno')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUser.role === 'aluno'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              Aluno
            </button>
            <button
              onClick={() => handleSelectRole('professor')}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUser.role === 'professor'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Professor
              {!authenticatedTeacher && (
                <Lock className="w-3 h-3 text-slate-500" />
              )}
              {pendingSubmissionsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {pendingSubmissionsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleSelectRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentUser.role === 'admin'
                  ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
              {(!authenticatedTeacher || authenticatedTeacher.role !== 'admin') && (
                <Lock className="w-3 h-3 text-slate-500" />
              )}
            </button>
          </div>

          {/* Right: Gamification Status for Aluno / Teacher metrics + Profile dropdown */}
          <div className="flex items-center gap-3">
            {currentUser.role === 'aluno' && (
              <div className="hidden lg:flex items-center gap-3 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-xs font-bold text-slate-200">
                      Nível {currentUser.level}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-medium truncate max-w-[120px]">
                      {currentLevelInfo.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                        style={{ width: `${xpProgress}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-amber-400 flex items-center gap-0.5">
                      <Sparkles className="w-3 h-3 inline text-amber-400" />
                      {currentUser.xp} XP
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Project Selector for Professor / Admin */}
            {(currentUser.role === 'professor' || currentUser.role === 'admin') && (
              <div className="relative">
                <button
                  onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                  className="flex items-center gap-2 text-xs bg-slate-950/80 hover:bg-slate-950 border border-indigo-900/50 hover:border-indigo-500/50 rounded-xl px-3 py-1.5 transition-all text-left shadow-sm"
                  title="Clique para alternar o projeto ativo ou visualizar todos"
                >
                  <span className="text-base">
                    {activeProject ? activeProject.icon || '📘' : '🌐'}
                  </span>
                  <div className="hidden sm:block">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                      Projeto:
                      {activeProject && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-indigo-300 max-w-[140px] truncate leading-tight">
                      {activeProject ? activeProject.name : 'Todos os Projetos'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
                </button>

                {/* Project Selector Dropdown */}
                {projectDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-800 mb-1.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">Projetos Institucionais</p>
                        <p className="text-[11px] text-slate-400">Selecione o escopo ativo</p>
                      </div>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-md">
                        {projects.length} projetos
                      </span>
                    </div>

                    <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                      {/* Option: Todos os Projetos */}
                      <button
                        onClick={() => {
                          setActiveProjectId('all');
                          setProjectDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                          activeProjectId === 'all'
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🌐</span>
                          <div>
                            <div className="font-semibold text-white">Todos os Projetos</div>
                            <div className="text-[10px] text-slate-400">Visualizar dados gerais combinados</div>
                          </div>
                        </div>
                        {activeProjectId === 'all' && <Check className="w-4 h-4 text-indigo-400" />}
                      </button>

                      {/* Each Project */}
                      {projects.map((proj) => {
                        const isSelected = activeProjectId === proj.id;
                        return (
                          <button
                            key={proj.id}
                            onClick={() => {
                              setActiveProjectId(proj.id);
                              setProjectDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                              isSelected
                                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg shrink-0">{proj.icon || '📘'}</span>
                              <div className="min-w-0">
                                <div className="font-semibold text-white truncate">{proj.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                                  <span>{proj.workloadHours}h</span>
                                  <span>•</span>
                                  <span className="capitalize">{proj.status}</span>
                                </div>
                              </div>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Manage Projects Link */}
                    {onNavigateToTab && (
                      <div className="pt-2 mt-1 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setProjectDropdownOpen(false);
                            if (currentUser.role === 'admin') {
                              onNavigateToTab('admin-projetos');
                            } else {
                              onNavigateToTab('prof-projetos');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                        >
                          <FolderKanban className="w-3.5 h-3.5 text-indigo-400" />
                          Gerenciar Todos os Projetos
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Student Project Badge */}
            {currentUser.role === 'aluno' && (
              <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-950/70 border border-blue-900/40 rounded-xl px-3 py-1.5">
                <span className="text-sm">
                  {currentUser.projectName?.includes('Tecendo')
                    ? '📗'
                    : currentUser.projectName?.includes('40h')
                    ? '📙'
                    : '📘'}
                </span>
                <div>
                  <div className="text-[9px] text-slate-400 uppercase font-semibold">Projeto:</div>
                  <div className="text-xs font-bold text-blue-300 truncate max-w-[130px]">
                    {currentUser.projectName || 'Crescer e Transformar'}
                  </div>
                </div>
              </div>
            )}

            {/* Virtual Tutor / Voice Assistant Button */}
            <button
              onClick={() => {
                soundEffects.playClick();
                openAssistant();
              }}
              className={`p-2 rounded-xl border transition-all relative flex items-center justify-center ${
                assistantContext?.isTakingActivity
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : isAssistantOpen
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-cyan-300'
              }`}
              title="Abrir NEXUS — Assistente Inteligente GAMEINFOR"
              aria-label="Abrir NEXUS — Assistente Inteligente GAMEINFOR"
            >
              <Bot className="w-4 h-4" />
              {assistantContext?.isTakingActivity && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* Audio Settings Button */}
            <button
              onClick={() => {
                soundEffects.playClick();
                setAudioModalOpen(true);
              }}
              className="p-2 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition-colors"
              title="Ajustes de Áudio & Efeitos Sonoros"
              aria-label="Ajustes de Áudio"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Profile Selector */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all text-left"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-8 h-8 rounded-lg object-cover ring-2 ring-blue-500/30"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
                    {currentUser.nickname || currentUser.name.split(' ')[0]}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        currentUser.role === 'aluno'
                          ? 'bg-blue-500/20 text-blue-300'
                          : currentUser.role === 'professor'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[110px]">
                    {currentUser.name}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-slate-800 mb-2">
                    <p className="text-xs font-semibold text-white">Perfil e Sessão</p>
                    <p className="text-[11px] text-slate-400">
                      {authenticatedTeacher
                        ? `Docente autenticado: ${authenticatedTeacher.name}`
                        : authenticatedStudent
                        ? `Aluno autenticado: ${authenticatedStudent.name}`
                        : 'Sessão como visitante'}
                    </p>
                  </div>

                  {/* Authenticated user actions */}
                  {isAuthenticated ? (
                    <div className="space-y-2 mb-2">
                      <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white font-semibold truncate max-w-[170px]">
                            {currentUser.name}
                          </span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-bold uppercase">
                            {currentUser.role}
                          </span>
                        </div>
                        {currentUser.email && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {currentUser.email}
                          </p>
                        )}
                      </div>

                      {/* Profile navigation and Avatar Change */}
                      {onNavigateToTab && currentUser.role === 'aluno' && (
                        <button
                          onClick={() => {
                            onNavigateToTab('aluno-perfil');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Meu Perfil de Aluno</span>
                          </div>
                          <span className="text-[10px] text-slate-400">Ver</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          setAvatarSelectorOpen(true);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Smile className="w-3.5 h-3.5 text-amber-400" />
                          <span>Alterar Avatar</span>
                        </div>
                        <span className="text-[10px] text-cyan-400 font-bold">Catálogo</span>
                      </button>

                      {/* Universal Logout */}
                      <button
                        onClick={() => {
                          logoutUser();
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/20 transition-colors mt-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sair da Conta
                      </button>
                    </div>
                  ) : (
                    /* Guest actions */
                    <div className="space-y-2 mb-2">
                      {/* Unified Access Portal Button */}
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          openUnifiedAccessModal('aluno');
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Portal de Acesso (Login / Cadastro)</span>
                      </button>

                      <div className="p-2.5 bg-blue-950/30 border border-blue-500/20 rounded-xl space-y-1.5">
                        <p className="text-xs font-bold text-blue-300">Espaço do Aluno</p>
                        <p className="text-[11px] text-slate-400">
                          Acesse suas aulas, atividades e conquistas.
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              openUnifiedAccessModal('aluno');
                            }}
                            className="py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all text-center cursor-pointer"
                          >
                            Entrar
                          </button>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              openStudentAuthModal('register');
                            }}
                            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-all text-center border border-slate-700 cursor-pointer"
                          >
                            Cadastrar
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl space-y-1.5">
                        <p className="text-xs font-bold text-indigo-300">Área do Professor & Admin</p>
                        <p className="text-[11px] text-slate-400">
                          Acesso restrito para docentes e administradores.
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              openUnifiedAccessModal('professor');
                            }}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <GraduationCap className="w-3 h-3" />
                            Docente
                          </button>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              openUnifiedAccessModal('admin');
                            }}
                            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audio Controls Modal */}
      <AudioControlsModal
        isOpen={audioModalOpen}
        onClose={() => setAudioModalOpen(false)}
      />

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={avatarSelectorOpen}
        onClose={() => setAvatarSelectorOpen(false)}
        currentAvatarId={currentUser.avatarId || 'avatar-gamer'}
        onSaveAvatar={updateUserAvatar}
      />
    </header>
  );
};

