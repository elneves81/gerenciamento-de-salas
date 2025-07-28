# 🗃️ CONFIGURAÇÃO DO BANCO NEON - PASSO A PASSO

## ✅ **Você já tem a Connection String:**
```
postgresql://neondb_owner:npg_30vfdEapKsji@ep-polished-glitter-ad3ve5sr-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

## 🚀 **Próximos Passos:**

### 1. **Configurar Banco no Console Neon** (3 min)

1. **Acesse:** [console.neon.tech](https://console.neon.tech/)
2. **Entre no seu projeto** que já está criado
3. **Clique em "SQL Editor"** no menu lateral
4. **Copie e execute** o código abaixo no editor SQL:

```sql
-- 1. Criar tabela de usuários
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

-- 2. Criar tabela de salas
CREATE TABLE IF NOT EXISTS agendamento_sala (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    capacidade INTEGER,
    descricao TEXT,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Criar tabela de agendamentos
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

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_agendamento_data_inicio ON agendamento_agendamento(data_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamento_data_fim ON agendamento_agendamento(data_fim);
CREATE INDEX IF NOT EXISTS idx_agendamento_sala ON agendamento_agendamento(sala_id);
CREATE INDEX IF NOT EXISTS idx_agendamento_usuario ON agendamento_agendamento(usuario_id);

-- 5. Inserir salas de exemplo
INSERT INTO agendamento_sala (nome, capacidade, descricao) VALUES
    ('Sala de Reunião A', 10, 'Sala principal com projetor e videoconferência'),
    ('Sala de Reunião B', 6, 'Sala pequena para reuniões íntimas'),
    ('Auditório', 50, 'Sala grande para apresentações e eventos'),
    ('Sala de Treinamento', 20, 'Sala equipada para cursos e workshops')
ON CONFLICT (nome) DO NOTHING;

-- 6. Criar usuário admin (senha: admin123)
INSERT INTO auth_user (username, email, first_name, last_name, password, is_superuser, is_staff) VALUES
    ('admin', 'admin@salafacil.com', 'Admin', 'Sistema', '$2a$10$N9qo8uLOickgx2ZMRZoMye.Zz8IvLTHB3QFGUk7nOD4F4sEqqGVVu', TRUE, TRUE)
ON CONFLICT (username) DO NOTHING;

-- 7. Verificar se tudo foi criado
SELECT 'Usuários:' as tabela, COUNT(*) as total FROM auth_user
UNION ALL
SELECT 'Salas:', COUNT(*) FROM agendamento_sala;
```

5. **Clique em "Run"** ou pressione Ctrl+Enter
6. **Você deve ver:** "Usuários: 1" e "Salas: 4"

### 2. **Deploy no Netlify** (5 min)

1. **Acesse:** [netlify.com](https://netlify.com/) e faça login
2. **Clique:** "New site from Git"
3. **Conecte:** seu repositório GitHub `gerenciamento-de-salas`
4. **Configure:**
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
5. **Clique:** "Deploy site"

### 3. **Configurar Variáveis de Ambiente** (2 min)

No dashboard do Netlify:
1. **Vá em:** "Site settings" → "Environment variables"
2. **Adicione estas 2 variáveis:**

```
DATABASE_URL = postgresql://neondb_owner:npg_30vfdEapKsji@ep-polished-glitter-ad3ve5sr-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

JWT_SECRET = sua-chave-jwt-super-secreta-de-32-caracteres-aqui
```

3. **Clique:** "Save"
4. **Em "Deploys":** clique "Trigger deploy"

### 4. **Testar** (2 min)

1. **Aguarde** o deploy terminar
2. **Acesse** a URL do Netlify
3. **Faça login:**
   - **Usuário:** admin
   - **Senha:** admin123

---

## 🎯 **Status Atual:**
- ✅ **Código:** Commitado e no GitHub
- ✅ **Banco:** Connection string obtida
- ⏳ **Banco:** Aguardando configuração das tabelas
- ⏳ **Deploy:** Aguardando Netlify

**Próximo passo:** Executar o SQL no console Neon! 🚀
