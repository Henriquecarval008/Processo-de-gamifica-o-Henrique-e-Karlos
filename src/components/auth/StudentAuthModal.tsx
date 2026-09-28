import React, { useState } from 'react';
import { authService, AuthSession } from '../../services/authService';
import { AVATAR_PRESETS, getAvatarSvgDataUri } from '../../data/avatars';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

interface StudentAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  initialTab?: 'login' | 'register';
  onOpenTeacherAuth?: () => void;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'login',
  onOpenTeacherAuth,
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'choose_avatar'>(initialTab);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState('avatar-gamer');
  const [pendingSession, setPendingSession] = useState<AuthSession | null>(null);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setSuccessMessage('');
    setPendingSession(null);
    setSelectedAvatarId('avatar-gamer');
  };

  const handleTabChange = (newTab: 'login' | 'register') => {
    resetForm();
    setTab(newTab);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.loginStudent(email, password);
      if (res.success && res.session) {
        onSuccess(res.session);
        onClose();
        resetForm();
      } else {
        setErrorMessage(res.message || 'E-mail ou senha incorretos.');
      }
    } catch {
      setErrorMessage('Erro de conexão. Tente novamente em instantes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name.trim() || name.trim().length < 3) {
      setErrorMessage('Informe seu nome completo (mínimo de 3 caracteres).');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Informe um e-mail válido.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação da senha não confere.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.registerStudent({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.success) {
        if (res.session) {
          // Pass to Step 2: Choose Avatar
          setPendingSession(res.session);
          setTab('choose_avatar');
        } else {
          setSuccessMessage(res.message || 'Cadastro realizado com sucesso! Faça seu login.');
          setTab('login');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        setErrorMessage(res.message || 'Falha ao criar conta de aluno.');
      }
    } catch {
      setErrorMessage('Erro inesperado durante o cadastro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAvatarSelection = async () => {
    if (!pendingSession) return;
    setIsLoading(true);
    try {
      const userId = pendingSession.userId || pendingSession.teacherId;
      await authService.updateProfileAvatar(userId, selectedAvatarId);
      const updatedSession = { ...pendingSession, avatarId: selectedAvatarId };
      onSuccess(updatedSession);
      onClose();
      resetForm();
    } catch {
      // Fallback
      onSuccess(pendingSession);
      onClose();
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Decorative Header */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800 bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900">
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Espaço do Aluno
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                  GAMEINFOR
                </span>
              </div>
              <h2 className="text-xl font-black text-white">
                {tab === 'login'
                  ? 'Entrar na Plataforma'
                  : tab === 'register'
                  ? 'Criar Conta de Aluno'
                  : 'Escolha seu Avatar Inicial'}
              </h2>
            </div>
          </div>

          {/* Tab Switcher (only show during login/register) */}
          {tab !== 'choose_avatar' && (
            <div className="grid grid-cols-2 gap-1.5 mt-5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleTabChange('login')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'login'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Já tenho conta
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('register')}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  tab === 'register'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Criar nova conta
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  E-mail do Aluno
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar no GAMEINFOR
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@exemplo.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Senha (mín 6)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-2 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-2 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>O perfil será criado com perfil oficial de Aluno no GAMEINFOR.</span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    Avançar para Escolha de Avatar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Choose Avatar Step after Registration */}
          {tab === 'choose_avatar' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-950/40 border border-blue-500/30 rounded-2xl text-xs text-blue-200 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <strong className="block text-white font-bold">Conta criada com sucesso!</strong>
                  <span>Escolha abaixo seu personagem oficial para o perfil e ranking:</span>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = selectedAvatarId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedAvatarId(preset.id)}
                      className={`relative p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-cyan-400 ring-2 ring-cyan-400/40'
                          : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                      <img
                        src={getAvatarSvgDataUri(preset.id)}
                        alt={preset.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <span className="text-[10px] font-semibold text-white truncate max-w-[80px]">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleFinishAvatarSelection}
                disabled={isLoading}
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando perfil...
                  </>
                ) : (
                  <>
                    Concluir e Entrar no GAMEINFOR
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Teacher link fallback */}
          {onOpenTeacherAuth && tab !== 'choose_avatar' && (
            <div className="pt-3 border-t border-slate-800/80 text-center">
              <p className="text-xs text-slate-400">
                É professor ou instrutor?{' '}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTeacherAuth();
                  }}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
                >
                  Entrar na Área do Professor
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
