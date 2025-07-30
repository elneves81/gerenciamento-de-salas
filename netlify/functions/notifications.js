const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

exports.handler = async (event, context) => {
  // CORS headers
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
    if (event.httpMethod === 'GET') {
      // Buscar notificações do usuário
      const userId = event.queryStringParameters?.user_id;
      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'user_id é obrigatório' })
        };
      }

      const result = await client.query(`
        SELECT id, title, message, type, read as is_read, created_at 
        FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 50
      `, [userId]);

      // Garantir que sempre retorne um array
      const notifications = result.rows || [];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(notifications)
      };
    }

    if (event.httpMethod === 'POST') {
      const { title, message, type, user_id } = JSON.parse(event.body);

      const result = await client.query(`
        INSERT INTO notifications (title, message, type, user_id, read, created_at)
        VALUES ($1, $2, $3, $4, false, NOW())
        RETURNING *
      `, [title, message, type || 'info', user_id]);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (event.httpMethod === 'PUT') {
      // Marcar como lida
      const notificationId = event.path.split('/').pop();
      
      await client.query(`
        UPDATE notifications 
        SET read = true 
        WHERE id = $1
      `, [notificationId]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    console.error('Erro na API de notificações:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      })
    };
  } finally {
    client.release();
  }
};
