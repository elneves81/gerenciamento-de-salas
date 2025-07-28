const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura';

// Configuração do banco Neon
const getDbClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const client = getDbClient();

  try {
    await client.connect();
    
    const { username, password, action } = JSON.parse(event.body || '{}');

    if (action === 'login') {
      // Login
      const user = await client.query(
        'SELECT * FROM auth_user WHERE username = $1',
        [username]
      );

      if (user.rows.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
        };
      }

      const userData = user.rows[0];
      const passwordMatch = await bcrypt.compare(password, userData.password);

      if (!passwordMatch) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
        };
      }

      // Gerar tokens
      const accessToken = jwt.sign(
        { user_id: userData.id, username: userData.username },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { user_id: userData.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          access: accessToken,
          refresh: refreshToken,
          user: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name
          }
        })
      };

    } else if (action === 'register') {
      // Registro
      const { email, first_name, last_name } = JSON.parse(event.body || '{}');

      // Verificar se usuário já existe
      const existingUser = await client.query(
        'SELECT * FROM auth_user WHERE username = $1 OR email = $2',
        [username, email]
      );

      if (existingUser.rows.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Usuário ou email já existe' })
        };
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const newUser = await client.query(
        `INSERT INTO auth_user 
         (username, email, first_name, last_name, password, is_active, date_joined) 
         VALUES ($1, $2, $3, $4, $5, true, NOW()) RETURNING *`,
        [username, email, first_name, last_name, hashedPassword]
      );

      const userData = newUser.rows[0];

      // Gerar tokens
      const accessToken = jwt.sign(
        { user_id: userData.id, username: userData.username },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { user_id: userData.id },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          access: accessToken,
          refresh: refreshToken,
          user: {
            id: userData.id,
            username: userData.username,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name
          }
        })
      };

    } else if (action === 'refresh') {
      // Refresh token
      const { refresh } = JSON.parse(event.body || '{}');

      try {
        const decoded = jwt.verify(refresh, JWT_SECRET);
        const user = await client.query(
          'SELECT * FROM auth_user WHERE id = $1',
          [decoded.user_id]
        );

        if (user.rows.length === 0) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Token inválido' })
          };
        }

        const userData = user.rows[0];
        const accessToken = jwt.sign(
          { user_id: userData.id, username: userData.username },
          JWT_SECRET,
          { expiresIn: '15m' }
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ access: accessToken })
        };

      } catch (error) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Token inválido' })
        };
      }
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Ação não reconhecida' })
    };

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    await client.end();
  }
};
