# 🚀 DEPLOY NETLIFY + NEON - SalaFácil

## ⚡ STACK SIMPLIFICADA (5 minutos total)

### **Frontend**: Netlify (Gratuito)
### **Database**: Neon PostgreSQL (Gratuito)  
### **Backend**: Netlify Functions (Gratuito)

---

## 📋 **PASSO A PASSO**

### 1️⃣ **Database - Neon (2 min)**

1. **https://neon.tech** → GitHub login
2. **Create Project**: `sala-facil`  
3. **Copy connection string**:
```
postgresql://user:pass@ep-xxx.neon.tech/sala_facil_db?sslmode=require
```

### 2️⃣ **Frontend + Backend - Netlify (3 min)**

1. **https://netlify.com** → GitHub login
2. **New site from Git** → Seu repositório
3. **Build settings**:
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

4. **Environment Variables**:
   ```env
   VITE_API_URL=/.netlify/functions
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/sala_facil_db?sslmode=require
   SECRET_KEY=sua-chave-super-secreta-123
   ```

5. **Enable Functions**: ✅ (automático)

---

## 🔧 **O QUE VAMOS FAZER**

### ❌ **Remover**:
- Railway (backend separado)
- Configurações complexas
- Múltiplos serviços

### ✅ **Simplificar**:
- Tudo no Netlify
- Backend como Functions
- Uma única plataforma
- Deploy automático

---

## 📁 **ESTRUTURA NOVA**

```
projeto/
├── frontend/          # React app
├── netlify/
│   └── functions/     # Backend API (Python/Node)
├── netlify.toml       # Configuração
└── requirements.txt   # Dependências
```

---

## 🎯 **VANTAGENS**

- 🆓 **100% Gratuito**
- 🚀 **Deploy único**
- 🔄 **Updates automáticos**
- 🌐 **CDN global**
- 🔒 **HTTPS automático**
- 📊 **Dashboard único**

---

## 🎉 **RESULTADO**

- ✅ **App**: https://seu-site.netlify.app
- ✅ **API**: https://seu-site.netlify.app/.netlify/functions/
- ✅ **Database**: Neon PostgreSQL
- ✅ **Tudo gratuito!**

**Quer que eu configure isso para você? 🚀**
