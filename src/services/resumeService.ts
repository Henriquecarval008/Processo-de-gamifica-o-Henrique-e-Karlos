/**
 * Professional Resume Service for GAMEINFOR (Instituto Ambiente)
 * 
 * Manages:
 * - Student professional resume builder ("Meu Currículo" - Jovem Aprendiz & Primeiro Emprego)
 * - Structured categories: Objetivo Profissional, Escolaridade, Cursos, Habilidades, Informática, Experiências, Projetos e Idiomas
 * - AI-powered phrasing and clarity enhancement (server-side via @google/genai, never inventing data)
 * - AI diagnostic evaluation (strengths, missing information, interview preparation tips)
 * - 4 professional templates: Moderno, Clássico, Tecnológico, Jovem Aprendiz
 * - Print / PDF export generation
 */

import { ResumeData, ResumeAnalysisResult } from '../types';

const RESUME_STORAGE_KEY_PREFIX = 'gameinfor_resume_v1_';

class ResumeService {
  public getDefaultResume(studentId: string, studentName: string, email: string): ResumeData {
    return {
      id: `resume-${studentId}`,
      studentId,
      studentName: studentName || 'Estudante Instituto Ambiente',
      email: email || '',
      phone: '(11) 98765-4321',
      city: 'São Paulo',
      neighborhood: 'Zona Sul',
      professionalObjective:
        'Busco oportunidade como Jovem Aprendiz na área administrativa ou de tecnologia da informação, aplicando meus conhecimentos práticos em informática, organização e atendimento para contribuir com a equipe e desenvolver minha carreira.',
      schooling: 'Ensino Médio (Cursando o 2º ano no período noturno)',
      courses: [
        {
          id: 'c-1',
          name: 'Informática Básica e Aplicada à Gestão',
          institution: 'Instituto Ambiente — Projeto Crescer e Transformar',
          hours: 60,
          year: '2026',
          completionStatus: 'concluido',
        },
        {
          id: 'c-2',
          name: 'Rotinas Administrativas e Atendimento ao Cliente',
          institution: 'Instituto Ambiente',
          hours: 30,
          year: '2026',
          completionStatus: 'concluido',
        },
      ],
      technicalSkills: [
        'Comunicação assertiva e pontualidade',
        'Organização de arquivos e documentos digitais',
        'Trabalho em equipe e aprendizagem rápida',
        'Atendimento ao público e etiqueta corporativa',
      ],
      itKnowledge: [
        'Microsoft Excel: fórmulas (SOMA, MÉDIA, SE), tabelas dinâmicas e formatação',
        'Microsoft Word: redação corporativa, relatórios e ofícios',
        'Google Workspace (Docs, Sheets, Drive, Gmail)',
        'Digitação ágil e atalhos de produtividade no Windows',
        'Segurança da informação e navegação consciente',
      ],
      experiences: [
        {
          id: 'exp-1',
          role: 'Monitor Voluntário de Laboratório de Informática',
          company: 'Instituto Ambiente',
          period: 'Fevereiro de 2026 – Presente',
          description:
            'Apoio aos colegas de turma na resolução de dúvidas práticas de informática básica, auxílio na organização dos computadores e conferência de equipamentos.',
        },
      ],
      projectsAndActivities: [
        {
          id: 'proj-1',
          title: 'Planilha Gamificada de Controle Orçamentário Pessoal',
          description:
            'Desenvolvimento prático de planilha em Excel com fórmulas automáticas, gráficos de despesas e painel visual para controle financeiro familiar.',
          role: 'Autor e Apresentador',
        },
      ],
      languages: [
        {
          language: 'Português',
          level: 'Fluente',
        },
        {
          language: 'Inglês',
          level: 'Básico',
        },
      ],
      chosenTemplate: 'jovem_aprendiz',
      updatedAt: new Date().toISOString(),
    };
  }

