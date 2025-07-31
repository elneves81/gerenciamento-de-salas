# 🗃️ Configuração Google Cloud SQL - PostgreSQL

## 1. Acesse o Google Cloud Console
- Vá para: https://console.cloud.google.com/
- Faça login com sua conta Google

## 2. Criar/Selecionar Projeto
- Se não tem projeto: "Criar Projeto"
- Nome sugerido: "sala-facil-db"

## 3. Ativar API do SQL
- Navegue: APIs & Services > Library
- Procure: "Cloud SQL Admin API"
- Clique: "Enable"

## 4. Criar Instância PostgreSQL
- Navegue: SQL > Create Instance
- Escolha: PostgreSQL
- Configurações:
  * Instance ID: salafacil-db
  * Password: [criar senha forte]
  * Region: us-central1 (ou mais próximo)
  * Zone: Any
  * Machine type: db-f1-micro (gratuito)
  * Storage: 10GB SSD

## 5. Configurar Conexões
- Na instância criada > Connections
- Authorized networks: Add network
- Name: "Netlify"
- Network: 0.0.0.0/0 (temporário para teste)

## 6. Criar Database
- Na instância > Databases > Create Database
- Database name: salafacil

## 7. Criar Usuário
- Na instância > Users > Add User Account
- Username: salafacil_user
- Password: [senha forte]

## 8. Obter Connection String
Formato: postgresql://username:password@IP:5432/database

Exemplo:
postgresql://salafacil_user:suasenha@34.123.45.67:5432/salafacil

## 9. Atualizar Netlify
- Dashboard Netlify > Site Settings > Environment Variables
- Atualizar: DATABASE_URL = [sua connection string]

## 10. Deploy e Teste
- Push para GitHub
- Aguardar deploy
- Testar criação de usuários

## 💰 Custos Estimados
- db-f1-micro: ~$7-10/mês
- 10GB storage: ~$1.7/mês
- Total: ~$8-12/mês

## ⚡ Vantagens
✅ Mesmo código PostgreSQL atual
✅ Backup automático
✅ SSL automático
✅ Interface web para gerenciar
✅ Escalabilidade automática
