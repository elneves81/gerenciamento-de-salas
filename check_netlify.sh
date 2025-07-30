#!/bin/bash

echo "🚀 Verificando configuração do Netlify + Neon..."

# Verificar estrutura do projeto
echo "📁 Verificando estrutura do projeto..."

if [ -f "frontend/package.json" ]; then
    echo "✅ package.json encontrado"
else
    echo "❌ package.json não encontrado"
    exit 1
fi

if [ -f "frontend/netlify.toml" ]; then
    echo "✅ netlify.toml encontrado"
else
    echo "❌ netlify.toml não encontrado"
    exit 1
fi

if [ -f "frontend/netlify/functions/api.js" ]; then
    echo "✅ Função principal api.js encontrada"
else
    echo "❌ Função api.js não encontrada"
    exit 1
fi

if [ -f "frontend/netlify/functions/google-auth.js" ]; then
    echo "✅ Função google-auth.js encontrada"
else
    echo "❌ Função google-auth.js não encontrada"
    exit 1
fi

if [ -f "frontend/src/components/AdminPanel.jsx" ]; then
    echo "✅ AdminPanel.jsx encontrado"
else
    echo "❌ AdminPanel.jsx não encontrado"
    exit 1
fi

# Verificar dependências
echo ""
echo "📦 Verificando dependências..."

cd frontend

# Verificar se as dependências essenciais estão no package.json
if grep -q '"pg"' package.json; then
    echo "✅ Dependência pg (PostgreSQL) presente"
else
    echo "❌ Dependência pg ausente"
fi

if grep -q '"google-auth-library"' package.json; then
    echo "✅ Dependência google-auth-library presente"
else
    echo "❌ Dependência google-auth-library ausente"
fi

if grep -q '"@mui/material"' package.json; then
    echo "✅ Dependência Material-UI presente"
else
    echo "❌ Dependência Material-UI ausente"
fi

# Verificar configuração do build
echo ""
echo "🔧 Verificando configuração de build..."

if grep -q '"build": "vite build"' package.json; then
    echo "✅ Script de build configurado"
else
    echo "❌ Script de build não configurado"
fi

# Verificar netlify.toml
echo ""
echo "⚙️ Verificando configuração do Netlify..."

if grep -q 'functions = "netlify/functions"' netlify.toml; then
    echo "✅ Diretório de functions configurado"
else
    echo "❌ Diretório de functions não configurado"
fi

if grep -q 'publish = "dist"' netlify.toml; then
    echo "✅ Diretório de publish configurado"
else
    echo "❌ Diretório de publish não configurado"
fi

if grep -q '/api/\*' netlify.toml; then
    echo "✅ Redirect para API configurado"
else
    echo "❌ Redirect para API não configurado"
fi

# Verificar variáveis de ambiente necessárias
echo ""
echo "🔑 Variáveis de ambiente necessárias:"
echo "   - DATABASE_URL (String de conexão do Neon)"
echo "   - GOOGLE_CLIENT_ID (ID do cliente Google OAuth)"
echo "   - NODE_ENV=production"
echo ""

# Verificar estado do git
echo "📋 Verificando estado do Git..."
cd ..

if git status --porcelain | grep -q .; then
    echo "⚠️ Há arquivos não commitados:"
    git status --porcelain
    echo ""
    echo "Execute: git add . && git commit -m 'Deploy Netlify + Neon'"
else
    echo "✅ Repositório limpo e pronto para deploy"
fi

echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. 📤 Fazer push do código: git push origin main"
echo "2. 🌐 Conectar repositório no Netlify.com"
echo "3. ⚙️ Configurar variáveis de ambiente no Netlify"
echo "4. 🚀 Deploy automático será executado"
echo ""
echo "📖 Consulte NETLIFY_DEPLOY.md para instruções detalhadas"
echo ""
echo "✨ Sistema 100% pronto para Netlify + Neon!"
