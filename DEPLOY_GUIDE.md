# 🚀 Deploy Rápido - SalaFácil com Chat

## Netlify (Frontend)

1. **Conectar GitHub ao Netlify:**
   - Vá em [netlify.com](https://netlify.com)
   - "New site from Git" → Escolha este repositório
   - Build settings já estão no `netlify.toml`

2. **Variáveis de Ambiente no Netlify:**
   ```
   REACT_APP_API_URL = https://seu-backend.herokuapp.com
   REACT_APP_VAPID_PUBLIC_KEY = sua-chave-vapid-publica
   ```

3. **Deploy Automático:**
   - Netlify fará deploy automático a cada push

## Railway (Backend)

1. **Conectar GitHub ao Railway:**
   - Vá em [railway.app](https://railway.app)
   - "New Project" → "Deploy from GitHub"
   - Escolha a pasta `backend` como root

2. **Variáveis de Ambiente no Railway:**
   ```
   DEBUG = False
   SECRET_KEY = sua-chave-secreta
   DATABASE_URL = sua-connection-string-neon
   VAPID_PRIVATE_KEY = sua-chave-vapid-privada
   VAPID_PUBLIC_KEY = sua-chave-vapid-publica
   EMAIL_HOST_USER = seu-email@gmail.com
   EMAIL_HOST_PASSWORD = sua-senha-de-app
   FRONTEND_URL = https://seu-app.netlify.app
   ALLOWED_HOSTS = *.up.railway.app
   CORS_ALLOWED_ORIGINS = https://seu-app.netlify.app
   ```

## Gerar Chaves VAPID

1. Acesse: https://web-push-codelab.glitch.me/
2. Clique em "Generate Keys"
3. Copie as chaves para as variáveis de ambiente

## Banco de Dados (Neon)

1. Vá em [neon.tech](https://neon.tech)
2. Crie novo projeto PostgreSQL
3. Copie a connection string para `DATABASE_URL`

## ✅ Sistema Pronto!

Após o deploy, você terá:
- 💬 Chat em tempo real
- 🔔 Push notifications  
- 📧 Emails automáticos
- 📱 PWA completo
