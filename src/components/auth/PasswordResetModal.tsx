/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, X, ShieldCheck } from 'lucide-react';
import { authService } from '../../services/authService';
import { soundEffects } from '../../utils/soundEffects';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountEmail?: string;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accountEmail,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resolvedEmail =
    accountEmail ||
    (typeof window !== 'undefined' ? sessionStorage.getItem('gameinfor_recovery_email') : '') ||
    '';

  if (!isOpen) return null;

  const handleClose = () => {
    soundEffects.playClick();
    setError(null);
    setSuccessMsg(null);
    setNewPassword('');
    setConfirmNewPassword('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setError(null);
    setSuccessMsg(null);

    if (newPassword !== confirmNewPassword) {
      soundEffects.playWrong();
      setError('A confirmação não coincide com a nova senha digitada.');
      return;
    }

    const validation = authService.validatePassword(newPassword);
    if (!validation.isValid) {
      soundEffects.playWrong();
      setError(validation.errors.join(' '));
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authService.updatePassword(newPassword, confirmNewPassword);

      if (res.success) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        soundEffects.playWrong();
        setError(res.message);
      }
    } catch {
      soundEffects.playWrong();
      setError('Erro ao salvar a nova senha no Supabase. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmNewPassword;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border-t-2 border-t-emerald-500">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Redefinir Senha de Acesso</h2>
              <p className="text-xs text-slate-400">Supabase Auth — GAMEINFOR</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Sessão de Recuperação Autenticada</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Você acessou a plataforma através do link oficial de recuperação. Cadastre sua nova senha abaixo.
            </p>
            {resolvedEmail && (
              <p className="text-[11px] text-cyan-300 font-mono pt-1">
                Conta: <strong>{resolvedEmail}</strong>
              </p>
            )}
          </div>

          {/* Nova Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Nova senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
                autoFocus
                disabled={isSubmitting || Boolean(successMsg)}
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirmar nova senha
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                required
                disabled={isSubmitting || Boolean(successMsg)}
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Requirements Badges */}
          <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className={hasMinLength ? 'text-emerald-300 font-medium' : ''}>Mínimo de 8 caracteres</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${hasLetter && hasNumber ? 'bg-emerald-400' : 'bg-slate-600'}`} />
              <span className={hasLetter && hasNumber ? 'text-emerald-300 font-medium' : ''}>Ao menos uma letra e um número</span>
            </div>
            {confirmNewPassword.length > 0 && (
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                <span className={passwordsMatch ? 'text-emerald-300 font-medium' : 'text-rose-400'}>
                  {passwordsMatch ? 'Senhas coincidem' : 'As senhas não coincidem'}
                </span>
              </div>
            )}
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <span className="font-bold block text-white mb-0.5">Senha Alterada!</span>
                <span>{successMsg}</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isSubmitting || !hasMinLength || !passwordsMatch || Boolean(successMsg)}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <KeyRound className="w-4 h-4" />
            {isSubmitting ? 'Salvando nova senha...' : 'Salvar Nova Senha'}
          </button>

          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Cancelar e voltar à página inicial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
