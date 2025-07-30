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
      // Buscar mensagens de uma conversa
      const conversationId = event.queryStringParameters?.conversation_id;
      if (!conversationId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'conversation_id é obrigatório' })
        };
      }

      const result = await client.query(`
        SELECT 
          m.id,
          m.content,
          m.created_at,
          m.updated_at,
          json_build_object(
            'id', u.id,
            'username', u.username,
            'first_name', u.first_name,
            'last_name', u.last_name
          ) as sender
        FROM messages m
        JOIN auth_user u ON m.sender_id = u.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
      `, [conversationId]);

      // Garantir que sempre retorne um array
      const messages = result.rows || [];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(messages)
      };
    }

    if (event.httpMethod === 'POST') {
      const { conversation_id, sender_id, content } = JSON.parse(event.body);

      if (!conversation_id || !sender_id || !content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'conversation_id, sender_id e content são obrigatórios' })
        };
      }

      // Inserir mensagem
      const messageResult = await client.query(`
        INSERT INTO messages (conversation_id, sender_id, content, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `, [conversation_id, sender_id, content]);

      // Atualizar timestamp da conversa
      await client.query(`
        UPDATE conversations 
        SET updated_at = NOW() 
        WHERE id = $1
      `, [conversation_id]);

      // Buscar dados do remetente para retorno completo
      const senderResult = await client.query(`
        SELECT id, username, first_name, last_name 
        FROM auth_user 
        WHERE id = $1
      `, [sender_id]);

      const message = {
        ...messageResult.rows[0],
        sender: senderResult.rows[0]
      };

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(message)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    console.error('Erro na API de mensagens:', error);
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
