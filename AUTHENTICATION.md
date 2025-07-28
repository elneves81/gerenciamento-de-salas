# 🔐 Sistema de Autenticação - SalaFácil

## ✨ Funcionalidades Implementadas

### 🆕 **Nova Página de Autenticação**
- **Login tradicional** (email/senha)
- **Registro de novos usuários**
- **Login com Google OAuth**
- **Interface moderna** com Material-UI
- **Validação de formulários** em tempo real
- **Tratamento de erros** detalhado

### 🔧 **Backend Atualizado**
- **Função Netlify para registro** (`/register`)
- **Função Netlify para Google OAuth** (`/google-auth`)
- **Função de autenticação** atualizada (`/auth`)
- **Banco de dados** preparado para usuários Google

---

## 🚀 Como Configurar o Google OAuth

### 1. **Criar Projeto no Google Cloud Console**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google+ API** (se necessário)

### 2. **Configurar OAuth 2.0**

1. Vá para **APIs & Services > Credentials**
2. Clique em **Create Credentials > OAuth 2.0 Client ID**
3. Configure:
   - **Application type**: Web application
   - **Name**: SalaFácil
   - **Authorized domains**: 
     - `gerenciamentosalas.netlify.app`
     - `localhost:5173` (para desenvolvimento)
   - **Authorized redirect URIs**: 
     - `https://gerenciamentosalas.netlify.app`
     - `http://localhost:5173` (para desenvolvimento)

### 3. **Configurar Variáveis de Ambiente**

#### **No Netlify (Produção):**
1. Acesse seu dashboard do Netlify
2. Vá em **Site settings > Environment variables**
3. Adicione:
   ```
   VITE_GOOGLE_CLIENT_ID=seu-google-client-id-aqui
   DATABASE_URL=sua-url-neon-database
   JWT_SECRET=sua-chave-jwt-secreta
   ```

#### **Para Desenvolvimento Local:**
1. Copie `.env.example` para `.env`
2. Preencha com seus valores reais:
   ```bash
   VITE_GOOGLE_CLIENT_ID=seu-google-client-id-aqui
   DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   JWT_SECRET=sua-chave-jwt-super-secreta-de-32-caracteres-ou-mais
   ```

### 4. **Atualizar Banco de Dados**

Execute o script SQL para adicionar campos do Google:

```sql
-- Execute no seu banco Neon PostgreSQL
ALTER TABLE usuarios ADD COLUMN google_id VARCHAR(255);
ALTER TABLE usuarios ADD COLUMN avatar_url TEXT;
ALTER TABLE usuarios ALTER COLUMN password DROP NOT NULL;

CREATE UNIQUE INDEX idx_usuarios_google_id ON usuarios(google_id);
CREATE INDEX idx_usuarios_email ON usuarios(email);
```

---

## 🎯 Como Usar

### **Para Usuários Finais:**

1. **Acesse**: https://gerenciamentosalas.netlify.app/
2. **Escolha uma opção**:
   - ✅ **Criar Conta**: Preencha nome, email e senha
   - ✅ **Login com Google**: Clique no botão do Google
   - ✅ **Login Tradicional**: Use email e senha

### **Recursos Disponíveis:**
- 📊 **Dashboard** com estatísticas e analytics
- 🏢 **Gerenciar Salas** (/gerenciar-salas)
- 📅 **Sistema de Reservas**
- 👤 **Perfil de usuário** personalizado

---

## 🔒 Segurança

### **Medidas Implementadas:**
- ✅ **JWT Tokens** com expiração
- ✅ **Senhas criptografadas** com bcrypt
- ✅ **Validação do Google Token** no backend
- ✅ **CORS** configurado corretamente
- ✅ **Validação de entrada** em todos os endpoints

### **Estrutura de Usuários:**
```sql
usuarios {
  id: SERIAL PRIMARY KEY,
  username: VARCHAR(50),
  email: VARCHAR(100) UNIQUE,
  password: VARCHAR(255), -- Opcional para usuários Google
  nome: VARCHAR(100),
  telefone: VARCHAR(20),
  google_id: VARCHAR(255), -- ID único do Google
  avatar_url: TEXT, -- Foto de perfil
  created_at: TIMESTAMP
}
```

---

## 🛠️ Arquivos Principais

### **Frontend:**
- `frontend/src/pages/AuthPage.jsx` - Página de login/registro
- `frontend/src/contexts/AuthContext.jsx` - Context de autenticação

### **Backend:**
- `netlify/functions/auth.js` - Login tradicional
- `netlify/functions/register.js` - Registro de usuários
- `netlify/functions/google-auth.js` - Login com Google

### **Banco de Dados:**
- `database/update_usuarios_google.sql` - Script de atualização

---

## 🎉 Sistema Completo!

Agora o **SalaFácil** tem um sistema de autenticação moderno e completo:

- ✅ **Usuários podem criar contas**
- ✅ **Login com Google OAuth**
- ✅ **Interface profissional**
- ✅ **Totalmente seguro**
- ✅ **Pronto para produção**

**Deploy em andamento em**: https://gerenciamentosalas.netlify.app/
