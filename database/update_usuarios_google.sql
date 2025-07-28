-- Script SQL para atualizar a tabela usuarios para suporte ao Google OAuth (PostgreSQL)

-- Adicionar campo para Google ID
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='google_id') THEN
        ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255);
    END IF;
END $$;

-- Adicionar campo para avatar/foto do Google
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='usuarios' AND column_name='avatar_url') THEN
        ALTER TABLE usuarios ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Tornar password opcional (para usuários do Google)
ALTER TABLE usuarios ALTER COLUMN password DROP NOT NULL;

-- Criar índice único para Google ID
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_usuarios_google_id' AND n.nspname = 'public') THEN
        CREATE UNIQUE INDEX idx_usuarios_google_id ON usuarios(google_id);
    END IF;
END $$;

-- Criar índice para email
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_usuarios_email' AND n.nspname = 'public') THEN
        CREATE INDEX idx_usuarios_email ON usuarios(email);
    END IF;
END $$;

-- Atualizar estrutura para melhor performance
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'idx_usuarios_created_at' AND n.nspname = 'public') THEN
        CREATE INDEX idx_usuarios_created_at ON usuarios(created_at);
    END IF;
END $$;

-- Comentários para documentação
COMMENT ON COLUMN usuarios.google_id IS 'ID único do usuário no Google OAuth';
COMMENT ON COLUMN usuarios.avatar_url IS 'URL da foto de perfil do usuário';
