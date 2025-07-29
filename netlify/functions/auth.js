const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'sala-facil-jwt-secret-2024';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    if (event.httpMethod === 'GET') {
      const authHeader = event.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Token não fornecido' })
        };
      }

      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const result = await client.query(
          'SELECT id, username, email, nome, telefone FROM usuarios WHERE id = ',
          [decoded.user_id]
        );

        if (result.rows.length === 0) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Usuário não encontrado' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      } catch (jwtError) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Token inválido' })
        };
      }
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      
      // Suporte para formato antigo
      if (body.action === 'login') {
        const { username, password } = body;
        
        let result = await client.query(
          'SELECT * FROM usuarios WHERE username =  OR email = ',
          [username]
        );

        if (result.rows.length === 0) {
          result = await client.query(
            'SELECT * FROM auth_user WHERE username = ',
            [username]
          );
        }

        if (result.rows.length === 0) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
          };
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
          };
        }

        const accessToken = jwt.sign(
          { user_id: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        const refreshToken = jwt.sign(
          { user_id: user.id },
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
              id: user.id,
              username: user.username,
              email: user.email || '',
              nome: user.first_name || user.nome || 'Usuário'
            }
          })
        };
      }

      // Formato novo
      const { email, password } = body;
      
      if (!email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Email e senha são obrigatórios' })
        };
      }

      const result = await client.query(
        'SELECT * FROM usuarios WHERE email = ',
        [email]
      );

      if (result.rows.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Email ou senha incorretos' })
        };
      }

      const user = result.rows[0];
      
      if (!user.password) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Usuário cadastrado via Google. Use login com Google.' })
        };
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Email ou senha incorretos' })
        };
      }

      const accessToken = jwt.sign(
        { user_id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      const refreshToken = jwt.sign(
        { user_id: user.id },
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
            id: user.id,
            username: user.username,
            email: user.email,
            nome: user.nome
          }
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message
      })
    };
  } finally {
    try {
      await client.end();
    } catch (e) {
      console.error('Error closing client:', e);
    }
  }
};
