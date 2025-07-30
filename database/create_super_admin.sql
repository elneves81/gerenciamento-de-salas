-- Criar usuário super administrador
-- Execute este SQL no seu banco de dados Neon

-- 1. Inserir o usuário super admin
INSERT INTO usuarios (
    nome, 
    email, 
    password_hash, 
    role, 
    status, 
    created_at
) VALUES (
    'Super Administrador',
    'superadmin@salafacil.com',
    '$2b$10$rQ8YvQ8YvQ8YvQ8YvQ8YvOeJ8YvQ8YvQ8YvQ8YvQ8YvQ8YvQ8YvQ8Y', -- senha: admin123
    'admin',
    'active',
    NOW()
);

-- 2. Criar departamento de Administração se não existir
INSERT INTO departments (name, description, created_at) 
VALUES ('Administração Geral', 'Departamento de administração do sistema', NOW())
ON CONFLICT DO NOTHING;

-- 3. Associar o super admin ao departamento de administração
UPDATE usuarios 
SET department_id = (SELECT id FROM departments WHERE name = 'Administração Geral' LIMIT 1)
WHERE email = 'superadmin@salafacil.com';

-- 4. Verificar se foi criado corretamente
SELECT id, nome, email, role, status, created_at 
FROM usuarios 
WHERE email = 'superadmin@salafacil.com';
