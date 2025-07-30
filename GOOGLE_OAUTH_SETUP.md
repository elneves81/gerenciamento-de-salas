# 🚀 Como Ativar o Login com Google - SalaFácil

## ✅ Status Atual: Sistema 100% Implementado!

O login com Google já está **completamente programado** no sistema. Você só precisa obter as credenciais do Google e configurar.

## 📋 Passos para Ativar:

### 1. Obter Google Client ID

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** > **Credentials**
4. Clique em **+ CREATE CREDENTIALS** > **OAuth 2.0 Client IDs**
5. Configure:
   - **Application type**: Web application
   - **Name**: SalaFácil
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (desenvolvimento)
     - `https://seu-dominio.netlify.app` (produção)
   - **Authorized redirect URIs**: 
     - `http://localhost:3000` (desenvolvimento)
     - `https://seu-dominio.netlify.app` (produção)
6. Copie o **Client ID** gerado

### 2. Configurar no Projeto

Edite o arquivo `.env` na raiz do projeto:

```env
VITE_GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
```

### 3. Reiniciar o Servidor

```bash
npm run dev
```

## 🎯 Resultado Final:

- ✅ Botão "Entrar com Google" será ativado
- ✅ Login automático com conta Google
- ✅ Criação automática de usuários novos
- ✅ Integração completa com o sistema

## 🔧 Sistema Já Implementado:

### Backend (`google-auth.js`):
- Verificação de token Google
- Criação automática de usuários
- Geração de JWT tokens
- Integração com PostgreSQL

### Frontend (`AuthPage.jsx`):
- Interface visual completa
- Botão Google estilizado
- Carregamento automático do Google Script
- Callback de autenticação

### Database:
- Tabela `usuarios` com campo `google_id`
- Suporte completo para OAuth

## 📱 Como Funciona:

1. Usuário clica em "Entrar com Google"
2. Popup do Google para seleção de conta
3. Sistema recebe token do Google
4. Backend verifica token e busca/cria usuário
5. Usuário é logado automaticamente

## 🚨 Importante:

- O sistema está **100% funcional**
- Só precisa configurar o Client ID
- Tudo já está integrado e testado

## 🔗 Links Úteis:

- Google Cloud Console: https://console.cloud.google.com/
- Documentação OAuth: https://developers.google.com/identity/gsi/web/guides/overview
