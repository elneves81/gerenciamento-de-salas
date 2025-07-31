-- 🗃️ Script SQL para Google Cloud SQL - PostgreSQL
-- Execute este script após criar a instância

-- 1. Criar tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password VARCHAR(128), -- Hash da senha
    nome VARCHAR(300) NOT NULL,
    telefone VARCHAR(20),
    first_name VARCHAR(150),
    last_name VARCHAR(150),
    google_id VARCHAR(100),
    is_staff BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de salas
CREATE TABLE IF NOT EXISTS salas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    capacidade INTEGER NOT NULL DEFAULT 10,
    localizacao VARCHAR(500),
    equipamentos TEXT[],
    descricao TEXT,
    ativa BOOLEAN DEFAULT TRUE,
    preco_hora DECIMAL(10,2) DEFAULT 0.00,
    imagem_url VARCHAR(1000),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
    id SERIAL PRIMARY KEY,
    sala_id INTEGER REFERENCES salas(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP WITH TIME ZONE NOT NULL,
    data_fim TIMESTAMP WITH TIME ZONE NOT NULL,
    titulo VARCHAR(300) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) DEFAULT 'confirmado',
    valor_total DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar conflitos de horário
    CONSTRAINT no_overlap EXCLUDE USING gist (
        sala_id WITH =,
        tstzrange(data_inicio, data_fim) WITH &&
    )
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_agendamentos_sala_data ON agendamentos(sala_id, data_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamentos_usuario ON agendamentos(usuario_id);

-- 5. Inserir usuário admin padrão
INSERT INTO usuarios (
    username, 
    email, 
    password, 
    nome, 
    first_name, 
    last_name, 
    is_staff,
    is_active
) VALUES (
    'admin',
    'admin@salafacil.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    'Administrador Sistema',
    'Administrador',
    'Sistema',
    TRUE,
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- 6. Inserir salas de exemplo
INSERT INTO salas (nome, capacidade, localizacao, equipamentos, descricao, preco_hora) VALUES 
(
    'Sala Executiva A',
    12,
    'Andar 1 - Ala Norte',
    ARRAY['Projetor', 'TV 55"', 'Sistema de Som', 'Ar Condicionado', 'WiFi'],
    'Sala moderna com vista para a cidade, ideal para reuniões executivas',
    150.00
),
(
    'Sala de Treinamento B',
    25,
    'Andar 2 - Ala Sul', 
    ARRAY['Projetor 4K', 'Flipchart', 'Sistema de Som', 'Ar Condicionado', 'WiFi', 'Lousa Digital'],
    'Ampla sala para treinamentos e workshops',
    200.00
),
(
    'Sala de Videoconferência C',
    8,
    'Andar 1 - Centro',
    ARRAY['Câmera 4K', 'Microfones', 'TV 65"', 'Sistema Zoom', 'Ar Condicionado', 'WiFi'],
    'Equipada com tecnologia de ponta para videoconferências',
    180.00
)
ON CONFLICT DO NOTHING;

-- 7. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Triggers para atualizar updated_at
CREATE TRIGGER update_usuarios_updated_at 
    BEFORE UPDATE ON usuarios 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salas_updated_at 
    BEFORE UPDATE ON salas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agendamentos_updated_at 
    BEFORE UPDATE ON agendamentos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Verificar se tudo foi criado corretamente
SELECT 
    'Tabelas criadas com sucesso!' as status,
    (SELECT COUNT(*) FROM usuarios) as total_usuarios,
    (SELECT COUNT(*) FROM salas) as total_salas,
    (SELECT COUNT(*) FROM agendamentos) as total_agendamentos;
