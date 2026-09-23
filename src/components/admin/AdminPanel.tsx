import React, { useState } from 'react';
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
} from 'lucide-react';
import { UserRole } from '../../types';
import { ProjectsManager } from '../common/ProjectsManager';

interface AdminPanelProps {
  currentTab: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentTab }) => {
  const {
    projects,
    users,
    classes,
    courses,
    modules,
    lessons,
    activities,
    submissions,
    levels,
    createUser,
    createClassRoom,
    updateLevelConfig,
  } = useGameinfor();

  // Modals
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [userRoleToCreate, setUserRoleToCreate] = useState<UserRole>('professor');

  // Form State for User
  const [userName, setUserName] = useState('');
  const [userNickname, setUserNickname] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userClassId, setUserClassId] = useState(classes[0]?.id || '');

  // Form State for Class
  const [className, setClassName] = useState('');
  const [classProjectId, setClassProjectId] = useState(projects[0]?.id || '');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [teacherId, setTeacherId] = useState(
    users.find((u) => u.role === 'professor')?.id || ''
  );
  const [classSchedule, setClassSchedule] = useState(
    'Segundas e Quartas - 14:00 às 16:00'
  );

  // Editable Levels state
  const [editingLevels, setEditingLevels] = useState(levels);

  const teachers = users.filter((u) => u.role === 'professor');
  const students = users.filter((u) => u.role === 'aluno');

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    const assignedClass = classes.find((c) => c.id === userClassId);

    createUser({
      name: userName,
      nickname: userNickname || userName.split(' ')[0],
      email: userEmail,
      role: userRoleToCreate,
      classId: userRoleToCreate === 'aluno' ? userClassId : undefined,
      className: userRoleToCreate === 'aluno' ? assignedClass?.name : undefined,
    });

    setIsCreateUserOpen(false);
    setUserName('');
    setUserNickname('');
    setUserEmail('');
  };

  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) {
      alert('Informe o nome da turma.');
      return;
    }

    const selCourse = courses.find((c) => c.id === courseId);
    const selTeacher = users.find((u) => u.id === teacherId);

    createClassRoom(
      className,
      classProjectId || projects[0]?.id || 'proj-crescer-transformar',
      courseId,
      selCourse?.title || 'Informática Básica',
      teacherId,
      selTeacher?.name || 'Instrutor Henrique',
      classSchedule
    );

    setIsCreateClassOpen(false);
    setClassName('');
  };

  const handleSaveLevels = () => {
    updateLevelConfig(editingLevels);
  };

  if (currentTab === 'admin-projetos') {
    return <ProjectsManager />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Administração Geral
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1">
            <Shield className="w-7 h-7 text-purple-400" />
            Painel Administrativo GAMEINFOR
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Gestão global de usuários, professores, turmas, cursos e parâmetros de gamificação.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setUserRoleToCreate('professor');
              setIsCreateUserOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Professor
          </button>
          <button
            onClick={() => {
              setUserRoleToCreate('aluno');
              setIsCreateUserOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Aluno
          </button>
          <button
            onClick={() => setIsCreateClassOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            + Turma
          </button>
        </div>
      </div>

      {/* DASHBOARD TAB (default or admin-dashboard) */}
      {(currentTab === 'admin-dashboard' || currentTab === 'admin-usuarios') && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Total Usuários</span>
              <div className="text-2xl font-black text-white mt-1">{users.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Professores</span>
              <div className="text-2xl font-black text-indigo-400 mt-1">{teachers.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Alunos Ativos</span>
              <div className="text-2xl font-black text-blue-400 mt-1">{students.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <span className="text-xs text-slate-400">Turmas Operando</span>
              <div className="text-2xl font-black text-purple-400 mt-1">{classes.length}</div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider">
                Base Geral de Usuários do Sistema
              </span>
              <span>{users.length} contas cadastradas</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Nome</th>
                    <th className="py-3 px-4">Função</th>
                    <th className="py-3 px-4">Apelido (Ranking)</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Turma Vinculada</th>
                    <th className="py-3 px-4 text-right">XP Acumulado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {users.map((u) => (
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

                      <td className="py-3 px-4 font-mono text-cyan-300">
                        {u.nickname || '—'}
                      </td>

                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {u.email}
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        {u.className || '—'}
                      </td>

                      <td className="py-3 px-4 text-right font-black text-amber-400">
                        {u.xp} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSORES TAB */}
      {currentTab === 'admin-professores' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-400" />
              Professores e Instrutores Cadastrados
            </h3>
            <button
              onClick={() => {
                setUserRoleToCreate('professor');
                setIsCreateUserOpen(true);
              }}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Professor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teachers.map((prof) => (
              <div
                key={prof.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={prof.avatar}
                    alt={prof.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-indigo-500/40"
                  />
                  <div>
                    <h4 className="font-bold text-white text-sm">{prof.name}</h4>
                    <p className="text-xs text-slate-400">{prof.email}</p>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      Membro desde {prof.joinedAt}
                    </span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                  Instrutor Ativo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALUNOS TAB */}
      {currentTab === 'admin-alunos' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Gestão de Alunos da Plataforma
            </h3>
            <button
              onClick={() => {
                setUserRoleToCreate('aluno');
                setIsCreateUserOpen(true);
              }}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Matricular Novo Aluno
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map((st) => (
              <div
                key={st.id}
                className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={st.avatar}
                    alt={st.name}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700"
                  />
                  <div>
                    <h4 className="font-bold text-white text-xs">{st.name}</h4>
                    <p className="text-[11px] text-cyan-300 font-mono">@{st.nickname}</p>
                    <p className="text-[10px] text-slate-400">{st.className}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-amber-400">{st.xp} XP</span>
                  <div className="text-[10px] text-slate-400">Nível {st.level}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TURMAS TAB */}
      {currentTab === 'admin-turmas' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              Turmas Cadastradas
            </h3>
            <button
              onClick={() => setIsCreateClassOpen(true)}
              className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Criar Turma
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((cls) => (
              <div
                key={cls.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-400 uppercase">
                    {cls.courseName}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {cls.studentCount} Alunos
                  </span>
                </div>
                <h4 className="font-bold text-white text-base">{cls.name}</h4>
                <p className="text-xs text-slate-400">
                  Professor Vinculado: <strong>{cls.teacherName}</strong>
                </p>
                <p className="text-xs text-slate-400">Horário: {cls.schedule}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CURSOS & CURRÍCULO TABS */}
      {(currentTab === 'admin-cursos' || currentTab === 'admin-curriculo') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Catálogo Oficial de Cursos & Grade
          </h3>

          <div className="space-y-4">
            {courses.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">{c.title}</h4>
                  <span className="text-xs text-cyan-400 font-mono">
                    {c.durationHours} horas
                  </span>
                </div>
                <p className="text-xs text-slate-300">{c.description}</p>
                <div className="text-[11px] text-slate-400">
                  Categoria: {c.category} • {c.modulesCount} Módulos
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GAMIFICAÇÃO & NÍVEIS (Section 10 & 14) */}
      {currentTab === 'admin-gamificacao' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Configuração de Níveis e Faixas de XP
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ajuste os nomes dos 4 níveis e os limites mínimos de XP para progressão de nível.
              </p>
            </div>
            <button
              onClick={handleSaveLevels}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all shadow-md"
            >
              Salvar Alterações de Nível
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editingLevels.map((lvl, idx) => (
              <div
                key={lvl.level}
                className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    Nível {lvl.level}
                  </span>
                  <input
                    type="text"
                    value={lvl.badge}
                    onChange={(e) => {
                      const copy = [...editingLevels];
                      copy[idx].badge = e.target.value;
                      setEditingLevels(copy);
                    }}
                    className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
                    placeholder="Emblema"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Nome do Nível:
                  </label>
                  <input
                    type="text"
                    value={lvl.title}
                    onChange={(e) => {
                      const copy = [...editingLevels];
                      copy[idx].title = e.target.value;
                      setEditingLevels(copy);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      XP Mínimo:
                    </label>
                    <input
                      type="number"
                      value={lvl.minXp}
                      onChange={(e) => {
                        const copy = [...editingLevels];
                        copy[idx].minXp = Number(e.target.value);
                        setEditingLevels(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      XP Máximo:
                    </label>
                    <input
                      type="number"
                      value={lvl.maxXp}
                      onChange={(e) => {
                        const copy = [...editingLevels];
                        copy[idx].maxXp = Number(e.target.value);
                        setEditingLevels(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-amber-400 font-bold"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RELATÓRIOS & CONFIGURAÇÕES */}
      {(currentTab === 'admin-relatorios' || currentTab === 'admin-configuracoes') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
            <CalendarCheck className="w-5 h-5 text-indigo-400" />
            Relatórios e Auditoria da Plataforma
          </h3>
          <p className="text-xs text-slate-300">
            A plataforma GAMEINFOR está preparada para persistência de dados e integração futura com Supabase/PostgreSQL e Java Spring Boot.
          </p>
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <div>✓ Controle de Acesso por Função (RBAC: Aluno, Professor, Administrador) ativo</div>
            <div>✓ Isolamento e segurança de arquivos dos estudantes garantido</div>
            <div>✓ Motor de gamificação e cálculo de XP centralizado</div>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR USUÁRIO (Professor ou Aluno) */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">
                Cadastrar Novo {userRoleToCreate === 'professor' ? 'Professor' : 'Aluno'}
              </h3>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Apelido (Para o Ranking):
                </label>
                <input
                  type="text"
                  placeholder="Ex: CaduTech"
                  value={userNickname}
                  onChange={(e) => setUserNickname(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail:</label>
                <input
                  type="email"
                  required
                  placeholder="carlos@exemplo.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              {userRoleToCreate === 'aluno' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Vincular à Turma:
                  </label>
                  <select
                    value={userClassId}
                    onChange={(e) => setUserClassId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.courseName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR TURMA */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">+ Criar Nova Turma</h3>
              <button
                onClick={() => setIsCreateClassOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Projeto Vinculado:
                </label>
                <select
                  value={classProjectId}
                  onChange={(e) => setClassProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.icon || '📘'} {p.name} ({p.workloadHours}h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Nome da Turma:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Turma Futuro Conectado"
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
                    <option key={crs.id} value={crs.id}>
                      {crs.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Professor Responsável:
                </label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Dias e Horário:
                </label>
                <input
                  type="text"
                  value={classSchedule}
                  onChange={(e) => setClassSchedule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Cadastrar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
