import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Send,
  RefreshCw,
  Info,
} from 'lucide-react';
import { authService, AuthSession } from '../../services/authService';
import { soundEffects } from '../../utils/soundEffects';

type AuthStep =
  | 'login'
  | 'register'
  | 'verify_email'
  | 'forgot_password'
  | 'reset_password';

interface TeacherAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  initialStep?: AuthStep;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialStep = 'login',
}) => {
  const [step, setStep] = useState<AuthStep>(initialStep);

  useEffect(() => {
    if (initialStep) {
      setStep(initialStep);
    }
  }, [initialStep]);

  // Form states - strictly empty by default (no hardcoded credentials)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetFormState = () => {
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleClose = () => {
    soundEffects.playClick();
    resetFormState();
    onClose();
  };

  const goToStep = (newStep: AuthStep) => {
    soundEffects.playClick();
    setError(null);
    setSuccessMsg(null);
    setStep(newStep);
  };

  // 1. Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authService.loginTeacher(email, password);
      if (res.success && res.session) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
        setTimeout(() => {
          resetFormState();
          onSuccess(res.session!);
        }, 500);
      } else if (res.needsVerification) {
        soundEffects.playWrong();
        setError(res.message);
        setStep('verify_email');
      } else {
        soundEffects.playWrong();
        setError(res.message);
      }
    } catch {
      setError('Erro ao processar autenticação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authService.registerTeacher(name, email, password, confirmPassword);
      if (res.success) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
        setStep('verify_email');
      } else {
        soundEffects.playWrong();
        setError(res.message);
      }
    } catch {
      setError('Erro ao criar conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Handle Verify Email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await authService.verifyEmail(email, verificationCode);
      if (res.success && res.session) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
        setTimeout(() => {
          resetFormState();
          onSuccess(res.session!);
        }, 600);
      } else {
        soundEffects.playWrong();
        setError(res.message);
      }
    } catch {
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    soundEffects.playClick();
    setError(null);
    try {
      const res = await authService.resendVerificationCode(email);
      if (res.success) {
        soundEffects.playCorrect();
        setSuccessMsg('Um novo código de ativação foi enviado para seu e-mail.');
      } else {
        setError(res.message);
      }
    } catch {
      setError('Erro ao reenviar código.');
    }
  };

  // 4. Handle Forgot Password Request (Supabase Auth oficial)
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authService.requestPasswordReset(email);
      if (res.success) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
      } else {
        soundEffects.playWrong();
        setError(res.message);
      }
    } catch {
      setError('Erro ao solicitar redefinição de senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Handle Reset Password Submit (Supabase Auth updateUser)
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authService.updatePassword(
        newPassword,
        confirmNewPassword
      );
      if (res.success) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
        setTimeout(() => {
          goToStep('login');
        }, 1500);
      } else {
        soundEffects.playWrong();
        setError(res.message);
      }
    } catch {
      setError('Erro ao atualizar senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border-t-2 border-t-indigo-500">
        {/* Header Bar */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">
                {step === 'login' && 'Área do Professor'}
                {step === 'register' && 'Criar conta de professor'}
                {step === 'verify_email' && 'Verificação de Conta'}
                {step === 'forgot_password' && 'Recuperar Senha'}
                {step === 'reset_password' && 'Redefinir senha'}
              </h2>
              <p className="text-xs text-slate-400">
                {step === 'login' && 'Autenticação segura de docentes e coordenadores'}
                {step === 'register' && 'Cadastro individual com credenciais exclusivas'}
                {step === 'verify_email' && 'Confirmação de e-mail para liberação'}
                {step === 'forgot_password' && 'Envio de link seguro para redefinição'}
                {step === 'reset_password' && 'Cadastre uma nova senha de acesso'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================
            SCREEN 1: LOGIN DO PROFESSOR
           ======================================================== */}
        {step === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@instituicao.com.br"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                  autoFocus
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => goToStep('forgot_password')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha cadastrada"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {isSubmitting ? 'Verificando...' : 'Entrar'}
            </button>

            <div className="pt-3 border-t border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                Ainda não possui conta de docente?{' '}
                <button
                  type="button"
                  onClick={() => goToStep('register')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                >
                  Criar conta de professor
                </button>
              </p>
            </div>
          </form>
        )}

        {/* ========================================================
            SCREEN 2: CRIAR CONTA DE PROFESSOR
           ======================================================== */}
        {step === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo do professor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                  autoFocus
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@escola.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres (letras e números)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirmar senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha digitada"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs space-y-1 text-slate-400">
              <div className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Critérios de Segurança:
              </div>
              <div className="flex items-center gap-2">
                <span className={password.length >= 8 ? 'text-emerald-400' : 'text-slate-500'}>
                  {password.length >= 8 ? '✓' : '○'} Mínimo de 8 caracteres
                </span>
                <span>·</span>
                <span
                  className={
                    /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }
                >
                  {/[a-zA-Z]/.test(password) && /[0-9]/.test(password) ? '✓' : '○'} Letras e números
                </span>
              </div>
              <div className={password && confirmPassword && password === confirmPassword ? 'text-emerald-400' : 'text-slate-500'}>
                {password && confirmPassword && password === confirmPassword ? '✓' : '○'} Confirmação de senha idêntica
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <User className="w-4 h-4" />
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => goToStep('login')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Já possui uma conta? Fazer login
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            SCREEN 3: CONFIRMAÇÃO DO E-MAIL
           ======================================================== */}
        {step === 'verify_email' && (
          <form onSubmit={handleVerifyEmail} className="p-6 space-y-4">
            <div className="text-center py-2">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mx-auto flex items-center justify-center mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">
                Verifique seu e-mail para ativar sua conta
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                Digite o código de verificação de 6 dígitos enviado para <strong>{email}</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 text-center">
                Código de Ativação
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                placeholder="Ex: 123456"
                className="w-full max-w-xs mx-auto block bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-center font-mono text-xl font-bold tracking-widest text-cyan-300 focus:outline-none focus:border-indigo-500 transition-colors"
                maxLength={6}
                required
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || verificationCode.length < 6}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Ativando...' : 'Ativar Conta & Acessar'}
            </button>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reenviar código
              </button>
              <button
                type="button"
                onClick={() => goToStep('login')}
                className="text-slate-400 hover:text-white"
              >
                Voltar ao login
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            SCREEN 4: ESQUECI MINHA SENHA (RECUPERAÇÃO REAL SUPABASE)
           ======================================================== */}
        {step === 'forgot_password' && (
          <form onSubmit={handleForgotPasswordSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300">
              <span className="font-bold block mb-1 text-white">Recuperação de Senha (Supabase Auth)</span>
              Informe seu e-mail de professor para receber um link seguro de redefinição de senha na sua caixa de entrada.
            </div>

            {!successMsg ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    E-mail cadastrado
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@instituicao.com.br"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      required
                      autoFocus
                    />
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
                </button>
              </>
            ) : (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs leading-relaxed">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <span className="font-bold block text-white mb-1">Solicitação enviada com sucesso!</span>
                    <span>{successMsg}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Abra o e-mail recebido e clique no link de redefinição para abrir a tela de definição de nova senha no GAMEINFOR.
                </p>
              </div>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => goToStep('login')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar ao login
              </button>
            </div>
          </form>
        )}

        {/* ========================================================
            SCREEN 5: REDEFINIR SENHA (DEFINIR NOVA SENHA)
           ======================================================== */}
        {step === 'reset_password' && (
          <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-300">
              <span className="font-bold block mb-1 text-white">Criar Nova Senha</span>
              Cadastre sua nova senha de acesso para sua conta de professor no Supabase.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nova senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha (mínimo 8 caracteres)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                  autoFocus
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title={showNewPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {isSubmitting ? 'Salvando...' : 'Salvar nova senha'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => goToStep('login')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cancelar e voltar ao login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
