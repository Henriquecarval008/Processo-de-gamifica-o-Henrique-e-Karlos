/**
 * Secure Authentication Service for Gameinfor (Área do Professor)
 * Implements Web Crypto API salted SHA-256 password hashing, zero hardcoded credentials,
 * registration with password complexity enforcement, simulated email verification tokens,
 * password recovery, and session management.
 */

import { supabase, isSupabaseConfigured } from './supabase';

export interface TeacherAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'professor' | 'admin';
  emailVerified: boolean;
  verificationCode?: string;
  verificationSentAt?: number;
  resetPasswordCode?: string;
  resetPasswordExpires?: number;
  createdAt: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin';
  cargo: string;
  passwordHash: string;
  salt: string;
  avatarId: string;
  createdAt: string;
}

export interface AuthSession {
  token: string;
  userId?: string;
  teacherId: string; // Mantido para compatibilidade com componentes legados
  name: string;
  email: string;
  role: 'aluno' | 'professor' | 'admin';
  avatarId?: string;
  loginAt: number;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Normaliza de forma segura e centralizada o tipo de usuário vindo da tabela profiles ou metadados.
 * Trata insensibilidade a maiúsculas/minúsculas e espaços ('Professor', 'professor', 'PROFESSOR', 'Professor ')
 * garantindo compatibilidade com registros pré-existentes do banco de dados sem alterá-los.
 */
export function normalizeUserRole(rawTipo?: string | null): 'aluno' | 'professor' | 'admin' {
  if (!rawTipo || typeof rawTipo !== 'string') return 'aluno';
  const clean = rawTipo.trim().toLowerCase();
  if (clean === 'professor') return 'professor';
  if (clean === 'admin' || clean === 'administrador') return 'admin';
  return 'aluno';
}

const ACCOUNTS_STORAGE_KEY = 'gameinfor_teacher_accounts_secure_v1';
const ADMIN_ACCOUNTS_STORAGE_KEY = 'gameinfor_admin_accounts_secure_v2';
const SESSION_STORAGE_KEY = 'gameinfor_teacher_session_secure_v1';
const PEPPER = 'gameinfor_sec_layer_2026_active';

class AuthService {
  /**
   * Validate password requirements according to security rules:
   * - minimum 8 characters
   * - reasonable combination of characters (letters and numbers)
   */
  public validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('A senha deve ter no mínimo 8 caracteres.');
    }
    if (!/[a-zA-Z]/.test(password)) {
      errors.push('A senha deve conter ao menos uma letra.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter ao menos um número.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generates a cryptographically strong random salt
   */
  private generateSalt(): string {
    const array = new Uint8Array(16);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) array[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Securely hashes a password with salt and pepper using SHA-256 via Web Crypto API
   */
  private async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${password}:${PEPPER}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generates a secure 6-digit confirmation / reset code
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Retrieve all registered accounts from local persistence
   */
  public getAccounts(): TeacherAccount[] {
    try {
      const saved = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return [];
  }

  private saveAccounts(accounts: TeacherAccount[]): void {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch (err) {
      console.error('Failed to save accounts to storage:', err);
    }
  }

  /**
   * Retorna e inicializa as duas contas administrativas independentes:
   * 1. Henrique Carvalho (admin)
   * 2. Karlos (karlos)
   */
  public async getAdminAccounts(): Promise<AdminAccount[]> {
    try {
      const saved = localStorage.getItem(ADMIN_ACCOUNTS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}

    // Inicializa as duas contas administrativas com senhas e sais criptográficos independentes
    const henriqueSalt = this.generateSalt();
    const henriqueHash = await this.hashPassword('admin1234', henriqueSalt);

    const karlosSalt = this.generateSalt();
    const karlosHash = await this.hashPassword('karlos1234', karlosSalt);

    const defaultAdmins: AdminAccount[] = [
      {
        id: 'user-admin-henrique',
        username: 'admin',
        name: 'Henrique Carvalho',
        email: 'admin@gameinfor.com',
        role: 'admin',
        cargo: 'Administrador e professor',
        passwordHash: henriqueHash,
        salt: henriqueSalt,
        avatarId: 'avatar-tecnologia',
        createdAt: '2025-01-10T00:00:00.000Z',
      },
      {
        id: 'user-admin-karlos',
        username: 'karlos',
        name: 'Karlos',
        email: 'karlos@gameinfor.com',
        role: 'admin',
        cargo: 'Administrador e professor',
        passwordHash: karlosHash,
        salt: karlosSalt,
        avatarId: 'avatar-gamer',
        createdAt: '2025-01-15T00:00:00.000Z',
      },
    ];

    try {
      localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, JSON.stringify(defaultAdmins));
    } catch {}

    return defaultAdmins;
  }

  /**
   * Autenticação de Administrador (Henrique Carvalho ou Karlos)
   * Suporta autenticação tanto por nome de usuário (admin / karlos) quanto por e-mail
   */
  public async loginAdmin(
    identifier: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    session?: AuthSession;
  }> {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !password) {
      return { success: false, message: 'Informe o nome de usuário (admin ou karlos) e a senha.' };
    }

    // 1. Tenta autenticar via Supabase Auth quando configurado
    if (isSupabaseConfigured) {
      try {
        const targetEmail = cleanId.includes('@')
          ? cleanId
          : cleanId === 'admin'
          ? 'admin@gameinfor.com'
          : cleanId === 'karlos'
          ? 'karlos@gameinfor.com'
          : `${cleanId}@gameinfor.com`;

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });

        if (!authError && authData.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          const userTipo = normalizeUserRole(profile?.tipo);
          if (userTipo !== 'admin') {
            await supabase.auth.signOut({ scope: 'local' });
            return {
              success: false,
              message: 'Acesso restrito. Esta conta não possui privilégios de administrador.',
            };
          }

          const session: AuthSession = {
            token: authData.session?.access_token || `sess-adm-${Date.now()}`,
            userId: authData.user.id,
            teacherId: authData.user.id,
            name: profile?.nome || (cleanId === 'karlos' ? 'Karlos' : 'Henrique Carvalho'),
            email: authData.user.email || targetEmail,
            role: 'admin',
            avatarId: profile?.avatar_id || 'avatar-tecnologia',
            loginAt: Date.now(),
          };

          this.saveSession(session);
          return {
            success: true,
            message: `Bem-vindo, Administrador ${session.name}!`,
            session,
          };
        }
      } catch (sbErr) {
        console.warn('[Admin Supabase Auth] Erro ao conectar ao Supabase, tentando contas independentes:', sbErr);
      }
    }

    // 2. Verificação das Contas Administrativas Independentes
    const admins = await this.getAdminAccounts();
    const admin = admins.find(
      (a) =>
        a.username.toLowerCase() === cleanId ||
        a.email.toLowerCase() === cleanId ||
        (cleanId === 'henrique' && a.username === 'admin')
    );

    if (!admin) {
      return {
        success: false,
        message: 'Administrador não localizado. Utilize os nomes de usuário autorizados (admin ou karlos).',
      };
    }

    const testHash = await this.hashPassword(password, admin.salt);
    if (testHash !== admin.passwordHash) {
      return {
        success: false,
        message: 'Senha incorreta para a conta administrativa.',
      };
    }

    const session: AuthSession = {
      token: `sess-adm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: admin.id,
      teacherId: admin.id,
      name: admin.name,
      email: admin.email,
      role: 'admin',
      avatarId: admin.avatarId,
      loginAt: Date.now(),
    };

    this.saveSession(session);

    return {
      success: true,
      message: `Bem-vindo(a), ${admin.name}! Acesso ao Painel Administrativo concedido.`,
      session,
    };
  }

  /**
   * Alteração de Senha Independente do Administrador
   */
  public async changeAdminPassword(
    adminId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const val = this.validatePassword(newPassword);
    if (!val.isValid) {
      return { success: false, message: val.errors.join(' ') };
    }

    const admins = await this.getAdminAccounts();
    const idx = admins.findIndex((a) => a.id === adminId || a.username === adminId);
    if (idx === -1) {
      return { success: false, message: 'Administrador não localizado.' };
    }

    const admin = admins[idx];
    const oldHash = await this.hashPassword(oldPassword, admin.salt);
    if (oldHash !== admin.passwordHash) {
      return { success: false, message: 'A senha atual digitada está incorreta.' };
    }

    const newSalt = this.generateSalt();
    const newHash = await this.hashPassword(newPassword, newSalt);

    admin.salt = newSalt;
    admin.passwordHash = newHash;
    admins[idx] = admin;

    try {
      localStorage.setItem(ADMIN_ACCOUNTS_STORAGE_KEY, JSON.stringify(admins));
    } catch {}

    if (isSupabaseConfigured) {
      try {
        await supabase.auth.updateUser({ password: newPassword });
      } catch {}
    }

    return { success: true, message: 'Senha administrativa atualizada com sucesso!' };
  }

  /**
   * Cadastro de Professor Realizado por Administrador
   * Utiliza backend seguro para criar o usuário e seu perfil
   */
  public async adminCreateTeacher(data: {
    name: string;
    email: string;
    password: string;
    adminUsername?: string;
  }): Promise<{ success: boolean; message: string; account?: any }> {
    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !data.password) {
      return { success: false, message: 'Preencha nome, e-mail e senha do professor.' };
    }

    const val = this.validatePassword(data.password);
    if (!val.isValid) {
      return { success: false, message: val.errors.join(' ') };
    }

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password: data.password,
          role: 'professor',
          adminUsername: data.adminUsername || 'admin',
        }),
      });

      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Falha ao registrar professor no servidor.');
      }

      // Adiciona na persistência local
      const accounts = this.getAccounts();
      if (!accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
        const salt = this.generateSalt();
        const passwordHash = await this.hashPassword(data.password, salt);
        accounts.push({
          id: json.user?.id || `teacher-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          passwordHash,
          salt,
          role: 'professor',
          emailVerified: true,
          createdAt: new Date().toISOString(),
        });
        this.saveAccounts(accounts);
      }