  public getResume(studentId: string, studentName?: string, email?: string): ResumeData {
    if (typeof window === 'undefined') {
      return this.getDefaultResume(studentId, studentName || '', email || '');
    }
    try {
      const stored = localStorage.getItem(`${RESUME_STORAGE_KEY_PREFIX}${studentId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Erro ao carregar currículo:', e);
    }
    const defaultData = this.getDefaultResume(studentId, studentName || '', email || '');
    this.saveResume(defaultData);
    return defaultData;
  }

  public saveResume(data: ResumeData): void {
    if (typeof window === 'undefined') return;
    try {
      const updated = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(`${RESUME_STORAGE_KEY_PREFIX}${data.studentId}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar currículo:', e);
    }
  }

  /**
   * AI-powered text enhancement via backend /api/resume/ai-enhance
   */
  public async enhanceSectionWithAI(
    field: 'objective' | 'skills' | 'experience_desc',
    currentText: string,
    studentContext?: { schooling?: string; itSkills?: string[] }
  ): Promise<{ enhancedText: string; suggestions: string[] }> {
    try {
      const res = await fetch('/api/resume/ai-enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, currentText, studentContext }),
      });
      if (res.ok) {
        const json = await res.json();
        return {
          enhancedText: json.enhancedText || currentText,
          suggestions: json.suggestions || [],
        };
      }
    } catch (err) {
      console.warn('Fallback local de aprimoramento de currículo:', err);
    }

    // Local educational heuristic fallback if offline
    if (field === 'objective') {
      return {
        enhancedText:
          'Busco oportunidade como Jovem Aprendiz ou estagiário, aplicando meus conhecimentos em informática, organização e rotinas administrativas para contribuir com as metas da empresa enquanto desenvolvo minhas competências profissionais.',
        suggestions: [
          'Evite termos genéricos como "dar o meu melhor". Foque no valor que você agrega.',
          'Mencione a área de interesse: administrativa, atendimento ou suporte em informática.',
        ],
      };
    }
    return {
      enhancedText: currentText.trim(),
      suggestions: ['Revise a concordância e utilize verbos de ação no início das frases.'],
    };
  }

  /**
   * AI-powered diagnostic evaluation via backend /api/resume/ai-evaluate
   */
  public async evaluateResume(resume: ResumeData): Promise<ResumeAnalysisResult> {
    try {
      const res = await fetch('/api/resume/ai-evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Fallback local de avaliação de currículo:', err);
    }

    // Comprehensive heuristic diagnostic evaluation
    const strengths: string[] = [];
    const missingInfo: string[] = [];
    const suggestions: string[] = [];
    const interviewTips: string[] = [];
    let score = 70;

    if (resume.courses.length >= 2) {
      strengths.push('Excelente destaque para a formação profissionalizante no Instituto Ambiente.');
      score += 10;
    } else {
      missingInfo.push('Adicione mais detalhes sobre os cursos realizados no Instituto Ambiente.');
    }

    if (resume.itKnowledge.length >= 3) {
      strengths.push('Habilidades de informática bem detalhadas (Excel, Word e sistemas digitais).');
      score += 10;
    } else {
      missingInfo.push('Especifique seu domínio em informática prática (ex: fórmulas no Excel, digitação).');
    }

    if (resume.phone && resume.email) {
      strengths.push('Contatos diretos claros e de fácil localização.');
    } else {
      missingInfo.push('Número de telefone ou e-mail de contato principal ausente.');
      score -= 15;
    }

    if (resume.professionalObjective.length > 50) {
      strengths.push('Objetivo profissional objetivo, alinhado ao perfil de Jovem Aprendiz.');
    } else {
      suggestions.push('Amplie o objetivo profissional para demonstrar como seus conhecimentos beneficiam a organização.');
    }

    suggestions.push('Mantenha o currículo sempre em uma página para processos seletivos de primeiro emprego.');
    suggestions.push('Revise a pontuação e certifique-se de que os números de telefone possuem DDD.');

    interviewTips.push('Nas entrevistas, conte como você desenvolveu os projetos práticos no GAMEINFOR.');
    interviewTips.push('Destaque sua pontualidade, disposição para aprender e afinidade com tecnologia.');
    interviewTips.push('Treine uma breve apresentação pessoal de 1 minuto sobre sua trajetória.');

    return {
      overallScore: Math.min(100, Math.max(50, score)),
      strengths,
      missingInfo,
      suggestions,
      interviewTips,
    };
  }

  /**
   * Trigger native browser print dialog with print-optimized CSS layout
   */
  public printResume(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}

export const resumeService = new ResumeService();
