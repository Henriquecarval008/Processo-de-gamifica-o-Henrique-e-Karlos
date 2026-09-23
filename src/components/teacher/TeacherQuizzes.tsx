import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Brain,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  ToggleLeft,
  ToggleRight,
  X,
  Users,
} from 'lucide-react';
import { Quiz } from '../../types';

export const TeacherQuizzes: React.FC = () => {
  const { quizzes, quizAttempts, classes, createQuiz, toggleQuizActive } = useGameinfor();

  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [selectedQuizResults, setSelectedQuizResults] = useState<Quiz | null>(null);

  // New Quiz Form State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('Desafio de fixação de fórmulas e interface.');
  const [classId, setClassId] = useState(classes[0]?.id || 'turma-1');
  const [module, setModule] = useState('Excel');
  const [timeSec, setTimeSec] = useState(45);
  const [xp, setXp] = useState(100);

  // Dynamic Questions State
  const [questions, setQuestions] = useState([
    {
      question: 'Qual fórmula deve ser utilizada para calcular a soma total de A1 até A10?',
      options: ['=SOMA(A1:A10)', '=SOMAR(A1-A10)', '=SOMA(A1;A10)', '=TOTAL(A1..A10)'],
      correctIndex: 0,
      explanation: 'No Excel, o operador de dois pontos (:) define o intervalo contínuo.',
    },
    {
      question: 'Qual caractere inicia qualquer fórmula no Microsoft Excel?',
      options: ['=', '@', '#', '$'],
      correctIndex: 0,
      explanation: 'Toda fórmula precisa iniciar com o sinal de igual (=).',
    },
  ]);

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        question: 'Nova pergunta sobre ferramentas ou fórmulas?',
        options: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'],
        correctIndex: 0,
        explanation: 'Explicação didática da resposta correta.',
      },
    ]);
  };

  const handleSaveQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizTitle.trim()) {
      alert('Informe o título do quiz.');
      return;
    }

    const targetClass = classes.find((c) => c.id === classId);

    createQuiz({
      title: quizTitle,
      description: quizDesc,
      classId,
      className: targetClass?.name || 'Projeto Crescer e Transformar',
      module,
      timePerQuestionSec: Number(timeSec),
      xp: Number(xp),
      questions,
    });

    setIsCreatingQuiz(false);
    setQuizTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-400" />
            Gestão de Quizzes Gamificados
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Crie avaliações rápidas e dinâmicas com tempo regressivo por questão e premiação em XP.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingQuiz(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + CRIAR QUIZ
        </button>
      </div>

      {/* Quizzes List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((quiz) => {
          const attemptsForQuiz = quizAttempts.filter((a) => a.quizId === quiz.id);

          return (
            <div
              key={quiz.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {quiz.module}
                    </span>
                    <button
                      onClick={() => toggleQuizActive(quiz.id)}
                      className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        quiz.active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {quiz.active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Ativo
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Desativado
                        </>
                      )}
                    </button>
                  </div>

                  <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-xs font-black">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    +{quiz.xp} XP
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">{quiz.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {quiz.description}
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Turma:</span>
                    <strong className="text-slate-200">{quiz.className}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Configuração:</span>
                    <span>
                      {quiz.questions.length} perguntas • {quiz.timePerQuestionSec}s/pergunta
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Publicado em:</span>
                    <span>{quiz.publishedAt}</span>
                  </div>
                </div>
              </div>

              {/* Action row */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => setSelectedQuizResults(quiz)}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Ver Desempenho ({attemptsForQuiz.length} tentativas)
                </button>

                <button
                  onClick={() => toggleQuizActive(quiz.id)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {quiz.active ? 'Desativar Quiz' : 'Ativar Quiz'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: VER RESULTADOS DO QUIZ */}
      {selectedQuizResults && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Resultados: {selectedQuizResults.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Histórico de tentativas dos alunos nesta avaliação
                </p>
              </div>
              <button
                onClick={() => setSelectedQuizResults(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {quizAttempts.filter((a) => a.quizId === selectedQuizResults.id).length === 0 ? (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  Nenhum aluno realizou este quiz ainda.
                </p>
              ) : (
                quizAttempts
                  .filter((a) => a.quizId === selectedQuizResults.id)
                  .map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">
                          Estudante ID: {attempt.studentId}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {attempt.completedAt}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-bold">
                          Nota: {attempt.score}/{attempt.totalQuestions}
                        </span>
                        <span className="text-amber-400 font-black bg-amber-500/10 px-2 py-0.5 rounded">
                          +{attempt.xpEarned} XP
                        </span>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedQuizResults(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: + CRIAR QUIZ (Section 11) */}
      {isCreatingQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-white text-lg">+ CRIAR QUIZ</h3>
              </div>
              <button
                onClick={() => setIsCreatingQuiz(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nome do Quiz:
                </label>
                <input
                  type="text"
                  required
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="Ex: Quiz — Fórmulas e Atalhos do Excel"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Descrição:
                </label>
                <textarea
                  rows={2}
                  value={quizDesc}
                  onChange={(e) => setQuizDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Turma:</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Módulo:</label>
                  <input
                    type="text"
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Tempo / Questão (s):
                  </label>
                  <input
                    type="number"
                    value={timeSec}
                    onChange={(e) => setTimeSec(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    XP Total:
                  </label>
                  <input
                    type="number"
                    value={xp}
                    onChange={(e) => setXp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-2 py-2 text-amber-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Questions Builder */}
              <div className="space-y-4 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white uppercase tracking-wider text-[11px]">
                    Perguntas Cadastradas ({questions.length})
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Pergunta
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300">
                        Pergunta #{qIdx + 1}
                      </span>
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const copy = [...questions];
                        copy[qIdx].question = e.target.value;
                        setQuestions(copy);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs"
                      placeholder="Enunciado da pergunta"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctIndex === oIdx}
                            onChange={() => {
                              const copy = [...questions];
                              copy[qIdx].correctIndex = oIdx;
                              setQuestions(copy);
                            }}
                            title="Marcar como resposta correta"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const copy = [...questions];
                              copy[qIdx].options[oIdx] = e.target.value;
                              setQuestions(copy);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                          />
                        </div>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={q.explanation}
                      onChange={(e) => {
                        const copy = [...questions];
                        copy[qIdx].explanation = e.target.value;
                        setQuestions(copy);
                      }}
                      placeholder="Explicação pedagógica exibida no gabarito"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-[11px] text-slate-300"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingQuiz(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30"
                >
                  Publicar Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
