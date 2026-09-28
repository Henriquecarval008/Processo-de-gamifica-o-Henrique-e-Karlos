import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Clock,
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { LiveQuizQuestion, LiveQuizRoom, RoomAudioConfig } from '../../types';
import { liveQuizService } from '../../services/liveQuizService';
import { soundEffects } from '../../utils/soundEffects';
import { DEFAULT_ROOM_AUDIO_CONFIG } from '../../utils/audioLibrary';
import { RoomAudioSettingsSection } from './RoomAudioSettingsSection';

interface LiveQuizRoomCreatorProps {
  teacherId: string;
  teacherName: string;
  onCancel: () => void;
  onRoomCreated: (room: LiveQuizRoom) => void;
}

export const LiveQuizRoomCreator: React.FC<LiveQuizRoomCreatorProps> = ({
  teacherId,
  teacherName,
  onCancel,
  onRoomCreated,
}) => {
  const [name, setName] = useState('Revisão de Informática Básica & Planilhas');
  const [lessonTitle, setLessonTitle] = useState('Aula 04 — Funções Essenciais e Interface');
  const [description, setDescription] = useState(
    'Quiz interativo ao vivo para fixação dos conceitos práticos de informática, atalhos e fórmulas.'
  );
  const [defaultTimeSec, setDefaultTimeSec] = useState<number>(30);
  const [allowImages, setAllowImages] = useState<boolean>(true);
  const [slidesFile, setSlidesFile] = useState<{
    name: string;
    type: string;
    size: string;
    dataUrl?: string;
    uploadedAt: string;
  } | null>(null);
  const [audioConfig, setAudioConfig] = useState<RoomAudioConfig>(DEFAULT_ROOM_AUDIO_CONFIG);

  const [questions, setQuestions] = useState<LiveQuizQuestion[]>([
    {
      id: 'q-new-1',
      question: 'Qual programa é utilizado principalmente para criar planilhas eletrônicas?',
      options: ['Microsoft Word', 'Microsoft Excel', 'Microsoft PowerPoint', 'Paint'],
      correctIndex: 1,
      timeSec: 30,
      explanation: 'O Microsoft Excel é a ferramenta líder para planilhas e cálculos numéricos.',
    },
    {
      id: 'q-new-2',
      question: 'Qual caractere OBRIGATÓRIO deve iniciar qualquer fórmula no Microsoft Excel?',
      options: ['Sinal de mais (+)', 'Sinal de arroba (@)', 'Sinal de igual (=)', 'Sinal de cifrão ($)'],
      correctIndex: 2,
      timeSec: 25,
      explanation: 'Toda fórmula de cálculo no Excel deve iniciar impreterivelmente com o sinal de igual (=).',
    },
    {
      id: 'q-new-3',
      question: 'Qual atalho de teclado é utilizado universalmente para desfazer uma ação no Windows?',
      options: ['Ctrl + C', 'Ctrl + Z', 'Ctrl + V', 'Ctrl + S'],
      correctIndex: 1,
      timeSec: 20,
      explanation: 'Ctrl + Z desfaz a última alteração realizada no arquivo.',
    },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEffects.playClick();

    const reader = new FileReader();
    reader.onload = () => {
      setSlidesFile({
        name: file.name,
        type: file.name.split('.').pop() || 'pdf',
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        dataUrl: reader.result as string,
        uploadedAt: new Date().toLocaleDateString('pt-BR'),
      });
      soundEffects.playCorrect();
    };
    reader.readAsDataURL(file);
  };

  const handleAddQuestion = () => {
    soundEffects.playClick();
    const newQ: LiveQuizQuestion = {
      id: 'q-new-' + (questions.length + 1) + '-' + Date.now(),
      question: 'Nova pergunta sobre informática ou ferramentas...',
      options: ['Alternativa A', 'Alternativa B', 'Alternativa C', 'Alternativa D'],
      correctIndex: 0,
      timeSec: defaultTimeSec,
      explanation: 'Explicação didática da resposta.',
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (index: number) => {
    soundEffects.playClick();
    if (questions.length <= 1) {
      alert('A sala precisa ter pelo menos 1 pergunta.');
      return;
    }
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index: number, partial: Partial<LiveQuizQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...partial };
    setQuestions(updated);
  };

  const handleImageUploadForQuestion = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEffects.playClick();

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdateQuestion(index, { image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome da sala de quiz.');
      return;
    }

    if (questions.length === 0) {
      alert('Adicione pelo menos uma pergunta.');
      return;
    }

    soundEffects.playClick();

    const newRoom = liveQuizService.createRoom({
      name,
      lessonTitle,
      description,
      teacherId,
      teacherName,
      defaultTimeSec,
      allowImages,
      questions,
      slidesMaterial: slidesFile || undefined,
      xpRules: {
        startingXp: 1000,
        correctXp: 100,
        wrongXp: -30,
        speedBonus: true,
      },
      audioConfig,
    });

    soundEffects.playCorrect();
    onRoomCreated(newRoom);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              + Criar Sala de Quiz Interativo ao Vivo
            </h2>
            <p className="text-xs text-slate-400">
              Configure a sala, adicione perguntas com alternativas e tempo regressivo por questão.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Sala Info */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Configuração Geral da Sala
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Atividade / Sala *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Revisão de Informática Básica"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título da Aula / Tópico
              </label>
              <input
                type="text"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                placeholder="Ex: Aula 04 — Fórmulas e Interface do Excel"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descrição ou Orientações (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instruções para os alunos..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Tempo Padrão por Pergunta
              </label>
              <select
                value={defaultTimeSec}
                onChange={(e) => setDefaultTimeSec(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={15}>15 segundos (Super Rápido)</option>
                <option value={20}>20 segundos</option>
                <option value={30}>30 segundos (Recomendado)</option>
                <option value={45}>45 segundos</option>
                <option value={60}>60 segundos (1 minuto)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="allowImagesCheck"
                checked={allowImages}
                onChange={(e) => setAllowImages(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 accent-indigo-500"
              />
              <label htmlFor="allowImagesCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
                Permitir imagens ilustrativas nas perguntas
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Upload de Slides / Material */}
        <div className="bg-slate-950/80 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4" /> Material Didático / Slides da Aula
            </h3>
            <span className="text-xs text-slate-400">PDF, PPTX, PPT ou Imagens</span>
          </div>

          {slidesFile ? (
            <div className="flex items-center justify-between p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl text-xs text-cyan-200">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-cyan-400" />
                <div>
                  <span className="font-bold block text-white">{slidesFile.name}</span>
                  <span className="text-[11px] text-cyan-300/80">{slidesFile.size} • Associado à sala</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSlidesFile(null)}
                className="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2 py-1 bg-rose-500/10 rounded-lg"
              >
                Remover
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition-all text-center">
              <Upload className="w-6 h-6 text-cyan-400 mb-2" />
              <span className="text-xs font-bold text-white">
                Clique para enviar a apresentação de slides da aula
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Formatos aceitos: PDF, PPTX, PPT, PNG, JPG (Opcional)
              </span>
              <input
                type="file"
                accept=".pdf,.pptx,.ppt,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Section: Configuração da Música Ambiente da Atividade */}
        <RoomAudioSettingsSection
          config={audioConfig}
          onChange={setAudioConfig}
        />

        {/* Section 3: Editor de Perguntas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-400" />
                Perguntas do Quiz ({questions.length})
              </h3>
              <p className="text-xs text-slate-400">
                Cada questão possui 4 alternativas e tempo individual personalizável.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> + Adicionar Pergunta
            </button>
          </div>

          <div className="space-y-5">
            {questions.map((q, qIdx) => (
              <div
                key={q.id || qIdx}
                className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 relative group"
              >
                {/* Question Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-500/30">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-300">
                      Pergunta {qIdx + 1} de {questions.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Individual Question Time */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] text-slate-400">Tempo:</span>
                      <select
                        value={q.timeSec || defaultTimeSec}
                        onChange={(e) =>
                          handleUpdateQuestion(qIdx, { timeSec: Number(e.target.value) })
                        }
                        className="bg-transparent text-xs font-bold text-amber-400 focus:outline-none cursor-pointer"
                      >
                        <option value={15} className="bg-slate-900 text-white">15s</option>
                        <option value={20} className="bg-slate-900 text-white">20s</option>
                        <option value={30} className="bg-slate-900 text-white">30s</option>
                        <option value={45} className="bg-slate-900 text-white">45s</option>
                        <option value={60} className="bg-slate-900 text-white">60s</option>
                      </select>
                    </div>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors"
                        title="Remover pergunta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Enunciado da Pergunta *
                  </label>
                  <textarea
                    rows={2}
                    value={q.question}
                    onChange={(e) => handleUpdateQuestion(qIdx, { question: e.target.value })}
                    placeholder="Ex: Qual programa é utilizado principalmente para criar planilhas?"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white focus:outline-none focus:border-indigo-500 resize-none"
                    required
                  />
                </div>

                {/* Optional Image */}
                {allowImages && (
                  <div>
                    {q.image ? (
                      <div className="relative inline-block border border-slate-700 rounded-xl overflow-hidden group/img">
                        <img
                          src={q.image}
                          alt="Ilustração da pergunta"
                          className="max-h-40 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(qIdx, { image: undefined })}
                          className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-500 text-white p-1 rounded-lg text-xs font-bold shadow-md"
                        >
                          Remover Imagem
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 cursor-pointer text-xs font-semibold transition-colors">
                        <ImageIcon className="w-4 h-4 text-cyan-400" />
                        + Adicionar imagem ilustrativa
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUploadForQuestion(qIdx, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}

                {/* 4 Alternatives with Radio for Correct */}
                <div className="space-y-2">
                  <span className="block text-xs font-semibold text-slate-400">
                    Alternativas (Marque a opção correta com o botão verde):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const letters = ['A', 'B', 'C', 'D'];
                      const isCorrect = q.correctIndex === optIdx;

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                            isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              soundEffects.playClick();
                              handleUpdateQuestion(qIdx, { correctIndex: optIdx });
                            }}
                            className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center shrink-0 transition-all ${
                              isCorrect
                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/40'
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                            title="Marcar como alternativa correta"
                          >
                            {letters[optIdx]}
                          </button>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...q.options];
                              newOpts[optIdx] = e.target.value;
                              handleUpdateQuestion(qIdx, { options: newOpts });
                            }}
                            placeholder={`Alternativa ${letters[optIdx]}`}
                            className="bg-transparent text-xs text-white flex-1 focus:outline-none"
                            required
                          />

                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20">
                              Correta
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-sm font-black tracking-wide shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-5 h-5" />
            INICIAR SALA DE QUIZ
          </button>
        </div>
      </form>
    </div>
  );
};
