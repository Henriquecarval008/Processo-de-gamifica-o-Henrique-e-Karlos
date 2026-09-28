-- ==============================================================================
-- GAMEINFOR - ESQUEMA COMPLETO DE BANCO DE DADOS E SEGURANÇA SUPABASE
-- Plataforma Educacional Gamificada do Instituto Ambiente
-- Administradores Principais: Henrique Carvalho & Karlos
-- ==============================================================================

-- 1. Habilitar extensão de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT,
    tipo TEXT NOT NULL DEFAULT 'aluno' CHECK (tipo IN ('aluno', 'professor', 'admin')),
    cargo TEXT,
    avatar_id TEXT DEFAULT 'avatar-gamer',
    turma_id TEXT,
    turma_nome TEXT,
    projeto_id TEXT,
    projeto_nome TEXT,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabela da Base de Conhecimento do Assistente (Instituto Ambiente)
CREATE TABLE IF NOT EXISTS public.assistant_knowledge (
    id TEXT PRIMARY KEY,
    categoria TEXT NOT NULL,
    titulo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    atualizado_por TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabela de Turmas (classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY DEFAULT ('turma-' || substr(md5(random()::text), 1, 8)),
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 6),
    projeto_id TEXT NOT NULL,
    projeto_nome TEXT NOT NULL,
    curso_id TEXT NOT NULL,
    curso_nome TEXT NOT NULL,
    professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    professor_nome TEXT,
    dias_horario TEXT,
    ano_semestre TEXT DEFAULT '2026.1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabela de Projetos Institucionais (projects)
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT NOT NULL,
    carga_horaria INTEGER NOT NULL DEFAULT 60,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'concluido', 'planejado')),
    icone TEXT DEFAULT '📘',
    cor TEXT DEFAULT 'from-blue-600 to-indigo-600',
    coordenador_nome TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Trigger para Atualizar o Timestamp `updated_at` Automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_assistant_knowledge_updated_at ON public.assistant_knowledge;
CREATE TRIGGER set_assistant_knowledge_updated_at
    BEFORE UPDATE ON public.assistant_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Função e Trigger para Criação Automática de Perfil no Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    user_name TEXT;
    user_username TEXT;
    user_class_id TEXT;
