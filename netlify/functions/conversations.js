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
      // Buscar conversas do usuário
      let userId = event.queryStringParameters?.user_id;
      
      // Se não tem user_id nos parâmetros, tentar extrair do token JWT
      if (!userId) {
        const authHeader = event.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          try {
            const token = authHeader.substring(7);
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            userId = payload.user_id;
          } catch (error) {
            console.log('Erro ao decodificar token:', error.message);
          }
        }
      }
      
      if (!userId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'user_id é obrigatório ou token inválido' })
        };
      }

      const result = await client.query(`
        SELECT 
          c.id,
          c.name,
          c.type,
          c.created_at,
          c.updated_at,
          COALESCE(
            json_agg(
              json_build_object(
                'id', u.id,
                'username', u.username,
                'first_name', u.first_name,
                'last_name', u.last_name
              )
            ) FILTER (WHERE u.id IS NOT NULL), 
            '[]'
          ) as participants
        FROM conversations c
        LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN auth_user u ON cp.user_id = u.id
        WHERE c.id IN (
          SELECT conversation_id 
          FROM conversation_participants 
          WHERE user_id = $1
        )
        GROUP BY c.id, c.name, c.type, c.created_at, c.updated_at
        ORDER BY c.updated_at DESC
      `, [userId]);

      // Garantir que sempre retorne um array
      const conversations = result.rows || [];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(conversations)
      };
    }

    if (event.httpMethod === 'POST') {
      const { name, type, participants } = JSON.parse(event.body);

      // Criar conversa
      const conversationResult = await client.query(`
        INSERT INTO conversations (name, type, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        RETURNING *
      `, [name, type || 'private']);

      const conversationId = conversationResult.rows[0].id;

      // Adicionar participantes
      if (participants && participants.length > 0) {
        for (const userId of participants) {
          await client.query(`
            INSERT INTO conversation_participants (conversation_id, user_id, joined_at)
            VALUES ($1, $2, NOW())
          `, [conversationId, userId]);
        }
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(conversationResult.rows[0])
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    console.error('Erro na API de conversas:', error);
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
