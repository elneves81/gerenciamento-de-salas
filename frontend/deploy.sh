#!/bin/bash

# Script de build do frontend
echo "🚀 Iniciando build do frontend..."

# Instalar dependências
npm ci

# Build para produção
npm run build

echo "✅ Build do frontend concluído!"
echo "📁 Arquivos gerados em: dist/"
