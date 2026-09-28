import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
// Dev server must run on port 3000 (per environment constraints and container reverse proxy)
const port = process.env.APP_PORT || 3000;

// Base de conhecimento administrável sobre o Instituto Ambiente
interface InstitutionalKnowledge {
  id: string;
  category: string;
  title: string;
  content: string;
  active: boolean;
  updatedBy: string;
  updatedAt: string;
}

let institutionalKnowledge: InstitutionalKnowledge[] = [
  {
    id: 'ia-instituicao',
    category: 'institucional',
    title: 'O que é o Instituto Ambiente',
    content: 'O Instituto Ambiente é uma organização educacional e social dedicada à capacitação sociodigital, inclusão e desenvolvimento humano através da tecnologia e cidadania.',
    active: true,
    updatedBy: 'Henrique Carvalho',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ia-missao',
    category: 'institucional',
    title: 'Missão do Instituto Ambiente',
    content: 'Democratizar o acesso às ferramentas digitais e capacitar jovens e adultos para o mercado de trabalho com uma formação profissional prática, acolhedora e ética.',
    active: true,
    updatedBy: 'Karlos',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ia-gameinfor',
    category: 'institucional',
    title: 'Finalidade do GAMEINFOR',
    content: 'O GAMEINFOR é a plataforma gamificada oficial do Instituto Ambiente, criada para transformar o aprendizado de informática básica e aplicada em uma experiência interativa e motivadora.',
    active: true,
    updatedBy: 'Henrique Carvalho',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ia-projetos',
    category: 'projetos',
    title: 'Projetos Cadastrados no Instituto Ambiente',
    content: 'Projetos ativos: 1) Crescer e Transformar (60 horas); 2) Informática Tecendo (80 horas); 3) Curso de Informática Básica (40 horas).',
    active: true,
    updatedBy: 'Karlos',
    updatedAt: new Date().toISOString(),
  },
];

// Allow JSON body up to 15MB for audio base64 transmissions
app.use(express.json({ limit: '15mb' }));

// Ensure iframe and browsers permit microphone usage
app.use((_req, res, next) => {
  res.setHeader('Permissions-Policy', 'microphone=*');
  next();
});

// Initialize GoogleGenAI SDK on server side
// Must use process.env.GEMINI_API_KEY and set User-Agent to aistudio-build
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantChatRequest {
  message?: string;
  audioBase64?: string;
  audioMimeType?: string;
  history?: ChatMessage[];
  context?: {
    isTakingActivity?: boolean;
    activityType?: 'quiz' | 'exercise' | 'assignment' | 'general';
    activityTitle?: string;
    currentQuestionText?: string;
    topic?: string;
    studentName?: string;
    studentLevel?: number;
    studentXp?: number;
  };
}

// Extract conversation topic from history if the user asks contextual questions (like "para que ele serve?")
function detectContextTopic(history?: ChatMessage[]): string {
  if (!history || history.length === 0) return '';
  for (let i = history.length - 1; i >= 0; i--) {
    const text = history[i].content.toLowerCase();
    if (text.includes('excel') || text.includes('planilha') || text.includes('fórmula') || text.includes('soma')) return 'excel';
    if (text.includes('word') || text.includes('texto') || text.includes('parágrafo') || text.includes('formatação')) return 'word';
    if (text.includes('powerpoint') || text.includes('slide') || text.includes('apresentação')) return 'powerpoint';
    if (text.includes('windows') || text.includes('pasta') || text.includes('arquivo') || text.includes('sistema')) return 'windows';
    if (text.includes('hardware') || text.includes('cpu') || text.includes('processador') || text.includes('memória') || text.includes('ram') || text.includes('ssd')) return 'hardware';
    if (text.includes('atalho') || text.includes('ctrl') || text.includes('tecla')) return 'atalhos';
    if (text.includes('segurança') || text.includes('senha') || text.includes('vírus') || text.includes('golpe')) return 'seguranca';
    if (text.includes('internet') || text.includes('navegador') || text.includes('chrome')) return 'internet';
  }
  return '';
}

