const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = await pool.connect();
  let results = [];

  try {
    // 1. Verificar se a tabela notifications existe
    results.push('🔍 Verificando tabela notifications...');
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      results.push('✅ Tabela notifications existe!');
    } else {
      results.push('❌ Tabela notifications NÃO existe!');
      results.push('🔧 Execute: /.netlify/functions/setup-chat-tables');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'error',
          message: 'Tabela notifications não existe',
          results 
        })
      };
    }

    // 2. Verificar estrutura da tabela
    results.push('📋 Verificando estrutura da tabela...');
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position;
    `);
    
    results.push(`✅ Colunas encontradas: ${columns.rows.length}`);
    columns.rows.forEach(col => {
      results.push(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });

    // 3. Contar notificações existentes
    const countResult = await client.query('SELECT COUNT(*) FROM notifications');
    const count = countResult.rows[0].count;
    results.push(`📊 Total de notificações no banco: ${count}`);

    // 4. Criar uma notificação de teste se não existir nenhuma
    if (count === '0') {
      results.push('🧪 Criando notificação de teste...');
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, read)
        VALUES (1, 'Sistema funcionando!', 'Esta é uma notificação de teste para verificar se tudo está ok.', 'info', false)
        ON CONFLICT DO NOTHING
      `);
      results.push('✅ Notificação de teste criada!');
    }

    // 5. Buscar as últimas 5 notificações
    results.push('📨 Últimas notificações:');
    const recentNotifications = await client.query(`
      SELECT id, user_id, title, message, type, read, created_at 
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    recentNotifications.rows.forEach(notif => {
      results.push(`  🔔 [${notif.id}] ${notif.title} (user: ${notif.user_id}, ${notif.read ? 'lida' : 'não lida'})`);
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: 'success',
        message: 'Sistema de notificações funcionando!',
        table_exists: true,
        total_notifications: count,
        columns: columns.rows.length,
        results,
        notifications: recentNotifications.rows
      })
    };

  } catch (error) {
    console.error('Erro ao testar notificações:', error);
    results.push(`❌ Erro: ${error.message}`);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'error',
        message: error.message,
        results
      })
    };
  } finally {
    client.release();
  }
};
