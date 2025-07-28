-- Script para configurar o banco de dados Neon PostgreSQL
-- Execute este script no console do Neon Database

-- Criar tabela de usuários (compatível com Django)
CREATE TABLE IF NOT EXISTS auth_user (
    id SERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMP,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    username VARCHAR(150) NOT NULL UNIQUE,
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    email VARCHAR(254),
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    date_joined TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar tabela de salas
CREATE TABLE IF NOT EXISTS agendamento_sala (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    capacidade INTEGER,
    descricao TEXT,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamento_agendamento (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    sala_id INTEGER NOT NULL REFERENCES agendamento_sala(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_agendamento_data_inicio ON agendamento_agendamento(data_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamento_data_fim ON agendamento_agendamento(data_fim);
CREATE INDEX IF NOT EXISTS idx_agendamento_sala ON agendamento_agendamento(sala_id);
CREATE INDEX IF NOT EXISTS idx_agendamento_usuario ON agendamento_agendamento(usuario_id);

-- Inserir dados de exemplo
INSERT INTO agendamento_sala (nome, capacidade, descricao) VALUES
    ('Sala de Reunião A', 10, 'Sala principal com projetor e videoconferência'),
    ('Sala de Reunião B', 6, 'Sala pequena para reuniões íntimas'),
    ('Auditório', 50, 'Sala grande para apresentações e eventos'),
    ('Sala de Treinamento', 20, 'Sala equipada para cursos e workshops')
ON CONFLICT (nome) DO NOTHING;

-- Criar usuário admin (senha: admin123)
-- Hash gerado com bcrypt para 'admin123'
INSERT INTO auth_user (username, email, first_name, last_name, password, is_superuser, is_staff) VALUES
    ('admin', 'admin@salafacil.com', 'Admin', 'Sistema', '$2a$10$N9qo8uLOickgx2ZMRZoMye.Zz8IvLTHB3QFGUk7nOD4F4sEqqGVVu', TRUE, TRUE)
ON CONFLICT (username) DO NOTHING;

-- Inserir alguns agendamentos de exemplo
INSERT INTO agendamento_agendamento (titulo, descricao, data_inicio, data_fim, sala_id, usuario_id) VALUES
    ('Reunião de Equipe', 'Reunião semanal da equipe de desenvolvimento', 
     NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', 1, 1),
    ('Apresentação do Projeto', 'Apresentação do novo sistema para os stakeholders', 
     NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 3 hours', 3, 1),
    ('Treinamento React', 'Curso de React para desenvolvedores', 
     NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 4 hours', 4, 1)
ON CONFLICT DO NOTHING;

-- Verificar se tudo foi criado corretamente
SELECT 'Usuários:' as tabela, COUNT(*) as total FROM auth_user
UNION ALL
SELECT 'Salas:', COUNT(*) FROM agendamento_sala
UNION ALL
SELECT 'Agendamentos:', COUNT(*) FROM agendamento_agendamento;
