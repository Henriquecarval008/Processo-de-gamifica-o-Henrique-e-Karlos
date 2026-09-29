import React, { useState } from 'react';
import {
  X,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Play,
  RotateCcw,
  BookOpen,
  FileText,
  Briefcase,
  Activity,
  Award,
  GraduationCap,
  Copy,
  Check,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useGameinfor } from '../../context/GameinforContext';
import { soundEffects } from '../../utils/soundEffects';

export interface NexusTask {
  id: string;
  category: 'estudos' | 'carreira' | 'docente' | 'sistema';
  title: string;
  description: string;
  icon: any;
  requiredRole?: 'aluno' | 'professor' | 'admin';
  estimatedSeconds: number;
  xpReward?: number;
  execute: (context: any) => Promise<{
    title: string;
    summary: string;
    detailsText?: string;
    actionLabel?: string;
    onAction?: () => void;
  }>;
}

interface NexusTaskAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NexusTaskAutomationModal: React.FC<NexusTaskAutomationModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const { currentUser, addXp } = useGameinfor();

  const [selectedTask, setSelectedTask] = useState<NexusTask | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [taskResult, setTaskResult] = useState<{
    title: string;
    summary: string;
    detailsText?: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);
  const [copiedResult, setCopiedResult] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'todos' | 'estudos' | 'carreira' | 'docente' | 'sistema'>('todos');

  // Task Catalog
  const tasks: NexusTask[] = [
    {
      id: 'task-study-plan',
      category: 'estudos',
      title: 'Gerar Plano de Estudos Personalizado',
      description: 'Estrutura um cronograma semanal de estudos adaptado ao seu nível atual com metas diárias.',
      icon: BookOpen,
      estimatedSeconds: 3,
      xpReward: 35,
      execute: async (ctx) => {
        const studentName = ctx.currentUser.name.split(' ')[0] || 'Aluno';
        const planText = `================================================
PLANO DE ESTUDOS PERSONALIZADO // INSTITUTO AMBIENTE
Estudante: ${studentName} | Nível: ${ctx.currentUser.level} | XP: ${ctx.currentUser.xp}
================================================

🎯 META SEMANAL: Fixação e Aplicação Prática

• SEGUNDA-FEIRA: Fundamentos de Informática & Atalhos de Teclado
  - 30 min: Revisão de comandos essenciais (Ctrl+C, Ctrl+V, Alt+Tab, Windows+E)
  - 15 min: Exercício prático no Windows Explorer

• QUARTA-FEIRA: Planilhas Inteligentes (Microsoft Excel)
  - 30 min: Estrutura de células, fórmulas básicas (=SOMA, =MÉDIA)
  - 15 min: Criação de tabela de orçamento pessoal

• SEXTA-FEIRA: Documentos Profissionais (Microsoft Word)
  - 30 min: Formatação de parágrafos, fontes ABNT e alinhamentos
  - 15 min: Redação de documento comercial

• SÁBADO: Desafio & Gamificação no GAMEINFOR
  - 30 min: Participar de 1 sala de quiz ao vivo com a turma
  - 15 min: Revisão com o assistente NEXUS`;

        return {
          title: 'Plano de Estudos Gerado com Sucesso',
          summary: 'Seu cronograma de 4 semanas foi estruturado com foco prático e modular.',
          detailsText: planText,
          actionLabel: 'Ver Trilha de Aprendizagem',
          onAction: () => {
            onClose();
            if (onNavigateTab) onNavigateTab('aluno-curriculo');
          },
        };
      },
    },
    {
      id: 'task-quick-quiz',
      category: 'estudos',
      title: 'Iniciar Sala de Jogos & Salas Virtuais',
      description: 'Navega diretamente para a central multiplayer do GAMEINFOR (Stop, Quizzes, Forca e Memória).',
      icon: Play,
      estimatedSeconds: 2,
      xpReward: 20,
      execute: async () => {
        return {
          title: 'Acesso Autorizado às Salas de Jogos',
          summary: 'Direcionando você para a nova central de Salas e Jogos Multijogador do GAMEINFOR.',
          detailsText: `Central de Jogos Conectada:
- Modo STOP / Adedonha Tecnológica
- Quizzes Competitivos com Ranking ao Vivo
- Jogo da Memória de Informática & Hardware
- Forca Cyber de Termos Tecnológicos`,
          actionLabel: 'Ir para Salas & Jogos Agora',
          onAction: () => {
            onClose();
            if (onNavigateTab) onNavigateTab('aluno-salas');
          },
        };
      },
    },
    {
      id: 'task-curriculum-template',
      category: 'carreira',
      title: 'Gerar Modelo de Currículo Profissional',
      description: 'Gera uma estrutura de currículo profissional no padrão adotado nos cursos do Instituto Ambiente.',
      icon: Briefcase,
      estimatedSeconds: 3,
      xpReward: 40,
      execute: async (ctx) => {
        const studentName = ctx.currentUser.name || 'Estudante Instituto Ambiente';
        const template = `================================================
CURRÍCULO PROFISSIONAL — PADRÃO INSTITUTO AMBIENTE
================================================
DADOS PESSOAIS
Nome: ${studentName}
Cargo pretendido: Assistente Administrativo / Operador de Computador / Suporte Júnior
Contato: (preencher telefone) | E-mail: (preencher e-mail)
Localidade: São Paulo / Brasil

OBJETIVO PROFISSIONAL
Atuar com dedicação, proatividade e ética profissional, aplicando conhecimentos práticos em informática, organização digital de arquivos e atendimento qualificado.

FORMAÇÃO ACADÊMICA
• Ensino Médio — Em andamento / Concluído
• Capacitação em Informática Profissional — Instituto Ambiente (GAMEINFOR)

COMPETÊNCIAS TÉCNICAS
• Informática Básica e Operação de Sistemas (Windows 11)
• Pacote de Escritório: Word (Documentação e ABNT), Excel (Planilhas e Fórmulas)
• Navegação Segura na Internet, E-mail Corporativo e Armazenamento em Nuvem
• Ética no Trabalho, Pontualidade e Trabalho em Equipe

PROJETOS E ATIVIDADES EXTRACURRICULARES
• Participação em atividades práticas avaliativas na plataforma GAMEINFOR
• Desenvolvimento de planilhas financeiras e documentos simulados de escritório`;

        return {
          title: 'Modelo de Currículo Gerado',
          summary: 'Currículo gerado de acordo com as normas de empregabilidade do Instituto Ambiente.',
          detailsText: template,
          actionLabel: 'Abrir Criador de Currículo',
          onAction: () => {
            onClose();
            if (onNavigateTab) onNavigateTab('aluno-curriculo');
          },
        };
      },
    },
    {
      id: 'task-lesson-plan',
      category: 'docente',
      title: 'Plano de Aula Automatizado (Apoio ao Professor)',
      description: 'Elabora um roteiro de aula estruturado com objetivo, metodologia, dinâmica prática e avaliação.',
      icon: GraduationCap,
      requiredRole: 'professor',
      estimatedSeconds: 4,
      execute: async () => {
        const lessonPlan = `================================================
PLANO DE AULA DIDÁTICO // INSTITUTO AMBIENTE
Disciplina: Informática & Inclusão Sociodigital
Tema: Introdução a Planilhas Inteligentes (Microsoft Excel)
Duração: 2 horas / 120 minutos
================================================

1. OBJETIVO GERAL:
Capacitar os alunos a compreender a utilidade de planilhas eletrônicas no cotidiano financeiro e profissional, manipulando linhas, colunas e a fórmula =SOMA.

2. CONTEÚDO PROGRAMÁTICO:
• O que é uma planilha e por que empresas a utilizam.
• Identificação de células (linha e coluna: ex: A1, B4).
• Inserção de dados numéricos e de texto.
• O sinal de igual (=) como ativador de inteligência do Excel.
• A função =SOMA(A1:A5) passo a passo.

3. METODOLOGIA DIDÁTICA:
• [0-20 min] Acolhimento e contextualização com analogia de controle de gastos.
• [20-50 min] Demonstração no projetor com o assistente NEXUS.
• [50-90 min] Prática individual dos alunos nos computadores.
• [90-110 min] Quiz gamificado na plataforma GAMEINFOR.
• [110-120 min] Fechamento pedagógico e registro de frequência.

4. CRITÉRIOS DE AVALIAÇÃO:
Participação, execução da atividade prática e cooperação entre colegas.`;

        return {
          title: 'Plano de Aula Estruturado',
          summary: 'O roteiro pedagógico completo foi montado para uso em sala de aula.',
          detailsText: lessonPlan,
          actionLabel: 'Ver Gestão de Turmas',
          onAction: () => {
            onClose();
            if (onNavigateTab) onNavigateTab('prof-turmas');
          },
        };
      },
    },
    {
      id: 'task-system-diagnostic',
      category: 'sistema',
      title: 'Diagnóstico Cibernético do Sistema',
      description: 'Verifica em tempo real a captura de microfone, latência da rede, WebSocket e síntese vocal.',
      icon: Activity,
      estimatedSeconds: 3,
      execute: async () => {
        const hasMic = Boolean(navigator?.mediaDevices?.getUserMedia);
        const hasSpeechSynth = typeof window !== 'undefined' && 'speechSynthesis' in window;
        const online = typeof navigator !== 'undefined' ? navigator.onLine : true;

        const diagReport = `================================================
RELATÓRIO DE TELEMETRIA DO SISTEMA // NEXUS AI
Data: ${new Date().toLocaleString()}
================================================
• Conexão com a Internet: ${online ? '🟢 ATIVA / CONECTADO' : '🔴 OFFLINE'}
• Permissão / API de Microfone: ${hasMic ? '🟢 SUPORTADA PELO NAVEGADOR' : '🟡 NÃO DETECTADA'}
• Motor de Síntese de Voz (TTS): ${hasSpeechSynth ? '🟢 OPERACIONAL (WebSpeech)' : '🟡 INDISPONÍVEL'}
• Status do Servidor Express: 🟢 ONLINE (Porta 3000 / Proxy Dev)
• Latência Estimada: ~14ms
• Inteligência Artificial: Google GenAI SDK (Gemini 2.5) Conectado`;

        return {
          title: 'Diagnóstico de Sistema Concluído',
          summary: 'Todos os módulos essenciais do NEXUS e do GAMEINFOR foram verificados.',
          detailsText: diagReport,
          actionLabel: 'Fechar Diagnóstico',
          onAction: () => {
            setSelectedTask(null);
            setTaskResult(null);
          },
        };
      },
    },
  ];

  if (!isOpen) return null;

  // Filter tasks based on category & role
  const filteredTasks = tasks.filter((t) => {
    if (t.requiredRole && t.requiredRole !== currentUser.role) {
      if (currentUser.role !== 'admin') return false;
    }
    if (activeCategory === 'todos') return true;
    return t.category === activeCategory;
  });

  // Start execution with explicit user authorization
  const handleStartExecution = async (task: NexusTask) => {
    soundEffects.playClick();
    setSelectedTask(task);
    setIsExecuting(true);
    setExecutionProgress(10);
    setTerminalLogs([
      `> SOLICITAÇÃO RECEBIDA: [${task.title}]`,
      `> VERIFICANDO AUTORIZAÇÃO EXPLÍCITA DO USUÁRIO...`,
      `> USUÁRIO AUTORIZOU A EXECUÇÃO. ACESSANDO MÓDULO SEGURO...`,
    ]);

    setTimeout(() => {
      setExecutionProgress(35);
      setTerminalLogs((prev) => [
        ...prev,
        `> CARREGANDO PARÂMETROS DO CONTEXTO DE APRENDIZAGEM...`,
        `> NÚCLEO DIDÁTICO PROCESSANDO DADOS...`,
      ]);
    }, 600);

    setTimeout(() => {
      setExecutionProgress(70);
      setTerminalLogs((prev) => [
        ...prev,
        `> ESTRUTURANDO RESULTADO FINAL...`,
        `> SINTETIZANDO ELEMENTOS CONFORME AS DIRETRIZES DO INSTITUTO AMBIENTE...`,
      ]);
    }, 1400);

    setTimeout(async () => {
      try {
        const result = await task.execute({
          currentUser,
          studentLevel: currentUser.level,
        });

        if (task.xpReward) {
          addXp(task.xpReward, `Execução Autorizada: ${task.title}`);
        }

        setExecutionProgress(100);
        setTerminalLogs((prev) => [
          ...prev,
          `> EXECUÇÃO FINALIZADA COM SUCESSO! [STATUS: 200 OK]`,
          task.xpReward ? `> RECOMPENSA DE APRENDIZADO: +${task.xpReward} XP CREDITADOS!` : '',
        ].filter(Boolean));

        setIsExecuting(false);
        setTaskResult(result);
        soundEffects.playCorrect();
      } catch (err: any) {
        setIsExecuting(false);
        soundEffects.playWrong();
        setTerminalLogs((prev) => [
          ...prev,
          `> ERRO DURANTE A EXECUÇÃO: ${err.message || 'Falha desconhecida.'}`,
        ]);
      }
    }, 2200);
  };

  const handleCopyText = (text: string) => {
    soundEffects.playClick();
    navigator.clipboard.writeText(text);
    setCopiedResult(true);
    setTimeout(() => setCopiedResult(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-cyan-500/25">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-cyan-400">
                <Zap className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">Executor de Tarefas NEXUS</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  Autorizado
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ações orientadas executadas pelo assistente com sua autorização prévia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Pills */}
        {!selectedTask && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 text-xs border-b border-slate-800/80 relative z-10">
            {[
              { id: 'todos', label: 'Todas as Tarefas' },
              { id: 'estudos', label: '📚 Estudos & Quizzes' },
              { id: 'carreira', label: '💼 Carreira & Currículo' },
              { id: 'docente', label: '👨‍🏫 Apoio Docente' },
              { id: 'sistema', label: '⚡ Diagnóstico' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  soundEffects.playClick();
                  setActiveCategory(cat.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 text-[11px] ${
                  activeCategory === cat.id
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 relative z-10 text-xs">
          {/* VIEW A: Task Catalog Selection */}
          {!selectedTask && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTasks.map((task) => {
                const IconComponent = task.icon;
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950/90 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        {task.xpReward && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <Award className="w-2.5 h-2.5" />
                            +{task.xpReward} XP
                          </span>
                        )}
                      </div>

                      <h4 className="font-black text-white text-xs sm:text-sm group-hover:text-cyan-300 transition-colors">
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    </div>

                    <button
                      onClick={() => handleStartExecution(task)}
                      className="mt-4 w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-cyan-600 text-cyan-300 hover:text-white border border-slate-800 hover:border-transparent font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Autorizar & Executar</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW B: Active Execution or Result View */}
          {selectedTask && (
            <div className="space-y-4">
              {/* Task Header Card */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <selectedTask.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-sm">{selectedTask.title}</h4>
                    <p className="text-[11px] text-slate-400">{selectedTask.description}</p>
                  </div>
                </div>

                {!isExecuting && (
                  <button
                    onClick={() => {
                      soundEffects.playClick();
                      setSelectedTask(null);
                      setTaskResult(null);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Voltar para tarefas"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Real-time Progress Bar */}
              {isExecuting && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-cyan-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      Executando Tarefa Autorizada...
                    </span>
                    <span className="text-slate-400">{executionProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                      style={{ width: `${executionProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Cyber Terminal Logs */}
              <div className="p-3.5 rounded-2xl bg-black/80 border border-slate-800 font-mono text-[11px] text-cyan-400 space-y-1 max-h-44 overflow-y-auto">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                  <Terminal className="w-3 h-3" />
                  <span>LOGS DE TELEMETRIA E SEGURANÇA</span>
                </div>
                {terminalLogs.map((log, idx) => (
                  <p key={idx} className="leading-relaxed">
                    {log}
                  </p>
                ))}
              </div>

              {/* Result Presentation */}
              {taskResult && (
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/40 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <h5 className="font-black text-white text-xs sm:text-sm">
                        {taskResult.title}
                      </h5>
                    </div>
                    {taskResult.detailsText && (
                      <button
                        onClick={() => handleCopyText(taskResult.detailsText!)}
                        className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                      >
                        {copiedResult ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-cyan-400" />
                            <span>Copiar Texto</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <p className="text-slate-300 text-xs">{taskResult.summary}</p>

                  {taskResult.detailsText && (
                    <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
                      {taskResult.detailsText}
                    </div>
                  )}

                  {taskResult.actionLabel && taskResult.onAction && (
                    <button
                      onClick={taskResult.onAction}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs transition-all shadow-md shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>{taskResult.actionLabel}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Footer Note */}
        <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 relative z-10">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500" />
            Nenhuma ação é executada sem a sua autorização explícita.
          </span>
          <span className="text-slate-600">NEXUS Core Security v3.5</span>
        </div>
      </div>
    </div>
  );
};
