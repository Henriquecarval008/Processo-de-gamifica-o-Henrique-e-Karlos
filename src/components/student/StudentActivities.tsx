import React, { useState, useRef } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  FileSpreadsheet,
  Clock,
  Sparkles,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Upload,
  Download,
  FileText,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { Activity } from '../../types';

export const StudentActivities: React.FC = () => {
  const { activities, submissions, currentUser, submitActivity } = useGameinfor();

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    activities[0] || null
  );
  const [filter, setFilter] = useState<'todas' | 'pendentes' | 'concluidas'>('todas');
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const mySubmissions = submissions.filter((s) => s.studentId === currentUser.id);

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    const sub = mySubmissions.find((s) => s.activityId === act.id);
    if (filter === 'pendentes') {
      return !sub || sub.status === 'pendente';
    }
    if (filter === 'concluidas') {
      return sub && sub.status === 'corrigido';
    }
    return true;
  });

  const activeSub = selectedActivity
    ? mySubmissions.find((s) => s.activityId === selectedActivity.id)
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingFile(e.target.files[0]);
    }
  };

  const handleSendSubmission = (activityId: string) => {
    if (!uploadingFile) {
      alert('Por favor, selecione um arquivo antes de enviar.');
      return;
    }

    const ext = uploadingFile.name.split('.').pop()?.toLowerCase() || 'xlsx';
    const sizeKB = Math.round(uploadingFile.size / 1024);
    const formattedSize = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;

    submitActivity(activityId, {
      name: uploadingFile.name,
      type: ext,
      size: formattedSize,
    });

    setUploadingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="w-7 h-7 text-cyan-400" />
            Minhas Atividades Práticas
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Realize os exercícios, envie suas planilhas e projetos para avaliação do professor e ganhe XP.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilter('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'todas'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({activities.length})
          </button>
          <button
            onClick={() => setFilter('pendentes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'pendentes'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFilter('concluidas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'concluidas'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Corrigidas
          </button>
        </div>
      </div>

      {/* Main Grid: Activity List & Activity Detail / Upload Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Activity List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredActivities.map((act) => {
            const isSelected = selectedActivity?.id === act.id;
            const sub = mySubmissions.find((s) => s.activityId === act.id);

            return (
              <div
                key={act.id}
                onClick={() => setSelectedActivity(act)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-850 border-blue-500 shadow-md shadow-blue-500/10'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      {act.module} • {act.lesson}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {act.title}
                    </h3>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded text-xs font-extrabold">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    +{act.xp} XP
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                  {act.description}
                </p>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Entrega: {act.dueDate}
                  </span>

                  {sub ? (
                    sub.status === 'corrigido' ? (
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        🟢 Corrigido
                      </span>
                    ) : (
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        🟡 Em correção
                      </span>
                    )
                  ) : (
                    <span className="text-blue-400 font-semibold">
                      Não enviado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Active Activity Details & Upload Workspace */}
        <div className="lg:col-span-7">
          {selectedActivity ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl sticky top-24">
              {/* Activity Header */}
              <div className="border-b border-slate-800 pb-5 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-cyan-300 border border-blue-500/30">
                    {selectedActivity.module} • {selectedActivity.lesson}
                  </span>
                  <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1 rounded-xl text-xs font-extrabold">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Recompensa: +{selectedActivity.xp} XP
                  </div>
                </div>

                <h2 className="text-xl font-black text-white">
                  {selectedActivity.title}
                </h2>

                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>Turma: <strong>{selectedActivity.className}</strong></span>
                  <span>Prazo: <strong>{selectedActivity.dueDate}</strong></span>
                </div>
              </div>

              {/* Activity Detailed Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Instruções da Atividade
                </h4>
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl text-sm text-slate-200 leading-relaxed">
                  {selectedActivity.description}
                </div>
              </div>

              {/* Support File (Arquivo de Apoio) */}
              {selectedActivity.supportFileName && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Material de Apoio do Professor
                  </h4>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-cyan-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {selectedActivity.supportFileName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {selectedActivity.supportFileType?.toUpperCase()} • {selectedActivity.supportFileSize}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Baixando arquivo modelo: ${selectedActivity.supportFileName}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Baixar Modelo
                    </button>
                  </div>
                </div>
              )}

              {/* Student Submission Status or Submission Box */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Envio do Trabalho</span>
                  {activeSub && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        activeSub.status === 'corrigido'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {activeSub.status === 'corrigido' ? '🟢 Corrigido' : '🟡 Aguardando correção'}
                    </span>
                  )}
                </h4>

                {/* If already submitted */}
                {activeSub ? (
                  <div className="space-y-4">
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <FileCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              {activeSub.fileName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Enviado em {activeSub.submittedAt} • {activeSub.fileSize}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                          Arquivo enviado com sucesso.
                        </span>
                      </div>

                      {/* If Graded by Teacher */}
                      {activeSub.status === 'corrigido' && (
                        <div className="mt-3 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-300">
                                Avaliação do Professor:
                              </span>
                              <span className="text-xs font-extrabold text-white px-2 py-0.5 rounded bg-emerald-500/20">
                                {activeSub.grade}
                              </span>
                            </div>
                            <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              +{activeSub.awardedXp} XP Creditado!
                            </span>
                          </div>

                          {activeSub.feedback && (
                            <p className="text-xs text-slate-200 italic bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                              "{activeSub.feedback}"
                            </p>
                          )}

                          <div className="text-[10px] text-slate-400 text-right">
                            Corrigido por {activeSub.gradedBy} em {activeSub.gradedAt}
                          </div>
                        </div>
                      )}

                      {/* If waiting for correction */}
                      {activeSub.status === 'pendente' && (
                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>
                            Seu arquivo está na fila de correção do professor. Assim que for corrigido, o XP será creditado no seu perfil!
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Resubmit button if user wants to replace */}
                    <details className="text-xs text-slate-400">
                      <summary className="cursor-pointer hover:text-slate-200 font-medium flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Deseja reenviar ou atualizar o arquivo da atividade?
                      </summary>
                      <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                        <input
                          type="file"
                          accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg"
                          onChange={handleFileChange}
                          className="text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
                        />
                        {uploadingFile && (
                          <button
                            onClick={() => handleSendSubmission(selectedActivity.id)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl text-xs transition-colors"
                          >
                            Confirmar Reenvio: {uploadingFile.name}
                          </button>
                        )}
                      </div>
                    </details>
                  </div>
                ) : (
                  /* Not yet submitted: Show Upload Box */
                  <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
                    <p className="text-xs text-slate-300">
                      Formatos aceitos:{' '}
                      <strong className="text-cyan-400">
                        PDF, DOCX, XLSX, PPTX, PNG, JPG
                      </strong>
                    </p>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-700 hover:border-blue-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-900/50"
                    >
                      <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-white">
                        {uploadingFile ? uploadingFile.name : 'Clique para selecionar seu arquivo'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {uploadingFile
                          ? `${(uploadingFile.size / 1024).toFixed(1)} KB`
                          : 'Ou arraste seu arquivo para esta área'}
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <button
                      onClick={() => handleSendSubmission(selectedActivity.id)}
                      disabled={!uploadingFile}
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                        uploadingFile
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Paperclip className="w-4 h-4" />
                      📎 ENVIAR ATIVIDADE
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              Selecione uma atividade à esquerda para visualizar detalhes e enviar seu trabalho.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
