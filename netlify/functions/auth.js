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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const client = getDbClient();

  try {
    await client.connect();
    
    // Se for GET, retornar dados do usuário autenticado
    if (event.httpMethod === 'GET') {
      return await handleGetUser(event, client, headers);
    }

    // Se for POST, processar login tradicional
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      return await handleLogin(body, client, headers);
    }

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
    await client.end();
  }
};

// Função para obter dados do usuário autenticado
async function handleGetUser(event, client, headers) {
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
      'SELECT id, username, email, nome, telefone, created_at FROM usuarios WHERE id = $1',
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
  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token inválido' })
    };
  }
}

// Função para login tradicional
async function handleLogin(body, client, headers) {
  const { username, password, email } = body;
  
  if ((!username && !email) || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Username/email e senha são obrigatórios' })
    };
  }

  try {
    // Buscar usuário por username ou email
    const query = username ? 
      'SELECT * FROM usuarios WHERE username = $1' :
      'SELECT * FROM usuarios WHERE email = $1';
    const param = username || email;

    const user = await client.query(query, [param]);

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
          nome: userData.nome
        }
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
}

// Função para registro de usuário
async function handleRegister(body, client, headers) {
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

  try {
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
  }
}

// Função para verificar token do Google
async function verifyGoogleToken(credential) {
  try {
    // Para desenvolvimento/demo, aceitar qualquer credential que comece com 'mock_'
    if (credential.startsWith('mock_')) {
      return {
        sub: 'mock_user_id',
        email: 'admin@salafacil.com',
        name: 'Admin Demo',
        email_verified: true
      };
    }

    // Para produção, você pode implementar verificação real do Google
    // const { OAuth2Client } = require('google-auth-library');
    // const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    // const ticket = await client.verifyIdToken({
    //   idToken: credential,
    //   audience: process.env.GOOGLE_CLIENT_ID,
    // });
    // return ticket.getPayload();

    // Por enquanto, retornar erro para tokens não-mock
    throw new Error('Token Google inválido');
  } catch (error) {
    throw new Error('Erro ao verificar token Google');
  }
}

// Função para login com Google
async function handleGoogleAuth(body, client, headers) {
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

  try {
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
  }
}