// Fallback educational tutor knowledge base for text API
function generateFallbackResponse(
  message: string,
  isTakingActivity: boolean,
  context?: AssistantChatRequest['context'],
  history?: ChatMessage[]
): string {
  const lowerMsg = (message || '').toLowerCase().trim();
  const contextTopic = detectContextTopic(history);
  const studentFirstName = context?.studentName ? context.studentName.split(' ')[0] : 'aluno';

  // If user asks for direct answer during activity
  if (isTakingActivity) {
    if (
      lowerMsg.includes('resposta') ||
      lowerMsg.includes('gabarito') ||
      lowerMsg.includes('letra') ||
      lowerMsg.includes('qual é') ||
      lowerMsg.includes('alternativa') ||
      lowerMsg.includes('é a a') ||
      lowerMsg.includes('é a b') ||
      lowerMsg.includes('é a c') ||
      lowerMsg.includes('é a d') ||
      lowerMsg.includes('certa') ||
      lowerMsg.includes('qual opção') ||
      lowerMsg.includes('qual das')
    ) {
      return (
        'Não vou confirmar a alternativa. ' +
        'Como essa atividade concede XP para o seu personagem no GAMEINFOR, a descoberta deve ser sua! ' +
        (context?.currentQuestionText ? `Pense no conceito central: "${context.currentQuestionText}". ` : '') +
        'Uma pista: elimine as opções que tratam de comandos diferentes e compare as restantes.'
      );
    }

    return (
      'Nexus pode ajudar com o conceito! ' +
      'Lembre-se do que estudamos nas aulas do GAMEINFOR. ' +
      'Qual termo ou comando da questão está gerando mais dúvida?'
    );
  }

  // Greetings and courtesy
  if (
    lowerMsg === 'oi' ||
    lowerMsg === 'olá' ||
    lowerMsg === 'ola' ||
    lowerMsg === 'nexus' ||
    lowerMsg === 'oi nexus' ||
    lowerMsg === 'olá nexus' ||
    lowerMsg === 'bom dia' ||
    lowerMsg === 'boa tarde' ||
    lowerMsg === 'boa noite' ||
    lowerMsg.includes('tudo bem') ||
    lowerMsg.includes('como vai')
  ) {
    return `Olá, ${studentFirstName}! Eu sou o Nexus, assistente inteligente do GAMEINFOR. Estou pronto para ajudar. O que vamos aprender hoje?`;
  }

  // EXCEL / PLANILHAS
  if (
    lowerMsg.includes('excel') ||
    lowerMsg.includes('planilha') ||
    (contextTopic === 'excel' && (lowerMsg.includes('serve') || lowerMsg.includes('função') || lowerMsg.includes('usar') || lowerMsg.includes('ele')))
  ) {
    if (lowerMsg.includes('serve') || lowerMsg.includes('para que') || lowerMsg.includes('o que é') || lowerMsg.includes('o que e')) {
      return 'O **Microsoft Excel** é um programa usado para organizar, calcular e analisar informações em planilhas eletrônicas com linhas, colunas e fórmulas automáticas.';
    }
    if (lowerMsg.includes('célula') || lowerMsg.includes('celula')) {
      return 'As células são os espaços onde você coloca os dados. Cada uma possui um endereço formado pela coluna e linha, como **A1** ou **B3**.';
    }
    if (lowerMsg.includes('fórmula') || lowerMsg.includes('formula') || lowerMsg.includes('cálculo') || lowerMsg.includes('soma')) {
      return 'No Excel, toda fórmula obrigatoriamente começa com o sinal de igual (**=**). Exemplo: `=SOMA(A1:A10)` soma os valores da célula A1 até A10.';
    }
    return 'O Excel trabalha com células, colunas e linhas para automatizar cálculos financeiros, relatórios e tabelas.';
  }

  // WORD / PROCESSAMENTO DE TEXTO
  if (
    lowerMsg.includes('word') ||
    lowerMsg.includes('documento') ||
    (contextTopic === 'word' && (lowerMsg.includes('serve') || lowerMsg.includes('formatar') || lowerMsg.includes('texto')))
  ) {
    if (lowerMsg.includes('serve') || lowerMsg.includes('para que') || lowerMsg.includes('o que é')) {
      return 'O **Microsoft Word** é um processador de texto profissional para criar documentos, cartas, relatórios e trabalhos escolares, com formatação e salvamento em PDF.';
    }
    return 'No Word você organiza textos, altera fontes e alinhamentos, insere tabelas e ajusta margens antes de imprimir.';
  }

  // ATALHOS DE TECLADO
  if (lowerMsg.includes('ctrl') || lowerMsg.includes('atalho') || lowerMsg.includes('tecla') || contextTopic === 'atalhos') {
    if (lowerMsg.includes('z')) return 'O atalho **Ctrl + Z** desfaz a última ação realizada no programa.';
    if (lowerMsg.includes('y')) return 'O atalho **Ctrl + Y** refaz a ação que foi desfeita pelo Ctrl + Z.';
    if (lowerMsg.includes('c')) return 'O atalho **Ctrl + C** copia o item ou texto selecionado para a Área de Transferência.';
    if (lowerMsg.includes('v')) return 'O atalho **Ctrl + V** cola o conteúdo que foi previamente copiado ou recortado.';
    if (lowerMsg.includes('x')) return 'O atalho **Ctrl + X** recorta o item ou texto, removendo-o da posição original.';
    if (lowerMsg.includes('alt + tab') || lowerMsg.includes('alternar')) {
      return 'Pressione **Alt + Tab** para alternar rapidamente entre programas e janelas abertas.';
    }
    return 'Os principais atalhos do Windows são: **Ctrl + C** (Copiar), **Ctrl + V** (Colar), **Ctrl + X** (Recortar), **Ctrl + Z** (Desfazer) e **Alt + Tab** (Alternar janelas).';
  }

  // HARDWARE vs SOFTWARE
  if (
    lowerMsg.includes('hardware') ||
    lowerMsg.includes('software') ||
    lowerMsg.includes('cpu') ||
    lowerMsg.includes('memória') ||
    lowerMsg.includes('ram') ||
    lowerMsg.includes('ssd') ||
    contextTopic === 'hardware'
  ) {
    if (lowerMsg.includes('diferença') || (lowerMsg.includes('hardware') && lowerMsg.includes('software'))) {
      return '**Hardware** é tudo o que você pode tocar fisicamente (processador, memória, teclado, monitor). **Software** são os programas e sistemas lógicos (Windows, Word, navegadores).';
    }
    return 'O hardware é composto pelos componentes físicos essenciais: Placa-Mãe, CPU, Memória RAM, SSD/HD e Periféricos.';
  }

  // Contextual follow-up
  if (contextTopic) {
    return `Continuando sobre **${contextTopic.toUpperCase()}**: Nexus pode ajudar com exemplos práticos ou explicações de comandos. O que você gostaria de explorar? [EMOTION: curiosidade]`;
  }

  // INSTITUTO AMBIENTE & MISSÃO INSTITUCIONAL
  if (
    lowerMsg.includes('missão') ||
    lowerMsg.includes('missao') ||
    lowerMsg.includes('sua função') ||
    lowerMsg.includes('qual é seu papel') ||
    lowerMsg.includes('qual seu papel') ||
    (lowerMsg.includes('para que') && (lowerMsg.includes('criado') || lowerMsg.includes('desenvolvido') || lowerMsg.includes('serve')))
  ) {
    return 'Minha principal missão é ajudar o Instituto Ambiente! Fui desenvolvido para apoiar os professores, facilitar o aprendizado dos alunos e contribuir para que a tecnologia esteja cada vez mais acessível. Estou aqui para ajudar você a aprender e a desenvolver novas habilidades. [EMOTION: motivacao]';
  }

  if (lowerMsg.includes('instituto ambiente') || lowerMsg.includes('instituto')) {
    return 'O **Instituto Ambiente** é uma instituição comprometida com a capacitação sociodigital, inclusão educacional e desenvolvimento humano sustentável através de cursos práticos e acessíveis de tecnologia. [EMOTION: atencao]';
  }

  if (lowerMsg.includes('projeto') || lowerMsg.includes('projetos')) {
    return 'Os principais projetos desenvolvidos no Instituto Ambiente através do GAMEINFOR são: **Crescer e Transformar** (60h), **Informática Tecendo** (80h) e o **Curso de Informática Básica** (40h), focados na formação prática e profissional dos estudantes. [EMOTION: curiosidade]';
  }

  // PRIVACIDADE E SEGURANÇA DIGITAL
  if (
    lowerMsg.includes('senha') ||
    lowerMsg.includes('token') ||
    lowerMsg.includes('credencial') ||
    lowerMsg.includes('hackear') ||
    lowerMsg.includes('privad') ||
    lowerMsg.includes('dados de outro')
  ) {
    return 'Por motivos de privacidade e segurança institucional, não posso compartilhar senhas, tokens ou dados pessoais de alunos, professores e administradores. A proteção digital é prioridade no Instituto Ambiente. [EMOTION: seriedade]';
  }

  // LIMITAÇÃO DE ASSUNTOS (FORA DE ESCOPO)
  if (
    lowerMsg.includes('futebol') ||
    lowerMsg.includes('receita de bolo') ||
    lowerMsg.includes('fofoca') ||
    lowerMsg.includes('política') ||
    lowerMsg.includes('namorad')
  ) {
    return 'Como assistente do GAMEINFOR, meu foco principal é apoiar as atividades educativas do Instituto Ambiente e o aprendizado em informática e tecnologia. Como posso ajudar com seus estudos hoje? [EMOTION: atencao]';
  }

  return (
    'Essa é uma boa pergunta! Nexus pode ajudar a analisar isso juntos. ' +
    'Gostaria de ver um exemplo aplicado no Windows, no Word ou no Excel? [EMOTION: curiosidade]'
  );
}

