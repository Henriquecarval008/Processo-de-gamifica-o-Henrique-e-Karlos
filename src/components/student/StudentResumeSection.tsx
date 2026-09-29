/**
 * Student Professional Resume Builder ("Meu Currículo" — Jovem Aprendiz & Primeiro Emprego)
 * 
 * Features:
 * - Comprehensive structured categories: Objetivo, Escolaridade, Cursos, Habilidades, Informática, Experiências, Projetos e Idiomas
 * - AI-powered text enhancement via @google/genai (refines phrasing without inventing data)
 * - AI diagnostic resume evaluation with strengths, missing items, and interview tips
 * - 4 professional templates: Jovem Aprendiz, Moderno, Clássico, Tecnológico
 * - Real-time preview & print / PDF download
 */

import React, { useState, useEffect } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import { resumeService } from '../../services/resumeService';
import { ResumeData, ResumeAnalysisResult, ResumeCourseItem, ResumeExperienceItem } from '../../types';
import { soundEffects } from '../../utils/soundEffects';
import {
  FileText,
  Sparkles,
  Printer,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Eye,
  Award,
  GraduationCap,
  Briefcase,
  Layers,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  Zap,
} from 'lucide-react';

export const StudentResumeSection: React.FC = () => {
  const { currentUser, addNotification } = useGameinfor();

  const [resume, setResume] = useState<ResumeData>(() =>
    resumeService.getResume(currentUser.id, currentUser.name, currentUser.email)
  );

  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'analysis'>('editor');
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeData['chosenTemplate']>(
    resume.chosenTemplate || 'jovem_aprendiz'
  );

  const [isEnhancingObjective, setIsEnhancingObjective] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResult | null>(null);

  // Sync state if currentUser changes
  useEffect(() => {
    setResume(resumeService.getResume(currentUser.id, currentUser.name, currentUser.email));
  }, [currentUser.id]);

  const handleSave = () => {
    soundEffects.playClick();
    const updated = { ...resume, chosenTemplate: selectedTemplate };
    resumeService.saveResume(updated);
    setResume(updated);
    addNotification({
      type: 'success',
      title: 'Currículo Salvo!',
      message: 'Seus dados profissionais foram atualizados com sucesso.',
    });
  };

  const handleAddCourse = () => {
    const newCourse: ResumeCourseItem = {
      id: `c-${Date.now()}`,
      name: 'Curso de Informática Prática',
      institution: 'Instituto Ambiente',
      hours: 40,
      year: '2026',
      completionStatus: 'concluido',
    };
    setResume({ ...resume, courses: [...resume.courses, newCourse] });
  };

  const handleRemoveCourse = (id: string) => {
    setResume({ ...resume, courses: resume.courses.filter((c) => c.id !== id) });
  };

  const handleAddExperience = () => {
    const newExp: ResumeExperienceItem = {
      id: `exp-${Date.now()}`,
      role: 'Jovem Aprendiz ou Auxiliar',
      company: 'Empresa ou Projeto Social',
      period: '2026',
      description: 'Atividades práticas de organização e rotinas informatizadas.',
    };
    setResume({ ...resume, experiences: [...resume.experiences, newExp] });
  };

  const handleRemoveExperience = (id: string) => {
    setResume({ ...resume, experiences: resume.experiences.filter((e) => e.id !== id) });
  };

  const handleEnhanceObjectiveWithAI = async () => {
    soundEffects.playClick();
    setIsEnhancingObjective(true);
    try {
      const res = await resumeService.enhanceSectionWithAI('objective', resume.professionalObjective, {
        schooling: resume.schooling,
        itSkills: resume.itKnowledge,
      });
      setResume({ ...resume, professionalObjective: res.enhancedText });
      addNotification({
        type: 'info',
        title: 'Objetivo Aprimorado com IA!',
        message: 'O texto foi enriquecido de maneira profissional para o seu perfil.',
      });
    } catch {
      // fallback handled in service
    } finally {
      setIsEnhancingObjective(false);
    }
  };

  const handleRunAnalysisWithAI = async () => {
    soundEffects.playClick();
    setIsEvaluating(true);
    try {
      const result = await resumeService.evaluateResume(resume);
      setAnalysisResult(result);
      setActiveTab('analysis');
      addNotification({
        type: 'success',
        title: 'Diagnóstico Concluído!',
        message: `Seu currículo recebeu pontuação de ${result.overallScore}/100.`,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handlePrint = () => {
    soundEffects.playClick();
    resumeService.printResume();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Instituto Ambiente • Empregabilidade
            </span>
          </div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 mt-1">
            <FileText className="w-7 h-7 text-cyan-400" />
            Meu Currículo Profissional
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Prepare seu currículo para vagas de Jovem Aprendiz, estágios e primeiro emprego. Utilize a
            orientação de Inteligência Artificial para destacar seus cursos e projetos do GAMEINFOR.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSave}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4 text-cyan-400" />
            <span>Salvar</span>
          </button>

          <button
            onClick={handleRunAnalysisWithAI}
            disabled={isEvaluating}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 transition-all flex items-center gap-1.5"
          >
            {isEvaluating ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{isEvaluating ? 'Analisando...' : 'Avaliar com IA'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Baixar em PDF</span>
          </button>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'editor'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Editar Currículo</span>
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'preview'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Pré-visualização</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'analysis'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Diagnóstico IA</span>
          </button>
        </div>

        {/* Template Selector */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <span>Modelo:</span>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 focus:outline-none"
          >
            <option value="jovem_aprendiz">Jovem Aprendiz (Recomendado)</option>
            <option value="moderno">Moderno</option>
            <option value="tecnologico">Tecnológico</option>
            <option value="classico">Clássico</option>
          </select>
        </div>
      </div>

      {/* TAB 1: CURRICULUM EDITOR */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          {/* Section: Personal Info */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
              1. Dados Pessoais & Contato
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo:</label>
                <input
                  type="text"
                  value={resume.studentName}
                  onChange={(e) => setResume({ ...resume, studentName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail Principal:</label>
                <input
                  type="email"
                  value={resume.email}
                  onChange={(e) => setResume({ ...resume, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Telefone / WhatsApp:</label>
                <input
                  type="text"
                  value={resume.phone}
                  onChange={(e) => setResume({ ...resume, phone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cidade:</label>
                <input
                  type="text"
                  value={resume.city}
                  onChange={(e) => setResume({ ...resume, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Bairro:</label>
                <input
                  type="text"
                  value={resume.neighborhood}
                  onChange={(e) => setResume({ ...resume, neighborhood: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Escolaridade Atual:</label>
                <input
                  type="text"
                  value={resume.schooling}
                  onChange={(e) => setResume({ ...resume, schooling: e.target.value })}
                  placeholder="Ex: Ensino Médio (2º ano - Noturno)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Professional Objective + AI Helper */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                2. Objetivo Profissional
              </h2>
              <button
                type="button"
                onClick={handleEnhanceObjectiveWithAI}
                disabled={isEnhancingObjective}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all shadow"
              >
                {isEnhancingObjective ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>Aprimorar Redação com IA</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={resume.professionalObjective}
              onChange={(e) => setResume({ ...resume, professionalObjective: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 leading-relaxed"
              placeholder="Descreva a vaga ou área de interesse (Jovem Aprendiz, Assistente de Informática, etc.)"
            />
            <p className="text-[11px] text-slate-400">
              Dica do Instituto Ambiente: Seja direto, citando a área que deseja atuar e sua disposição
              para aprender.
            </p>
          </div>

          {/* Section: Courses & Capacitation */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-400" />
                3. Cursos e Qualificações (Instituto Ambiente)
              </h2>
              <button
                type="button"
                onClick={handleAddCourse}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Curso</span>
              </button>
            </div>

            <div className="space-y-3">
              {resume.courses.map((course, idx) => (
                <div
                  key={course.id || idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs items-center"
                >
                  <div className="sm:col-span-2">
                    <label className="text-[11px] text-slate-400 block mb-1">Nome do Curso:</label>
                    <input
                      type="text"
                      value={course.name}
                      onChange={(e) => {
                        const updated = [...resume.courses];
                        updated[idx].name = e.target.value;
                        setResume({ ...resume, courses: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Instituição / Carga:</label>
                    <input
                      type="text"
                      value={`${course.institution} (${course.hours}h)`}
                      onChange={(e) => {
                        const updated = [...resume.courses];
                        updated[idx].institution = e.target.value;
                        setResume({ ...resume, courses: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={course.year}
                      onChange={(e) => {
                        const updated = [...resume.courses];
                        updated[idx].year = e.target.value;
                        setResume({ ...resume, courses: updated });
                      }}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-center"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCourse(course.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Excluir curso"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: IT Knowledge & Practical Tools */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              4. Conhecimentos de Informática (Excel, Word, Sistemas)
            </h2>

            <div className="space-y-2">
              {resume.itKnowledge.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const updated = [...resume.itKnowledge];
                      updated[idx] = e.target.value;
                      setResume({ ...resume, itKnowledge: updated });
                    }}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setResume({
                        ...resume,
                        itKnowledge: resume.itKnowledge.filter((_, i) => i !== idx),
                      });
                    }}
                    className="p-2 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setResume({
                    ...resume,
                    itKnowledge: [...resume.itKnowledge, 'Nova competência de informática'],
                  });
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1 mt-2"
              >
                <Plus className="w-3 h-3" />
                <span>Adicionar Ferramenta de Informática</span>
              </button>
            </div>
          </div>

          {/* Section: Experiences & Social Projects */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-cyan-400" />
                5. Experiências Profissionais ou Voluntárias
              </h2>
              <button
                type="button"
                onClick={handleAddExperience}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Experiência</span>
              </button>
            </div>

            {resume.experiences.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Nenhuma experiência cadastrada. Caso esteja em busca do primeiro emprego, o modelo
                destacará seus cursos e atividades práticas do Instituto Ambiente!
              </p>
            ) : (
              <div className="space-y-4">
                {resume.experiences.map((exp, idx) => (
                  <div
                    key={exp.id || idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Cargo / Função:</label>
                        <input
                          type="text"
                          value={exp.role}
                          onChange={(e) => {
                            const updated = [...resume.experiences];
                            updated[idx].role = e.target.value;
                            setResume({ ...resume, experiences: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Empresa / Local:</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...resume.experiences];
                            updated[idx].company = e.target.value;
                            setResume({ ...resume, experiences: updated });
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <label className="text-[11px] text-slate-400 block mb-1">Período:</label>
                          <input
                            type="text"
                            value={exp.period}
                            onChange={(e) => {
                              const updated = [...resume.experiences];
                              updated[idx].period = e.target.value;
                              setResume({ ...resume, experiences: updated });
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(exp.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors mt-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Descrição das atividades:</label>
                      <textarea
                        rows={2}
                        value={exp.description}
                        onChange={(e) => {
                          const updated = [...resume.experiences];
                          updated[idx].description = e.target.value;
                          setResume({ ...resume, experiences: updated });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRINT-OPTIMIZED PREVIEW */}
      {activeTab === 'preview' && (
        <div className="bg-white text-slate-900 p-8 sm:p-12 rounded-2xl shadow-2xl max-w-3xl mx-auto font-sans leading-relaxed border border-slate-200">
          {/* Header */}
          <div className="border-b-2 border-cyan-600 pb-4 mb-6">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wide">
              {resume.studentName || 'Nome do Estudante'}
            </h1>
            <div className="flex items-center gap-4 text-xs text-slate-600 mt-2 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                {resume.neighborhood}, {resume.city}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-cyan-600" />
                {resume.phone}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-cyan-600" />
                {resume.email}
              </span>
            </div>
          </div>

          {/* Section: Objective */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-cyan-800 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-1">
              Objetivo Profissional
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed">{resume.professionalObjective}</p>
          </div>

          {/* Section: Education */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-cyan-800 uppercase tracking-wider mb-1.5 border-b border-slate-200 pb-1">
              Formação Escolar
            </h2>
            <p className="text-xs text-slate-800 font-semibold">{resume.schooling}</p>
          </div>

          {/* Section: Courses */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-cyan-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              Qualificação Profissional & Cursos
            </h2>
            <div className="space-y-2.5">
              {resume.courses.map((c, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{c.name}</span>
                    <span className="text-slate-500 font-normal">{c.year}</span>
                  </div>
                  <div className="text-slate-600">
                    {c.institution} — Carga horária: {c.hours} horas
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: IT Skills */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-cyan-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              Conhecimentos em Informática & Tecnologia
            </h2>
            <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
              {resume.itKnowledge.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Section: Experiences */}
          {resume.experiences.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-bold text-cyan-800 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
                Experiências
              </h2>
              <div className="space-y-3">
                {resume.experiences.map((exp, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>{exp.role}</span>
                      <span className="text-slate-500 font-normal">{exp.period}</span>
                    </div>
                    <div className="text-slate-600 font-medium">{exp.company}</div>
                    <p className="text-slate-700 mt-1">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Institute Stamp */}
          <div className="text-[10px] text-slate-400 text-center pt-4 border-t border-slate-200">
            Formação promovida pelo Instituto Ambiente • Plataforma GAMEINFOR
          </div>
        </div>
      )}

      {/* TAB 3: AI DIAGNOSTIC EVALUATION */}
      {activeTab === 'analysis' && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                Diagnóstico Pedagógico com Inteligência Artificial
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Avaliação orientativa focada em aumentar suas chances em processos de Jovem Aprendiz.
              </p>
            </div>

            {analysisResult && (
              <div className="text-center px-4 py-2 rounded-xl bg-purple-950/80 border border-purple-500/40">
                <span className="text-[10px] font-bold text-purple-300 uppercase block">Pontuação</span>
                <span className="text-2xl font-black text-amber-400">{analysisResult.overallScore}/100</span>
              </div>
            )}
          </div>

          {!analysisResult ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2 animate-pulse" />
              <p className="font-semibold text-slate-300">Nenhum diagnóstico gerado ainda.</p>
              <p className="text-slate-500 mt-1">
                Clique no botão "Avaliar com IA" no topo para analisar forças, sugestões e dicas de entrevista.
              </p>
              <button
                onClick={handleRunAnalysisWithAI}
                className="mt-4 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                Gerar Análise do Currículo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                <h3 className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Pontos Fortes do Seu Currículo
                </h3>
                <ul className="list-disc list-inside text-emerald-200/90 space-y-1 leading-relaxed">
                  {analysisResult.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Missing Info */}
              <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 space-y-2">
                <h3 className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Informações a Completar ou Ajustar
                </h3>
                <ul className="list-disc list-inside text-amber-200/90 space-y-1 leading-relaxed">
                  {analysisResult.missingInfo.length === 0 ? (
                    <li>Todas as seções essenciais estão preenchidas adequadamente!</li>
                  ) : (
                    analysisResult.missingInfo.map((item, i) => <li key={i}>{item}</li>)
                  )}
                </ul>
              </div>

              {/* Suggestions */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
                <h3 className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Sugestões de Melhoria
                </h3>
                <ul className="list-disc list-inside text-blue-200/90 space-y-1 leading-relaxed">
                  {analysisResult.suggestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* Interview Tips */}
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                <h3 className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-indigo-400" />
                  Dicas para Processos Seletivos & Entrevistas
                </h3>
                <ul className="list-disc list-inside text-indigo-200/90 space-y-1 leading-relaxed">
                  {analysisResult.interviewTips.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
