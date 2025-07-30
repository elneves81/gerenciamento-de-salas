# Arquivo de configuração para variáveis de ambiente - Netlify

# ========================================
# INSTRUÇÕES PARA DEPLOY NO NETLIFY
# ========================================

# 1. Acesse o dashboard do Netlify (https://app.netlify.com)
# 2. Vá em Site Settings > Environment Variables
# 3. Adicione as seguintes variáveis:

# === BACKEND (RAILWAY/HEROKU) ===
REACT_APP_API_URL=https://your-backend-app.herokuapp.com
# ou
REACT_APP_API_URL=https://your-app.up.railway.app

# === PUSH NOTIFICATIONS ===
# Gere suas chaves em: https://web-push-codelab.glitch.me/
REACT_APP_VAPID_PUBLIC_KEY=sua-chave-publica-vapid-aqui

# === OUTRAS CONFIGURAÇÕES ===
NODE_VERSION=18
REACT_APP_FRONTEND_URL=https://your-app.netlify.app

# ========================================
# BACKEND ENVIRONMENT VARIABLES
# (Para Railway/Heroku/Render)
# ========================================

# === DJANGO SETTINGS ===
DEBUG=False
SECRET_KEY=sua-chave-super-secreta-de-producao
ALLOWED_HOSTS=your-app.up.railway.app,*.herokuapp.com
CORS_ALLOWED_ORIGINS=https://your-app.netlify.app

# === DATABASE ===
# Para Neon PostgreSQL
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/sala_facil_db?sslmode=require

# === PUSH NOTIFICATIONS ===
VAPID_PRIVATE_KEY=sua-chave-privada-vapid-aqui  
VAPID_PUBLIC_KEY=sua-chave-publica-vapid-aqui
VAPID_EMAIL=admin@salafacil.com

# === EMAIL CONFIGURATION ===
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=seu-email@gmail.com
EMAIL_HOST_PASSWORD=sua-senha-de-app-gmail
DEFAULT_FROM_EMAIL=SalaFácil <noreply@salafacil.com>

# === FRONTEND URL ===
FRONTEND_URL=https://your-app.netlify.app

# ========================================
# PASSOS PARA DEPLOY COMPLETO
# ========================================

# FRONTEND (NETLIFY):
# 1. Conecte o repositório GitHub ao Netlify
# 2. Configure as variáveis de ambiente acima
# 3. Deploy automático acontecerá

# BACKEND (RAILWAY):
# 1. Conecte o repositório ao Railway
# 2. Configure as variáveis de ambiente
# 3. Certifique-se que a pasta 'backend' é o diretório raiz

# BANCO DE DADOS (NEON):
# 1. Crie conta em neon.tech
# 2. Crie um novo projeto PostgreSQL
# 3. Copie a connection string para DATABASE_URL

# EMAIL (GMAIL):
# 1. Ative autenticação de 2 fatores
# 2. Gere uma "Senha de app" específica
# 3. Use essa senha no EMAIL_HOST_PASSWORD

# ========================================
# TESTANDO O SISTEMA
# ========================================

# 1. Acesse o frontend no Netlify
# 2. Faça login no sistema
# 3. Teste o chat clicando no botão flutuante
# 4. Verifique notificações no ícone de sino
# 5. Teste push notifications (precisa de HTTPS)

# ========================================
# URLs FINAIS DO SISTEMA
# ========================================

# Frontend: https://your-app.netlify.app
# Backend API: https://your-app.up.railway.app/api/
# Django Admin: https://your-app.up.railway.app/admin/
# Chat APIs: https://your-app.up.railway.app/api/chat/