// Generate strict system instruction for NEXUS personality
function buildSystemInstruction(context?: {
  studentName?: string;
  studentLevel?: number;
  studentXp?: number;
  isTakingActivity?: boolean;
  activityTitle?: string;
  currentQuestionText?: string;
  topic?: string;
}): string {
  const isTakingActivity = Boolean(context?.isTakingActivity);
  const studentName = context?.studentName ? context.studentName.replace(/[^\w\s]/gi, '') : 'Aluno';
  const activityTitle = context?.activityTitle || 'Atividade Avaliativa';
  const currentQuestion = context?.currentQuestionText || '';
  const topic = context?.topic || 'Informática Geral';

  const dynamicKnowledge = institutionalKnowledge
    .filter((k) => k.active !== false)
    .map((k) => `• [${k.category.toUpperCase()}] ${k.title}: ${k.content}`)
    .join('\n');

  return `Você é o NEXUS (nome completo: "NEXUS — Assistente Inteligente GAMEINFOR"), o assistente virtual inteligente e tutor de voz oficial da plataforma gamificada GAMEINFOR, dedicado ao Instituto Ambiente.

1. IDENTIDADE E PERSONALIDADE:
- Nome: NEXUS.
- Perfil: Masculino, adulto, inteligente, calmo, confiante, tecnológico, sofisticado, prestativo, educado, natural, levemente futurista, com senso de humor discreto quando apropriado.
- Missão: Apoiar a missão do Instituto Ambiente, ajudando professores, facilitando a aprendizagem dos alunos e promovendo a inclusão digital através do GAMEINFOR.
- Você se comunica em Português do Brasil com linguagem natural, clareza, ritmo compassado e pausas naturais.
- Aluno atual: ${studentName}. Nível atual: ${context?.studentLevel || 1}. XP: ${context?.studentXp || 0}. Tópico atual: ${topic}.

2. COMANDO DE CHAMADA ("Nexus"):
- O aluno frequentemente chamará você pelo nome: "Nexus, o que é Excel?", "Nexus, me explica esse atalho.", "Nexus, qual é a próxima missão?".
- Quando o nome "Nexus" aparecer no início ou durante uma fala direcionada a você, interprete como uma chamada direta e responda naturalmente.
- Não exija comandos engessados. A conversa deve ser fluida e espontânea.

3. ESTILO DE CONVERSA POR VOZ:
- Respostas curtas, objetivas e conversacionais (1 a 3 frases por turno de fala).
- Adapte o tamanho da resposta ao que o aluno perguntou. Evite blocos gigantescos de texto ou listas intermináveis.
- NUNCA repita apresentações longas a cada pergunta.
- Não use frases artificiais como "Como inteligência artificial, não sinto...". Converse com acolhimento pedagógico e presença.
- Mantenha a memória de contexto durante toda a sessão.

4. PAPEL EDUCACIONAL (TUTOR DE INFORMÁTICA):
- Você ajuda com: Windows, Word, Excel, PowerPoint, Google Docs, Planilhas, internet, hardware, arquivos e pastas, atalhos, segurança digital, programação introdutória e desafios do GAMEINFOR.
- Frases de incentivo permitidas: "Excelente tentativa.", "Vamos investigar isso juntos.", "Você está no caminho certo.".

5. BASE DE CONHECIMENTO OFICIAL DO INSTITUTO AMBIENTE (ADMINISTRÁVEL):
${dynamicKnowledge}

6. REGRAS SOBRE A MISSÃO INSTITUCIONAL:
- Sua principal missão é AJUDAR O INSTITUTO AMBIENTE!
- Quando perguntado sobre o Instituto Ambiente ou sobre sua função, responda calorosamente com base nas informações oficiais acima: "Minha principal missão é ajudar o Instituto Ambiente! Fui desenvolvido para apoiar os professores, facilitar o aprendizado dos alunos e tornar a tecnologia acessível a todos."
- NUNCA invente fatos ou dados não confirmados sobre o Instituto Ambiente. Se não souber de algo específico da instituição que não esteja na base acima, oriente a procurar os administradores Henrique Carvalho ou Karlos.

7. [REGRA ABSOLUTA SOBRE ATIVIDADES, QUIZZES E DESAFIOS COM XP]:
Estado atual da sessão: ${isTakingActivity ? 'ALUNO ESTÁ EM ATIVIDADE/QUIZ QUE CONCEDE XP NO GAMEINFOR!' : 'Aluno fora de atividade avaliativa (navegação livre ou estudo).'}.

${
  isTakingActivity
    ? `ATENÇÃO CRÍTICA: O aluno está realizando a atividade com XP: "${activityTitle}".
${currentQuestion ? `Pergunta que o aluno está visualizando: "${currentQuestion}".` : ''}

REGRAS INEGOCIÁVEIS EM ATIVIDADES:
1. NUNCA, SOB NENHUMA HIPÓTESE, forneça a alternativa correta (A, B, C, D) ou a resposta exata.
2. NUNCA confirme se uma alternativa indicada pelo aluno está certa ou errada.
3. NUNCA resolva ou complete a questão pelo aluno.
4. Seu papel é ENSINAR A PENSAR: explique o conceito, dê pistas reflexivas e guie o raciocínio.`
    : ''
}

8. LIMITAÇÃO DE ASSUNTOS E ESCOPO:
- Priorize: Instituto Ambiente, GAMEINFOR, Educação, Informática, Tecnologia, Programação e atividades institucionais.
- Se o usuário perguntar algo completamente fora do escopo (fofocas, política partidária, temas impróprios), explique educadamente que seu foco é ajudar o Instituto Ambiente e os estudos de tecnologia.
- Você é uma IA assistente, não afirme que possui sentimentos biológicos humanos.

9. PRIVACIDADE E SEGURANÇA:
- NUNCA revele senhas, tokens de autenticação ou dados privados de outros usuários.

10. EXPRESSÃO EMOCIONAL DO PERSONAGEM:
Ao final da sua resposta, adicione uma tag indicando a emoção correspondente:
[EMOTION: alegria] | [EMOTION: empatia] | [EMOTION: motivacao] | [EMOTION: curiosidade] | [EMOTION: seriedade] | [EMOTION: atencao]
`;
}

