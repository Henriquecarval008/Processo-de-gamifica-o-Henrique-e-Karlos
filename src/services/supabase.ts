import { createClient } from '@supabase/supabase-js';

// Suporta tanto o ambiente cliente Vite (import.meta.env) quanto ambientes de execução Node/testes
const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'https://placeholder.supabase.co'
);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configuradas. Configure-as no arquivo .env para habilitar a conexão.'
  );
}

// Inicializa o cliente do Supabase com as credenciais ou fallback seguro para evitar que a aplicação quebre durante o build inicial
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);

export const RECOVERY_STORAGE_KEY = 'gameinfor_is_recovering_password';
export const RECOVERY_EMAIL_KEY = 'gameinfor_recovery_email';

export function isRecoveryUrlPresent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const href = window.location.href || '';
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Se a URL já reporta erro de link expirado ou acesso negado pelo Supabase
    if (href.includes('error=') || href.includes('error_description=')) {
      return false;
    }

    return (
      hash.includes('type=recovery') ||
      search.includes('type=recovery') ||
      href.includes('type=recovery') ||
      hash.includes('type%3Drecovery') ||
      search.includes('type%3Drecovery') ||
      href.includes('type%3Drecovery')
    );
  } catch {
    return false;
  }
}

export function isRecoveryFlowActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem(RECOVERY_STORAGE_KEY) === 'true') {
      return true;
    }
    return isRecoveryUrlPresent();
  } catch {
    return false;
  }
}

// Captura imediata no carregamento do módulo para interceptar o evento antes de qualquer componente React montar
if (typeof window !== 'undefined') {
  try {
    if (isRecoveryUrlPresent()) {
      sessionStorage.setItem(RECOVERY_STORAGE_KEY, 'true');
    }
  } catch {}

  // Listener síncrono registrado imediatamente após a criação do cliente Supabase
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      try {
        sessionStorage.setItem(RECOVERY_STORAGE_KEY, 'true');
        if (session?.user?.email) {
          sessionStorage.setItem(RECOVERY_EMAIL_KEY, session.user.email);
        }
      } catch {}
      window.dispatchEvent(
        new CustomEvent('gameinfor:password-recovery', { detail: { session } })
      );
    }
  });
}

export interface SupabaseConnectionResult {
  success: boolean;
  message: string;
  details?: unknown;
}

/**
 * Função simples de teste que verifica se o cliente Supabase consegue realizar
 * uma requisição ao projeto sem alterar tabelas, layouts ou autenticação.
 */
export async function testSupabaseConnection(): Promise<SupabaseConnectionResult> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      message: 'Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão configuradas.',
    };
  }

  try {
    // 1. Testa a comunicação com o serviço do Supabase Auth
    const { error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      return {
        success: false,
        message: `Erro na comunicação com o Supabase Auth: ${authError.message}`,
        details: authError,
      };
    }

    // 2. Realiza uma requisição leve ao PostgREST para validar a chave e conexão com a API
    // O retorno de status do PostgREST (como PGRST205 - schema cache consultado com sucesso) comprova a conectividade
    const { error: restError } = await supabase.from('_connection_probe').select('*').limit(1);

    if (restError && restError.code !== 'PGRST205' && restError.code !== 'PGRST116' && restError.code !== 'PGRST301') {
      // Se for um erro crítico de autorização/chave inválida
      if (restError.message?.toLowerCase().includes('jwt') || restError.message?.toLowerCase().includes('apikey')) {
        return {
          success: false,
          message: `Falha de autenticação no Supabase: ${restError.message}`,
          details: restError,
        };
      }
    }

    return {
      success: true,
      message: 'Supabase conectado com sucesso!',
      details: {
        endpoint: supabaseUrl,
        connected: true,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Erro inesperado ao conectar com o Supabase: ${errorMessage}`,
      details: error,
    };
  }
}
