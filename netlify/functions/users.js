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
      // Listar todos os usuários ativos para o chat
      const result = await client.query(`
        SELECT 
          id, 
          username, 
          email, 
          first_name, 
          last_name,
          is_staff,
          is_active,
          date_joined
        FROM auth_user 
        WHERE is_active = true
        ORDER BY first_name ASC, username ASC
      `);

      // Formatar dados para o chat
      const users = result.rows.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`.trim()
          : user.username,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        is_staff: user.is_staff,
        is_active: user.is_active,
        avatar: null, // Adicionar suporte a avatar depois
        online: false // Adicionar status online depois
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(users)
      };
    }

    if (event.httpMethod === 'POST') {
      // Buscar usuário específico por ID
      const { user_id } = JSON.parse(event.body);
      
      if (!user_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'user_id é obrigatório' })
        };
      }

      const result = await client.query(`
        SELECT 
          id, 
          username, 
          email, 
          first_name, 
          last_name,
          is_staff,
          is_active,
          date_joined
        FROM auth_user 
        WHERE id = $1 AND is_active = true
      `, [user_id]);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Usuário não encontrado' })
        };
      }

      const user = result.rows[0];
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}`.trim()
          : user.username,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        is_staff: user.is_staff,
        is_active: user.is_active,
        avatar: null,
        online: false
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(userData)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    console.error('Erro na API de usuários:', error);
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