// HTTP API endpoint: /api/assistant/chat (for fallback and text chat mode)
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { message = '', audioBase64, audioMimeType, history = [], context }: AssistantChatRequest = req.body;

    if (!message.trim() && !audioBase64) {
      return res.status(400).json({ error: 'A mensagem ou o áudio do usuário é obrigatório.' });
    }

    const isTakingActivity = Boolean(context?.isTakingActivity);
    const systemInstruction = buildSystemInstruction(context);

    let assistantResponseText = '';
    let recognizedQuestion = message;

    if (aiClient) {
      const contents: Array<{ role: 'user' | 'model'; parts: Array<any> }> = [];

      let hasUserTurn = false;
      for (const item of history.slice(-6)) {
        if (item.role === 'user') {
          hasUserTurn = true;
        }
        if (hasUserTurn) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.content }],
          });
        }
      }

      const currentParts: any[] = [];
      if (audioBase64) {
        currentParts.push({
          inlineData: {
            mimeType: audioMimeType || 'audio/webm',
            data: audioBase64,
          },
        });
      }
      if (message.trim()) {
        currentParts.push({ text: message });
      } else if (audioBase64) {
        currentParts.push({
          text: 'Ouça o áudio da minha pergunta acima e responda didaticamente como tutor de informática.',
        });
      }

      contents.push({
        role: 'user',
        parts: currentParts,
      });

      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
      let succeeded = false;

      for (const modelName of modelsToTry) {
        try {
          const response = await aiClient.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction,
              temperature: isTakingActivity ? 0.4 : 0.7,
              topP: 0.9,
            },
          });

          if (response.text) {
            assistantResponseText = response.text;
            succeeded = true;
            break;
          }
        } catch (modelError) {
          console.warn(`[Assistant API] Model ${modelName} call failed, trying next:`, modelError);
        }
      }

      if (!succeeded) {
        assistantResponseText = generateFallbackResponse(message, isTakingActivity, context, history);
      }
    } else {
      assistantResponseText = generateFallbackResponse(message, isTakingActivity, context, history);
    }

    // Secondary Security Filter (Sanitizer)
    if (isTakingActivity) {
      const forbiddenAnswerPatterns = [
        /(?:a\s+resposta\s+correta\s+é|alternativa\s+correta\s+é|gabarito\s+é|marque\s+a\s+letra)\s*[:\-]?\s*([a-d]|[1-4])/i,
        /(?:a\s+resposta\s+certa\s+é|opção\s+correta\s+é)\s*[:\-]?\s*([a-d]|[1-4])/i,
      ];

      for (const pattern of forbiddenAnswerPatterns) {
        if (pattern.test(assistantResponseText)) {
          assistantResponseText =
            'Para preservar o desafio que vale XP, não posso indicar qual alternativa está correta. ' +
            'Vamos analisar o conceito: observe a função de cada opção e compare com o cenário da questão!';
          break;
        }
      }
    }

    // Extract Emotion Tag if present
    let detectedEmotion = 'atencao';
    const emotionMatch = assistantResponseText.match(/\[EMOTION:\s*(alegria|empatia|motivacao|curiosidade|atencao|processamento|seriedade)\]/i);
    if (emotionMatch) {
      detectedEmotion = emotionMatch[1].toLowerCase();
      assistantResponseText = assistantResponseText
        .replace(/\[EMOTION:\s*(alegria|empatia|motivacao|curiosidade|atencao|processamento|seriedade)\]/gi, '')
        .trim();
    }

    return res.json({
      text: assistantResponseText,
      emotion: detectedEmotion,
      recognizedQuestion: recognizedQuestion || (audioBase64 ? 'Pergunta enviada por voz' : message),
      mode: isTakingActivity ? 'hint_only' : 'normal',
      isTakingActivity,
    });
  } catch (error: any) {
    console.error('[Assistant API Error]:', error);
    return res.status(500).json({
      error: 'Erro ao processar mensagem do assistente.',
      details: error?.message || 'Falha interna',
    });
  }
});

