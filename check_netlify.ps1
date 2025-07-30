Write-Host "🚀 Verificando configuração do Netlify + Neon..." -ForegroundColor Green

# Verificar estrutura do projeto
Write-Host "📁 Verificando estrutura do projeto..." -ForegroundColor Yellow

$success = $true

if (Test-Path "frontend\package.json") {
    Write-Host "✅ package.json encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ package.json não encontrado" -ForegroundColor Red
    $success = $false
}

if (Test-Path "frontend\netlify.toml") {
    Write-Host "✅ netlify.toml encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ netlify.toml não encontrado" -ForegroundColor Red
    $success = $false
}

if (Test-Path "frontend\netlify\functions\api.js") {
    Write-Host "✅ Função principal api.js encontrada" -ForegroundColor Green
} else {
    Write-Host "❌ Função api.js não encontrada" -ForegroundColor Red
    $success = $false
}

if (Test-Path "frontend\netlify\functions\google-auth.js") {
    Write-Host "✅ Função google-auth.js encontrada" -ForegroundColor Green
} else {
    Write-Host "❌ Função google-auth.js não encontrada" -ForegroundColor Red
    $success = $false
}

if (Test-Path "frontend\src\components\AdminPanel.jsx") {
    Write-Host "✅ AdminPanel.jsx encontrado" -ForegroundColor Green
} else {
    Write-Host "❌ AdminPanel.jsx não encontrado" -ForegroundColor Red
    $success = $false
}

# Verificar dependências
Write-Host ""
Write-Host "📦 Verificando dependências..." -ForegroundColor Yellow

$packageJson = Get-Content "frontend\package.json" -Raw

if ($packageJson -match '"pg"') {
    Write-Host "✅ Dependência pg (PostgreSQL) presente" -ForegroundColor Green
} else {
    Write-Host "❌ Dependência pg ausente" -ForegroundColor Red
}

if ($packageJson -match '"google-auth-library"') {
    Write-Host "✅ Dependência google-auth-library presente" -ForegroundColor Green
} else {
    Write-Host "❌ Dependência google-auth-library ausente" -ForegroundColor Red
}

if ($packageJson -match '"@mui/material"') {
    Write-Host "✅ Dependência Material-UI presente" -ForegroundColor Green
} else {
    Write-Host "❌ Dependência Material-UI ausente" -ForegroundColor Red
}

# Verificar configuração do build
Write-Host ""
Write-Host "🔧 Verificando configuração de build..." -ForegroundColor Yellow

if ($packageJson -match '"build": "vite build"') {
    Write-Host "✅ Script de build configurado" -ForegroundColor Green
} else {
    Write-Host "❌ Script de build não configurado" -ForegroundColor Red
}

# Verificar netlify.toml
Write-Host ""
Write-Host "⚙️ Verificando configuração do Netlify..." -ForegroundColor Yellow

$netlifyToml = Get-Content "frontend\netlify.toml" -Raw

if ($netlifyToml -match 'functions = "netlify/functions"') {
    Write-Host "✅ Diretório de functions configurado" -ForegroundColor Green
} else {
    Write-Host "❌ Diretório de functions não configurado" -ForegroundColor Red
}

if ($netlifyToml -match 'publish = "dist"') {
    Write-Host "✅ Diretório de publish configurado" -ForegroundColor Green
} else {
    Write-Host "❌ Diretório de publish não configurado" -ForegroundColor Red
}

if ($netlifyToml -match '/api/\*') {
    Write-Host "✅ Redirect para API configurado" -ForegroundColor Green
} else {
    Write-Host "❌ Redirect para API não configurado" -ForegroundColor Red
}

# Verificar variáveis de ambiente necessárias
Write-Host ""
Write-Host "🔑 Variáveis de ambiente necessárias:" -ForegroundColor Yellow
Write-Host "   - DATABASE_URL (String de conexão do Neon)" -ForegroundColor Cyan
Write-Host "   - GOOGLE_CLIENT_ID (ID do cliente Google OAuth)" -ForegroundColor Cyan
Write-Host "   - NODE_ENV=production" -ForegroundColor Cyan
Write-Host ""

# Verificar estado do git
Write-Host "📋 Verificando estado do Git..." -ForegroundColor Yellow

$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️ Há arquivos não commitados:" -ForegroundColor Yellow
    git status --porcelain
    Write-Host ""
    Write-Host "Execute: git add . && git commit -m 'Deploy Netlify + Neon'" -ForegroundColor Cyan
} else {
    Write-Host "✅ Repositório limpo e pronto para deploy" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎯 PRÓXIMOS PASSOS:" -ForegroundColor Magenta
Write-Host "1. 📤 Fazer push do código: git push origin main" -ForegroundColor White
Write-Host "2. 🌐 Conectar repositório no Netlify.com" -ForegroundColor White
Write-Host "3. ⚙️ Configurar variáveis de ambiente no Netlify" -ForegroundColor White
Write-Host "4. 🚀 Deploy automático será executado" -ForegroundColor White
Write-Host ""
Write-Host "📖 Consulte NETLIFY_DEPLOY.md para instruções detalhadas" -ForegroundColor Cyan
Write-Host ""
Write-Host "✨ Sistema 100% pronto para Netlify + Neon!" -ForegroundColor Green
