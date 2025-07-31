const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura';

// Configuração do banco Google Cloud SQL
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
    console.log('🚀 SalaFacil API called:', event.httpMethod, event.path);
    
    // ROTEAMENTO DE AUTENTICAÇÃO
    if (event.path.includes('/auth') || event.path.includes('/api/auth') || 
        event.path.includes('/login') || event.path.includes('/register') ||
        event.path.includes('/google-auth') ||
        (!event.path.includes('/salas') && !event.path.includes('/agendamentos'))) {
      
      // Se for GET para auth, verificar usuário logado
      if (event.httpMethod === 'GET') {
        return await handleGetUser(event, headers);
      }
      
      // Se for POST, processar login/register/google
      if (event.httpMethod === 'POST') {
        const body = JSON.parse(event.body || '{}');
        
        if (body.action === 'register') {
          return await handleRegister(body, headers);
        } else if (body.credential) {
          return await handleGoogleAuth(body, headers);
        } else {
          return await handleLogin(body, headers);
        }
      }
    }

    // ROTEAMENTO DE SALAS
    if (event.path.includes('/salas') || event.path.includes('/get-salas')) {
      return await handleSalas(event, headers);
    }

    // ROTEAMENTO DE AGENDAMENTOS  
    if (event.path.includes('/agendamentos')) {
      return await handleAgendamentos(event, headers);
    }

    // Endpoint padrão
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: '🚀 SalaFacil API funcionando!',
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ API Error:', error);
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
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
async function handleLogin(body, headers) {
  console.log('🔑 Processing login...');
  
  const { username, password, email } = body;
  
  if ((!username && !email) || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Username/email e senha são obrigatórios' })
    };
  }

  // Login demo para admin
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

  const client = getDbClient();

  try {
    await client.connect();
    
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
async function handleRegister(body, headers) {
  console.log('📝 Processing registration...');
  
  const { email, password, nome, telefone } = body;
  
  if (!email || !password || !nome) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Email, senha e nome são obrigatórios'
      })
    };
  }

  if (password.length < 6) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Senha deve ter pelo menos 6 caracteres'
      })
    };
  }

  const client = getDbClient();

  try {
    await client.connect();

    const existingUser = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Email já está em uso'
        })
      };
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const username = email.split('@')[0];

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
        details: dbError.message
      })
    };
  } finally {
    try { await client.end(); } catch {}
  }
}

// Função para login com Google
async function handleGoogleAuth(body, headers) {
  console.log('🌐 Processing Google auth...');
  
  const { credential } = body;
  
  if (!credential) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Token do Google é obrigatório'
      })
    };
  }

  // Mock para desenvolvimento
  const googleUser = {
    sub: 'mock_user_id',
    email: 'admin@salafacil.com',
    name: 'Admin Demo',
    email_verified: true
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      token: 'demo-google-token',
      refreshToken: 'demo-google-refresh',
      user: {
        id: 1,
        username: 'admin',
        email: googleUser.email,
        nome: googleUser.name
      }
    })
  };
}

// Funções de salas e agendamentos simplificadas
async function handleSalas(event, headers) {
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([
        {
          id: 1,
          nome: 'Sala Executiva A',
          capacidade: 12,
          localizacao: 'Andar 1 - Ala Norte',
          equipamentos: ['Projetor', 'TV 55"', 'Sistema de Som'],
          descricao: 'Sala moderna para reuniões executivas',
          preco_hora: 150.00,
          ativa: true
        }
      ])
    };
  }
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Salas endpoint' })
  };
}

async function handleAgendamentos(event, headers) {
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify([])
    };
  }
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Agendamentos endpoint' })
  };
}
