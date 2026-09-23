import React, { useState, useEffect } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Brain,
  Sparkles,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { Quiz } from '../../types';

export const StudentQuizzes: React.FC = () => {
  const { quizzes, quizAttempts, currentUser, completeQuiz } = useGameinfor();

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(45);
  const [quizFinished, setQuizFinished] = useState(false);
  const [earnedXpState, setEarnedXpState] = useState<number | null>(null);

  // My attempts
  const myAttempts = quizAttempts.filter((a) => a.studentId === currentUser.id);

  // Timer countdown while taking quiz
  useEffect(() => {
    if (!activeQuiz || quizFinished) return;

    if (timeLeft <= 0) {
      handleNextQuestion();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, timeLeft, quizFinished]);

  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswers(new Array(quiz.questions.length).fill(-1));
    setTimeLeft(quiz.timePerQuestionSec || 45);
    setQuizFinished(false);
    setEarnedXpState(null);
  };

  const handleSelectOption = (optionIndex: number) => {
    const updated = [...selectedAnswers];
    updated[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;

    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(activeQuiz.timePerQuestionSec || 45);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!activeQuiz) return;

    let score = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });

    const gainedXp = completeQuiz(activeQuiz.id, score, activeQuiz.questions.length);
    setEarnedXpState(gainedXp);
    setQuizFinished(true);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-indigo-400" />
            Quizzes Gamificados
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Teste seu raciocínio rápido em informática básica e Excel para ganhar XP instantâneo!
          </p>
        </div>
        <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-300">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>{myAttempts.length} Quizzes Realizados</span>
        </div>
      </div>

      {/* If Taking Quiz */}
      {activeQuiz ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl space-y-6">
          {!quizFinished ? (
            <>
              {/* Quiz Header & Progress */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    {activeQuiz.module}
                  </span>
                  <h2 className="text-lg font-bold text-white">{activeQuiz.title}</h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold text-amber-400">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>{timeLeft}s</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    Questão {currentQuestionIndex + 1} de {activeQuiz.questions.length}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{
                    width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Current Question */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white leading-relaxed">
                  {activeQuiz.questions[currentQuestionIndex].question}
                </h3>

                {/* Options */}
                <div className="space-y-2.5">
                  {activeQuiz.questions[currentQuestionIndex].options.map((opt, optIdx) => {
                    const isSelected = selectedAnswers[currentQuestionIndex] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSelected
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentQuestionIndex] === -1}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all ${
                    selectedAnswers[currentQuestionIndex] !== -1
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {currentQuestionIndex + 1 === activeQuiz.questions.length ? 'Finalizar Quiz' : 'Próxima'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Quiz Completed Celebration Screen */
            <div className="text-center py-6 space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 mx-auto flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20">
                <Trophy className="w-8 h-8 text-slate-950" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white">Quiz Finalizado!</h2>
                <p className="text-sm text-slate-300">
                  Parabéns pelo empenho! Seus pontos foram registrados no sistema.
                </p>
              </div>

              {/* Score & XP badge */}
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-400">Acertos</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {selectedAnswers.filter((ans, idx) => ans === activeQuiz.questions[idx].correctIndex).length} / {activeQuiz.questions.length}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-xs text-amber-300">XP Conquistado</span>
                  <div className="text-2xl font-black text-amber-400 mt-1 flex items-center justify-center gap-1">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    +{earnedXpState} XP
                  </div>
                </div>
              </div>

              {/* Answers Review */}
              <div className="space-y-3 text-left max-h-72 overflow-y-auto pr-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gabarito com Explicações:
                </h4>
                {activeQuiz.questions.map((q, idx) => {
                  const isCorrect = selectedAnswers[idx] === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-xl border text-xs ${
                        isCorrect
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                          : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        )}
                        <span>{q.question}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-300">
                        Resposta correta: <strong>{q.options[q.correctIndex]}</strong>
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400 italic">
                        {q.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => startQuiz(activeQuiz)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Jogar Novamente
                </button>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                >
                  Voltar aos Quizzes
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Quiz Catalog */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const attempt = myAttempts.find((a) => a.quizId === quiz.id);

            return (
              <div
                key={quiz.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {quiz.module}
                    </span>
                    <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-black">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      +{quiz.xp} XP
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">{quiz.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {quiz.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {quiz.questions.length} perguntas
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {quiz.timePerQuestionSec}s por questão
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
                  {attempt ? (
                    <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Última nota: {attempt.score}/{attempt.totalQuestions} (+{attempt.xpEarned} XP)
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Ainda não realizado</span>
                  )}

                  <button
                    onClick={() => startQuiz(quiz)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                  >
                    {attempt ? 'Refazer Quiz' : 'Iniciar Quiz'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
