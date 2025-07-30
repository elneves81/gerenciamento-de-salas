const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event, context) => {
  // Headers CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Aceitar qualquer método
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = await pool.connect();
  let results = [];

  try {
    // 1. Verificar conexão com banco
    results.push('🔌 Conectando ao banco Neon...');
    await client.query('SELECT NOW()');
    results.push('✅ Conexão com Neon estabelecida!');

    // 2. Criar tabela de conversas
    results.push('📝 Criando tabela conversations...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(50) DEFAULT 'private',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    results.push('✅ Tabela conversations criada!');

    // 3. Criar tabela de participantes
    results.push('👥 Criando tabela conversation_participants...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_participants (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(conversation_id, user_id)
      );
    `);
    results.push('✅ Tabela conversation_participants criada!');

    // 4. Criar tabela de mensagens
    results.push('💬 Criando tabela messages...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    results.push('✅ Tabela messages criada!');

    // 5. Criar tabela de notificações
    results.push('🔔 Criando tabela notifications...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        type VARCHAR(50) DEFAULT 'info',
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    results.push('✅ Tabela notifications criada!');

    // 6. Criar índices
    results.push('⚡ Criando índices para performance...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);');
    results.push('✅ Índices criados!');

    // 7. Verificar tabelas criadas
    results.push('🔍 Verificando tabelas criadas...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversations', 'conversation_participants', 'messages', 'notifications')
      ORDER BY table_name;
    `);
    
    const tableNames = tablesResult.rows.map(row => row.table_name);
    results.push(`✅ Tabelas encontradas: ${tableNames.join(', ')}`);

    // 8. Inserir dados de teste (opcional)
    if (event.queryStringParameters?.test_data === 'true') {
      results.push('🧪 Inserindo dados de teste...');
      
      // Criar conversa de teste
      const convResult = await client.query(`
        INSERT INTO conversations (name, type) 
        VALUES ('Chat Geral', 'group') 
        ON CONFLICT DO NOTHING
        RETURNING id;
      `);
      
      if (convResult.rows.length > 0) {
        results.push('✅ Conversa de teste criada!');
      }
    }

    results.push('');
    results.push('🎉 SETUP COMPLETO!');
    results.push('');
    results.push('📋 Próximos passos:');
    results.push('1. Teste o chat no sistema');
    results.push('2. Verifique as notificações');
    results.push('3. Configure as chaves VAPID para push notifications');

    // Retornar como HTML para visualizar no navegador
    const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SalaFácil - Setup Chat Tables</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .success { color: green; }
        .info { color: blue; }
        .step { margin: 5px 0; }
        .container { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 SalaFácil - Setup do Chat</h1>
        <div class="results">
          ${results.map(line => `<div class="step">${line}</div>`).join('')}
        </div>
        <hr>
        <p><strong>URLs das APIs:</strong></p>
        <ul>
          <li>Notificações: <code>/.netlify/functions/notifications</code></li>
          <li>Conversas: <code>/.netlify/functions/conversations</code></li>
          <li>Mensagens: <code>/.netlify/functions/messages</code></li>
        </ul>
      </div>
    </body>
    </html>`;

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'text/html',
      },
      body: htmlResponse
    };

  } catch (error) {
    console.error('Erro no setup:', error);
    
    const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Erro no Setup</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .error { color: red; background: #ffe6e6; padding: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>❌ Erro no Setup</h1>
      <div class="error">
        <strong>Erro:</strong> ${error.message}<br>
        <strong>Detalhes:</strong> ${error.stack}
      </div>
      <h3>Passos executados:</h3>
      ${results.map(line => `<div>${line}</div>`).join('')}
      
      <h3>Possíveis soluções:</h3>
      <ul>
        <li>Verifique se DATABASE_URL está configurada no Netlify</li>
        <li>Verifique se o banco Neon está acessível</li>
        <li>Tente novamente em alguns minutos</li>
      </ul>
    </body>
    </html>`;

    return {
      statusCode: 500,
      headers: {
        ...headers,
        'Content-Type': 'text/html',
      },
      body: errorHtml
    };
  } finally {
    client.release();
  }
};
