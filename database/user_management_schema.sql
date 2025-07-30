-- Sistema de Gerenciamento de Usuários - SalaFácil
-- Atualização da estrutura do banco de dados

-- 1. Adicionar campos à tabela usuarios para sistema de permissões
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS department_id INTEGER;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS manager_id INTEGER;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS created_by INTEGER;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;

-- 2. Criar tabela de departamentos/localizações
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INTEGER REFERENCES departments(id),
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES usuarios(id)
);

-- 3. Criar tabela de logs de ações administrativas
CREATE TABLE IF NOT EXISTS admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES usuarios(id),
    action VARCHAR(50) NOT NULL,
    target_user_id INTEGER REFERENCES usuarios(id),
    details TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Criar tabela para notificações push personalizadas
CREATE TABLE IF NOT EXISTS push_notifications (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES usuarios(id),
    recipient_id INTEGER REFERENCES usuarios(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'admin_message',
    sent_at TIMESTAMP DEFAULT NOW(),
    read_at TIMESTAMP
);

-- 5. Atualizar tabela de agendamentos para controle de permissões
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES usuarios(id);
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS can_be_edited_by TEXT DEFAULT 'owner_only';

-- 6. Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_department ON usuarios(department_id);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON admin_logs(target_user_id);

-- 7. Inserir departamentos padrão
INSERT INTO departments (name, description) VALUES 
('Administração', 'Departamento Administrativo'),
('TI', 'Tecnologia da Informação'),
('RH', 'Recursos Humanos'),
('Vendas', 'Departamento de Vendas'),
('Marketing', 'Departamento de Marketing')
ON CONFLICT DO NOTHING;

-- 8. Comentários para documentação
COMMENT ON COLUMN usuarios.role IS 'Nível de acesso: admin, user';
COMMENT ON COLUMN usuarios.status IS 'Status do usuário: active, blocked, inactive';
COMMENT ON COLUMN usuarios.department_id IS 'Referência ao departamento do usuário';
COMMENT ON COLUMN usuarios.manager_id IS 'Referência ao gerente/superior do usuário';
COMMENT ON COLUMN usuarios.created_by IS 'ID do admin que criou este usuário';

-- 9. Criar função para log automático de ações administrativas
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_id INTEGER,
    p_action VARCHAR(50),
    p_target_user_id INTEGER,
    p_details TEXT,
    p_ip_address INET DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_logs (admin_id, action, target_user_id, details, ip_address)
    VALUES (p_admin_id, p_action, p_target_user_id, p_details, p_ip_address);
END;
$$ LANGUAGE plpgsql;

-- 10. Criar view para hierarquia de usuários
CREATE OR REPLACE VIEW user_hierarchy AS
WITH RECURSIVE hierarchy AS (
    -- Usuários sem gerente (raiz da hierarquia)
    SELECT 
        u.id,
        u.nome,
        u.email,
        u.role,
        u.status,
        u.department_id,
        d.name as department_name,
        u.manager_id,
        0 as level,
        ARRAY[u.id] as path
    FROM usuarios u
    LEFT JOIN departments d ON u.department_id = d.id
    WHERE u.manager_id IS NULL
    
    UNION ALL
    
    -- Usuários com gerente (recursivo)
    SELECT 
        u.id,
        u.nome,
        u.email,
        u.role,
        u.status,
        u.department_id,
        d.name as department_name,
        u.manager_id,
        h.level + 1,
        h.path || u.id
    FROM usuarios u
    LEFT JOIN departments d ON u.department_id = d.id
    INNER JOIN hierarchy h ON u.manager_id = h.id
    WHERE NOT u.id = ANY(h.path) -- Evitar loops
)
SELECT * FROM hierarchy ORDER BY level, department_name, nome;
