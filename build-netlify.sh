#!/bin/bash

echo "🚀 Build para Netlify - SalaFácil"

# Ir para o diretório frontend
cd frontend

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Build para produção
echo "🔧 Fazendo build..."
npm run build

# Verificar se o build foi bem-sucedido
if [ -d "dist" ]; then
    echo "✅ Build concluído com sucesso!"
    echo "📁 Pasta 'dist' criada em: $(pwd)/dist"
    echo ""
    echo "🌐 Para fazer deploy no Netlify:"
    echo "1. Acesse: https://netlify.com"
    echo "2. Arraste a pasta 'dist' para o site"
    echo "3. Configure a variável VITE_API_URL"
    echo ""
    echo "📊 Tamanho dos arquivos:"
    du -sh dist/
    ls -la dist/
else
    echo "❌ Erro no build!"
    exit 1
fi
