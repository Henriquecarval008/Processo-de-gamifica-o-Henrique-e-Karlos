import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import { Project, ProjectStatus } from '../../types';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  BookOpen,
  FileSpreadsheet,
  CheckSquare,
  Brain,
  Sparkles,
  Paperclip,
  BarChart3,
  ExternalLink,
  Layers,
  X,
  Eye,
} from 'lucide-react';

interface ProjectsManagerProps {
  onNavigateToTab?: (tabId: string) => void;
}

export const ProjectsManager: React.FC<ProjectsManagerProps> = ({ onNavigateToTab }) => {
  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    createProject,
    updateProject,
    deleteProject,
    toggleProjectStatus,
    classes,
    users,
    activities,
    quizzes,
    sharedFiles,
    didacticMaterials,
    currentUser,
    createClassRoom,
    courses,
  } = useGameinfor();

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProjectStructure, setViewingProjectStructure] = useState<Project | null>(null);
  const [structureActiveTab, setStructureActiveTab] = useState<
    'turmas' | 'alunos' | 'atividades' | 'quizzes' | 'apostilas' | 'arquivos' | 'desempenho'
  >('turmas');

  // Quick Class Creation Modal for a specific project
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [classTargetProjectId, setClassTargetProjectId] = useState<string>('');
  const [newClassName, setNewClassName] = useState('');
  const [newClassCourseId, setNewClassCourseId] = useState(courses[0]?.id || '');
  const [newClassTeacherId, setNewClassTeacherId] = useState(
    users.find((u) => u.role === 'professor')?.id || ''
  );
  const [newClassSchedule, setNewClassSchedule] = useState('Segundas e Quartas - 14:00 às 16:00');

  // Form State for Project Create/Edit
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectWorkload, setProjectWorkload] = useState(40);
  const [projectStartDate, setProjectStartDate] = useState('2026-03-01');
  const [projectEndDate, setProjectEndDate] = useState('2026-06-30');
  const [projectStatus, setProjectStatus] = useState<ProjectStatus>('ativo');
  const [projectIcon, setProjectIcon] = useState('📘');
  const [projectColor, setProjectColor] = useState('from-blue-600 to-cyan-600');
  const [projectCoordinator, setProjectCoordinator] = useState('Instrutor Henrique');

  // Icon options
  const iconOptions = ['📘', '📗', '📙', '📕', '📒', '💻', '🚀', '🎓', '⚡', '🌐', '🏆', '📊', '🤖', '💡'];

  // Color options
  const colorOptions = [
    { label: 'Azul e Ciano', value: 'from-blue-600 to-cyan-600', ring: 'ring-blue-500' },
    { label: 'Esmeralda e Verde', value: 'from-emerald-600 to-teal-500', ring: 'ring-emerald-500' },
    { label: 'Âmbar e Laranja', value: 'from-amber-600 to-orange-500', ring: 'ring-amber-500' },
    { label: 'Roxo e Índigo', value: 'from-purple-600 to-indigo-600', ring: 'ring-purple-500' },
    { label: 'Rosa e Carmim', value: 'from-pink-600 to-rose-600', ring: 'ring-pink-500' },
  ];

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
    setProjectWorkload(40);
    const now = new Date();
    const formattedNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setProjectStartDate(formattedNow);
    const nextFourMonths = new Date(now.setMonth(now.getMonth() + 4));
    setProjectEndDate(
      `${nextFourMonths.getFullYear()}-${String(nextFourMonths.getMonth() + 1).padStart(2, '0')}-${String(nextFourMonths.getDate()).padStart(2, '0')}`
    );
    setProjectStatus('ativo');
    setProjectIcon('📘');
    setProjectColor('from-blue-600 to-cyan-600');
    setProjectCoordinator(currentUser.name || 'Instrutor Henrique');
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (proj: Project) => {
    setEditingProject(proj);
    setProjectName(proj.name);
    setProjectDescription(proj.description || '');
    setProjectWorkload(proj.workloadHours);
    setProjectStartDate(proj.startDate);
    setProjectEndDate(proj.endDate);
    setProjectStatus(proj.status);
    setProjectIcon(proj.icon || '📘');
    setProjectColor(proj.color || 'from-blue-600 to-cyan-600');
    setProjectCoordinator(proj.coordinatorName || 'Instrutor Henrique');
    setIsCreateModalOpen(true);
  };

  // Handle Save Project
  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert('Por favor, informe o nome do projeto.');
      return;
    }

    if (editingProject) {
      updateProject(editingProject.id, {
        name: projectName.trim(),
        description: projectDescription.trim(),
        workloadHours: Number(projectWorkload) || 40,
        startDate: projectStartDate,
        endDate: projectEndDate,
        status: projectStatus,
        icon: projectIcon,
        color: projectColor,
        coordinatorName: projectCoordinator,
      });
    } else {
      createProject({
        name: projectName.trim(),
        description: projectDescription.trim(),
        workloadHours: Number(projectWorkload) || 40,
        startDate: projectStartDate,
        endDate: projectEndDate,
        status: projectStatus,
        icon: projectIcon,
        color: projectColor,
        coordinatorName: projectCoordinator,
      });
    }

    setIsCreateModalOpen(false);
  };

  // Quick class create
  const handleCreateClassForProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !classTargetProjectId) {
      alert('Informe o nome da turma.');
      return;
    }

    const selCourse = courses.find((c) => c.id === newClassCourseId);
    const selTeacher = users.find((u) => u.id === newClassTeacherId);

    createClassRoom(
      newClassName.trim(),
      classTargetProjectId,
      newClassCourseId,
      selCourse?.title || 'Informática Básica Profissional',
      newClassTeacherId,
      selTeacher?.name || 'Instrutor Henrique',
      newClassSchedule
    );

    setIsAddClassModalOpen(false);
    setNewClassName('');
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics across all projects
  const totalProjectsCount = projects.length;
  const activeProjectsCount = projects.filter((p) => p.status === 'ativo').length;
  const totalWorkloadHours = projects.reduce((acc, p) => acc + (p.workloadHours || 0), 0);
  const totalClassesCount = classes.length;
  const totalStudentsCount = users.filter((u) => u.role === 'aluno').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-900/40 p-6 md:p-8 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
              <FolderKanban className="w-3.5 h-3.5" />
              Gestão Educacional Centralizada
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Gerenciador de Projetos
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Cadastre novos projetos institucionais dinamicamente. Cada projeto possui sua própria estrutura isolada de turmas, alunos, conteúdos, atividades, quizzes, apostilas e métricas de desempenho.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              ➕ Novo Projeto
            </button>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Projetos</div>
            <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-2">
              {totalProjectsCount}
              <span className="text-xs text-indigo-400 font-medium">cadastrados</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Status Ativo</div>
            <div className="text-2xl font-black text-emerald-400 mt-1 flex items-baseline gap-2">
              {activeProjectsCount}
              <span className="text-xs text-slate-400 font-medium">em andamento</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Carga Horária Total</div>
            <div className="text-2xl font-black text-amber-400 mt-1 flex items-baseline gap-2">
              {totalWorkloadHours}h
              <span className="text-xs text-slate-400 font-medium">acumuladas</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Turmas Vinculadas</div>
            <div className="text-2xl font-black text-cyan-400 mt-1 flex items-baseline gap-2">
              {totalClassesCount}
              <span className="text-xs text-slate-400 font-medium">turmas</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Alunos Atendidos</div>
            <div className="text-2xl font-black text-purple-400 mt-1 flex items-baseline gap-2">
              {totalStudentsCount}
              <span className="text-xs text-slate-400 font-medium">alunos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Project Filter Notification Banner */}
      {activeProjectId !== 'all' && (
        <div className="bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-slate-900 border border-blue-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{projects.find((p) => p.id === activeProjectId)?.icon || '📘'}</span>
            <div>
              <div className="text-xs text-blue-300 font-semibold uppercase tracking-wider">
                Filtro Global da Plataforma Ativo
              </div>
              <div className="text-sm font-bold text-white">
                Visualizando dados de: {projects.find((p) => p.id === activeProjectId)?.name}
              </div>
            </div>
          </div>
          <button
            onClick={() => setActiveProjectId('all')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all shrink-0 self-start sm:self-auto"
          >
            Limpar filtro (Ver todos os projetos)
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar projeto por nome ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Status:
          </span>
          {(['all', 'ativo', 'planejamento', 'concluido', 'pausado'] as const).map((status) => {
            const labelMap: Record<string, string> = {
              all: 'Todos',
              ativo: 'Ativos',
              planejamento: 'Em Planejamento',
              concluido: 'Concluídos',
              pausado: 'Pausados',
            };
            const isSelected = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {labelMap[status]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj) => {
          const projectClasses = classes.filter((c) => c.projectId === proj.id);
          const projectClassIds = projectClasses.map((c) => c.id);
          const projectStudents = users.filter(
            (u) => u.role === 'aluno' && (u.projectId === proj.id || (u.classId && projectClassIds.includes(u.classId)))
          );
          const projectActivities = activities.filter(
            (a) => a.projectId === proj.id || (a.classId && projectClassIds.includes(a.classId))
          );
          const projectQuizzes = quizzes.filter(
            (q) => q.projectId === proj.id || (q.classId && projectClassIds.includes(q.classId))
          );
          const projectMaterials = didacticMaterials.filter(
            (m) => m.projectId === proj.id || (m.targetClassId && projectClassIds.includes(m.targetClassId))
          );
          const isCurrentlyActive = activeProjectId === proj.id;

          const statusBadgeConfig = {
            ativo: { label: '🟢 Ativo', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
            planejamento: { label: '🟡 Planejamento', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
            concluido: { label: '🔵 Concluído', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
            pausado: { label: '⚪ Pausado', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
          }[proj.status];

          return (
            <div
              key={proj.id}
              className={`flex flex-col justify-between bg-slate-900 border rounded-3xl p-6 transition-all hover:shadow-xl ${
                isCurrentlyActive
                  ? 'border-indigo-500/80 shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header card info */}
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${
                        proj.color || 'from-blue-600 to-cyan-600'
                      } flex items-center justify-center text-2xl shadow-lg shrink-0`}
                    >
                      {proj.icon || '📘'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">
                        {proj.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeConfig.bg}`}
                        >
                          {statusBadgeConfig.label}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {proj.workloadHours} horas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Dropdown / Quick Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(proj)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Editar Projeto"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir o projeto "${proj.name}"?`)) {
                            deleteProject(proj.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                        title="Excluir Projeto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                  {proj.description || 'Sem descrição cadastrada para este projeto.'}
                </p>

                {/* Dates & Coordinator */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 mt-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      Período:
                    </span>
                    <span className="text-slate-200 font-medium">
                      {proj.startDate} até {proj.endDate}
                    </span>
                  </div>
                  {proj.coordinatorName && (
                    <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-slate-800/60">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                        Coord./Instrutor:
                      </span>
                      <span className="text-slate-200 font-semibold">{proj.coordinatorName}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Turmas</div>
                    <div className="text-sm font-black text-indigo-400 mt-0.5">{projectClasses.length}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Alunos</div>
                    <div className="text-sm font-black text-purple-400 mt-0.5">{projectStudents.length}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Ativid.</div>
                    <div className="text-sm font-black text-cyan-400 mt-0.5">{projectActivities.length}</div>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Apostilas</div>
                    <div className="text-sm font-black text-amber-400 mt-0.5">{projectMaterials.length}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (isCurrentlyActive) {
                        setActiveProjectId('all');
                      } else {
                        setActiveProjectId(proj.id);
                      }
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                      isCurrentlyActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
                    }`}
                  >
                    {isCurrentlyActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        Visão Ativada
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        Filtrar Plataforma
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      setViewingProjectStructure(proj);
                      setStructureActiveTab('turmas');
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all"
                    title="Ver estrutura completa de turmas, alunos, apostilas e atividades"
                  >
                    <Eye className="w-3.5 h-3.5 text-cyan-400" />
                    Estrutura
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
                  <button
                    onClick={() => {
                      setClassTargetProjectId(proj.id);
                      setIsAddClassModalOpen(true);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Criar Turma neste projeto
                  </button>

                  <button
                    onClick={() => toggleProjectStatus(proj.id)}
                    className="hover:text-slate-200 font-medium flex items-center gap-1"
                  >
                    {proj.status === 'ativo' ? (
                      <>
                        <PauseCircle className="w-3 h-3 text-amber-400" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-3 h-3 text-emerald-400" />
                        Ativar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProjects.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 text-slate-500 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum projeto encontrado</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Não foram encontrados projetos com os termos pesquisados ou com o status selecionado.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Projeto
          </button>
        </div>
      )}

      {/* MODAL: Criar / Editar Projeto */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{projectIcon}</span>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingProject ? 'Editar Projeto' : '➕ Novo Projeto'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Preencha as informações para registrar o projeto no sistema
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4 mt-6">
              {/* Nome do Projeto */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Projeto Jovem Digital, Inclusão Tech..."
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Descrição do Projeto
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o público-alvo, objetivo pedagógico e metas do projeto..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                />
              </div>

              {/* Grid: Carga Horária e Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Carga Horária (Horas) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    required
                    value={projectWorkload}
                    onChange={(e) => setProjectWorkload(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value as ProjectStatus)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="ativo">🟢 Ativo (Em andamento)</option>
                    <option value="planejamento">🟡 Planejamento</option>
                    <option value="concluido">🔵 Concluído</option>
                    <option value="pausado">⚪ Pausado</option>
                  </select>
                </div>
              </div>

              {/* Grid: Datas de Início e Término */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    required
                    value={projectStartDate}
                    onChange={(e) => setProjectStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Data de Término
                  </label>
                  <input
                    type="date"
                    required
                    value={projectEndDate}
                    onChange={(e) => setProjectEndDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Coordenador / Instrutor */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Coordenador / Instrutor Responsável
                </label>
                <input
                  type="text"
                  placeholder="Nome do coordenador pedagógico ou instrutor"
                  value={projectCoordinator}
                  onChange={(e) => setProjectCoordinator(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Ícone do Projeto */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ícone / Emoji do Projeto
                </label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setProjectIcon(icon)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        projectIcon === icon
                          ? 'bg-indigo-600 ring-2 ring-indigo-400 scale-110 shadow-lg'
                          : 'bg-slate-950 border border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cor de Destaque */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tema Visual / Cor do Card
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {colorOptions.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setProjectColor(col.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                        projectColor === col.value
                          ? 'border-indigo-400 bg-slate-800 text-white ring-1 ring-indigo-500'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${col.value}`} />
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  {editingProject ? 'Salvar Alterações' : 'Cadastrar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Visualizar Estrutura Completa do Projeto */}
      {viewingProjectStructure && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${
                    viewingProjectStructure.color || 'from-blue-600 to-cyan-600'
                  } flex items-center justify-center text-2xl shadow-lg shrink-0`}
                >
                  {viewingProjectStructure.icon || '📘'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{viewingProjectStructure.name}</h2>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                      {viewingProjectStructure.workloadHours}h
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estrutura isolada de turmas, alunos, conteúdos, atividades, quizzes e apostilas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveProjectId(viewingProjectStructure.id);
                    setViewingProjectStructure(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md"
                >
                  Ativar Filtro
                </button>
                <button
                  onClick={() => setViewingProjectStructure(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Structure Sub-Tabs */}
            <div className="flex items-center gap-1.5 px-6 pt-3 pb-2 border-b border-slate-800/80 bg-slate-900 overflow-x-auto text-xs">
              {[
                { id: 'turmas', label: 'Turmas', icon: Layers },
                { id: 'alunos', label: 'Alunos', icon: Users },
                { id: 'atividades', label: 'Atividades', icon: CheckSquare },
                { id: 'quizzes', label: 'Quizzes', icon: Brain },
                { id: 'apostilas', label: 'Apostilas Didáticas', icon: Sparkles },
                { id: 'arquivos', label: 'Arquivos', icon: Paperclip },
                { id: 'desempenho', label: 'Desempenho', icon: BarChart3 },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = structureActiveTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setStructureActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Structure Body View */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* TURMAS */}
              {structureActiveTab === 'turmas' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white">
                      Turmas cadastradas neste projeto ({classes.filter((c) => c.projectId === viewingProjectStructure.id).length})
                    </h3>
                    <button
                      onClick={() => {
                        setClassTargetProjectId(viewingProjectStructure.id);
                        setIsAddClassModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Nova Turma
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {classes
                      .filter((c) => c.projectId === viewingProjectStructure.id)
                      .map((cls) => (
                        <div
                          key={cls.id}
                          className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-white">{cls.name}</h4>
                              <p className="text-xs text-indigo-400 font-medium">{cls.courseName}</p>
                            </div>
                            <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-md">
                              {cls.studentCount} alunos
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 space-y-1">
                            <div>Instrutor: <span className="text-slate-200">{cls.teacherName}</span></div>
                            <div>Horário: <span className="text-slate-200">{cls.schedule}</span></div>
                          </div>

                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Progresso médio:</span>
                            <span className="font-bold text-emerald-400">{cls.avgProgress}%</span>
                          </div>
                        </div>
                      ))}

                    {classes.filter((c) => c.projectId === viewingProjectStructure.id).length === 0 && (
                      <div className="col-span-2 text-center py-8 text-slate-500 text-xs">
                        Nenhuma turma vinculada a este projeto ainda. Clique em "Nova Turma" para cadastrar.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ALUNOS */}
              {structureActiveTab === 'alunos' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    Alunos matriculados nas turmas deste projeto
                  </h3>
                  <div className="divide-y divide-slate-800 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                    {users
                      .filter(
                        (u) =>
                          u.role === 'aluno' &&
                          (u.projectId === viewingProjectStructure.id ||
                            classes
                              .filter((c) => c.projectId === viewingProjectStructure.id)
                              .some((c) => c.id === u.classId))
                      )
                      .map((st) => (
                        <div key={st.id} className="p-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={st.avatar}
                              alt={st.name}
                              className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20"
                            />
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                                {st.name}
                                {st.nickname && (
                                  <span className="text-[10px] text-slate-400 font-normal">
                                    ({st.nickname})
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {st.className || 'Turma não atribuída'} • {st.email}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-black text-amber-400">
                              {st.xp} XP
                            </span>
                            <div className="text-[10px] text-slate-400 font-semibold">
                              Nível {st.level}
                            </div>
                          </div>
                        </div>
                      ))}

                    {users.filter(
                      (u) =>
                        u.role === 'aluno' &&
                        (u.projectId === viewingProjectStructure.id ||
                          classes
                            .filter((c) => c.projectId === viewingProjectStructure.id)
                            .some((c) => c.id === u.classId))
                    ).length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        Nenhum aluno matriculado nas turmas deste projeto.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ATIVIDADES */}
              {structureActiveTab === 'atividades' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Atividades Vinculadas a este Projeto</h3>
                  <div className="space-y-2">
                    {activities
                      .filter(
                        (a) =>
                          a.projectId === viewingProjectStructure.id ||
                          classes
                            .filter((c) => c.projectId === viewingProjectStructure.id)
                            .some((c) => c.id === a.classId)
                      )
                      .map((act) => (
                        <div
                          key={act.id}
                          className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{act.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {act.className} • Módulo: {act.module} • {act.lesson}
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            +{act.xp} XP
                          </span>
                        </div>
                      ))}

                    {activities.filter(
                      (a) =>
                        a.projectId === viewingProjectStructure.id ||
                        classes
                          .filter((c) => c.projectId === viewingProjectStructure.id)
                          .some((c) => c.id === a.classId)
                    ).length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                        Nenhuma atividade cadastrada para este projeto.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* QUIZZES */}
              {structureActiveTab === 'quizzes' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Quizzes do Projeto</h3>
                  <div className="space-y-2">
                    {quizzes
                      .filter(
                        (q) =>
                          q.projectId === viewingProjectStructure.id ||
                          classes
                            .filter((c) => c.projectId === viewingProjectStructure.id)
                            .some((c) => c.id === q.classId)
                      )
                      .map((quiz) => (
                        <div
                          key={quiz.id}
                          className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between"
                        >
                          <div>
                            <div className="text-xs font-bold text-white">{quiz.title}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {quiz.questions.length} perguntas • {quiz.module}
                            </div>
                          </div>
                          <span className="text-xs font-extrabold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">
                            +{quiz.xp} XP
                          </span>
                        </div>
                      ))}

                    {quizzes.filter(
                      (q) =>
                        q.projectId === viewingProjectStructure.id ||
                        classes
                          .filter((c) => c.projectId === viewingProjectStructure.id)
                          .some((c) => c.id === q.classId)
                    ).length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                        Nenhum quiz vinculado a este projeto.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* APOSTILAS DIDÁTICAS */}
              {structureActiveTab === 'apostilas' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">
                    Apostilas e Materiais Didáticos Gerados
                  </h3>
                  <div className="space-y-3">
                    {didacticMaterials
                      .filter(
                        (m) =>
                          m.projectId === viewingProjectStructure.id ||
                          classes
                            .filter((c) => c.projectId === viewingProjectStructure.id)
                            .some((c) => c.id === m.targetClassId)
                      )
                      .map((mat) => (
                        <div
                          key={mat.id}
                          className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-4"
                        >
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              {mat.title}
                              <span
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  mat.status === 'publicado'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {mat.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Turma: {mat.targetClassName} • {mat.lessonTitle} • Tempo de leitura: ~{mat.readTimeMin} min
                            </div>
                          </div>
                        </div>
                      ))}

                    {didacticMaterials.filter(
                      (m) =>
                        m.projectId === viewingProjectStructure.id ||
                        classes
                          .filter((c) => c.projectId === viewingProjectStructure.id)
                          .some((c) => c.id === m.targetClassId)
                    ).length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                        Nenhuma apostila gerada para este projeto ainda. Você pode gerar apostilas na aba "Gerador de Material".
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ARQUIVOS */}
              {structureActiveTab === 'arquivos' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Arquivos e Documentos do Projeto</h3>
                  <div className="space-y-2">
                    {sharedFiles
                      .filter(
                        (f) =>
                          f.projectId === viewingProjectStructure.id ||
                          classes
                            .filter((c) => c.projectId === viewingProjectStructure.id)
                            .some((c) => c.id === f.classId)
                      )
                      .map((file) => (
                        <div
                          key={file.id}
                          className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">📄</span>
                            <div>
                              <div className="text-xs font-bold text-white">{file.name}</div>
                              <div className="text-[11px] text-slate-400">
                                {file.fileSize} • {file.materialType} • {file.className}
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {file.uploadedAt}
                          </span>
                        </div>
                      ))}

                    {sharedFiles.filter(
                      (f) =>
                        f.projectId === viewingProjectStructure.id ||
                        classes
                          .filter((c) => c.projectId === viewingProjectStructure.id)
                          .some((c) => c.id === f.classId)
                    ).length === 0 && (
                      <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                        Nenhum arquivo compartilhado para este projeto.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DESEMPENHO */}
              {structureActiveTab === 'desempenho' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white">Indicadores de Desempenho do Projeto</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 font-semibold uppercase">Carga Horária</div>
                      <div className="text-2xl font-black text-amber-400 mt-1">
                        {viewingProjectStructure.workloadHours}h
                      </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 font-semibold uppercase">Turmas Ativas</div>
                      <div className="text-2xl font-black text-indigo-400 mt-1">
                        {classes.filter((c) => c.projectId === viewingProjectStructure.id).length}
                      </div>
                    </div>
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center">
                      <div className="text-xs text-slate-400 font-semibold uppercase">Alunos Atendidos</div>
                      <div className="text-2xl font-black text-purple-400 mt-1">
                        {
                          users.filter(
                            (u) =>
                              u.role === 'aluno' &&
                              (u.projectId === viewingProjectStructure.id ||
                                classes
                                  .filter((c) => c.projectId === viewingProjectStructure.id)
                                  .some((c) => c.id === u.classId))
                          ).length
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nova Turma Rápida Vinculada a um Projeto */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Nova Turma no Projeto
              </h3>
              <button
                onClick={() => setIsAddClassModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClassForProject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Nome da Turma *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Turma Gamma (Noite), Turma Sábado..."
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Curso Relacionado
                </label>
                <select
                  value={newClassCourseId}
                  onChange={(e) => setNewClassCourseId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Instrutor Responsável
                </label>
                <select
                  value={newClassTeacherId}
                  onChange={(e) => setNewClassTeacherId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {users
                    .filter((u) => u.role === 'professor')
                    .map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Dias e Horário
                </label>
                <input
                  type="text"
                  value={newClassSchedule}
                  onChange={(e) => setNewClassSchedule(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
                >
                  Criar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