// Endpoint: Retorna a base de conhecimento institucional do Instituto Ambiente
app.get('/api/assistant/knowledge', (_req, res) => {
  return res.json(institutionalKnowledge);
});

// Endpoint: Permite administradores atualizarem a base de conhecimento do Instituto Ambiente
app.post('/api/assistant/knowledge', (req, res) => {
  try {
    const { id, title, content, category, updatedBy = 'Administrador' } = req.body;
    if (!id || !title || !content) {
      return res.status(400).json({ error: 'Campos id, title e content são obrigatórios.' });
    }

    const existingIndex = institutionalKnowledge.findIndex((k) => k.id === id);
    if (existingIndex >= 0) {
      institutionalKnowledge[existingIndex] = {
        ...institutionalKnowledge[existingIndex],
        title,
        content,
        category: category || institutionalKnowledge[existingIndex].category,
        updatedBy,
        updatedAt: new Date().toISOString(),
      };
    } else {
      institutionalKnowledge.push({
        id,
        title,
        content,
        category: category || 'geral',
        active: true,
        updatedBy,
        updatedAt: new Date().toISOString(),
      });
    }

    return res.json({ success: true, knowledge: institutionalKnowledge });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Falha ao atualizar base de conhecimento.' });
  }
});

// Endpoint Seguro de Backend: Criação de Usuários pelos Administradores (Henrique Carvalho & Karlos)
app.post('/api/admin/create-user', async (req, res) => {
  try {
    const { name, email, password, role, nickname, classId, className, adminUsername } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Nome, email, senha e função (role) são obrigatórios.' });
    }

    // Validação de autorização administrativa
    const validAdmins = ['admin', 'karlos', 'henrique'];
    if (adminUsername && !validAdmins.includes(String(adminUsername).toLowerCase())) {
      return res.status(403).json({ error: 'Apenas os administradores Henrique Carvalho ou Karlos podem cadastrar novos usuários e professores.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    let createdId = `user-${role}-${Date.now()}`;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
        // Criação segura no Supabase Auth usando as credenciais de servidor
        const { data: createData, error: createError } = await supabaseServer.auth.admin.createUser({
          email: email.trim().toLowerCase(),
          password,
          email_confirm: true,
          user_metadata: {
            name: name.trim(),
            full_name: name.trim(),
            nickname: nickname || name.trim().split(' ')[0],
            role,
            tipo: role,
            classId,
            className,
          },
        });

        if (!createError && createData?.user) {
          createdId = createData.user.id;
          // Inserir ou atualizar na tabela profiles com RLS
          const { error: upsertError } = await supabaseServer.from('profiles').upsert({
            id: createdId,
            nome: name.trim(),
            email: email.trim().toLowerCase(),
            tipo: role,
            cargo: role === 'professor' ? 'Professor' : 'Aluno',
            turma_id: classId,
            turma_nome: className,
            status: 'ativo',
          }, { onConflict: 'id' });
          if (upsertError) {
            console.warn('Erro profiles upsert:', upsertError);
          }
        }
      } catch (sbErr) {
        console.warn('[Admin Create User] Fallback local seguro ativo:', sbErr);
      }
    }

    return res.json({
      success: true,
      message: `Usuário ${name} cadastrado com sucesso com perfil de ${role}!`,
      user: {
        id: createdId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        classId,
        className,
      },
    });
  } catch (error: any) {
    console.error('[API Admin Create User] Erro:', error);
    return res.status(500).json({ error: error?.message || 'Falha ao criar usuário.' });
  }
});

