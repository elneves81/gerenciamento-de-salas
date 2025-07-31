# 🔑 Guia para Conectar ao Neon Database Real

## Passo 1: Obter API Key do Neon

1. Acesse: https://console.neon.tech/
2. Faça login na sua conta Neon
3. Vá em **Settings** → **API Keys**
4. Clique em **Generate new API key**
5. Copie a chave gerada

## Passo 2: Configurar no Netlify

1. Acesse: https://app.netlify.com/
2. Entre no seu site **gerenciamentosalas**
3. Vá em **Site settings** → **Environment variables**
4. Adicione a variável:
   ```
   NEON_API_KEY = sua_api_key_aqui
   ```

## Passo 3: Testar Conexão Real

Após configurar, teste:

```bash
# Testar status do banco real
curl https://gerenciamentosalas.netlify.app/api/neon-production-api/status

# Setup completo no banco real
curl https://gerenciamentosalas.netlify.app/api/neon-production-api/setup-complete
```

## Passo 4: Migrar Dados

O sistema criará automaticamente:
- ✅ Tabelas: usuarios, departamentos, salas, reservas
- ✅ Dados iniciais profissionais
- ✅ Estrutura completa pronta para uso

---

## ⚠️ Importante

- **Sem API Key**: Sistema funciona em modo simulação (como está agora)
- **Com API Key**: Conecta ao banco Neon real
- **Ambos modos**: Sistema frontend funciona igual

---

## 🚀 Resultado

Após configurar a API Key, você terá:
- ✅ Banco Neon real funcionando
- ✅ Dados persistentes na nuvem
- ✅ Escalabilidade para produção
- ✅ Backup automático do Neon
