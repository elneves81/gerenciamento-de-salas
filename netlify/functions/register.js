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
    
    const body = JSON.parse(event.body);
    const { email, password, nome, telefone } = body;
    
    if (!email || !password || !nome) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Email, senha e nome são obrigatórios',
          message: 'Email, senha e nome são obrigatórios'
        })
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Senha deve ter pelo menos 6 caracteres',
          message: 'Senha deve ter pelo menos 6 caracteres'
        })
      };
    }

    // Verificar se email já existe
    const existingUser = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Email já está em uso',
          message: 'Email já está em uso'
        })
      };
    }

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Gerar username único baseado no email
    const username = email.split('@')[0];

    // Inserir usuário
    const result = await client.query(`
      INSERT INTO usuarios (username, email, password, nome, telefone, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, username, email, nome, telefone
    `, [username, email, hashedPassword, nome, telefone || null]);

    const newUser = result.rows[0];

    // Gerar tokens
    const accessToken = jwt.sign(
      { user_id: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { user_id: newUser.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          nome: newUser.nome
        }
      })
    };

  } catch (error) {
    console.error('Register error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: 'Erro ao criar conta. Tente novamente.'
      })
    };
  } finally {
    await client.end();
  }
};
