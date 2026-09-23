import React, { useState, useRef } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  Paperclip,
  Plus,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  X,
  Upload,
  CheckCircle2,
} from 'lucide-react';
import { SharedFile } from '../../types';

export const TeacherFiles: React.FC = () => {
  const { sharedFiles, classes, uploadTeacherFile } = useGameinfor();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [description, setDescription] = useState('Introdução ao Excel');
  const [classId, setClassId] = useState(classes[0]?.id || 'turma-1');
  const [module, setModule] = useState('Excel');
  const [lesson, setLesson] = useState('01');
  const [materialType, setMaterialType] = useState<
    'Apostila' | 'Exercício' | 'Apresentação' | 'Planilha Exemplo' | 'Guia Rápido'
  >('Apostila');

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPickedFile(file);
      if (!fileName) {
        setFileName(file.name);
      }
    }
  };

  const handlePublishFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) {
      alert('Por favor, informe o nome do arquivo.');
      return;
    }

    const targetClass = classes.find((c) => c.id === classId);
    const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const validExt = ['pdf', 'docx', 'xlsx', 'pptx', 'png', 'jpg'].includes(ext)
      ? (ext as any)
      : 'pdf';

    uploadTeacherFile({
      name: fileName,
      description,
      classId,
      className: targetClass?.name || 'Projeto Crescer e Transformar',
      module,
      lesson: lesson.startsWith('Aula') ? lesson : `Aula ${lesson}`,
      materialType,
      fileType: validExt,
      fileSize: pickedFile
        ? `${Math.round(pickedFile.size / 1024)} KB`
        : '2.5 MB',
    });

    setIsModalOpen(false);
    setFileName('');
    setDescription('');
    setPickedFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Paperclip className="w-7 h-7 text-cyan-400" />
            Central de Arquivos & Materiais Didáticos
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Envie apostilas em PDF, modelos em XLSX, apresentações PPTX e materiais de apoio diretamente para suas turmas.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-600/20 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          + Novo arquivo
        </button>
      </div>

      {/* Files Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sharedFiles.map((file) => {
          return (
            <div
              key={file.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-cyan-400 border border-blue-500/20">
                    <FileText className="w-6 h-6" />
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-950 text-cyan-300 border border-slate-800">
                    {file.materialType}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-extrabold text-white truncate" title={file.name}>
                    {file.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                    {file.description}
                  </p>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>Turma:</span>
                    <strong className="text-slate-200 truncate max-w-[150px]">
                      {file.className}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Módulo / Aula:</span>
                    <strong className="text-cyan-400">
                      {file.module} • {file.lesson}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Tamanho:</span>
                    <span>{file.fileSize}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Publicado em {file.uploadedAt}
                </span>

                <button
                  onClick={() => alert(`Baixando material didático: ${file.name}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-cyan-300 hover:text-white text-xs font-semibold transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: + NOVO ARQUIVO (Section 6) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-cyan-400" />
                <h3 className="font-black text-white text-lg">
                  + NOVO ARQUIVO PARA A TURMA
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishFile} className="space-y-4 text-xs">
              {/* Optional upload trigger */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-4 text-center cursor-pointer bg-slate-950 transition-colors"
              >
                <Upload className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                <span className="font-semibold text-white">
                  {pickedFile ? pickedFile.name : 'Selecionar arquivo do computador'}
                </span>
                <span className="block text-[10px] text-slate-400 mt-0.5">
                  PDF, DOCX, PPTX, XLSX, imagens
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.pptx,.png,.jpg"
                onChange={handleFilePicked}
                className="hidden"
              />

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nome do Arquivo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Excel_Basico.pdf"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Descrição:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Introdução ao Excel"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Turma:</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
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
                    value={module}
                    onChange={(e) => setModule(e.target.value)}
                    placeholder="Ex: Excel"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Aula:</label>
                  <input
                    type="text"
                    value={lesson}
                    onChange={(e) => setLesson(e.target.value)}
                    placeholder="Ex: 01"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Tipo de Material:
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="Apostila">Apostila</option>
                    <option value="Exercício">Exercício</option>
                    <option value="Apresentação">Apresentação</option>
                    <option value="Planilha Exemplo">Planilha Exemplo</option>
                    <option value="Guia Rápido">Guia Rápido</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-wider shadow-lg shadow-cyan-500/20"
                >
                  PUBLICAR PARA A TURMA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
