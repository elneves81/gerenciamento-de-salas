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

  try {
    // Criar algumas notificações de exemplo para teste
    const testNotifications = [
      {
        user_id: 1,
        title: '🎉 Bem-vindo ao Sistema!',
        message: 'Suas notificações estão funcionando perfeitamente.',
        type: 'info'
      },
      {
        user_id: 1,
        title: '📅 Reunião agendada',
        message: 'Você tem uma reunião às 14:00 na Sala de Conferências.',
        type: 'meeting'
      },
      {
        user_id: 1,
        title: '✅ Sala criada com sucesso',
        message: 'A sala "Sala de Reuniões" foi criada e está disponível.',
        type: 'reservation'
      },
      {
        user_id: 1,
        title: '💬 Nova mensagem',
        message: 'Você recebeu uma mensagem no chat do sistema.',
        type: 'chat'
      }
    ];

    // Inserir notificações
    for (const notif of testNotifications) {
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type, read, created_at)
        VALUES ($1, $2, $3, $4, false, NOW())
      `, [notif.user_id, notif.title, notif.message, notif.type]);
    }

    // Buscar todas as notificações criadas
    const result = await client.query(`
      SELECT id, title, message, type, read, created_at 
      FROM notifications 
      WHERE user_id = 1 
      ORDER BY created_at DESC
    `);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: `${testNotifications.length} notificações de teste criadas!`,
        total_notifications: result.rows.length,
        notifications: result.rows
      })
    };

  } catch (error) {
    console.error('Erro ao criar notificações de teste:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro ao criar notificações de teste',
        details: error.message
      })
    };
  } finally {
    client.release();
  }
};
