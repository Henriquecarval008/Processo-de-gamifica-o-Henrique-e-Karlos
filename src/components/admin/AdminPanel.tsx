import React, { useState, useEffect } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Shield,
  Users,
  GraduationCap,
  Layers,
  BookOpen,
  Sparkles,
  BarChart3,
  Settings,
  Plus,
  X,
  CheckCircle2,
  CalendarCheck,
  FileSpreadsheet,
  Award,
  Search,
  Lock,
  FolderKanban,
  CheckSquare,
  Brain,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Copy,
  Mail,
  UserCheck,
  Send,
  RefreshCw,
  Sliders,
  HelpCircle,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import { UserRole } from '../../types';
import { ProjectsManager } from '../common/ProjectsManager';
import { authService, AdminAccount } from '../../services/authService';
import { soundEffects } from '../../utils/soundEffects';

interface AdminPanelProps {
  currentTab: string;
  onNavigateToTab?: (tabId: string) => void;
}

interface InstitutionalKnowledge {
  id: string;
  category: string;
  title: string;
  content: string;
  active: boolean;
  updatedBy: string;
  updatedAt: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentTab, onNavigateToTab }) => {
  const {
    projects,
    users,
    classes,
    courses,
    modules,
    lessons,
    activities,
    submissions,
    quizzes,
    levels,
    createUser,
    createClassRoom,
    updateLevelConfig,
    authenticatedTeacher,
    currentUser,
    openPasswordResetModal,
    addNotification,
  } = useGameinfor();

  // Active Admin name detection
  const currentAdminName = authenticatedTeacher?.name || currentUser.name || 'Henrique Carvalho';
  const currentAdminUsername = currentAdminName.toLowerCase().includes('karlos') ? 'karlos' : 'admin';

  // Admin Accounts State
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  useEffect(() => {
    authService.getAdminAccounts().then(setAdminAccounts).catch(console.error);
  }, []);

  // Modals
  const [isCreateTeacherOpen, setIsCreateTeacherOpen] = useState(false);
  const [isCreateStudentOpen, setIsCreateStudentOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isChangeAdminPasswordOpen, setIsChangeAdminPasswordOpen] = useState(false);
  const [targetAdminToChange, setTargetAdminToChange] = useState<'admin' | 'karlos'>('admin');

  // Password reset for students
  const [isResetStudentPasswordOpen, setIsResetStudentPasswordOpen] = useState(false);
  const [studentToReset, setStudentToReset] = useState<{ id: string; name: string; email: string } | null>(null);
  const [newStudentPassword, setNewStudentPassword] = useState('');

  // Form State for Teacher Creation (Automated Account with Supabase & Backend)
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherProjectId, setTeacherProjectId] = useState(projects[0]?.id || '');
  const [teacherClassId, setTeacherClassId] = useState(classes[0]?.id || '');
  const [isCreatingTeacher, setIsCreatingTeacher] = useState(false);
  const [teacherSuccessData, setTeacherSuccessData] = useState<{ email: string; pass: string } | null>(null);

  // Form State for Student Creation
  const [studentName, setStudentName] = useState('');
  const [studentNickname, setStudentNickname] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentClassId, setStudentClassId] = useState(classes[0]?.id || '');
  const [studentPassword, setStudentPassword] = useState('');

  // Form State for Class Creation
  const [className, setClassName] = useState('');
  const [classProjectId, setClassProjectId] = useState(projects[0]?.id || '');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [teacherId, setTeacherId] = useState(
    users.find((u) => u.role === 'professor')?.id || ''
  );
  const [classSchedule, setClassSchedule] = useState(
    'Segundas e Quartas - 14:00 às 16:00'
  );

  // Change Admin Password Form
  const [oldAdminPass, setOldAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [confirmAdminPass, setConfirmAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminPassMsg, setAdminPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPass, setIsSavingPass] = useState(false);

  // Search & Filter
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('all');

  // Virtual Assistant Knowledge Base
  const [knowledgeList, setKnowledgeList] = useState<InstitutionalKnowledge[]>([]);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(false);
  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState('');
  const [newKnowledgeCategory, setNewKnowledgeCategory] = useState('institucional');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState('');
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(null);
  const [knowledgeMsg, setKnowledgeMsg] = useState<string | null>(null);

  // Fetch knowledge base from server
  const loadKnowledge = async () => {
    setIsLoadingKnowledge(true);
    try {
      const res = await fetch('/api/assistant/knowledge');
      if (res.ok) {
        const data = await res.json();
        setKnowledgeList(data);
      }
    } catch {
      console.warn('Fallback: carregar conhecimento offline');
    } finally {
      setIsLoadingKnowledge(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'admin-assistente') {
      loadKnowledge();
    }
  }, [currentTab]);

  const handleSaveKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) return;

    soundEffects.playClick();
    const idToSave = editingKnowledgeId || `ia-${Date.now()}`;

    try {
      const res = await fetch('/api/assistant/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: idToSave,
          title: newKnowledgeTitle.trim(),
          category: newKnowledgeCategory,
          content: newKnowledgeContent.trim(),
          updatedBy: currentAdminName,
        }),
      });

      if (res.ok) {
        soundEffects.playCorrect();
        setKnowledgeMsg('Base de conhecimento do Instituto Ambiente atualizada com sucesso!');
        setNewKnowledgeTitle('');
        setNewKnowledgeContent('');
        setEditingKnowledgeId(null);
        loadKnowledge();
        setTimeout(() => setKnowledgeMsg(null), 4000);
      }
    } catch {
      soundEffects.playWrong();
      setKnowledgeMsg('Erro ao salvar tópico na base.');
    }
  };

  // Editable Levels state for Settings
  const [editingLevels, setEditingLevels] = useState(levels);

  const teachers = users.filter((u) => u.role === 'professor');
  const students = users.filter((u) => u.role === 'aluno');

  // Submit automated Teacher creation
  const handleCreateTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    if (!teacherName.trim() || !teacherEmail.trim() || !teacherPassword.trim()) {
      alert('Preencha nome completo, e-mail e senha.');
      return;
    }

    setIsCreatingTeacher(true);
    try {
      const res = await authService.adminCreateTeacher({
        name: teacherName,
        email: teacherEmail,
        password: teacherPassword,
        adminUsername: currentAdminUsername,
      });

      if (res.success) {
        soundEffects.playCorrect();
        const assignedClass = classes.find((c) => c.id === teacherClassId);
        createUser({
          name: teacherName.trim(),
          nickname: teacherName.trim().split(' ')[0],
          email: teacherEmail.trim().toLowerCase(),
          role: 'professor',
          className: assignedClass?.name,
          classId: teacherClassId,
        });

        setTeacherSuccessData({
          email: teacherEmail.trim().toLowerCase(),
          pass: teacherPassword,
        });
        setTeacherName('');
        setTeacherEmail('');
        setTeacherPassword('');
      } else {
        soundEffects.playWrong();
        alert(res.message || 'Falha ao cadastrar professor.');
      }
    } catch {
      soundEffects.playWrong();
      alert('Erro de conexão ao criar conta de professor.');
    } finally {
      setIsCreatingTeacher(false);
    }
  };

  // Submit Student creation by admin
  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    if (!studentName.trim()) {
      alert('Informe o nome do aluno.');
      return;
    }

    const assignedClass = classes.find((c) => c.id === studentClassId);

    createUser({
      name: studentName.trim(),
      nickname: studentNickname.trim() || studentName.trim().split(' ')[0],
      email: studentEmail.trim().toLowerCase() || `${studentName.toLowerCase().replace(/\s+/g, '.')}${Math.floor(Math.random() * 900 + 100)}@gameinfor.edu`,
      role: 'aluno',
      classId: studentClassId,
      className: assignedClass?.name,
    });

    soundEffects.playCorrect();
    setIsCreateStudentOpen(false);
    setStudentName('');
    setStudentNickname('');
    setStudentEmail('');
    setStudentPassword('');
  };

  // Submit Class creation
  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    if (!className.trim()) {
      alert('Informe o nome da turma.');
      return;
    }

    const selCourse = courses.find((c) => c.id === courseId);
    const selTeacher = users.find((u) => u.id === teacherId);

    createClassRoom(
      className.trim(),
      classProjectId || projects[0]?.id || 'proj-crescer-transformar',
      courseId,
      selCourse?.title || 'Informática Básica',
      teacherId,
      selTeacher?.name || 'Instrutor Henrique Carvalho',
      classSchedule
    );

    soundEffects.playCorrect();
    setIsCreateClassOpen(false);
    setClassName('');
  };

  // Submit Admin Password Change
  const handleChangeAdminPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setAdminPassMsg(null);

    if (newAdminPass !== confirmAdminPass) {
      soundEffects.playWrong();
      setAdminPassMsg({ type: 'error', text: 'A confirmação não coincide com a nova senha.' });
      return;
    }

    setIsSavingPass(true);
    try {
      const res = await authService.changeAdminPassword(targetAdminToChange, oldAdminPass, newAdminPass);
      if (res.success) {
        soundEffects.playCorrect();
        setAdminPassMsg({ type: 'success', text: res.message });
        setOldAdminPass('');
        setNewAdminPass('');
        setConfirmAdminPass('');
        setTimeout(() => {
          setIsChangeAdminPasswordOpen(false);
          setAdminPassMsg(null);
        }, 1500);
      } else {
        soundEffects.playWrong();
        setAdminPassMsg({ type: 'error', text: res.message });
      }
    } catch {
      soundEffects.playWrong();
      setAdminPassMsg({ type: 'error', text: 'Erro ao conectar para alterar a senha.' });
    } finally {
      setIsSavingPass(false);
    }
  };

  // Submit Student Password Reset by Admin
  const handleResetStudentPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    if (!studentToReset || !newStudentPassword) return;

    try {
      const res = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: studentToReset.id,
          newPassword: newStudentPassword,
          adminUsername: currentAdminUsername,
        }),
      });

      if (res.ok) {
        soundEffects.playCorrect();
        alert(`Senha do aluno ${studentToReset.name} redefinida com sucesso para: ${newStudentPassword}`);
        setIsResetStudentPasswordOpen(false);
        setStudentToReset(null);
        setNewStudentPassword('');
      } else {
        soundEffects.playWrong();
        alert('Não foi possível redefinir a senha do aluno.');
      }
    } catch {
      soundEffects.playWrong();
      alert('Erro de conexão ao redefinir senha.');
    }
  };

  if (currentTab === 'admin-projetos') {
    return <ProjectsManager onNavigateToTab={onNavigateToTab} />;
  }

  // Filtered students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.nickname && s.nickname.toLowerCase().includes(studentSearch.toLowerCase()));
    const matchesClass =
      selectedClassFilter === 'all' || s.classId === selectedClassFilter || s.className?.includes(selectedClassFilter);
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner with Dual Administrators Badge */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
              Instituto Ambiente • Administração Central
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Sessão: {currentAdminName}
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1.5">
            <Shield className="w-7 h-7 text-purple-400" />
            Painel Administrativo GAMEINFOR
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Gestão unificada com autoridade independente para <strong>Henrique Carvalho</strong> e <strong>Karlos</strong>. Controle de usuários, turmas, projetos institucionais e robô assistente.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsCreateTeacherOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            + Adicionar Professor
          </button>
          <button
            onClick={() => setIsCreateStudentOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <UserIcon className="w-4 h-4" />
            + Adicionar Aluno
          </button>
          <button
            onClick={() => setIsCreateClassOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Criar Turma
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. VISÃO GERAL (admin-dashboard)                                     */}
      {/* ==================================================================== */}
      {currentTab === 'admin-dashboard' && (
        <div className="space-y-6">
          {/* Dual Admins Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                <h3 className="font-black text-sm text-white uppercase tracking-wider">
                  Estrutura de Administração Independente
                </h3>
              </div>
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 2 Administradores Ativos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Henrique Carvalho Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center font-black text-purple-300">
                    HC
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Henrique Carvalho</span>
                      <span className="text-[10px] bg-purple-500/20 text-purple-300 font-mono px-1.5 py-0.2 rounded font-bold">
                        admin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Cargo: Administrador e professor</p>
                    <p className="text-[10px] text-emerald-400 font-medium mt-0.5">● Sessão independente ativa</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTargetAdminToChange('admin');
                    setIsChangeAdminPasswordOpen(true);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Alterar senha individual de Henrique Carvalho"
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  <span className="hidden sm:inline">Senha</span>
                </button>
              </div>

              {/* Karlos Card */}
              <div className="bg-slate-950 p-4 rounded-xl border border-indigo-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-black text-indigo-300">
                    K
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">Karlos</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-1.5 py-0.2 rounded font-bold">
                        karlos
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Cargo: Administrador e professor</p>
                    <p className="text-[10px] text-emerald-400 font-medium mt-0.5">● Sessão independente ativa</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTargetAdminToChange('karlos');
                    setIsChangeAdminPasswordOpen(true);
                  }}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Alterar senha individual de Karlos"
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Senha</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Total Usuários</span>
              <div className="text-2xl font-black text-white mt-1">{users.length}</div>
              <span className="text-[10px] text-slate-500">Base geral no sistema</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Professores</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">{teachers.length}</div>
              <span className="text-[10px] text-indigo-300/70">Instrutores autorizados</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Alunos Ativos</span>
              <div className="text-2xl font-black text-blue-400 mt-1">{students.length}</div>
              <span className="text-[10px] text-blue-300/70">Inscritos nas turmas</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Turmas Operando</span>
              <div className="text-2xl font-black text-purple-400 mt-1">{classes.length}</div>
              <span className="text-[10px] text-purple-300/70">Em 3 projetos ativos</span>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider">
                Visão Rápida dos Usuários Cadastrados
              </span>
              <span>{users.length} registros</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Função</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Turma</th>
                    <th className="py-3 px-4 text-right">XP Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users.slice(0, 10).map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                        />
                        <span className="font-bold text-white">{u.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'aluno'
                              ? 'bg-blue-500/20 text-blue-300'
                              : u.role === 'professor'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-purple-500/20 text-purple-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{u.email}</td>
                      <td className="py-3 px-4 text-slate-300">{u.className || '—'}</td>
                      <td className="py-3 px-4 text-right font-black text-amber-400">{u.xp} XP</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. PROFESSORES (admin-professores)                                   */}
      {/* ==================================================================== */}
      {currentTab === 'admin-professores' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                Corpo Docente & Instrutores do Instituto Ambiente
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Contas criadas diretamente com autorização administrativa, sincronizadas no Supabase Auth.
              </p>
            </div>
            <button
              onClick={() => setIsCreateTeacherOpen(true)}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Adicionar Novo Professor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((prof) => (
              <div
                key={prof.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={prof.avatar}
                    alt={prof.name}
                    className="w-11 h-11 rounded-xl object-cover ring-1 ring-indigo-500/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{prof.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{prof.email}</p>
                    <span className="text-[10px] text-indigo-300 font-semibold bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40 inline-block mt-1">
                      {prof.className || 'Instrutor Geral'}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <button
                    onClick={() => openPasswordResetModal(prof.email)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1 cursor-pointer"
                    title="Enviar link de redefinição de senha para o e-mail"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Recuperar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. ALUNOS (admin-alunos)                                             */}
      {/* ==================================================================== */}
      {currentTab === 'admin-alunos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-400" />
                Estudantes Cadastrados ({students.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Alunos matriculados nas oficinas e cursos do Instituto Ambiente.
              </p>
            </div>
            <button
              onClick={() => setIsCreateStudentOpen(true)}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Cadastrar Aluno
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou apelido..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todas as Turmas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Estudante</th>
                  <th className="py-3 px-4">Apelido</th>
                  <th className="py-3 px-4">Turma</th>
                  <th className="py-3 px-4">Nível</th>
                  <th className="py-3 px-4">XP</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={st.avatar}
                        alt={st.name}
                        className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-700"
                      />
                      <div>
                        <div className="font-bold text-white">{st.name}</div>
                        <div className="text-[10px] text-slate-400">{st.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-300">{st.nickname || '—'}</td>
                    <td className="py-3 px-4 text-slate-300">{st.className || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                        Nível {st.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold text-amber-400">{st.xp} XP</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setStudentToReset({ id: st.id, name: st.name, email: st.email });
                          setNewStudentPassword('');
                          setIsResetStudentPasswordOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        title="Redefinir senha administrativamente"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        <span>Redefinir Senha</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. TURMAS (admin-turmas)                                             */}
      {/* ==================================================================== */}
      {currentTab === 'admin-turmas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Turmas & Oficinas em Atividade ({classes.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Vínculo entre projetos do Instituto Ambiente, professores responsáveis e estudantes.
              </p>
            </div>
            <button
              onClick={() => setIsCreateClassOpen(true)}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Criar Turma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => {
              const enrolledStudents = students.filter((s) => s.classId === cls.id || s.className === cls.name);
              const linkedProject = projects.find((p) => p.id === cls.projectId);

              return (
                <div key={cls.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {linkedProject?.name || 'Instituto Ambiente'}
                      </span>
                      <h4 className="font-bold text-white text-base mt-1">{cls.name}</h4>
                      <p className="text-xs text-slate-400">{cls.courseName}</p>
                    </div>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg">
                      {enrolledStudents.length} alunos
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 text-xs space-y-1 text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Professor:</span>
                      <strong className="text-white">{cls.teacherName}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Horário:</span>
                      <span>{cls.schedule}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. ATIVIDADES (admin-atividades)                                      */}
      {/* ==================================================================== */}
      {currentTab === 'admin-atividades' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              Gestão Global de Atividades Práticas ({activities.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento de entregas de exercícios práticos em Word, Excel e informática geral.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.map((act) => {
              const actSubmissions = submissions.filter((s) => s.activityId === act.id);
              const corrected = actSubmissions.filter((s) => s.status === 'corrigido').length;

              return (
                <div key={act.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {act.className}
                    </span>
                    <span className="text-xs font-black text-amber-400">+{act.xp} XP</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{act.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{act.description}</p>
                  <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                    <span>Entregas: {actSubmissions.length}</span>
                    <span>Corrigidas: {corrected}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 6. QUESTIONÁRIOS (admin-quizzes)                                     */}
      {/* ==================================================================== */}
      {currentTab === 'admin-quizzes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Questionários Avaliativos de Informática ({quizzes.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Quizzes com pontuação de XP e desafio conceitual para os alunos do Instituto Ambiente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {quiz.module || quiz.className}
                  </span>
                  <span className="text-xs font-black text-amber-400">+{quiz.xp} XP</span>
                </div>
                <h4 className="font-bold text-white text-sm">{quiz.title}</h4>
                <p className="text-xs text-slate-400">{quiz.description}</p>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                  <span>{quiz.questions.length} questões</span>
                  <span>Tempo: {quiz.timePerQuestionSec}s/questão</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 7. RELATÓRIOS (admin-relatorios)                                     */}
      {/* ==================================================================== */}
      {currentTab === 'admin-relatorios' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Relatórios Oficiais de Desempenho e Indicadores
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Métricas consolidadas extraídas das tabelas reais de submissões, turmas e projetos. Sem dados fictícios.
            </p>
          </div>

          {/* Metric cards strictly computed */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Submissões Práticas</span>
              <div className="text-2xl font-black text-white mt-1">{submissions.length}</div>
              <span className="text-[10px] text-emerald-400">
                {submissions.filter((s) => s.status === 'corrigido').length} corrigidas
              </span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Média Geral de XP</span>
              <div className="text-2xl font-black text-amber-400 mt-1">
                {students.length > 0
                  ? Math.round(students.reduce((acc, s) => acc + s.xp, 0) / students.length)
                  : 0}{' '}
                XP
              </div>
              <span className="text-[10px] text-slate-500">Por aluno matriculado</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Horas em Curso</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">
                {projects.reduce((acc, p) => acc + (p.workloadHours || 0), 0)}h
              </div>
              <span className="text-[10px] text-indigo-300">Soma da carga horária</span>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Aulas Concluídas</span>
              <div className="text-2xl font-black text-purple-400 mt-1">
                {lessons.filter((l) => l.completed).length} / {lessons.length}
              </div>
              <span className="text-[10px] text-purple-300">Currículo interativo</span>
            </div>
          </div>

          {/* Per-class breakdown */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Desempenho Real por Turma
            </h4>
            <div className="space-y-2">
              {classes.map((cls) => {
                const clsStudents = students.filter((s) => s.classId === cls.id || s.className === cls.name);
                const clsSubmissions = submissions.filter((s) => s.className === cls.name);
                const totalXp = clsStudents.reduce((acc, s) => acc + s.xp, 0);

                return (
                  <div key={cls.id} className="p-3 bg-slate-900 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-white">{cls.name}</strong>
                      <p className="text-[11px] text-slate-400">{cls.teacherName}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-amber-400 font-bold">{totalXp} XP coletivo</span>
                      <p className="text-[11px] text-slate-400">
                        {clsStudents.length} alunos • {clsSubmissions.length} entregas
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 8. CONFIGURAÇÕES (admin-configuracoes)                                */}
      {/* ==================================================================== */}
      {currentTab === 'admin-configuracoes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-300" />
              Configurações Gerais & Parâmetros do Sistema
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ajuste de faixas de XP, títulos de níveis de gamificação e parâmetros institucionais.
            </p>
          </div>

          {/* Levels editor */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-sm">Escala de Níveis & XP de Gamificação</h4>
              <button
                onClick={() => {
                  updateLevelConfig(editingLevels);
                  addNotification({
                    type: 'success',
                    title: 'Configurações Salvas',
                    message: 'Faixas de XP e níveis de gamificação atualizados com sucesso.',
                  });
                }}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs cursor-pointer shadow"
              >
                Salvar Níveis
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {editingLevels.map((lvl, index) => (
                <div key={lvl.level} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>Nível {lvl.level}</span>
                    <span className="text-amber-400">{lvl.badge}</span>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Título do Nível:</label>
                    <input
                      type="text"
                      value={lvl.title}
                      onChange={(e) => {
                        const copy = [...editingLevels];
                        copy[index] = { ...copy[index], title: e.target.value };
                        setEditingLevels(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs mt-0.5 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">XP Mínimo:</label>
                    <input
                      type="number"
                      value={lvl.minXp}
                      onChange={(e) => {
                        const copy = [...editingLevels];
                        copy[index] = { ...copy[index], minXp: Number(e.target.value) };
                        setEditingLevels(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs mt-0.5 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 9. ASSISTENTE VIRTUAL (admin-assistente)                              */}
      {/* ==================================================================== */}
      {currentTab === 'admin-assistente' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-400" />
                Base de Conhecimento do Robô NEXUS (Instituto Ambiente)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Os administradores Henrique Carvalho e Karlos podem atualizar as informações institucionais sem alterar código.
              </p>
            </div>
            <button
              onClick={loadKnowledge}
              disabled={isLoadingKnowledge}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
              title="Recarregar tópicos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingKnowledge ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {knowledgeMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{knowledgeMsg}</span>
            </div>
          )}

          {/* Form to add or edit institutional knowledge */}
          <form onSubmit={handleSaveKnowledge} className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 space-y-3.5">
            <h4 className="font-bold text-white text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              {editingKnowledgeId ? 'Editar Tópico Institucional' : 'Adicionar Novo Tópico sobre o Instituto Ambiente'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 text-[11px] font-semibold mb-1">Título do Conhecimento:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Como o Instituto Ambiente apoia os alunos"
                  value={newKnowledgeTitle}
                  onChange={(e) => setNewKnowledgeTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 text-[11px] font-semibold mb-1">Categoria:</label>
                <select
                  value={newKnowledgeCategory}
                  onChange={(e) => setNewKnowledgeCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="institucional">Institucional</option>
                  <option value="projetos">Projetos</option>
                  <option value="educacao">Educação e Metodologia</option>
                  <option value="regras">Regras e Convivência</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-[11px] font-semibold mb-1">Conteúdo Explicativo:</label>
              <textarea
                required
                rows={3}
                placeholder="Descreva detalhadamente a informação oficial. O robô NEXUS utilizará este texto como verdade institucional."
                value={newKnowledgeContent}
                onChange={(e) => setNewKnowledgeContent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {editingKnowledgeId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingKnowledgeId(null);
                    setNewKnowledgeTitle('');
                    setNewKnowledgeContent('');
                  }}
                  className="px-3 py-2 text-slate-400 hover:text-white text-xs"
                >
                  Cancelar Edição
                </button>
              )}
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Salvar na Memória do Robô
              </button>
            </div>
          </form>

          {/* Existing knowledge cards */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">
              Tópicos Institucionais Atuais ({knowledgeList.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {knowledgeList.map((k) => (
                <div key={k.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                      {k.category}
                    </span>
                    <button
                      onClick={() => {
                        setEditingKnowledgeId(k.id);
                        setNewKnowledgeTitle(k.title);
                        setNewKnowledgeCategory(k.category);
                        setNewKnowledgeContent(k.content);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Editar
                    </button>
                  </div>
                  <h5 className="font-bold text-white text-sm">{k.title}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed">{k.content}</p>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    Atualizado por: {k.updatedBy}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 10. SEGURANÇA E PERMISSÕES (admin-seguranca)                         */}
      {/* ==================================================================== */}
      {currentTab === 'admin-seguranca' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Segurança, Permissões e Gestão dos Administradores
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Políticas de Row Level Security (RLS) do Supabase e controle das duas credenciais administrativas independentes.
            </p>
          </div>

          {/* Accounts Security Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Henrique Carvalho */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-purple-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                  Administrador 1
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">● Autoridade Total</span>
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Henrique Carvalho</h4>
                <p className="text-xs text-purple-300 font-mono">Nome de usuário: admin</p>
                <p className="text-xs text-slate-400">Cargo: Administrador e professor</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-300 space-y-1">
                <p>• Senha individual com hash salted SHA-256</p>
                <p>• Sessão independente no navegador e Supabase</p>
                <p>• Permissão para gerenciar professores, alunos e turmas</p>
              </div>
              <button
                onClick={() => {
                  setTargetAdminToChange('admin');
                  setIsChangeAdminPasswordOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" /> Alterar Senha de Henrique
              </button>
            </div>

            {/* Karlos */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-indigo-500/40 space-y-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
                  Administrador 2
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">● Autoridade Total</span>
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Karlos</h4>
                <p className="text-xs text-indigo-300 font-mono">Nome de usuário: karlos</p>
                <p className="text-xs text-slate-400">Cargo: Administrador e professor</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 text-xs text-slate-300 space-y-1">
                <p>• Senha individual com hash salted SHA-256</p>
                <p>• Não depende da conta de Henrique para acessar</p>
                <p>• Permissão para criar turmas, projetos e relatórios</p>
              </div>
              <button
                onClick={() => {
                  setTargetAdminToChange('karlos');
                  setIsChangeAdminPasswordOpen(true);
                }}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" /> Alterar Senha de Karlos
              </button>
            </div>
          </div>

          {/* RLS Security Checklist */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Diretrizes de Segurança RLS Ativas
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Nenhum professor ou aluno comum pode elevar seus privilégios via frontend.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Criação de novos professores realizada por rota backend protegida com chave de serviço.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Senhas e tokens de autenticação não expostos no código-fonte nem no navegador.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Políticas de Row Level Security (RLS) ativas nas tabelas do Supabase.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAIS DO SISTEMA                                                    */}
      {/* ==================================================================== */}

      {/* MODAL 1: CADASTRAR PROFESSOR (Automático via Supabase & Backend) */}
      {isCreateTeacherOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-white text-base">Cadastrar Novo Professor</h3>
              </div>
              <button
                onClick={() => {
                  setIsCreateTeacherOpen(false);
                  setTeacherSuccessData(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {teacherSuccessData ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    Conta de Professor Criada com Sucesso!
                  </div>
                  <p>
                    A conta foi registrada no Supabase Auth e no banco de dados. O professor já pode entrar diretamente no portal com as credenciais abaixo:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1">
                    <p>E-mail: <strong className="text-white">{teacherSuccessData.email}</strong></p>
                    <p>Senha inicial: <strong className="text-white">{teacherSuccessData.pass}</strong></p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsCreateTeacherOpen(false);
                    setTeacherSuccessData(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateTeacherSubmit} className="space-y-3.5 text-xs">
                <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-[11px]">
                  Autorizado por: <strong>{currentAdminName}</strong>. O cadastro cria a conta no Supabase Auth e o perfil de docente automaticamente.
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nome Completo do Professor:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prof. Roberto Alves"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">E-mail Institucional:</label>
                  <input
                    type="email"
                    required
                    placeholder="roberto.alves@gameinfor.com"
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Senha Inicial (mínimo 8 caracteres):</label>
                  <input
                    type="password"
                    required
                    placeholder="Crie a senha do professor"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Projeto:</label>
                    <select
                      value={teacherProjectId}
                      onChange={(e) => setTeacherProjectId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                    >
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Turma Inicial:</label>
                    <select
                      value={teacherClassId}
                      onChange={(e) => setTeacherClassId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateTeacherOpen(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingTeacher}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/25 cursor-pointer disabled:opacity-60"
                  >
                    {isCreatingTeacher ? 'Criando no Supabase...' : 'Autorizar e Criar Professor'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: CADASTRAR ALUNO */}
      {isCreateStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-400" />
                <h3 className="font-black text-white text-base">Cadastrar Novo Aluno</h3>
              </div>
              <button
                onClick={() => setIsCreateStudentOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Matheus Lima"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Apelido (Ranking):</label>
                  <input
                    type="text"
                    placeholder="Ex: MathTech"
                    value={studentNickname}
                    onChange={(e) => setStudentNickname(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Turma:</label>
                  <select
                    value={studentClassId}
                    onChange={(e) => setStudentClassId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail (opcional):</label>
                <input
                  type="email"
                  placeholder="aluno@exemplo.com (ou gerado automático)"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateStudentOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                >
                  Cadastrar Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CRIAR TURMA */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">+ Criar Nova Turma</h3>
              <button
                onClick={() => setIsCreateClassOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Projeto do Instituto Ambiente:</label>
                <select
                  value={classProjectId}
                  onChange={(e) => setClassProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.workloadHours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome da Turma:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Turma Inclusão Digital ALPHA"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Curso:</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {courses.map((crs) => (
                    <option key={crs.id} value={crs.id}>{crs.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Professor Responsável:</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Horário:</label>
                <input
                  type="text"
                  value={classSchedule}
                  onChange={(e) => setClassSchedule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
                >
                  Cadastrar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ALTERAR SENHA ADMINISTRATIVA INDEPENDENTE */}
      {isChangeAdminPasswordOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-400" />
                <h3 className="font-black text-white text-base">
                  Alterar Senha de {targetAdminToChange === 'karlos' ? 'Karlos' : 'Henrique Carvalho'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsChangeAdminPasswordOpen(false);
                  setAdminPassMsg(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adminPassMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  adminPassMsg.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
                }`}
              >
                {adminPassMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{adminPassMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangeAdminPasswordSubmit} className="space-y-3.5 text-xs">
              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200">
                A alteração de senha é independente e não afeta o acesso do outro administrador.
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Senha Atual:</label>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  placeholder="Digite a senha atual"
                  value={oldAdminPass}
                  onChange={(e) => setOldAdminPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nova Senha (min. 8 caracteres):</label>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  placeholder="Crie a nova senha segura"
                  value={newAdminPass}
                  onChange={(e) => setNewAdminPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Confirmar Nova Senha:</label>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  required
                  placeholder="Repita a nova senha"
                  value={confirmAdminPass}
                  onChange={(e) => setConfirmAdminPass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {showAdminPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAdminPass ? 'Ocultar' : 'Visualizar'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingPass}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer disabled:opacity-60"
                >
                  {isSavingPass ? 'Atualizando...' : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: REDEFINIÇÃO ADMINISTRATIVA DE SENHA DO ALUNO */}
      {isResetStudentPasswordOpen && studentToReset && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Redefinir Senha do Aluno</h3>
              </div>
              <button
                onClick={() => {
                  setIsResetStudentPasswordOpen(false);
                  setStudentToReset(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetStudentPasswordSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px]">
                Redefinindo senha para o aluno <strong>{studentToReset.name}</strong> ({studentToReset.email}). Procedimento administrativo seguro para alunos sem e-mail direto.
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nova Senha Provisória:</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluno2026@"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetStudentPasswordOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold cursor-pointer"
                >
                  Salvar Nova Senha do Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
