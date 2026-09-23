import React, { useState } from 'react';
import { useGameinfor } from '../../context/GameinforContext';
import { Trophy, Medal, Sparkles, Filter, ShieldCheck, Flame } from 'lucide-react';

export const StudentRanking: React.FC = () => {
  const { users, currentUser, levels } = useGameinfor();
  const [filterMode, setFilterMode] = useState<'turma' | 'geral'>('turma');

  // Filter students
  const students = users.filter((u) => u.role === 'aluno');
  const filteredStudents =
    filterMode === 'turma'
      ? students.filter((s) => s.classId === currentUser.classId)
      : students;

  // Sort descending by XP
  const sortedStudents = [...filteredStudents].sort((a, b) => b.xp - a.xp);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-400" />
            Ranking de XP e Liderança
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Pontue enviando atividades e acertando quizzes. O ranking exibe apenas apelidos para preservar a privacidade.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setFilterMode('turma')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'turma'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Minha Turma
          </button>
          <button
            onClick={() => setFilterMode('geral')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'geral'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ranking Geral
          </button>
        </div>
      </div>

      {/* Podium Top 3 */}
      {sortedStudents.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 pb-2 max-w-2xl mx-auto items-end">
          {/* 2nd Place */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 text-center space-y-2 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Medal className="w-3.5 h-3.5" /> 2º
            </div>
            <img
              src={sortedStudents[1].avatar}
              alt={sortedStudents[1].nickname}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto object-cover ring-2 ring-slate-400/50 mt-1"
            />
            <div className="font-bold text-white text-sm truncate">
              {sortedStudents[1].nickname || sortedStudents[1].name}
            </div>
            <div className="text-[11px] text-cyan-400 font-medium">
              Nível {sortedStudents[1].level}
            </div>
            <div className="text-xs font-black text-amber-400 bg-amber-500/10 py-1 rounded-lg">
              {sortedStudents[1].xp} XP
            </div>
          </div>

          {/* 1st Place */}
          <div className="bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/50 rounded-2xl p-5 text-center space-y-2.5 relative scale-105 shadow-xl shadow-amber-500/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 text-xs font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <Trophy className="w-4 h-4" /> 1º Lugar
            </div>
            <img
              src={sortedStudents[0].avatar}
              alt={sortedStudents[0].nickname}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mx-auto object-cover ring-4 ring-amber-400 mt-1 shadow-lg"
            />
            <div className="font-extrabold text-white text-base truncate">
              {sortedStudents[0].nickname || sortedStudents[0].name}
            </div>
            <div className="text-xs text-amber-300 font-semibold flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Nível {sortedStudents[0].level}
            </div>
            <div className="text-sm font-black text-amber-300 bg-amber-500/20 py-1.5 rounded-xl border border-amber-500/40">
              {sortedStudents[0].xp} XP
            </div>
          </div>

          {/* 3rd Place */}
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-4 text-center space-y-2 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-700 text-amber-100 text-xs font-black px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
              <Medal className="w-3.5 h-3.5" /> 3º
            </div>
            <img
              src={sortedStudents[2].avatar}
              alt={sortedStudents[2].nickname}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto object-cover ring-2 ring-amber-700/50 mt-1"
            />
            <div className="font-bold text-white text-sm truncate">
              {sortedStudents[2].nickname || sortedStudents[2].name}
            </div>
            <div className="text-[11px] text-cyan-400 font-medium">
              Nível {sortedStudents[2].level}
            </div>
            <div className="text-xs font-black text-amber-400 bg-amber-500/10 py-1 rounded-lg">
              {sortedStudents[2].xp} XP
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider">Tabela Completa</span>
          <span>{sortedStudents.length} Estudantes Participando</span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {sortedStudents.map((student, idx) => {
            const isMe = student.id === currentUser.id;
            const levelData = levels.find((l) => l.level === student.level) || levels[0];

            return (
              <div
                key={student.id}
                className={`p-4 flex items-center justify-between transition-colors ${
                  isMe
                    ? 'bg-blue-600/15 border-l-4 border-l-blue-500 text-white font-semibold'
                    : 'hover:bg-slate-800/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <span
                    className={`w-7 text-center font-extrabold text-sm ${
                      idx === 0
                        ? 'text-amber-400'
                        : idx === 1
                        ? 'text-slate-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>

                  <img
                    src={student.avatar}
                    alt={student.nickname}
                    className="w-10 h-10 rounded-xl object-cover ring-2 ring-slate-700"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white truncate">
                        {student.nickname || student.name}
                      </span>
                      {isMe && (
                        <span className="bg-blue-500 text-white text-[10px] font-black uppercase px-2 py-0.2 rounded-full">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Nível {student.level} — {levelData.title}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-right">
                    <div className="text-sm font-black text-amber-400 flex items-center justify-end gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      {student.xp}
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      XP Total
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
