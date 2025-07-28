const { Client } = require('pg');
const jwt = require('jsonwebtoken');

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

// Função para verificar token do Google
async function verifyGoogleToken(token) {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const data = await response.json();
    
    if (data.error) {
      throw new Error('Token Google inválido');
    }
    
    return {
      email: data.email,
      name: data.name,
      picture: data.picture,
      sub: data.sub
    };
  } catch (error) {
    throw new Error('Erro ao verificar token Google');
  }
}

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
    
    const body = JSON.parse(event.body);
    const { credential } = body;
    
    if (!credential) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Token do Google é obrigatório',
          message: 'Token do Google é obrigatório'
        })
      };
    }

    // Verificar token do Google
    const googleUser = await verifyGoogleToken(credential);
    
    // Verificar se usuário já existe
    let user = await client.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [googleUser.email]
    );

    let userData;

    if (user.rows.length === 0) {
      // Criar novo usuário
      const username = googleUser.email.split('@')[0];
      const result = await client.query(`
        INSERT INTO usuarios (username, email, nome, google_id, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, username, email, nome
      `, [username, googleUser.email, googleUser.name, googleUser.sub]);
      
      userData = result.rows[0];
    } else {
      userData = user.rows[0];
      
      // Atualizar Google ID se não existir
      if (!userData.google_id) {
        await client.query(
          'UPDATE usuarios SET google_id = $1 WHERE id = $2',
          [googleUser.sub, userData.id]
        );
      }
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
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          nome: userData.nome
        }
      })
    };

  } catch (error) {
    console.error('Google auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro ao fazer login com Google',
        message: 'Erro ao fazer login com Google. Tente novamente.'
      })
    };
  } finally {
    await client.end();
  }
};
