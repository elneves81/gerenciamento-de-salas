# 🚀 APIs Neon Database - Documentação Completa

## 📋 Visão Geral

Este sistema oferece **3 níveis de integração** com o Neon Database:

1. **API Principal** (`admin-api.js`) - Sistema completo com fallback mock
2. **API REST Básica** (`neon-rest-api.js`) - Cliente REST simples
3. **API de Produção** (`neon-production-api.js`) - Implementação completa para produção

---

## 🔗 Endpoints Disponíveis

### 1. API Principal (Sistema Completo)
**Base URL:** `https://gerenciamentosalas.netlify.app/api/`

#### Autenticação
- `POST /api/auth` - Login de usuário
- `POST /api/register` - Registro de novo usuário
- `GET /api/auth/me` - Verificar sessão atual
- `POST /api/google-auth` - Login com Google

#### Gestão de Usuários
- `GET /api/admin/users` - Listar todos os usuários
- `POST /api/admin/users` - Criar novo usuário
- `PUT /api/admin/users/:id` - Atualizar usuário
- `DELETE /api/admin/users/:id` - Deletar usuário

#### Gestão de Departamentos
- `GET /api/admin/departments` - Listar departamentos
- `POST /api/admin/departments` - Criar departamento

#### Estatísticas
- `GET /api/admin/stats` - Estatísticas do sistema

#### Testes Neon
- `GET /api/test-neon` - Testar conexão Neon integrada

---

### 2. API REST Básica
**Base URL:** `https://gerenciamentosalas.netlify.app/api/neon-rest-api/`

#### Endpoints
- `GET /api/neon-rest-api` - Informações da API
- `GET /api/neon-rest-api/test` - Teste de conectividade
- `GET /api/neon-rest-api/init` - Inicializar estrutura de tabelas
- `POST /api/neon-rest-api/query` - Executar query customizada

#### Exemplo de Query Customizada
```bash
curl -X POST https://gerenciamentosalas.netlify.app/api/neon-rest-api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT NOW() as current_time, current_database() as db_name",
    "params": []
  }'
```

---

### 3. API de Produção (Avançada)
**Base URL:** `https://gerenciamentosalas.netlify.app/api/neon-production-api/`

#### Endpoints
- `GET /api/neon-production-api` - Informações da API
- `GET /api/neon-production-api/status` - Status completo do banco
- `GET /api/neon-production-api/setup-complete` - Setup completo com dados
- `POST /api/neon-production-api/sql` - Executar SQL customizado

#### Exemplo de SQL Customizado
```bash
curl -X POST https://gerenciamentosalas.netlify.app/api/neon-production-api/sql \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM usuarios LIMIT 5",
    "params": []
  }'
```

---

## ⚙️ Configuração

### Variáveis de Ambiente Netlify

1. **DATABASE_URL** (Obrigatória)
   ```
   postgresql://neondb_owner:password@host/database?sslmode=require
   ```

2. **NEON_API_KEY** (Opcional - para API real)
   ```
   neon_api_key_from_console
   ```

3. **GOOGLE_CLIENT_ID** (Para Google Auth)
   ```
   your_google_client_id
   ```

---

## 🧪 Testes de Conectividade

### 1. Testar API Principal
```bash
curl https://gerenciamentosalas.netlify.app/api/test-neon
```

### 2. Testar API REST Básica
```bash
curl https://gerenciamentosalas.netlify.app/api/neon-rest-api/test
```

### 3. Testar API de Produção
```bash
curl https://gerenciamentosalas.netlify.app/api/neon-production-api/status
```

---

## 📊 Estrutura do Banco de Dados

### Tabelas Criadas

1. **usuarios**
   - `id` (SERIAL PRIMARY KEY)
   - `nome` (VARCHAR)
   - `email` (VARCHAR UNIQUE)
   - `senha` (VARCHAR)
   - `telefone` (VARCHAR)
   - `role` (VARCHAR)
   - `status` (VARCHAR)
   - `department_id` (INTEGER)
   - `created_at` (TIMESTAMP)

2. **departamentos**
   - `id` (SERIAL PRIMARY KEY)
   - `name` (VARCHAR)
   - `description` (TEXT)
   - `manager_id` (INTEGER)
   - `budget` (DECIMAL)
   - `location` (VARCHAR)
   - `created_at` (TIMESTAMP)

3. **salas**
   - `id` (SERIAL PRIMARY KEY)
   - `nome` (VARCHAR)
   - `capacidade` (INTEGER)
   - `tipo` (VARCHAR)
   - `andar` (INTEGER)
   - `recursos` (TEXT[])
   - `equipamentos` (JSONB)
   - `status` (VARCHAR)
   - `preco_hora` (DECIMAL)
   - `created_at` (TIMESTAMP)

4. **reservas**
   - `id` (SERIAL PRIMARY KEY)
   - `sala_id` (INTEGER)
   - `usuario_id` (INTEGER)
   - `titulo` (VARCHAR)
   - `data_inicio` (TIMESTAMP)
   - `data_fim` (TIMESTAMP)
   - `status` (VARCHAR)
   - `created_at` (TIMESTAMP)

---

## 🔄 Fluxo de Desenvolvimento

### Fase 1: Configuração Inicial ✅
- [x] Setup das 3 APIs
- [x] Configuração de roteamento
- [x] Testes básicos de conectividade

### Fase 2: Implementação Real
- [ ] Configurar `NEON_API_KEY`
- [ ] Testar conexão real com API Neon
- [ ] Implementar CRUD completo

### Fase 3: Produção
- [ ] Migrar dados mock para Neon
- [ ] Implementar autenticação JWT
- [ ] Otimizar performance

---

## 🚨 Troubleshooting

### Problemas Comuns

1. **"pg module not found"**
   - ✅ **Solucionado**: Usando apenas fetch/REST API

2. **"Database connection failed"**
   - Verificar `DATABASE_URL` no Netlify
   - Testar conectividade via `/status`

3. **"API Key not configured"**
   - Sistema funciona sem API Key (modo simulação)
   - Para produção real, configurar `NEON_API_KEY`

### Logs de Debug

Todos os endpoints incluem logs detalhados no console do Netlify.

---

## 📈 Próximos Passos

1. **Obter API Key do Neon Console**
2. **Configurar variável `NEON_API_KEY`**
3. **Testar setup completo**
4. **Migrar para produção real**

---

*Documentação atualizada em: 31/07/2025*
