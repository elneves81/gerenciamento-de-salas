# 🚀 DEPLOY EM 5 MINUTOS - SalaFácil

## ⚡ SETUP SUPER RÁPIDO

### 1️⃣ **BACKEND - Railway (3 minutos)**

1. Acesse: **https://railway.app**
2. Login com GitHub
3. **New Project** → **Deploy from GitHub repo**
4. Selecione seu repositório
5. Configure **Root Directory**: `backend`
6. Adicione estas variáveis:

```env
SECRET_KEY=sua-chave-super-secreta-aqui-123456
DEBUG=False
ALLOWED_HOSTS=*.railway.app,determined-nourishment-production.up.railway.app
CORS_ALLOWED_ORIGINS=https://seu-frontend.vercel.app
```

✅ **PRONTO!** Backend online em ~3 minutos

---

### 2️⃣ **FRONTEND - Vercel (2 minutos)**

1. Acesse: **https://vercel.com**
2. **Import Project** → GitHub
3. Selecione seu repositório
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Adicione variável de ambiente:
```env
VITE_API_URL=https://determined-nourishment-production.up.railway.app/api
```

✅ **PRONTO!** Frontend online em ~2 minutos

---

## 🎯 RESULTADO FINAL

- ✅ **Frontend**: https://seu-app.vercel.app
- ✅ **Backend**: https://seu-app.railway.app  
- ✅ **Admin**: https://seu-app.railway.app/admin
- ✅ **Login**: admin / admin123

---

## 🔧 TROUBLESHOOTING RÁPIDO

### ❌ **"Build Error"**
```bash
# Verifique se está no diretório correto
Root Directory: backend (para Railway)
Root Directory: frontend (para Vercel)
```

### ❌ **"CORS Error"**
```bash
# No Railway, adicione variável:
CORS_ALLOWED_ORIGINS=https://SEU-FRONTEND.vercel.app
```

### ❌ **"API não funciona"**
```bash
# No Vercel, adicione variável:
VITE_API_URL=https://determined-nourishment-production.up.railway.app/api
```

---

## 💡 DICAS

- ✅ **Sempre use HTTPS** nas URLs de produção
- ✅ **Copie URLs exatas** (sem barra no final)
- ✅ **Aguarde 2-3 minutos** para propagação
- ✅ **Logs disponíveis** em ambas plataformas

---

## 🎉 SEU APP ESTÁ ONLINE!

**Total: ~5 minutos ⏱️**

Agora você tem:
- 🌐 **App web completo**
- 📱 **Responsivo mobile**
- 🔒 **HTTPS seguro**
- 🚀 **Deploy automático**
- 💾 **Banco PostgreSQL**
- 📊 **Admin panel**

**Compartilhe sua URL e começe a usar! 🎊**
