import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  BookOpen,
  Sparkles,
  Layers,
  Send,
  Eye,
  Edit3,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  Table as TableIcon,
  FileSpreadsheet,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Search,
  Filter,
  X,
  Save,
} from 'lucide-react';
import { DidacticMaterial, DidacticSection, DidacticSectionType } from '../../types';
import { DidacticBookletViewer } from '../common/DidacticBookletViewer';

export const TeacherMaterialGenerator: React.FC = () => {
  const {
    courses,
    modules,
    lessons,
    classes,
    didacticMaterials,
    generateDidacticMaterial,
    updateDidacticMaterial,
    publishDidacticMaterial,
    deleteDidacticMaterial,
  } = useGameinfor();

  // Selection state for generator
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');
  const [selectedLessonId, setSelectedLessonId] = useState<string>(lessons[0]?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  // Mode: 'list' | 'preview' | 'edit'
  const [currentMode, setCurrentMode] = useState<'list' | 'preview' | 'edit'>('list');
  const [activeMaterial, setActiveMaterial] = useState<DidacticMaterial | null>(
    didacticMaterials[0] || null
  );

  // Search and filter for list
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'publicado' | 'rascunho'>('all');

  // Filter modules and lessons
  const filteredModules = modules.filter(
    (m) => !selectedCourseId || m.courseId === selectedCourseId
  );
  const currentModule = modules.find((m) => m.id === selectedModuleId) || filteredModules[0];
  const filteredLessons = lessons.filter(
    (l) => !selectedModuleId || l.moduleId === (currentModule?.id || selectedModuleId)
  );

  // When course changes, update module if needed
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const mod = modules.find((m) => m.courseId === courseId);
    if (mod) {
      setSelectedModuleId(mod.id);
      const firstLes = lessons.find((l) => l.moduleId === mod.id);
      if (firstLes) setSelectedLessonId(firstLes.id);
    }
  };

  const handleModuleChange = (moduleId: string) => {
    setSelectedModuleId(moduleId);
    const firstLes = lessons.find((l) => l.moduleId === moduleId);
    if (firstLes) setSelectedLessonId(firstLes.id);
  };

  // Generate material action
  const handleGenerate = () => {
    const course = courses.find((c) => c.id === selectedCourseId) || courses[0];
    const mod = modules.find((m) => m.id === selectedModuleId) || modules[0];
    const lesson = lessons.find((l) => l.id === selectedLessonId) || lessons[0];
    const targetClass = classes.find((c) => c.id === selectedClassId) || classes[0];

    if (!lesson) {
      alert('Selecione uma aula válida.');
      return;
    }

    const created = generateDidacticMaterial(
      course.id,
      mod.id,
      lesson.id,
      targetClass.id
    );

    setActiveMaterial(created);
    setCurrentMode('preview');
  };

  // Quick action: publish directly
  const handlePublish = (materialId: string) => {
    publishDidacticMaterial(materialId);
    if (activeMaterial && activeMaterial.id === materialId) {
      setActiveMaterial((prev) => (prev ? { ...prev, status: 'publicado' } : null));
    }
  };

  // Filtered materials list
  const displayedMaterials = didacticMaterials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.lessonTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.moduleName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Recurso Pedagógico Avançado
            </span>
            <span className="text-xs text-slate-400">GAMEINFOR Didática</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Gerador de Material Didático
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Crie apostilas visuais, detalhadas e estruturadas passo a passo para alunos iniciantes.
            Gere o material a partir de qualquer aula de informática ou Excel, edite como desejar e publique diretamente para as suas turmas.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-center">
            <div className="text-xs text-slate-400 font-medium">Apostilas Criadas</div>
            <div className="text-2xl font-black text-white mt-1">{didacticMaterials.length}</div>
          </div>
          <div className="bg-slate-950/80 border border-emerald-500/30 p-3.5 rounded-xl text-center">
            <div className="text-xs text-emerald-400 font-medium">Publicadas</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {didacticMaterials.filter((m) => m.status === 'publicado').length}
            </div>
          </div>
        </div>
      </div>

      {/* Mode View: Preview */}
      {currentMode === 'preview' && activeMaterial && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentMode('list')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition-colors"
            >
              ← Voltar para Minhas Apostilas
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMode('edit')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Editar esta Apostila
              </button>
              {activeMaterial.status === 'rascunho' && (
                <button
                  onClick={() => handlePublish(activeMaterial.id)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  Publicar para a Turma
                </button>
              )}
            </div>
          </div>

          <DidacticBookletViewer
            material={activeMaterial}
            onClose={() => setCurrentMode('list')}
            onEdit={() => setCurrentMode('edit')}
            onPublish={() => handlePublish(activeMaterial.id)}
            isTeacherView={true}
          />
        </div>
      )}

      {/* Mode View: Edit */}
      {currentMode === 'edit' && activeMaterial && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentMode('preview')}
              className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl transition-colors"
            >
              ← Voltar para Pré-visualização
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMode('preview')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                Salvar e Visualizar
              </button>
            </div>
          </div>

          <MaterialEditorForm
            material={activeMaterial}
            classes={classes}
            onSave={(updated) => {
              updateDidacticMaterial(activeMaterial.id, updated);
              setActiveMaterial(updated);
            }}
            onPublish={() => {
              handlePublish(activeMaterial.id);
              setCurrentMode('preview');
            }}
          />
        </div>
      )}

      {/* Mode View: List & Generator Creator */}
      {currentMode === 'list' && (
        <div className="space-y-8">
          {/* Section 1: Generator Control Panel */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">
                  Criar Nova Apostila Didática
                </h2>
                <p className="text-xs text-slate-400">
                  Selecione o curso, a aula e a turma de destino para compor o material automaticamente.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Select 1: Course */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  1. Curso / Disciplina
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select 2: Module */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  2. Módulo do Curso
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => handleModuleChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {filteredModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select 3: Lesson */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  3. Aula / Conteúdo
                </label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {filteredLessons.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select 4: Target Class */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  4. Turma de Destino
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generator Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  O material será gerado em formato de apostila digital completa com diagramação, tabelas, fórmulas e exercício.
                </span>
              </div>

              <button
                onClick={handleGenerate}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Criar Material Didático
              </button>
            </div>
          </div>

          {/* Section 2: Materials Catalog */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  Apostilas Geradas na Plataforma
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gerencie, visualize antes de publicar, edite textos e libere o acesso aos alunos.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por título ou aula..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
                  />
                </div>

                <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Todas ({didacticMaterials.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('publicado')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === 'publicado'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Publicadas ({didacticMaterials.filter((m) => m.status === 'publicado').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('rascunho')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === 'rascunho'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Rascunhos ({didacticMaterials.filter((m) => m.status === 'rascunho').length})
                  </button>
                </div>
              </div>
            </div>

            {/* Grid of Materials Cards */}
            {displayedMaterials.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 p-10 rounded-2xl text-center space-y-3">
                <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-white">Nenhuma apostila encontrada</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Utilize o painel acima para selecionar uma aula e gerar sua primeira apostila didática.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {displayedMaterials.map((mat) => (
                  <div
                    key={mat.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 p-5 rounded-2xl transition-all shadow-lg flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            mat.status === 'publicado'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {mat.status === 'publicado' ? 'Publicado' : 'Rascunho'}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono">
                          Turma: {mat.targetClassName}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-cyan-400">
                          {mat.lessonTitle}
                        </span>
                        <h4 className="text-base font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                          {mat.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {mat.summary}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          ~{mat.readTimeMin} min
                        </span>
                        <span>•</span>
                        <span>{mat.sections.length} seções didáticas</span>
                        <span>•</span>
                        <span>Por: {mat.authorName}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveMaterial(mat);
                            setCurrentMode('preview');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          Visualizar
                        </button>

                        <button
                          onClick={() => {
                            setActiveMaterial(mat);
                            setCurrentMode('edit');
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                          Editar
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Deseja excluir a apostila "${mat.title}"?`)) {
                              deleteDidacticMaterial(mat.id);
                            }
                          }}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Excluir apostila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {mat.status === 'rascunho' ? (
                        <button
                          onClick={() => handlePublish(mat.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Publicar
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          No Ar
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Inline Editor Component for Didactic Material
interface MaterialEditorFormProps {
  material: DidacticMaterial;
  classes: { id: string; name: string }[];
  onSave: (updated: DidacticMaterial) => void;
  onPublish: () => void;
}

const MaterialEditorForm: React.FC<MaterialEditorFormProps> = ({
  material,
  classes,
  onSave,
  onPublish,
}) => {
  const [title, setTitle] = useState(material.title);
  const [summary, setSummary] = useState(material.summary);
  const [readTimeMin, setReadTimeMin] = useState(material.readTimeMin);
  const [targetClassId, setTargetClassId] = useState(material.targetClassId);
  const [sections, setSections] = useState<DidacticSection[]>(material.sections);

  const handleUpdateSectionContent = (index: number, newContent: string) => {
    setSections((prev) =>
      prev.map((sec, idx) => (idx === index ? { ...sec, content: newContent } : sec))
    );
  };

  const handleUpdateSectionTitle = (index: number, newTitle: string) => {
    setSections((prev) =>
      prev.map((sec, idx) => (idx === index ? { ...sec, title: newTitle } : sec))
    );
  };

  const handleUpdateSectionSubtitle = (index: number, newSubtitle: string) => {
    setSections((prev) =>
      prev.map((sec, idx) => (idx === index ? { ...sec, subtitle: newSubtitle } : sec))
    );
  };

  const handleSave = () => {
    const targetClass = classes.find((c) => c.id === targetClassId);
    const updated: DidacticMaterial = {
      ...material,
      title,
      summary,
      readTimeMin: Number(readTimeMin),
      targetClassId,
      targetClassName: targetClass?.name || material.targetClassName,
      sections,
    };
    onSave(updated);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-400" />
            Editor Visual da Apostila
          </h2>
          <p className="text-xs text-slate-400">
            Ajuste títulos, explicações, passos de instruções e exercícios antes de liberar para os alunos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Alterações
          </button>
          {material.status === 'rascunho' && (
            <button
              onClick={() => {
                handleSave();
                onPublish();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              Salvar e Publicar
            </button>
          )}
        </div>
      </div>

      {/* Main Metadata Fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-300">Título da Apostila</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300">Turma de Destino</label>
          <select
            value={targetClassId}
            onChange={(e) => setTargetClassId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1 md:col-span-2">
          <label className="text-xs font-bold text-slate-300">Resumo / Objetivo Pedagógico</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-300">Tempo de Leitura Estimado (min)</label>
          <input
            type="number"
            value={readTimeMin}
            onChange={(e) => setReadTimeMin(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Sections List in Editor */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Seções da Apostila ({sections.length})
        </h3>

        <div className="space-y-4">
          {sections.map((sec, idx) => (
            <div
              key={sec.id || idx}
              className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-cyan-400 uppercase tracking-wider">
                  Seção {idx + 1}: {sec.type}
                </span>
                <span className="text-[11px] text-slate-500">
                  {sec.highlightVariant ? `Caixa: ${sec.highlightVariant}` : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Título da Seção</label>
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => handleUpdateSectionTitle(idx, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">Subtítulo (Opcional)</label>
                  <input
                    type="text"
                    value={sec.subtitle || ''}
                    onChange={(e) => handleUpdateSectionSubtitle(idx, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-400">Texto Didático / Conteúdo</label>
                <textarea
                  rows={3}
                  value={sec.content}
                  onChange={(e) => handleUpdateSectionContent(idx, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              {/* Steps overview if present */}
              {sec.steps && sec.steps.length > 0 && (
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">
                    Contém {sec.steps.length} passos de instruções sequenciais.
                  </span>
                </div>
              )}

              {/* Table Data overview if present */}
              {sec.tableData && (
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <TableIcon className="w-3.5 h-3.5" />
                    Tabela Exemplo ({sec.tableData.columns.length} colunas x {sec.tableData.rows.length} linhas)
                  </span>
                  <div className="text-[11px] text-slate-500">
                    Colunas: {sec.tableData.columns.join(' | ')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