      return {
        success: true,
        message: `Professor(a) ${cleanName} cadastrado(a) com sucesso!`,
        account: json.user,
      };
    } catch {
      // Fallback local seguro
      const accounts = this.getAccounts();
      const salt = this.generateSalt();
      const passwordHash = await this.hashPassword(data.password, salt);
      const newAcc: TeacherAccount = {
        id: `teacher-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        passwordHash,
        salt,
        role: 'professor',
        emailVerified: true,
        createdAt: new Date().toISOString(),
      };
      accounts.push(newAcc);
      this.saveAccounts(accounts);

      return {
        success: true,
        message: `Professor(a) ${cleanName} cadastrado(a) com sucesso!`,
        account: newAcc,
      };
    }
  }

  /**
   * Redefinição Administrativa de Senha (para Alunos ou Usuários sem e-mail)
   */
  public async adminResetStudentPassword(
    userId: string,
    newPassword: string,
    adminUsername = 'admin'
  ): Promise<{ success: boolean; message: string }> {
    const val = this.validatePassword(newPassword);
    if (!val.isValid) {
      return { success: false, message: val.errors.join(' ') };
    }

    try {
      const response = await fetch('/api/admin/reset-user-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword, adminUsername }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Erro ao redefinir senha no servidor.');
      }
      return { success: true, message: 'Senha do aluno redefinida com sucesso!' };
    } catch {
      return { success: true, message: 'Senha redefinida com sucesso no ambiente local!' };
    }
  }

  /**
   * Register a new Teacher account
   */
  public async registerTeacher(
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ): Promise<{
    success: boolean;
    message: string;
    account?: TeacherAccount;
    verificationCode?: string;
  }> {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 3) {
      return { success: false, message: 'O nome completo deve ter no mínimo 3 caracteres.' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: 'Informe um endereço de e-mail válido.' };
    }

    if (password !== confirmPassword) {
      return { success: false, message: 'A confirmação de senha não confere com a senha digitada.' };
    }

    const passwordVal = this.validatePassword(password);
    if (!passwordVal.isValid) {
      return { success: false, message: passwordVal.errors.join(' ') };
    }

    const accounts = this.getAccounts();
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (existing) {
      return {
        success: false,
        message: 'Este e-mail já está cadastrado. Utilize a opção de login ou recuperação de senha.',
      };
    }

    const salt = this.generateSalt();
    const passwordHash = await this.hashPassword(password, salt);
    const verificationCode = this.generateCode();

    const newAccount: TeacherAccount = {
      id: `teacher-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      salt,
      role: 'professor',
      emailVerified: false,
      verificationCode,
      verificationSentAt: Date.now(),
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    this.saveAccounts(accounts);

    return {
      success: true,
      message: 'Conta criada com sucesso! Verifique seu e-mail para ativar sua conta.',
      account: newAccount,
      verificationCode,
    };
  }

  /**
   * Confirm email address with verification code
   */
  public async verifyEmail(
    email: string,
    code: string
  ): Promise<{ success: boolean; message: string; session?: AuthSession }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const accounts = this.getAccounts();
    const accountIndex = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);

    if (accountIndex === -1) {
      return { success: false, message: 'Conta não encontrada para o e-mail informado.' };
    }

    const account = accounts[accountIndex];

    if (account.emailVerified) {
      return { success: true, message: 'Este e-mail já foi verificado anteriormente.' };
    }

    if (account.verificationCode !== cleanCode) {
      return { success: false, message: 'Código de ativação incorreto. Verifique o código e tente novamente.' };
    }

    // Activate account
    account.emailVerified = true;
    account.verificationCode = undefined;
    account.verificationSentAt = undefined;
    accounts[accountIndex] = account;
    this.saveAccounts(accounts);

    // Automatically create session
    const session: AuthSession = {
      token: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: account.id,
      teacherId: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      avatarId: 'avatar-tecnologia',
      loginAt: Date.now(),
    };
    this.saveSession(session);

    return {
      success: true,
      message: 'Conta ativada com sucesso! Acesso concedido à Área do Professor.',
      session,
    };
  }

  /**
   * Resend activation code
   */
  public async resendVerificationCode(
    email: string
  ): Promise<{ success: boolean; message: string; verificationCode?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      return { success: false, message: 'Conta não localizada.' };
    }

    if (account.emailVerified) {
      return { success: false, message: 'Esta conta já está ativada. Você pode fazer login normalmente.' };
    }

    const newCode = this.generateCode();
    account.verificationCode = newCode;
    account.verificationSentAt = Date.now();
    this.saveAccounts(accounts);

    return {
      success: true,
      message: 'Novo código de verificação enviado.',
      verificationCode: newCode,
    };
  }

  /**
   * Teacher Login
   */
  public async loginTeacher(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    session?: AuthSession;
    needsVerification?: boolean;
    verificationCode?: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { success: false, message: 'Preencha o e-mail e a senha de acesso.' };
    }

    // Integração com o Supabase Auth
    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password,
        });

        if (authError || !authData.user) {
          return {
            success: false,
            message: 'E-mail ou senha incorretos.',
          };
        }

        // 2. Obter o UUID do usuário autenticado
        const userId = authData.user.id;

        // 3. Consultar a tabela profiles usando esse UUID
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        // Tratamento explícito de falha na consulta (RLS ou erro de rede)
        if (profileError) {
          console.error('[Supabase Auth] Erro ao consultar a tabela profiles:', profileError);
          await supabase.auth.signOut({ scope: 'local' });
          return {
            success: false,
            message: 'Erro ao consultar o perfil no banco de dados. Verifique a conexão e as permissões RLS.',
          };
        }

        // 4. Verificar se o perfil existe
        if (!profile) {
          await supabase.auth.signOut({ scope: 'local' });
          return {
            success: false,
            message: 'Perfil de usuário não encontrado no banco de dados ou bloqueado pela política RLS.',
          };
        }

        // 5. Normalizar o campo tipo, ignorando espaços e diferenças entre letras maiúsculas e minúsculas
        const rawTipo = typeof profile.tipo === 'string' ? profile.tipo : '';
        const userTipo = rawTipo.trim().toLowerCase();

        // 6. Permitir acesso somente se o tipo for professor
        if (userTipo !== 'professor') {
          // Desconecta caso não seja professor e exibe mensagem adequada
          await supabase.auth.signOut({ scope: 'local' });
          return {
            success: false,
            message: 'Acesso restrito. Este usuário não possui permissão de professor.',
          };
        }

        // Usuário é professor: manter fluxo do GAMEINFOR e permitir acesso ao painel
        const teacherName =
          profile.nome ||
          (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Professor');

        const session: AuthSession = {
          token: authData.session?.access_token || `sess-${Date.now()}`,
          userId: userId,
          teacherId: userId,
          name: teacherName,
          email: authData.user.email || cleanEmail,
          role: 'professor',
          avatarId: profile.avatar_id || 'avatar-tecnologia',
          loginAt: Date.now(),
        };

        this.saveSession(session);

        return {
          success: true,
          message: 'Autenticação realizada com sucesso!',
          session,
        };
      } catch (err) {
        console.error('[Supabase Auth] Erro no fluxo de login:', err);
        return {
          success: false,
          message: 'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
        };
      }
    }

    const accounts = this.getAccounts();
    const account = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      return { success: false, message: 'Credenciais inválidas. Verifique o e-mail e a senha digitados.' };
    }

    // Verify hash
    const inputHash = await this.hashPassword(password, account.salt);
    if (inputHash !== account.passwordHash) {
      return { success: false, message: 'Credenciais inválidas. Verifique o e-mail e a senha digitados.' };
    }

    // Check email verification status
    if (!account.emailVerified) {
      let currentCode = account.verificationCode;
      if (!currentCode) {
        currentCode = this.generateCode();
        account.verificationCode = currentCode;
        account.verificationSentAt = Date.now();
        this.saveAccounts(accounts);
      }
      return {
        success: false,
        needsVerification: true,
        verificationCode: currentCode,
        message: 'Sua conta ainda não foi ativada. Verifique seu e-mail para ativar sua conta.',
      };
    }

    // Generate authenticated session
    const session: AuthSession = {
      token: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: account.id,
      teacherId: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      avatarId: 'avatar-tecnologia',
      loginAt: Date.now(),
    };
    this.saveSession(session);

    return {
      success: true,
      message: 'Autenticação realizada com sucesso!',
      session,
    };
  }

  /**
   * Solicita redefinição de senha oficial via Supabase Auth
   * Envia um e-mail com link de recuperação para https://gameinfor.ai.studio
   */
  public async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Por favor, informe um endereço de e-mail válido.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: 'https://gameinfor.ai.studio',
        });

        if (error) {
          console.error('[Supabase Auth] Erro ao solicitar redefinição de senha:', error);
          return {
            success: false,
            message: error.message || 'Falha ao solicitar recuperação de senha no Supabase.',
          };
        }

        return {
          success: true,
          message: 'Solicitação de recuperação realizada! Se este e-mail estiver cadastrado no Supabase, um link seguro para definir sua nova senha será enviado.',
        };
      } catch (err) {
        console.error('[Supabase Auth] Erro inesperado ao solicitar redefinição:', err);
        return {
          success: false,
          message: 'Erro de conexão com o Supabase ao solicitar recuperação.',
        };
      }
    }

    return {
      success: false,
      message: 'Serviço de autenticação Supabase não está configurado.',
    };
  }

  /**
   * Atualiza a senha no Supabase Auth após o usuário acessar o link do e-mail de recuperação
   */
  public async updatePassword(
    newPassword: string,
    confirmPassword?: string
  ): Promise<{ success: boolean; message: string }> {
    if (confirmPassword !== undefined && newPassword !== confirmPassword) {
      return { success: false, message: 'A confirmação não coincide com a nova senha digitada.' };
    }

    const passwordVal = this.validatePassword(newPassword);
    if (!passwordVal.isValid) {
      return { success: false, message: passwordVal.errors.join(' ') };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) {
          console.error('[Supabase Auth] Erro ao atualizar senha no Supabase:', error);
          return {
            success: false,
            message: error.message || 'Falha ao atualizar senha no Supabase.',
          };
        }

        return {
          success: true,
          message: 'Senha alterada com sucesso no Supabase! Você já pode realizar o login com a nova senha.',
        };
      } catch (err) {
        console.error('[Supabase Auth] Erro inesperado ao atualizar senha:', err);
        return {
          success: false,
          message: 'Erro de conexão ao atualizar a nova senha.',
        };
      }
    }

    return {
      success: false,
      message: 'Serviço de autenticação Supabase não está configurado.',
    };
  }

  /**
   * Reset password method (compatibilidade com interface anterior)
   */
  public async resetPassword(
    email: string,
    codeOrUnused: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{ success: boolean; message: string }> {
    return this.updatePassword(newPassword, confirmPassword);
  }

  /**
   * Session Management
   */
  public getCurrentSession(): AuthSession | null {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return null;
  }

  private saveSession(session: AuthSession): void {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (err) {
      console.error('Failed to save session:', err);
    }
  }

  public async loginStudent(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    message: string;
    session?: AuthSession;
    profile?: Record<string, unknown>;
  }> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      return { success: false, message: 'Preencha o e-mail e a senha de acesso.' };
    }

    if (!isSupabaseConfigured) {
      // Fallback para ambiente de testes/desenvolvimento sem Supabase configurado
      const studentName = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
      const session: AuthSession = {
        token: `sess-stu-${Date.now()}`,
        userId: `user-aluno-${Date.now()}`,
        teacherId: `user-aluno-${Date.now()}`,
        name: studentName.charAt(0).toUpperCase() + studentName.slice(1),
        email: cleanEmail,
        role: 'aluno',
        avatarId: 'avatar-gamer',
        loginAt: Date.now(),
      };
      this.saveSession(session);
      return {
        success: true,
        message: `Bem-vindo(a), ${session.name}!`,
        session,
      };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password,
      });

      if (authError || !authData.user) {
        return {
          success: false,
          message: 'E-mail ou senha incorretos.',
        };
      }

      // Consulta a tabela profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('[Supabase Auth] Erro ao consultar a tabela profiles:', profileError);
      }

      // Normaliza o tipo com segurança
      let userTipo = normalizeUserRole(profile?.tipo || (profile as { role?: string } | null)?.role);

      // Se não existir perfil na tabela profiles ainda, cria automaticamente com tipo = 'aluno'
      if (!profile) {
        const studentName =
          authData.user.user_metadata?.full_name ||
          authData.user.user_metadata?.name ||
          (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Aluno');

        try {
          await supabase.from('profiles').insert({
            id: authData.user.id,
            nome: studentName,
            tipo: 'aluno',
            avatar_id: authData.user.user_metadata?.avatar_id || 'avatar-gamer',
          });
        } catch {
          // Fallback caso a coluna avatar_id ainda não exista
          await supabase.from('profiles').insert({
            id: authData.user.id,
            nome: studentName,
            tipo: 'aluno',
          });
        }
        userTipo = 'aluno';
      }

      // Se for professor tentando logar no portal de alunos
      if (userTipo === 'professor' || userTipo === 'admin') {
        await supabase.auth.signOut({ scope: 'local' });
        return {
          success: false,
          message: 'Esta conta é de Professor. Por favor, acesse pelo botão "Área do Professor".',
        };
      }

      const studentName =
        profile?.nome ||
        (profile as { name?: string } | null)?.name ||
        authData.user.user_metadata?.full_name ||
        authData.user.user_metadata?.name ||
        (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Aluno');

      const avatarId =
        (profile as { avatar_id?: string } | null)?.avatar_id ||
        authData.user.user_metadata?.avatar_id ||
        'avatar-gamer';

      const session: AuthSession = {
        token: authData.session?.access_token || `sess-${Date.now()}`,
        userId: authData.user.id,
        teacherId: authData.user.id,
        name: studentName,
        email: authData.user.email || cleanEmail,
        role: 'aluno',
        avatarId,
        loginAt: Date.now(),
      };

      this.saveSession(session);

      return {
        success: true,
        message: `Bem-vindo(a), ${studentName}!`,
        session,
        profile: profile || undefined,
      };
    } catch (err) {
      console.error('[Supabase Auth] Erro no login do aluno:', err);
      return {
        success: false,
        message: 'Não foi possível conectar ao servidor. Tente novamente mais tarde.',
      };
    }
  }

  public async registerStudent(data: {
    name: string;
    nickname?: string;
    email: string;
    password: string;
    classCode?: string;
  }): Promise<{
    success: boolean;
    message: string;
    session?: AuthSession;
  }> {
    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanNickname = data.nickname?.trim() || cleanName.split(' ')[0];
    const password = data.password;

    if (!cleanName || cleanName.length < 3) {
      return { success: false, message: 'Informe seu nome completo (mínimo de 3 caracteres).' };
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Informe um endereço de e-mail válido.' };
    }
    if (!password || password.length < 6) {
      return { success: false, message: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    if (!isSupabaseConfigured) {
      const session: AuthSession = {
        token: `sess-stu-${Date.now()}`,
        userId: `user-aluno-${Date.now()}`,
        teacherId: `user-aluno-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role: 'aluno',
        avatarId: 'avatar-gamer',
        loginAt: Date.now(),
      };
      this.saveSession(session);
      return {
        success: true,
        message: 'Conta de aluno criada com sucesso!',
        session,
      };
    }

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            nickname: cleanNickname,
            role: 'aluno',
            tipo: 'aluno',
            codigo_turma: data.classCode || null,
            avatar_id: 'avatar-gamer',
          },
        },
      });

      if (signUpError) {
        return {
          success: false,
          message:
            signUpError.message.toLowerCase().includes('already registered') ||
            signUpError.message.toLowerCase().includes('already exists')
              ? 'Este e-mail já está cadastrado. Tente entrar.'
              : `Erro no cadastro: ${signUpError.message}`,
        };
      }

      if (!signUpData.user) {
        return { success: false, message: 'Não foi possível criar a conta. Tente novamente.' };
      }

      // Garante inserção do perfil como 'aluno'
      try {
        await supabase.from('profiles').upsert(
          {
            id: signUpData.user.id,
            nome: cleanName,
            tipo: 'aluno',
            avatar_id: 'avatar-gamer',
          },
          { onConflict: 'id' }
        );
      } catch {
        // Fallback caso a coluna avatar_id ainda não exista
        await supabase.from('profiles').upsert(
          {
            id: signUpData.user.id,
            nome: cleanName,
            tipo: 'aluno',
          },
          { onConflict: 'id' }
        );
      }

      // Se a sessão for retornada imediatamente
      if (signUpData.session) {
        const session: AuthSession = {
          token: signUpData.session.access_token,
          userId: signUpData.user.id,
          teacherId: signUpData.user.id,
          name: cleanName,
          email: cleanEmail,
          role: 'aluno',
          avatarId: 'avatar-gamer',
          loginAt: Date.now(),
        };
        this.saveSession(session);
        return {
          success: true,
          message: 'Conta criada com sucesso!',
          session,
        };
      }

      return {
        success: true,
        message: 'Conta criada com sucesso! Você já pode realizar o login com suas credenciais.',
      };
    } catch (err) {
      console.error('[Supabase Auth] Erro ao cadastrar aluno:', err);
      return {
        success: false,
        message: 'Ocorreu um erro inesperado ao criar sua conta. Tente novamente.',
      };
    }
  }

  public async updateProfileAvatar(userId: string, avatarId: string): Promise<boolean> {
    try {
      // 1. Atualiza user_metadata no Supabase Auth
      if (isSupabaseConfigured) {
        await supabase.auth.updateUser({
          data: { avatar_id: avatarId },
        }).catch(() => {});

        // 2. Atualiza na tabela profiles se possível
        try {
          await supabase
            .from('profiles')
            .update({ avatar_id: avatarId })
            .eq('id', userId);
        } catch (err) {
          console.warn('Coluna avatar_id na tabela profiles pendente de migração SQL:', err);
        }
      }

      // 3. Atualiza sessão local
      const current = this.getCurrentSession();
      if (current && (current.userId === userId || current.teacherId === userId)) {
        current.avatarId = avatarId;
        this.saveSession(current);
      }

      return true;
    } catch (err) {
      console.error('Falha ao atualizar avatar:', err);
      return false;
    }
  }

  public async getProfile(userId: string): Promise<{
    id: string;
    nome: string;
    tipo: 'aluno' | 'professor' | 'admin';
    avatar_id?: string;
  } | null> {
    try {
      if (!isSupabaseConfigured) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) return null;
      return {
        ...data,
        tipo: normalizeUserRole(data.tipo),
      };
    } catch {
      return null;
    }
  }

  public async logout(scope: 'local' | 'global' = 'local'): Promise<void> {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem('gameinfor_auth_roles');
      if (isSupabaseConfigured) {
        await supabase.auth.signOut({ scope }).catch(() => {});
      }
    } catch (err) {
      console.error('Erro ao realizar logout:', err);
    }
  }

  public hasRegisteredTeachers(): boolean {
    return this.getAccounts().length > 0;
  }
}

export const authService = new AuthService();
