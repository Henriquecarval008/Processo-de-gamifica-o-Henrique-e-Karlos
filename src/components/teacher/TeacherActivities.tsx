import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  CheckSquare,
  Plus,
  Sparkles,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  Paperclip,
  X,
  MessageSquare,
  Download,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Activity, Submission } from '../../types';

export const TeacherActivities: React.FC = () => {
  const {
    activities,
    submissions,
    classes,
    createActivity,
    gradeSubmission,
    currentUser,
  } = useGameinfor();

  // Modals & State
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] =
    useState<Submission | null>(null);

  // New Activity Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState(
    'Crie uma planilha contendo Produto, Quantidade, Preço Unitário, Subtotal, Desconto e Total Final.'
  );
  const [newClassId, setNewClassId] = useState(classes[0]?.id || 'turma-1');
  const [newModule, setNewModule] = useState('Excel');
  const [newLesson, setNewLesson] = useState('Aula 08 — Subtotal e Total Final');
  const [newDueDate, setNewDueDate] = useState('2026-10-05');
  const [newXp, setNewXp] = useState(100);
  const [newAllowFileUpload, setNewAllowFileUpload] = useState(true);
  const [newSupportFileName, setNewSupportFileName] = useState(
    'Modelo_Controle_Materiais.xlsx'
  );

  // Grading Form State
  const [gradeStatus, setGradeStatus] = useState('Concluído');
  const [gradeFeedback, setGradeFeedback] = useState(
    'Excelente trabalho. A planilha foi organizada corretamente.'
  );
  const [gradeXpAmount, setGradeXpAmount] = useState(100);

  // Filter Submissions
  const [activeTab, setActiveTab] = useState<'correcoes' | 'todas_atividades'>('correcoes');

  const pendingSubmissions = submissions.filter((s) => s.status === 'pendente');
  const correctedSubmissions = submissions.filter((s) => s.status === 'corrigido');

  const handleCreateActivitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Por favor, informe o título da atividade.');
      return;
    }

    const targetClass = classes.find((c) => c.id === newClassId);

    createActivity({
      classId: newClassId,
      className: targetClass?.name || 'Projeto Crescer e Transformar',
      title: newTitle,
      description: newDescription,
      module: newModule,
      lesson: newLesson,
      dueDate: newDueDate,
      xp: Number(newXp),
      allowFileUpload: newAllowFileUpload,
      supportFileName: newSupportFileName || undefined,
      supportFileType: 'xlsx',
      supportFileSize: '25 KB',
    });

    setIsCreatingActivity(false);
    setNewTitle('');
  };

  const handleOpenGradeModal = (sub: Submission) => {
    setSelectedSubmissionToGrade(sub);
    const act = activities.find((a) => a.id === sub.activityId);
    setGradeXpAmount(act ? act.xp : 100);
    setGradeFeedback(
      sub.feedback || 'Excelente trabalho. A planilha foi organizada corretamente.'
    );
    setGradeStatus(sub.grade || 'Concluído');
  };

  const handleConfirmGrade = () => {
    if (!selectedSubmissionToGrade) return;

    gradeSubmission(
      selectedSubmissionToGrade.id,
      gradeStatus,
      gradeFeedback,
      Number(gradeXpAmount)
    );

    setSelectedSubmissionToGrade(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CheckSquare className="w-7 h-7 text-indigo-400" />
            Atividades & Central de Correções
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Lance novos desafios com pontuação de XP e avalie os arquivos enviados pelos alunos atribuindo notas e comentários.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingActivity(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Criar Atividade
        </button>
      </div>

      {/* Tabs Switcher: Atividades para Corrigir vs Lista Geral */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('correcoes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'correcoes'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          ATIVIDADES PARA CORRIGIR
          {pendingSubmissions.length > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-black bg-slate-950 text-amber-400">
              {pendingSubmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('todas_atividades')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'todas_atividades'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Atividades Publicadas ({activities.length})
        </button>
      </div>

      {/* VIEW: ATIVIDADES PARA CORRIGIR */}
      {activeTab === 'correcoes' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-white uppercase tracking-wider">
                Fila de Trabalhos dos Alunos
              </span>
              <span>
                {pendingSubmissions.length} aguardando correção • {correctedSubmissions.length} já corrigidos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Aluno</th>
                    <th className="py-3 px-4">Atividade</th>
                    <th className="py-3 px-4">Arquivo Enviado</th>
                    <th className="py-3 px-4">Data do Envio</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Nenhum envio registrado ainda.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((sub) => {
                      const isPending = sub.status === 'pendente';
                      return (
                        <tr
                          key={sub.id}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isPending ? 'bg-amber-950/10' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{sub.studentName}</div>
                            <div className="text-[10px] text-cyan-400 font-mono">
                              @{sub.studentNickname} • {sub.className}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-200">
                            {sub.activityTitle}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 text-indigo-300 font-medium">
                              <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="truncate max-w-[150px]">
                                {sub.fileName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({sub.fileSize})
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                            {sub.submittedAt}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                🟡 Aguardando correção
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                🟢 Corrigido (+{sub.awardedXp} XP)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleOpenGradeModal(sub)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                                isPending
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                              }`}
                            >
                              {isPending ? 'Corrigir & Atribuir XP' : 'Ver Correção'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: TODAS AS ATIVIDADES */}
      {activeTab === 'todas_atividades' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activities.map((act) => {
            const subsForThis = submissions.filter((s) => s.activityId === act.id);
            const pendingCount = subsForThis.filter((s) => s.status === 'pendente').length;

            return (
              <div
                key={act.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {act.module} • {act.lesson}
                    </span>
                    <h3 className="text-base font-extrabold text-white mt-0.5">
                      {act.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg text-xs font-black shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    +{act.xp} XP
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {act.description}
                </p>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Turma: <strong>{act.className}</strong></span>
                  <span>Prazo: <strong>{act.dueDate}</strong></span>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    {subsForThis.length} envios realizados ({pendingCount} pendentes)
                  </span>

                  {act.supportFileName && (
                    <span className="text-[11px] text-cyan-400 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      {act.supportFileName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CORRIGIR ATIVIDADE (Section 9) */}
      {selectedSubmissionToGrade && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-lg">
                  Avaliar e Corrigir Atividade
                </h3>
              </div>
              <button
                onClick={() => setSelectedSubmissionToGrade(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Submission Info */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Aluno:</span>
                <span className="font-bold text-white">
                  {selectedSubmissionToGrade.studentName} (@{selectedSubmissionToGrade.studentNickname})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Atividade:</span>
                <span className="font-bold text-indigo-300">
                  {selectedSubmissionToGrade.activityTitle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Arquivo Anexado:</span>
                <span className="font-mono text-cyan-300 flex items-center gap-1">
                  <Paperclip className="w-3 h-3" />
                  {selectedSubmissionToGrade.fileName} ({selectedSubmissionToGrade.fileSize})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Data de Envio:</span>
                <span className="text-slate-300">{selectedSubmissionToGrade.submittedAt}</span>
              </div>
            </div>

            {/* Simulated File Download/Preview */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
              <div className="flex items-center gap-2 text-xs text-white">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Arquivo do estudante pronto para análise pedagógica</span>
              </div>
              <button
                onClick={() =>
                  alert(`Abrindo arquivo do aluno: ${selectedSubmissionToGrade.fileName}`)
                }
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
              >
                <Download className="w-3 h-3" />
                Baixar Planilha
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nota / Resultado:
                  </label>
                  <select
                    value={gradeStatus}
                    onChange={(e) => setGradeStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Concluído">Concluído</option>
                    <option value="Excelente">Excelente</option>
                    <option value="Bom">Bom</option>
                    <option value="Necessita Revisão">Necessita Revisão</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    XP Atribuído:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={gradeXpAmount}
                      onChange={(e) => setGradeXpAmount(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400"
                    />
                    <Sparkles className="w-4 h-4 text-amber-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Comentário do Professor (Feedback):
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Ex: Excelente trabalho. A planilha foi organizada corretamente."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedSubmissionToGrade(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmGrade}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                CORRIGIR E ENVIAR XP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: + CRIAR ATIVIDADE (Section 7) */}
      {isCreatingActivity && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-white text-lg">
                  + CRIAR NOVA ATIVIDADE
                </h3>
              </div>
              <button
                onClick={() => setIsCreatingActivity(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateActivitySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Título da Atividade:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Atividade — Planilha de Controle de Materiais"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Descrição / Instruções aos Alunos:
                </label>
                <textarea
                  rows={3}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Turma:</label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
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
                    value={newModule}
                    onChange={(e) => setNewModule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Aula Vinculada:</label>
                  <input
                    type="text"
                    value={newLesson}
                    onChange={(e) => setNewLesson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                    placeholder="Ex: Aula 08 — Subtotal e Total Final"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Data de Entrega:</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">XP da Atividade:</label>
                  <input
                    type="number"
                    value={newXp}
                    onChange={(e) => setNewXp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-amber-400 font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Permitir Envio de Arquivo:
                  </label>
                  <select
                    value={newAllowFileUpload ? 'SIM' : 'NAO'}
                    onChange={(e) => setNewAllowFileUpload(e.target.value === 'SIM')}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="SIM">SIM (PDF, DOCX, XLSX, PPTX, Imagens)</option>
                    <option value="NAO">NÃO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Arquivo de Apoio (opcional):
                </label>
                <input
                  type="text"
                  value={newSupportFileName}
                  onChange={(e) => setNewSupportFileName(e.target.value)}
                  placeholder="Ex: Modelo_Exemplo_Controle.xlsx"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingActivity(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30"
                >
                  Publicar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
