import React from 'react';
import {
  BookOpen,
  Sparkles,
  Clock,
  Printer,
  X,
  Edit3,
  Send,
  AlertTriangle,
  Lightbulb,
  Keyboard,
  Calculator,
  CheckCircle2,
  Trophy,
  Table as TableIcon,
  ChevronRight,
  BookmarkCheck,
  Share2,
} from 'lucide-react';
import { DidacticMaterial, DidacticSection } from '../../types';

interface DidacticBookletViewerProps {
  material: DidacticMaterial;
  onClose?: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
  isTeacherView?: boolean;
}

export const DidacticBookletViewer: React.FC<DidacticBookletViewerProps> = ({
  material,
  onClose,
  onEdit,
  onPublish,
  isTeacherView = false,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white print:text-black">
      {/* Container simulating a real physical / digital educational handbook */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar (Hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-md sticky top-4 z-40 print:hidden shadow-xl">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                material.status === 'publicado'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              {material.status === 'publicado' ? 'Publicado para a Turma' : 'Modo Rascunho'}
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Turma: <strong className="text-slate-200">{material.targetClassName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isTeacherView && onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                Editar Conteúdo
              </button>
            )}

            {isTeacherView && material.status === 'rascunho' && onPublish && (
              <button
                onClick={onPublish}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/30"
              >
                <Send className="w-3.5 h-3.5" />
                Publicar para Turma
              </button>
            )}

            <button
              onClick={handlePrint}
              title="Imprimir ou Salvar como PDF"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              Imprimir / PDF
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Booklet Main Page (Clean sheet styling) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
          {/* Header Title Section */}
          <div className="border-b border-slate-800 pb-8 space-y-4 print:border-neutral-300">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 print:text-neutral-600">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-400 print:text-blue-700 uppercase tracking-wider">
                  GAMEINFOR EDUCAÇÃO
                </span>
                <span>•</span>
                <span>{material.courseName}</span>
                <span>•</span>
                <span className="text-cyan-300 print:text-neutral-800 font-medium">{material.moduleName}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400 print:text-neutral-700" />
                  ~{material.readTimeMin} min de leitura
                </span>
                <span className="flex items-center gap-1">
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400 print:text-neutral-700" />
                  Nível Iniciante
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20 print:border-neutral-300 print:text-black">
                {material.lessonTitle}
              </span>
              <h1 className="text-2xl sm:text-4xl font-black text-white print:text-black tracking-tight leading-tight">
                {material.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 print:text-neutral-700 leading-relaxed max-w-3xl">
                {material.summary}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400 print:text-neutral-600 border-t border-slate-800/60 print:border-neutral-200">
              <div>
                Elaborado por: <strong className="text-slate-200 print:text-black">{material.authorName}</strong>
              </div>
              <div>
                Criado em: <span className="font-mono">{material.createdAt}</span>
                {material.publishedAt && (
                  <span className="ml-2">| Publicado: <span className="font-mono">{material.publishedAt}</span></span>
                )}
              </div>
            </div>
          </div>

          {/* Render Sections */}
          <div className="space-y-8">
            {material.sections.map((section, idx) => (
              <div key={section.id || idx} className="space-y-4">
                {/* Section Header */}
                {section.title && (
                  <div className="space-y-1">
                    <h2 className="text-lg sm:text-xl font-extrabold text-white print:text-black flex items-center gap-2">
                      <span className="w-2 h-5 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full inline-block print:bg-neutral-800"></span>
                      {section.title}
                    </h2>
                    {section.subtitle && (
                      <p className="text-xs sm:text-sm text-cyan-300 print:text-neutral-600 font-medium pl-4">
                        {section.subtitle}
                      </p>
                    )}
                  </div>
                )}

                {/* Section Content Text */}
                {section.content && (
                  <p className="text-sm sm:text-base text-slate-300 print:text-neutral-800 leading-relaxed">
                    {section.content}
                  </p>
                )}

                {/* Callout Box (Dica, Atenção, Fórmula, Atalho) */}
                {section.type === 'callout_box' && (
                  <div
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      section.highlightVariant === 'tip'
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200 print:bg-neutral-50 print:border-neutral-300 print:text-black'
                        : section.highlightVariant === 'warning'
                        ? 'bg-amber-950/40 border-amber-500/30 text-amber-200 print:bg-neutral-50 print:border-neutral-300 print:text-black'
                        : section.highlightVariant === 'formula'
                        ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200 print:bg-neutral-50 print:border-neutral-300 print:text-black'
                        : 'bg-purple-950/40 border-purple-500/30 text-purple-200 print:bg-neutral-50 print:border-neutral-300 print:text-black'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-950/60 shrink-0 print:bg-neutral-200">
                        {section.highlightVariant === 'tip' && (
                          <Lightbulb className="w-5 h-5 text-emerald-400 print:text-neutral-800" />
                        )}
                        {section.highlightVariant === 'warning' && (
                          <AlertTriangle className="w-5 h-5 text-amber-400 print:text-neutral-800" />
                        )}
                        {section.highlightVariant === 'formula' && (
                          <Calculator className="w-5 h-5 text-indigo-400 print:text-neutral-800" />
                        )}
                        {section.highlightVariant === 'shortcut' && (
                          <Keyboard className="w-5 h-5 text-purple-400 print:text-neutral-800" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-white print:text-black">
                          {section.title}
                        </h4>
                        <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Steps List (Passo a Passo) */}
                {section.steps && section.steps.length > 0 && (
                  <div className="grid gap-3 sm:gap-4">
                    {section.steps.map((st) => (
                      <div
                        key={st.order}
                        className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:bg-white print:border-neutral-200 print:p-2"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-cyan-300 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0 print:bg-neutral-100 print:text-black print:border-neutral-300">
                            {st.order}
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-sm font-bold text-white print:text-black">
                              {st.title}
                            </h5>
                            <p className="text-xs sm:text-sm text-slate-400 print:text-neutral-700 leading-relaxed">
                              {st.description}
                            </p>
                          </div>
                        </div>

                        {st.shortcut && (
                          <div className="sm:self-center shrink-0">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700 print:bg-neutral-100 print:text-black print:border-neutral-300">
                              <Keyboard className="w-3 h-3 text-cyan-400 print:text-black" />
                              {st.shortcut}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Visual Spreadsheet Table */}
                {section.tableData && (
                  <div className="space-y-2">
                    <div className="overflow-x-auto rounded-2xl border border-slate-800 shadow-xl bg-slate-950 print:border-neutral-300 print:bg-white">
                      {/* Fake Excel Window Bar */}
                      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 print:hidden">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                          <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                          <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                          <span className="font-semibold text-slate-300 ml-2 flex items-center gap-1.5">
                            <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
                            Planilha Exemplo — Visualização Didática
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-emerald-400">Microsoft Excel Formatted</span>
                      </div>

                      <table className="w-full text-left text-xs sm:text-sm border-collapse">
                        <thead>
                          <tr className="bg-slate-800/80 text-slate-200 border-b border-slate-700 print:bg-neutral-100 print:text-black print:border-neutral-300">
                            {section.tableData.columns.map((col, cIdx) => (
                              <th
                                key={cIdx}
                                className={`p-3 font-bold uppercase tracking-wider text-[11px] ${
                                  cIdx >= 2 ? 'text-right' : 'text-left'
                                }`}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 print:divide-neutral-200">
                          {section.tableData.rows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-slate-800/30 transition-colors print:hover:bg-transparent"
                            >
                              {row.map((cell, cellIdx) => (
                                <td
                                  key={cellIdx}
                                  className={`p-3 ${
                                    cellIdx === 0
                                      ? 'font-semibold text-white print:text-black'
                                      : 'text-slate-300 print:text-neutral-800'
                                  } ${cellIdx >= 2 ? 'text-right font-mono' : 'text-left'}`}
                                >
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                        {section.tableData.footers && (
                          <tfoot>
                            <tr className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border-t-2 border-emerald-500/50 text-emerald-300 font-bold print:bg-neutral-100 print:border-neutral-400 print:text-black">
                              {section.tableData.footers.map((foot, fIdx) => (
                                <td
                                  key={fIdx}
                                  className={`p-3.5 ${fIdx >= 2 ? 'text-right font-mono text-sm' : 'text-left text-xs uppercase'}`}
                                >
                                  {foot}
                                </td>
                              ))}
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>

                    {section.tableData.notes && (
                      <p className="text-xs text-slate-400 print:text-neutral-600 italic pl-2">
                        {section.tableData.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Practical Exercise Box */}
                {section.exercise && (
                  <div className="bg-gradient-to-br from-blue-950/40 via-slate-950 to-indigo-950/40 border border-blue-500/30 rounded-2xl p-5 sm:p-6 space-y-4 print:bg-neutral-50 print:border-neutral-300">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-500/20 text-cyan-400 border border-blue-500/30 print:bg-neutral-200 print:text-black">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-cyan-400 print:text-blue-800 uppercase tracking-wider">
                            Atividade Prática
                          </span>
                          <h4 className="text-base font-bold text-white print:text-black">
                            {section.exercise.objective}
                          </h4>
                        </div>
                      </div>

                      {section.exercise.rewardXp && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold print:border-neutral-300 print:text-black">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          +{section.exercise.rewardXp} XP ao Entregar
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80 print:border-neutral-200">
                      <h5 className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider">
                        Instruções para o Aluno:
                      </h5>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-300 print:text-neutral-800">
                        {section.exercise.instructions.map((inst, iIdx) => (
                          <li key={iIdx} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-[11px] shrink-0 print:bg-neutral-200 print:text-black">
                              {iIdx + 1}
                            </span>
                            <span>{inst}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {section.exercise.expectedResult && (
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs text-emerald-300 print:bg-neutral-100 print:border-neutral-300 print:text-neutral-800">
                        <strong>Resultado Esperado:</strong> {section.exercise.expectedResult}
                      </div>
                    )}
                  </div>
                )}

                {/* Final Challenge Callout */}
                {section.type === 'final_challenge' && (
                  <div className="bg-gradient-to-r from-amber-950/40 via-slate-950 to-orange-950/40 border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-xl print:bg-neutral-50 print:border-neutral-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg print:bg-neutral-200 print:text-black">
                        <Trophy className="w-6 h-6 text-amber-400 print:text-black" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-base sm:text-lg font-black text-amber-300 print:text-black">
                          {section.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-300 print:text-neutral-800 leading-relaxed">
                          {section.content}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Booklet Footer */}
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 print:border-neutral-300 print:text-neutral-600">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>GAMEINFOR — Plataforma Gamificada de Aprendizagem</span>
            </div>
            <div>
              Material formatado para a disciplina de informática básica e avançada.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