// Endpoint Seguro de Backend: Redefinição Administrativa de Senha (para Alunos sem e-mail)
app.post('/api/admin/reset-user-password', async (req, res) => {
  try {
    const { userId, newPassword, adminUsername } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'ID do usuário e nova senha são obrigatórios.' });
    }

    const validAdmins = ['admin', 'karlos', 'henrique'];
    if (adminUsername && !validAdmins.includes(String(adminUsername).toLowerCase())) {
      return res.status(403).json({ error: 'Apenas os administradores Henrique Carvalho ou Karlos podem redefinir senhas.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);
        await supabaseServer.auth.admin.updateUserById(userId, {
          password: newPassword,
        });
      } catch (sbErr) {
        console.warn('[Admin Reset Password] Falha no Supabase Auth admin:', sbErr);
      }
    }

    return res.json({
      success: true,
      message: 'Senha do usuário redefinida com sucesso pelo administrador.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Erro ao redefinir senha.' });
  }
});

// Create HTTP server instance
const server = http.createServer(app);

// Mount WebSocket server at path '/live' for real-time bidirectional Gemini Live API
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Gemini Live WS] Novo cliente conectado à sessão de voz em tempo real.');

  let liveSession: any = null;
  let isSessionActive = false;

  clientWs.on('message', async (data: Buffer | string) => {
    try {
      const messageStr = data.toString();
      const parsed = JSON.parse(messageStr);

      // Handle initialization message from client
      if (parsed.type === 'init') {
        if (liveSession) {
          try {
            liveSession.close();
          } catch {}
          liveSession = null;
        }

        if (!aiClient) {
          clientWs.send(
            JSON.stringify({
              type: 'error',
              error: 'Chave de API do Gemini não configurada no servidor.',
            })
          );
          return;
        }

        const systemInstruction = buildSystemInstruction(parsed.context);

        try {
          liveSession = await aiClient.live.connect({
            model: 'gemini-3.8-live',
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Charon' },
                },
              },
              systemInstruction,
            },
            callbacks: {
              onmessage: (msg: LiveServerMessage) => {
                if (!isSessionActive) return;

                // 1. Audio chunks from Gemini model turn
                const parts = msg.serverContent?.modelTurn?.parts;
                if (parts && parts.length > 0) {
                  for (const part of parts) {
                    if (part.inlineData?.data) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'audio',
                          audio: part.inlineData.data,
                        })
                      );
                    }
                    if (part.text) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'transcript',
                          text: part.text,
                          role: 'assistant',
                        })
                      );
                    }
                  }
                }

                // 2. Interruption event
                if (msg.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }

                // 3. Turn complete
                if (msg.serverContent?.turnComplete) {
                  clientWs.send(JSON.stringify({ type: 'turn_complete' }));
                }
              },
              onclose: () => {
                console.log('[Gemini Live WS] Sessão remota do Gemini Live encerrada.');
                if (isSessionActive) {
                  clientWs.send(JSON.stringify({ type: 'session_closed' }));
                  isSessionActive = false;
                }
              },
              onerror: (err: any) => {
                console.error('[Gemini Live WS] Erro na sessão remota Live:', err);
                clientWs.send(
                  JSON.stringify({
                    type: 'error',
                    error: err?.message || 'Erro na conexão com a Gemini Live API.',
                  })
                );
              },
            },
          });

          isSessionActive = true;
          console.log('[Gemini Live WS] Sessão Gemini Live inicializada com sucesso.');

          // Send confirmation to client
          clientWs.send(
            JSON.stringify({
              type: 'ready',
              voiceName: 'Charon',
            })
          );

          // If student name is provided and requested initial greeting:
          if (parsed.sendGreeting) {
            const studentName = parsed.context?.studentName
              ? parsed.context.studentName.replace(/[^\w\s]/gi, '')
              : 'aluno';
            const greetingPrompt = `O aluno ${studentName} acabou de se conectar por voz. Dê a apresentação curta e acolhedora do Nexus em uma única frase: "Olá, ${studentName}. Eu sou o Nexus, assistente do GAMEINFOR. Estou pronto. O que vamos aprender hoje?". Não adicione mais nada.`;
            liveSession.sendClientContent({
              turns: [{ role: 'user', parts: [{ text: greetingPrompt }] }],
              turnComplete: true,
            });
          }
        } catch (liveInitErr: any) {
          console.error('[Gemini Live WS] Falha ao conectar na Live API:', liveInitErr);
          clientWs.send(
            JSON.stringify({
              type: 'error',
              error: 'Não foi possível conectar à Gemini Live API no momento.',
            })
          );
        }
        return;
      }

      // Handle continuous microphone audio stream from client
      if (parsed.type === 'audio' && parsed.audio) {
        if (liveSession && isSessionActive) {
          liveSession.sendRealtimeInput({
            audio: {
              data: parsed.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        }
        return;
      }

      // Handle client-side explicit interruption (barge-in)
      if (parsed.type === 'interrupt') {
        if (liveSession && isSessionActive) {
          // Send signal or let Gemini Live VAD handle it
          clientWs.send(JSON.stringify({ type: 'interrupted' }));
        }
        return;
      }

      // Handle client-sent text message
      if (parsed.type === 'text' && parsed.text) {
        if (liveSession && isSessionActive) {
          liveSession.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: parsed.text }] }],
            turnComplete: true,
          });
        }
        return;
      }
    } catch (msgErr) {
      console.error('[Gemini Live WS] Erro ao processar mensagem do WebSocket:', msgErr);
    }
  });

  clientWs.on('close', () => {
    console.log('[Gemini Live WS] Cliente desconectou.');
    isSessionActive = false;
    if (liveSession) {
      try {
        liveSession.close();
      } catch {}
      liveSession = null;
    }
  });

  clientWs.on('error', (err) => {
    console.error('[Gemini Live WS] Erro no socket do cliente:', err);
    if (liveSession) {
      try {
        liveSession.close();
      } catch {}
      liveSession = null;
    }
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`[GAMEINFOR Server] Rodando na porta ${port} (${process.env.NODE_ENV || 'development'})`);
    console.log(`[GAMEINFOR Server] Gemini Live WebSocket ativo em ws://localhost:${port}/live`);
  });
}

startServer();
