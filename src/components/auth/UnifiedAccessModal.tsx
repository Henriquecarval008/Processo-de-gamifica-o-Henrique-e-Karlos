import React, { useState } from 'react';
import {
  Shield,
  GraduationCap,
  Gamepad2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  KeyRound,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { authService, AuthSession } from '../../services/authService';
import { soundEffects } from '../../utils/soundEffects';

export type AccessRoleTab = 'admin' | 'professor' | 'aluno';

interface UnifiedAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessAdmin: (session: AuthSession) => void;
  onSuccessTeacher: (session: AuthSession) => void;
  onSuccessStudent: (session: AuthSession) => void;
  onForgotPassword: (email?: string) => void;
  initialRoleTab?: AccessRoleTab;
}

export const UnifiedAccessModal: React.FC<UnifiedAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccessAdmin,
  onSuccessTeacher,
  onSuccessStudent,
  onForgotPassword,
  initialRoleTab = 'admin',
}) => {
  const [selectedRole, setSelectedRole] = useState<AccessRoleTab>(initialRoleTab);
  const [studentMode, setStudentMode] = useState<'login' | 'register'>('login');

  // Admin form
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Teacher form
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);

  // Student form (Login)
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Student form (Register)
  const [regName, setRegName] = useState('');
  const [regNickname, setRegNickname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regClassCode, setRegClassCode] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    soundEffects.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);
    onClose();
  };

  const handleTabChange = (role: AccessRoleTab) => {
    soundEffects.playClick();
    setSelectedRole(role);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  // Submit Admin Login
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.loginAdmin(adminUsername, adminPassword);
      if (res.success && res.session) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccessAdmin(res.session!);
          handleClose();
        }, 600);
      } else {
        soundEffects.playWrong();
        setErrorMsg(res.message || 'Falha na autenticação administrativa.');
      }
    } catch {
      soundEffects.playWrong();
      setErrorMsg('Erro de conexão ao autenticar administrador.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Teacher Login
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.loginTeacher(teacherEmail, teacherPassword);
      if (res.success && res.session) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccessTeacher(res.session!);
          handleClose();
        }, 600);
      } else {
        soundEffects.playWrong();
        setErrorMsg(res.message || 'Credenciais inválidas para área docente.');
      }
    } catch {
      soundEffects.playWrong();
      setErrorMsg('Erro de conexão ao autenticar professor.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Student Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const res = await authService.loginStudent(studentEmail, studentPassword);
      if (res.success && res.session) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccessStudent(res.session!);
          handleClose();
        }, 600);
      } else {
        soundEffects.playWrong();
        setErrorMsg(res.message || 'Credenciais de aluno incorretas.');
      }
    } catch {
      soundEffects.playWrong();
      setErrorMsg('Erro de conexão ao autenticar aluno.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Student Self-Registration
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playClick();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      soundEffects.playWrong();
      setErrorMsg('A confirmação de senha não coincide com a senha digitada.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.registerStudent({
        name: regName,
        nickname: regNickname,
        email: regEmail,
        password: regPassword,
        classCode: regClassCode,
      });

      if (res.success) {
        soundEffects.playCorrect();
        setSuccessMsg(res.message);
        if (res.session) {
          setTimeout(() => {
            onSuccessStudent(res.session!);
            handleClose();
          }, 800);
        } else {
          setStudentMode('login');
          setStudentEmail(regEmail);
        }
      } else {
        soundEffects.playWrong();
        setErrorMsg(res.message || 'Falha ao criar conta de aluno.');
      }
    } catch {
      soundEffects.playWrong();
      setErrorMsg('Erro de conexão ao realizar cadastro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">Portal de Acesso</h2>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Instituto Ambiente
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Selecione o seu perfil para entrar no GAMEINFOR
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Main Role Selection Tabs */}
        <div className="p-3 bg-slate-950 border-b border-slate-800/80">
          <div className="grid grid-cols-3 gap-2">
            {/* 1. Administrador */}
            <button
              onClick={() => handleTabChange('admin')}
              className={`py-3 px-2 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-purple-600/30 text-purple-200 border-2 border-purple-500 shadow-md shadow-purple-500/20'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Shield className={`w-5 h-5 ${selectedRole === 'admin' ? 'text-purple-400' : ''}`} />
              <span>Administrador</span>
              <span className="text-[9px] font-semibold text-slate-400">Henrique & Karlos</span>
            </button>

            {/* 2. Professor */}
            <button
              onClick={() => handleTabChange('professor')}
              className={`py-3 px-2 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'professor'
                  ? 'bg-indigo-600/30 text-indigo-200 border-2 border-indigo-500 shadow-md shadow-indigo-500/20'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className={`w-5 h-5 ${selectedRole === 'professor' ? 'text-indigo-400' : ''}`} />
              <span>Professor</span>
              <span className="text-[9px] font-semibold text-slate-400">Área Docente</span>
            </button>

            {/* 3. Aluno */}
            <button
              onClick={() => handleTabChange('aluno')}
              className={`py-3 px-2 rounded-2xl font-bold text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                selectedRole === 'aluno'
                  ? 'bg-blue-600/30 text-blue-200 border-2 border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Gamepad2 className={`w-5 h-5 ${selectedRole === 'aluno' ? 'text-blue-400' : ''}`} />
              <span>Aluno</span>
              <span className="text-[9px] font-semibold text-slate-400">Trilha Gamificada</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Notifications */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* 1. FORMULÁRIO ADMINISTRATIVO (Henrique Carvalho & Karlos)      */}
          {/* ============================================================== */}
          {selectedRole === 'admin' && (
            <form onSubmit={handleAdminSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-2.5 text-purple-200 text-[11px] leading-relaxed">
                <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-purple-300">Acesso Administrativo Central:</strong>
                  <p>
                    Contas com autoridade completa: <strong>Henrique Carvalho</strong> (usuário <code className="bg-purple-900/60 px-1 py-0.5 rounded text-white">admin</code>) e <strong>Karlos</strong> (usuário <code className="bg-purple-900/60 px-1 py-0.5 rounded text-white">karlos</code>).
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Nome de Usuário ou E-mail do Administrador:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    placeholder="Ex: admin ou karlos"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">Senha:</label>
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onForgotPassword(adminUsername.includes('@') ? adminUsername : 'admin@gameinfor.com');
                    }}
                    className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Digite sua senha individual"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="p-1.5 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
                    title={showAdminPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Verificando Credenciais...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Entrar no Painel Administrativo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================== */}
          {/* 2. FORMULÁRIO DO PROFESSOR                                     */}
          {/* ============================================================== */}
          {selectedRole === 'professor' && (
            <form onSubmit={handleTeacherSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-2.5 text-indigo-200 text-[11px] leading-relaxed">
                <GraduationCap className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-indigo-300">Acesso Exclusivo para Docentes:</strong>
                  <p>
                    Acesse sua conta autorizada para gerenciar turmas, publicar conteúdos e acompanhar o progresso dos alunos nos projetos do Instituto Ambiente.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">E-mail do Professor:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    placeholder="professor@gameinfor.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-semibold">Senha:</label>
                  <button
                    type="button"
                    onClick={() => {
                      handleClose();
                      onForgotPassword(teacherEmail);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showTeacherPassword ? 'text' : 'password'}
                    required
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                    className="p-1.5 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
                    title={showTeacherPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>Autenticando Docente...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    <span>Entrar na Área do Professor</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================== */}
          {/* 3. FORMULÁRIO DO ALUNO (Login & Auto-cadastro)                 */}
          {/* ============================================================== */}
          {selectedRole === 'aluno' && (
            <div className="space-y-4 text-xs">
              {/* Student Mode Switcher */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setStudentMode('login')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    studentMode === 'login'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Entrar com Conta Existente
                </button>
                <button
                  type="button"
                  onClick={() => setStudentMode('register')}
                  className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    studentMode === 'register'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Criar Cadastro de Aluno
                </button>
              </div>

              {studentMode === 'login' ? (
                /* Aluno: Login */
                <form onSubmit={handleStudentLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">E-mail do Aluno:</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        placeholder="aluno@exemplo.com"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-semibold">Senha:</label>
                      <button
                        type="button"
                        onClick={() => {
                          handleClose();
                          onForgotPassword(studentEmail);
                        }}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showStudentPassword ? 'text' : 'password'}
                        required
                        value={studentPassword}
                        onChange={(e) => setStudentPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowStudentPassword(!showStudentPassword)}
                        className="p-1.5 text-slate-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2"
                      >
                        {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? 'Entrando...' : 'Entrar como Aluno'}
                  </button>
                </form>
              ) : (
                /* Aluno: Auto-cadastro */
                <form onSubmit={handleStudentRegister} className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-[11px] text-blue-200">
                    Cadastro direto de aluno para os cursos e oficinas do <strong>Instituto Ambiente</strong>.
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Nome Completo:</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gabriel Santos"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Apelido (Ranking):</label>
                      <input
                        type="text"
                        placeholder="Ex: GabiDev"
                        value={regNickname}
                        onChange={(e) => setRegNickname(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Código da Turma:</label>
                      <input
                        type="text"
                        placeholder="Ex: ALPHA ou BETA"
                        value={regClassCode}
                        onChange={(e) => setRegClassCode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 uppercase font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">E-mail de Contato:</label>
                    <input
                      type="email"
                      required
                      placeholder="seu.email@exemplo.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Senha (min. 6 car.):</label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Crie sua senha"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Confirmar Senha:</label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isLoading ? 'Cadastrando Aluno...' : 'Finalizar Cadastro'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
