const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura';

// Configuração do Google Cloud SQL (PostgreSQL)
const getDbClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL, // URL do Google Cloud SQL
    ssl: {
      rejectUnauthorized: false
    }
  });
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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

  try {
    console.log('🔐 Auth function called:', event.httpMethod, event.path);
    
    // Roteamento baseado no path
    if (event.path.includes('/auth/user') || event.httpMethod === 'GET') {
      return await handleGetUser(event, headers);
    }
    
    if (event.path.includes('/auth/login') || (event.httpMethod === 'POST' && !event.path.includes('/register'))) {
      return await handleLogin(event, headers);
    }
    
    if (event.path.includes('/auth/register') || event.httpMethod === 'POST') {
      return await handleRegister(event, headers);
    }
    
    if (event.path.includes('/auth/google')) {
      return await handleGoogleAuth(event, headers);
    }

    // Para outros métodos, retornar método não permitido
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: `Method ${event.httpMethod} not allowed for ${event.path}` })
    };

  } catch (error) {
    console.error('❌ Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      })
    };
  }
};

// Função para obter dados do usuário autenticado
async function handleGetUser(event, headers) {
  console.log('👤 Getting user data...');
  
  const authHeader = event.headers.authorization;
  
  // Se não tem token, retornar usuário demo (para desenvolvimento)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('ℹ️ No auth header, returning demo user');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        id: 1,
        username: 'admin',
        email: 'admin@salafacil.com',
        first_name: 'Administrador',
        last_name: 'Sistema',
        is_staff: true,
        nome: 'Administrador Sistema',
        created_at: new Date().toISOString()
      })
    };
  }

  const token = authHeader.substring(7);
  const client = getDbClient();

  try {
    await client.connect();
    console.log('✅ Connected to Google Cloud SQL');

    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await client.query(
      'SELECT id, username, email, nome, telefone, created_at, first_name, last_name, is_staff FROM usuarios WHERE id = $1',
      [decoded.user_id]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Usuário não encontrado' })
      };
    }

    const user = result.rows[0];
    console.log('✅ User found:', user.email);
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ...user,
        is_staff: user.is_staff || true,
        first_name: user.first_name || user.nome?.split(' ')[0] || 'Usuário',
        last_name: user.last_name || user.nome?.split(' ').slice(1).join(' ') || 'Sistema'
      })
    };
  } catch (dbError) {
    console.error('❌ Database error:', dbError);
    // Se falhar conexão, retornar usuário demo
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        id: 1,
        username: 'admin',
        email: 'admin@salafacil.com',
        first_name: 'Administrador',
        last_name: 'Sistema',
        is_staff: true,
        nome: 'Administrador Sistema',
        created_at: new Date().toISOString()
      })
    };
  } finally {
    try { await client.end(); } catch {}
  }
}

// Função para login tradicional
async function handleLogin(event, headers) {
  console.log('🔑 Processing login...');
  
  const body = JSON.parse(event.body || '{}');
  const { username, password, email } = body;
  
  if ((!username && !email) || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Username/email e senha são obrigatórios' })
    };
  }

  const client = getDbClient();

  try {
    await client.connect();
    console.log('✅ Connected to Google Cloud SQL for login');

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

    console.log('✅ Login successful for:', userData.email);

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
          nome: userData.nome,
          is_staff: userData.is_staff || true
        }
      })
    };
  } catch (dbError) {
    console.error('❌ Login database error:', dbError);
    
    // Se falhar conexão, fazer login demo para admin
    if ((username === 'admin' || email === 'admin@salafacil.com') && password === 'admin') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          access: 'demo-token',
          refresh: 'demo-refresh-token',
          user: {
            id: 1,
            username: 'admin',
            email: 'admin@salafacil.com',
            nome: 'Administrador Sistema',
            is_staff: true
          }
        })
      };
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro de conexão com banco de dados',
        details: dbError.message 
      })
    };
  } finally {
    try { await client.end(); } catch {}
  }
}

// Função para registro de usuário
async function handleRegister(event, headers) {
  console.log('📝 Processing registration...');
  
  const body = JSON.parse(event.body || '{}');
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

  const client = getDbClient();

  try {
    await client.connect();
    console.log('✅ Connected to Google Cloud SQL for registration');

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
      INSERT INTO usuarios (username, email, password, nome, telefone, first_name, last_name, is_staff, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, username, email, nome, telefone
    `, [
      username, 
      email, 
      hashedPassword, 
      nome, 
      telefone || null,
      nome.split(' ')[0] || 'Usuário',
      nome.split(' ').slice(1).join(' ') || 'Sistema',
      false
    ]);

    const newUser = result.rows[0];
    console.log('✅ User registered successfully:', newUser.email);

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
  } catch (dbError) {
    console.error('❌ Register database error:', dbError);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        message: 'Erro ao criar conta. Tente novamente.',
        details: dbError.message
      })
    };
  } finally {
    try { await client.end(); } catch {}
  }
}

// Função para login com Google
async function handleGoogleAuth(event, headers) {
  console.log('🌐 Processing Google auth...');
  
  const body = JSON.parse(event.body || '{}');
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

  const client = getDbClient();

  try {
    await client.connect();
    console.log('✅ Connected to Google Cloud SQL for Google auth');

    // Verificar token do Google (mock para desenvolvimento)
    let googleUser;
    if (credential.startsWith('mock_')) {
      googleUser = {
        sub: 'mock_user_id',
        email: 'admin@salafacil.com',
        name: 'Admin Demo',
        email_verified: true
      };
    } else {
      // Em produção, implementar verificação real do Google
      throw new Error('Token Google inválido');
    }
    
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
        INSERT INTO usuarios (username, email, nome, google_id, first_name, last_name, is_staff, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING id, username, email, nome
      `, [
        username, 
        googleUser.email, 
        googleUser.name, 
        googleUser.sub,
        googleUser.name.split(' ')[0] || 'Usuário',
        googleUser.name.split(' ').slice(1).join(' ') || 'Google',
        false
      ]);
      
      userData = result.rows[0];
      console.log('✅ New Google user created:', userData.email);
    } else {
      userData = user.rows[0];
      
      // Atualizar Google ID se não existir
      if (!userData.google_id) {
        await client.query(
          'UPDATE usuarios SET google_id = $1 WHERE id = $2',
          [googleUser.sub, userData.id]
        );
      }
      console.log('✅ Existing Google user found:', userData.email);
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
  } catch (dbError) {
    console.error('❌ Google auth database error:', dbError);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro ao fazer login com Google',
        message: 'Erro ao fazer login com Google. Tente novamente.',
        details: dbError.message
      })
    };
  } finally {
    try { await client.end(); } catch {}
  }
}
