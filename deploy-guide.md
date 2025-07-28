# 🚀 Guia de Deploy - SalaFácil

## ⚡ Deploy Rápido (5 minutos)

### **Opção 1: Railway + Vercel (Recomendado)**

#### Backend no Railway:
1. Acesse [railway.app](https://railway.app)
2. Conecte seu GitHub
3. Deploy from repo → Selecione seu repositório
4. Configure as variáveis:
   ```
   SECRET_KEY=sua-chave-secreta-aqui
   DEBUG=False
   ALLOWED_HOSTS=*.railway.app
   CORS_ALLOWED_ORIGINS=https://seu-frontend.vercel.app
   ```
5. ✅ Backend online em ~3 minutos!

#### Frontend na Vercel:
1. Acesse [vercel.com](https://vercel.com)
2. Import project → GitHub
3. Configure build settings:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Variáveis de ambiente:
   ```
   VITE_API_URL=https://seu-backend.railway.app/api
   ```
5. ✅ Frontend online em ~2 minutos!

---

## 🌟 Outras Opções de Deploy

### Frontend Options:

#### **Vercel** (Recomendado)
- ✅ **GRATUITO** - 100GB bandwidth
- ✅ Deploy automático do GitHub
- ✅ CDN global
- ✅ Custom domains

#### **Netlify**
- ✅ **GRATUITO** - 100GB bandwidth  
- ✅ Deploy automático
- ✅ Form handling
- ✅ Functions serverless

#### **Firebase Hosting**
- ✅ **GRATUITO** - 10GB storage
- ✅ CDN global do Google
- ✅ SSL automático
- ✅ Integração com Analytics

### Backend Options:

#### **Railway** (Recomendado)
- ✅ **$5/mês** - PostgreSQL incluso
- ✅ Deploy automático
- ✅ Domain personalizado
- ✅ Logs em tempo real

#### **Render**
- ✅ **GRATUITO** - PostgreSQL incluso
- ✅ SSL automático
- ✅ Deploy do GitHub
- ❌ Sleep após inatividade

#### **PythonAnywhere**
- ✅ **$5/mês** - Sempre online
- ✅ MySQL incluso
- ✅ SSH access
- ❌ Setup manual

#### **Google Cloud Platform**
- ✅ **$300 créditos grátis**
- ✅ Escalabilidade infinita
- ✅ Cloud SQL
- ❌ Complexidade alta

---

## 🔧 Configuração Local para Deploy

### 1. Preparar Backend
```bash
cd backend

# Instalar dependências
pip install -r requirements.txt

# Configurar .env
cp .env.example .env
# Editar .env com suas configurações

# Testar localmente
python manage.py collectstatic --noinput
python manage.py migrate
python manage.py runserver
```

### 2. Preparar Frontend
```bash
cd frontend

# Instalar dependências
npm install

# Configurar .env
# VITE_API_URL=http://localhost:8000/api

# Build para produção
npm run build

# Testar build
npm run preview
```

---

## 🚀 Deploy Automatizado

### Railway Backend Deploy:
1. Push para GitHub
2. ✅ Deploy automático
3. ✅ PostgreSQL configurado
4. ✅ Migrations aplicadas
5. ✅ Superuser criado

### Vercel Frontend Deploy:
1. Push para GitHub  
2. ✅ Build automático
3. ✅ Deploy na CDN
4. ✅ HTTPS configurado
5. ✅ Domain personalizado

---

## 🔐 Variáveis de Ambiente

### Backend (.env):
```bash
# Produção
SECRET_KEY=chave-super-secreta-aqui
DEBUG=False
ALLOWED_HOSTS=*.railway.app,seu-dominio.com
DATABASE_URL=postgresql://user:pass@host:port/db
CORS_ALLOWED_ORIGINS=https://seu-frontend.vercel.app

# Desenvolvimento
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
# DATABASE_URL= (vazio usa SQLite)
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend (.env):
```bash
# Produção
VITE_API_URL=https://seu-backend.railway.app/api
VITE_APP_ENV=production

# Desenvolvimento  
VITE_API_URL=http://localhost:8000/api
VITE_APP_ENV=development
```

---

## 📋 Checklist de Deploy

### Pré-Deploy:
- [ ] Código commitado no GitHub
- [ ] `.env.example` criado
- [ ] `requirements.txt` atualizado
- [ ] `package.json` configurado
- [ ] Build local funcionando

### Backend:
- [ ] Railway conectado ao GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] PostgreSQL funcionando
- [ ] Migrations aplicadas
- [ ] Admin criado

### Frontend:
- [ ] Vercel conectado ao GitHub
- [ ] Build settings configurados
- [ ] Variáveis de ambiente configuradas
- [ ] Custom domain (opcional)

### Pós-Deploy:
- [ ] ✅ Backend online e respondendo
- [ ] ✅ Frontend carregando
- [ ] ✅ API calls funcionando
- [ ] ✅ CORS configurado
- [ ] ✅ Admin panel acessível

---

## 🔧 Troubleshooting

### Erros Comuns:

#### **"Build failed"**
```bash
# Verificar logs
railway logs
# ou
vercel logs
```

#### **"CORS error"**
```bash
# Backend settings.py
CORS_ALLOWED_ORIGINS = [
    'https://seu-frontend.vercel.app'
]
```

#### **"500 Internal Server Error"**
```bash
# Verificar variáveis de ambiente
# Verificar migrations
python manage.py migrate
```

#### **"Module not found"**
```bash
# Verificar requirements.txt
pip freeze > requirements.txt
```

---

## 💡 Dicas de Otimização

### Performance:
- ✅ Build otimizado (Vite)
- ✅ CDN global (Vercel)
- ✅ Compression (WhiteNoise)
- ✅ Static files cache

### Segurança:
- ✅ HTTPS everywhere
- ✅ CORS configurado
- ✅ Environment variables
- ✅ DEBUG=False em produção

### Monitoramento:
- ✅ Railway logs
- ✅ Vercel analytics
- ✅ Error tracking
- ✅ Performance metrics

---

## 📞 Suporte

### URLs de Exemplo:
- **Frontend**: https://sala-facil.vercel.app
- **Backend**: https://sala-facil-backend.railway.app
- **Admin**: https://sala-facil-backend.railway.app/admin

### Credenciais Padrão:
- **Admin**: admin / admin123
- **API**: Usar JWT tokens

---

**🎉 Seu SalaFácil estará online em menos de 5 minutos!**
