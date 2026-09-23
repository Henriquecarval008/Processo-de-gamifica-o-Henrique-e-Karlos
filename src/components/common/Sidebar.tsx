import React from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Home,
  CheckSquare,
  HelpCircle,
  Trophy,
  Award,
  BookOpen,
  User as UserIcon,
  Users,
  GraduationCap,
  Paperclip,
  Brain,
  Sparkles,
  BarChart3,
  Settings,
  Shield,
  Layers,
  FileSpreadsheet,
  CalendarCheck,
  X,
  FolderKanban,
} from 'lucide-react';

export interface SidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { currentUser, submissions, activities } = useGameinfor();

  // Teacher pending corrections count
  const pendingCorrectionsCount = submissions.filter((s) => s.status === 'pendente').length;

  // Student pending activities count
  const studentSubmittedIds = submissions
    .filter((s) => s.studentId === currentUser.id)
    .map((s) => s.activityId);
  const pendingStudentActivities = activities.filter(
    (a) => !studentSubmittedIds.includes(a.id)
  ).length;

  // Menus definition
  const studentMenu: MenuItem[] = [
    { id: 'aluno-inicio', label: 'Início', icon: Home },
    {
      id: 'aluno-atividades',
      label: 'Atividades',
      icon: CheckSquare,
      badge: pendingStudentActivities > 0 ? pendingStudentActivities : undefined,
    },
    { id: 'aluno-quizzes', label: 'Quizzes', icon: HelpCircle },
    { id: 'aluno-ranking', label: 'Ranking', icon: Trophy },
    { id: 'aluno-conquistas', label: 'Conquistas', icon: Award },
    { id: 'aluno-curriculo', label: 'Currículo', icon: BookOpen },
    { id: 'aluno-perfil', label: 'Meu Perfil', icon: UserIcon },
  ];

  const teacherMenu: MenuItem[] = [
    { id: 'prof-inicio', label: 'Início', icon: Home },
    { id: 'prof-projetos', label: 'Projetos', icon: FolderKanban },
    { id: 'prof-turmas', label: 'Minhas Turmas', icon: Users },
    { id: 'prof-alunos', label: 'Alunos', icon: GraduationCap },
    { id: 'prof-conteudos', label: 'Conteúdos', icon: BookOpen },
    { id: 'prof-materiais', label: 'Gerador de Material', icon: Sparkles },
    {
      id: 'prof-atividades',
      label: 'Atividades',
      icon: CheckSquare,
      badge: pendingCorrectionsCount > 0 ? pendingCorrectionsCount : undefined,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    { id: 'prof-arquivos', label: 'Arquivos', icon: Paperclip },
    { id: 'prof-quizzes', label: 'Quizzes', icon: Brain },
    { id: 'prof-gamificacao', label: 'Gamificação', icon: Sparkles },
    { id: 'prof-desempenho', label: 'Desempenho', icon: BarChart3 },
    { id: 'prof-config', label: 'Configurações', icon: Settings },
  ];

  const adminMenu: MenuItem[] = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'admin-projetos', label: 'Projetos', icon: FolderKanban },
    { id: 'admin-usuarios', label: 'Usuários', icon: Users },
    { id: 'admin-professores', label: 'Professores', icon: GraduationCap },
    { id: 'admin-alunos', label: 'Alunos', icon: UserIcon },
    { id: 'admin-turmas', label: 'Turmas', icon: Layers },
    { id: 'admin-cursos', label: 'Cursos', icon: BookOpen },
    { id: 'admin-curriculo', label: 'Currículo', icon: FileSpreadsheet },
    { id: 'admin-gamificacao', label: 'Gamificação', icon: Sparkles },
    { id: 'admin-relatorios', label: 'Relatórios', icon: CalendarCheck },
    { id: 'admin-configuracoes', label: 'Configurações', icon: Settings },
  ];

  const activeItems =
    currentUser.role === 'aluno'
      ? studentMenu
      : currentUser.role === 'professor'
      ? teacherMenu
      : adminMenu;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      {/* Role Banner */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex-1">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white shadow-md ${
              currentUser.role === 'aluno'
                ? 'bg-blue-600'
                : currentUser.role === 'professor'
                ? 'bg-indigo-600'
                : 'bg-purple-600'
            }`}
          >
            {currentUser.role === 'aluno' ? (
              <Trophy className="w-5 h-5" />
            ) : currentUser.role === 'professor' ? (
              <GraduationCap className="w-5 h-5" />
            ) : (
              <Shield className="w-5 h-5" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white uppercase tracking-wider truncate">
              {currentUser.role === 'aluno'
                ? 'Painel do Aluno'
                : currentUser.role === 'professor'
                ? 'Painel do Professor'
                : 'Administrador'}
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
              {currentUser.role === 'aluno'
                ? currentUser.className || 'Informática'
                : currentUser.role === 'professor'
                ? 'Instrutor Ativo'
                : 'Acesso Total'}
            </div>
          </div>
        </div>

        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-2 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {activeItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? currentUser.role === 'aluno'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : currentUser.role === 'professor'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    item.badgeColor || 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300">GAMEINFOR</span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono">
            {currentUser.role.toUpperCase()}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Cursos de Informática Profissional
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 rounded-2xl overflow-hidden border border-slate-800 shadow-xl self-start sticky top-24">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
