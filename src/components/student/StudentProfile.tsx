import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import {
  User as UserIcon,
  Sparkles,
  Trophy,
  Shield,
  Edit2,
  Check,
  Award,
  Calendar,
  Mail,
  BookOpen,
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { currentUser, levels, submissions, achievements, updateUserNickname } =
    useGameinfor();

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(currentUser.nickname || '');

  const currentLevel = levels.find((l) => l.level === currentUser.level) || levels[0];
  const mySubmissions = submissions.filter((s) => s.studentId === currentUser.id);
  const correctedCount = mySubmissions.filter((s) => s.status === 'corrigido').length;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const handleSaveNickname = () => {
    if (nicknameInput.trim()) {
      updateUserNickname(nicknameInput.trim());
      setIsEditingNickname(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Card Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-500/40 shadow-2xl"
            />
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <Trophy className="w-4 h-4 text-amber-400" />
            </div>
          </div>

          <div className="text-center sm:text-left space-y-2 flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-white">{currentUser.name}</h1>
              <span className="text-xs bg-blue-500/20 text-cyan-300 border border-blue-500/30 px-2.5 py-0.5 rounded-full font-bold uppercase">
                {currentUser.role}
              </span>
            </div>

            {/* Nickname Editor */}
            <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-300">
              <span className="text-slate-400">Apelido no Ranking:</span>
              {isEditingNickname ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    className="bg-slate-950 border border-blue-500 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                    placeholder="Seu apelido gamer"
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white"
                    title="Salvar apelido"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <strong className="text-cyan-400 font-extrabold">
                    {currentUser.nickname || 'Não definido'}
                  </strong>
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Alterar apelido"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400">
              {currentUser.bio || 'Aluno em formação de Informática Profissional.'}
            </p>
          </div>

          {/* Gamification Box */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center min-w-[150px]">
            <div className="text-xs font-semibold text-cyan-400 uppercase">
              {currentLevel.title}
            </div>
            <div className="text-2xl font-black text-amber-400 mt-1 flex items-center justify-center gap-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {currentUser.xp} XP
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Nível {currentUser.level}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-cyan-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Turma Matriculada</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {currentUser.className || 'Projeto Crescer e Transformar'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Atividades Aprovadas</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {correctedCount} concluídas
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Conquistas Ganhas</div>
            <div className="text-sm font-bold text-white mt-0.5">
              {unlockedCount} troféus
            </div>
          </div>
        </div>
      </div>

      {/* Account Info & Privacy Note */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          Privacidade e Segurança no GAMEINFOR
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Seus arquivos enviados são totalmente privados e visíveis apenas pelo seu professor e pela administração. No ranking público, somente seu apelido e pontuação de XP são exibidos para outros estudantes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
            <Mail className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">E-mail:</span>
            <span className="text-slate-200 font-mono truncate">{currentUser.email}</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400">Membro desde:</span>
            <span className="text-slate-200 font-semibold">{currentUser.joinedAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