BEGIN
    -- Obter metadados do usuário cadastrado
    user_role := COALESCE(NEW.raw_user_meta_data->>'tipo', NEW.raw_user_meta_data->>'role', 'aluno');
    -- Impedir auto-atribuição de admin no cadastro público (apenas aluno por padrão)
    IF user_role NOT IN ('aluno', 'professor', 'admin') THEN
        user_role := 'aluno';
    END IF;

    user_name := COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
    user_username := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1));
    user_class_id := NEW.raw_user_meta_data->>'turma_id';

    INSERT INTO public.profiles (
        id,
        nome,
        username,
        email,
        tipo,
        cargo,
        turma_id,
        avatar_id,
        xp,
        level,
        status
    ) VALUES (
        NEW.id,
        user_name,
        user_username,
        NEW.email,
        user_role,
        CASE 
            WHEN user_role = 'admin' THEN 'Administrador e professor'
            WHEN user_role = 'professor' THEN 'Professor'
            ELSE 'Aluno'
        END,
        user_class_id,
        COALESCE(NEW.raw_user_meta_data->>'avatar_id', 'avatar-gamer'),
        0,
        1,
        'ativo'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nome = COALESCE(public.profiles.nome, EXCLUDED.nome),
        tipo = COALESCE(public.profiles.tipo, EXCLUDED.tipo);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Função auxiliar de verificação se o usuário conectado é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tipo = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Função auxiliar de verificação se o usuário conectado é professor
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (tipo = 'professor' OR tipo = 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Políticas para `profiles`
CREATE POLICY "Leitura de perfis por usuários autenticados" 
    ON public.profiles FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Atualização do próprio perfil" 
    ON public.profiles FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (tipo = (SELECT tipo FROM public.profiles WHERE id = auth.uid())) -- Impede auto-promoção de role
    );

CREATE POLICY "Administradores gerenciam todos os perfis" 
    ON public.profiles FOR ALL 
    TO authenticated 
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Políticas para `assistant_knowledge`
CREATE POLICY "Leitura da base do assistente para todos autenticados" 
    ON public.assistant_knowledge FOR SELECT 
    TO authenticated 
    USING (ativo = true OR public.is_admin());

CREATE POLICY "Administradores editam base do assistente" 
    ON public.assistant_knowledge FOR ALL 
    TO authenticated 
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Políticas para `classes` e `projects`
CREATE POLICY "Leitura pública/autenticada de turmas e projetos" 
    ON public.classes FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Professores e administradores gerenciam turmas" 
    ON public.classes FOR ALL 
    TO authenticated 
    USING (public.is_teacher())
    WITH CHECK (public.is_teacher());

CREATE POLICY "Leitura de projetos por autenticados" 
    ON public.projects FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Administradores gerenciam projetos" 
    ON public.projects FOR ALL 
    TO authenticated 
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 9. CARGA INICIAL DE CONHECIMENTO INSTITUCIONAL (Instituto Ambiente)
-- ==============================================================================

INSERT INTO public.assistant_knowledge (id, categoria, titulo, conteudo, atualizado_por) VALUES
('ia-instituicao', 'institucional', 'O que é o Instituto Ambiente', 
'O Instituto Ambiente é uma organização dedicada à capacitação sociodigital, inclusão educacional e desenvolvimento humano através da tecnologia.', 'Sistema'),
('ia-missao', 'institucional', 'Missão do Instituto Ambiente', 
'Democratizar o acesso às ferramentas digitais e capacitar jovens e adultos para o mercado de trabalho com formação prática, cidadã e ética.', 'Sistema'),
('ia-gameinfor', 'institucional', 'Finalidade do GAMEINFOR', 
'O GAMEINFOR é a plataforma educacional gamificada oficial do Instituto Ambiente, criada para transformar o aprendizado de informática em uma experiência interativa com missões, níveis de XP e suporte de tutoria.', 'Sistema'),
('ia-projetos', 'projetos', 'Projetos Cadastrados no Instituto Ambiente', 
'Os principais projetos em andamento são: 1) Crescer e Transformar (60 horas); 2) Informática Tecendo (80 horas); 3) Curso de Informática Básica (40 horas).', 'Sistema'),
('ia-metodologia', 'pedagogico', 'Como o GAMEINFOR auxilia professores e alunos', 
'A plataforma permite aos professores gerenciar turmas, publicar materiais didáticos e atividades práticas, e oferece aos alunos feedback contínuo, ranking ético e apoio pedagógico inteligente.', 'Sistema')
ON CONFLICT (id) DO UPDATE SET 
    conteudo = EXCLUDED.conteudo,
    updated_at = NOW();

-- ==============================================================================
-- 10. CARGA INICIAL DOS PROJETOS INSTITUCIONAIS
-- ==============================================================================

INSERT INTO public.projects (id, nome, descricao, carga_horaria, status, icone, cor, coordenador_nome) VALUES
('proj-crescer-transformar', 'Crescer e Transformar', 'Projeto de inclusão sociodigital e capacitação em informática básica e aplicada.', 60, 'ativo', '📘', 'from-blue-600 to-indigo-600', 'Henrique Carvalho'),
('proj-informatica-tecendo', 'Informática Tecendo', 'Projeto focado em competências digitais, ferramentas de produtividade e mercado.', 80, 'ativo', '📗', 'from-emerald-600 to-teal-600', 'Karlos'),
('proj-curso-info-40h', 'Curso de Informática – 40h', 'Capacitação intensiva para iniciação ao computador, navegação segura e digitação.', 40, 'ativo', '📙', 'from-amber-600 to-orange-600', 'Henrique Carvalho')
ON CONFLICT (id) DO NOTHING;
