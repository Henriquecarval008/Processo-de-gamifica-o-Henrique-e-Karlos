import React from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import { Settings, Shield, Bell, Key, RefreshCw } from 'lucide-react';

export const TeacherSettings: React.FC = () => {
  const { currentUser, resetAllData } = useGameinfor();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-7 h-7 text-indigo-400" />
          Configurações do Professor
        </h1>
        <p className="text-sm text-slate-300 mt-1">
          Preferências pedagógicas, notificações e gestão de dados da sessão.
        </p>
      </div>

      {/* Account Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Dados do Instrutor
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Nome Completo</label>
            <input
              type="text"
              readOnly
              value={currentUser.name}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1">E-mail Profissional</label>
            <input
              type="email"
              readOnly
              value={currentUser.email}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>
      </div>

      {/* Demo State Control */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-cyan-400" />
          Restaurar Demonstração Original
        </h3>
        <p className="text-xs text-slate-300">
          Caso queira recarregar os alunos, turmas e atividades originais da demonstração da plataforma:
        </p>
        <button
          onClick={resetAllData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
        >
          Restaurar Dados Iniciais
        </button>
      </div>
    </div>
  );
};
