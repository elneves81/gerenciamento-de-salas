# 🚀 Deploy Completo: Netlify + Neon

## 📋 Pré-requisitos
- ✅ Conta no [Netlify](https://www.netlify.com/)
- ✅ Conta no [Neon](https://neon.tech/)
- ✅ Código otimizado no GitHub

## 🗃️ Passo 1: Configurar Banco Neon

### 1.1 Criar Projeto no Neon
1. Acesse [console.neon.tech](https://console.neon.tech/)
2. Clique em **"Create Project"**
3. Escolha:
   - **Name**: salafacil-db
   - **Region**: US East (Ohio) - us-east-2
   - **PostgreSQL version**: 15
4. Clique **"Create Project"**

### 1.2 Configurar Database
1. No dashboard do Neon, vá em **"SQL Editor"**
2. Cole e execute o script `setup-neon-database.sql`:

```sql
-- O arquivo setup-neon-database.sql já foi criado
-- Execute-o no SQL Editor do Neon
```

### 1.3 Obter Connection String
1. No dashboard, vá em **"Connection Details"**
2. Copie a **Connection String** (formato: `postgresql://username:password@host/database`)
3. Guarde para usar no Netlify

## 🌐 Passo 2: Deploy no Netlify

### 2.1 Conectar Repositório
1. Acesse [app.netlify.com](https://app.netlify.com/)
2. Clique **"New Site from Git"**
3. Escolha **GitHub** e selecione seu repositório
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`

### 2.2 Configurar Variáveis de Ambiente
1. No dashboard do site, vá em **"Site Settings"**
2. Clique **"Environment Variables"**
3. Adicione:

```
DATABASE_URL = sua-connection-string-do-neon
JWT_SECRET = uma-chave-super-secreta-de-32-caracteres
```

### 2.3 Instalar Dependências das Functions
1. Na raiz do projeto, crie `package.json`:

```bash
npm init -y
npm install @netlify/functions pg jsonwebtoken bcryptjs
```

## 🔧 Passo 3: Testar Functions

### 3.1 Teste Local (Opcional)
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Fazer login
netlify login

# Iniciar desenvolvimento local
netlify dev
```

### 3.2 Endpoints Disponíveis
Após o deploy, suas APIs estarão em:

- **Autenticação**: `https://seu-site.netlify.app/.netlify/functions/auth`
- **Salas**: `https://seu-site.netlify.app/.netlify/functions/salas`
- **Agendamentos**: `https://seu-site.netlify.app/.netlify/functions/agendamentos`

## 📱 Passo 4: Atualizar Frontend

O arquivo `api.js` já foi configurado para usar:
```javascript
const BASE_URL = '/.netlify/functions';
```

## 🧪 Passo 5: Testar a Aplicação

### 5.1 Login de Teste
- **Usuário**: admin
- **Senha**: admin123

### 5.2 Verificar Funcionalidades
1. ✅ Login/Logout
2. ✅ Listar salas
3. ✅ Criar agendamento
4. ✅ Visualizar agenda
5. ✅ Deletar agendamento

## 🚨 Troubleshooting

### Erro de CORS
Se houver problemas de CORS, verifique:
1. Headers no `netlify.toml` estão corretos
2. Functions retornam headers CORS adequados

### Erro de Database
1. Verifique a CONNECTION_STRING no Neon
2. Confirme que o IP está liberado (Neon libera por padrão)
3. Execute novamente o script SQL

### Build Error no Netlify
1. Verifique se o `package.json` do frontend está correto
2. Confirme que a pasta `frontend/dist` é gerada
3. Verifique logs de build no Netlify

## 📊 Monitoramento

### Netlify Analytics
- Acesse **"Analytics"** no dashboard
- Monitore requisições das Functions

### Neon Monitoring
- Vá em **"Monitoring"** no console Neon
- Acompanhe uso do banco

## 💰 Custos

### Netlify (Plano Gratuito)
- ✅ 100GB bandwidth/mês
- ✅ 125k function requests/mês
- ✅ Functions até 10s execução

### Neon (Plano Gratuito)
- ✅ 3 projetos
- ✅ 10 branches
- ✅ 3GB storage

## 🎉 Parabéns!

Sua aplicação SalaFácil agora está rodando com:
- 🚀 **Frontend**: Netlify (CDN global)
- ⚡ **Backend**: Netlify Functions (serverless)
- 🗃️ **Database**: Neon PostgreSQL (cloud)

**URL da aplicação**: `https://seu-site-name.netlify.app`

---

> 💡 **Dica**: Configure um domínio personalizado em **Site Settings > Domain Management** no Netlify!
