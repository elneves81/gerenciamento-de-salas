const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura';

// Configuração do banco Google Cloud SQL
const getDbClient = () => {
  // Tentativa com usuário postgres padrão
  const dbConfig = {
    host: '34.95.225.183',
    port: 5432,
    database: 'salafacil',
    user: 'postgres',
    password: 'elber@2025',
    ssl: {
      rejectUnauthorized: false
    }
  };

  console.log('🔗 Tentando conectar com:', {
    host: dbConfig.host,
    database: dbConfig.database,
    user: dbConfig.user,
    password: '***' + dbConfig.password.slice(-4)
  });

  return new Client(dbConfig);
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
    console.log('🚀 SalaFacil API called:', event.httpMethod, event.path, event.rawUrl);
    
    // Extrair path da URL ou query parameters
    const pathToCheck = event.path || event.rawUrl || event.queryStringParameters?.path || '';
    console.log('📍 Path being checked:', pathToCheck);
    
    // TESTE DE CONEXÃO COM BANCO (primeiro para evitar conflitos)
    if (pathToCheck.includes('/test-db') || pathToCheck.includes('/test-connection')) {
      return await handleTestDb(headers);
    }

    // ROTEAMENTO DE SALAS
    if (pathToCheck.includes('/salas') || pathToCheck.includes('/get-salas')) {
      return await handleSalas(event, headers);
    }

    // ROTEAMENTO DE AGENDAMENTOS  
    if (pathToCheck.includes('/agendamentos')) {
      return await handleAgendamentos(event, headers);
    }
    
    // ROTEAMENTO DE AUTENTICAÇÃO (default para tudo que sobrar)
    if (pathToCheck.includes('/auth') || pathToCheck.includes('/api/auth') || 
        pathToCheck.includes('/login') || pathToCheck.includes('/register') ||
        pathToCheck.includes('/google-auth') || pathToCheck === '' || pathToCheck === '/api') {
      
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
    if (pathToCheck.includes('/salas') || pathToCheck.includes('/get-salas')) {
      return await handleSalas(event, headers);
    }

    // ROTEAMENTO DE AGENDAMENTOS  
    if (pathToCheck.includes('/agendamentos')) {
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

// Função de teste de conexão com banco
async function handleTestDb(headers) {
  console.log('🔧 Testando conexão com banco...');
  
  const client = getDbClient();
  
  try {
    await client.connect();
    console.log('✅ Conexão estabelecida!');
    
    // Teste básico
    const result = await client.query('SELECT NOW() as timestamp, version() as pg_version');
    const stats = await client.query('SELECT COUNT(*) as total_usuarios FROM usuarios');
    const salasCount = await client.query('SELECT COUNT(*) as total_salas FROM salas');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Conexão com Google Cloud SQL estabelecida!',
        database_info: {
          timestamp: result.rows[0].timestamp,
          postgres_version: result.rows[0].pg_version,
          total_usuarios: stats.rows[0].total_usuarios,
          total_salas: salasCount.rows[0].total_salas
        },
        connection_details: {
          database_url_exists: !!process.env.DATABASE_URL,
          database_url_preview: process.env.DATABASE_URL ? 
            process.env.DATABASE_URL.substring(0, 20) + '...' : 'não definida'
        }
      })
    };
  } catch (dbError) {
    console.error('❌ Erro de conexão:', dbError);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro de conexão com banco',
        details: dbError.message,
        connection_info: {
          database_url_exists: !!process.env.DATABASE_URL,
          error_code: dbError.code,
          error_severity: dbError.severity
        }
      })
    };
  } finally {
    try { await client.end(); } catch {}
  }
}

// Funções de salas conectadas ao Google Cloud SQL
async function handleSalas(event, headers) {
  const client = getDbClient();

  try {
    await client.connect();

    // GET - Listar todas as salas
    if (event.httpMethod === 'GET') {
      console.log('📋 Buscando salas do banco...');
      
      const result = await client.query(`
        SELECT id, nome, capacidade, localizacao, equipamentos, descricao, preco_hora, ativa, created_at, updated_at
        FROM salas 
        WHERE ativa = true 
        ORDER BY nome ASC
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    // POST - Criar nova sala
    if (event.httpMethod === 'POST') {
      console.log('➕ Criando nova sala...');
      
      const body = JSON.parse(event.body || '{}');
      const { nome, capacidade, localizacao, equipamentos, descricao, preco_hora } = body;

      if (!nome || !capacidade) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Nome e capacidade são obrigatórios' })
        };
      }

      // Verificar se já existe sala com mesmo nome
      const existingSala = await client.query(
        'SELECT id FROM salas WHERE nome = $1',
        [nome]
      );

      if (existingSala.rows.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Já existe uma sala com este nome' })
        };
      }

      const result = await client.query(`
        INSERT INTO salas (nome, capacidade, localizacao, equipamentos, descricao, preco_hora, ativa, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [
        nome,
        parseInt(capacidade),
        localizacao || '',
        equipamentos || [],  // Passamos diretamente a array, não JSON.stringify
        descricao || '',
        parseFloat(preco_hora || 0),
        true
      ]);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Sala criada com sucesso!',
          sala: result.rows[0]
        })
      };
    }

    // PUT - Atualizar sala
    if (event.httpMethod === 'PUT') {
      console.log('✏️ Atualizando sala...');
      
      const salaId = pathToCheck.split('/').pop() || event.queryStringParameters?.id;
      const body = JSON.parse(event.body || '{}');
      const { nome, capacidade, localizacao, equipamentos, descricao, preco_hora, ativa } = body;

      if (!salaId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID da sala é obrigatório' })
        };
      }

      const result = await client.query(`
        UPDATE salas 
        SET nome = $1, capacidade = $2, localizacao = $3, equipamentos = $4, 
            descricao = $5, preco_hora = $6, ativa = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [
        nome,
        parseInt(capacidade),
        localizacao,
        equipamentos || [],  // Passamos diretamente a array
        descricao,
        parseFloat(preco_hora || 0),
        ativa !== undefined ? ativa : true,
        salaId
      ]);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Sala não encontrada' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Sala atualizada com sucesso!',
          sala: result.rows[0]
        })
      };
    }

    // DELETE - Deletar sala (soft delete)
    if (event.httpMethod === 'DELETE') {
      console.log('🗑️ Deletando sala...');
      
      const salaId = pathToCheck.split('/').pop() || event.queryStringParameters?.id;

      if (!salaId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID da sala é obrigatório' })
        };
      }

      const result = await client.query(`
        UPDATE salas 
        SET ativa = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [salaId]);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Sala não encontrada' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Sala removida com sucesso!'
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (dbError) {
    console.error('❌ Database error in handleSalas:', dbError);
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

// Função de agendamentos conectada ao Google Cloud SQL
async function handleAgendamentos(event, headers) {
  const client = getDbClient();

  try {
    await client.connect();

    // GET - Listar agendamentos
    if (event.httpMethod === 'GET') {
      console.log('📅 Buscando agendamentos do banco...');
      
      const result = await client.query(`
        SELECT a.*, s.nome as sala_nome, u.nome as usuario_nome
        FROM agendamentos a
        LEFT JOIN salas s ON a.sala_id = s.id
        LEFT JOIN usuarios u ON a.usuario_id = u.id
        ORDER BY a.data_inicio DESC
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows)
      };
    }

    // POST - Criar novo agendamento
    if (event.httpMethod === 'POST') {
      console.log('📝 Criando novo agendamento...');
      
      const body = JSON.parse(event.body || '{}');
      const { sala_id, usuario_id, data_inicio, data_fim, descricao, status } = body;

      if (!sala_id || !usuario_id || !data_inicio || !data_fim) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Sala, usuário, data de início e fim são obrigatórios' 
          })
        };
      }

      // Verificar conflitos de agendamento
      const conflictCheck = await client.query(`
        SELECT id FROM agendamentos 
        WHERE sala_id = $1 
        AND status != 'cancelado'
        AND (
          ($2 >= data_inicio AND $2 < data_fim) OR
          ($3 > data_inicio AND $3 <= data_fim) OR
          ($2 <= data_inicio AND $3 >= data_fim)
        )
      `, [sala_id, data_inicio, data_fim]);

      if (conflictCheck.rows.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Já existe um agendamento para esta sala neste horário' 
          })
        };
      }

      const result = await client.query(`
        INSERT INTO agendamentos (sala_id, usuario_id, data_inicio, data_fim, descricao, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [
        sala_id,
        usuario_id,
        data_inicio,
        data_fim,
        descricao || '',
        status || 'confirmado'
      ]);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'Agendamento criado com sucesso!',
          agendamento: result.rows[0]
        })
      };
    }

    // PUT - Atualizar agendamento
    if (event.httpMethod === 'PUT') {
      console.log('✏️ Atualizando agendamento...');
      
      const agendamentoId = pathToCheck.split('/').pop() || event.queryStringParameters?.id;
      const body = JSON.parse(event.body || '{}');
      const { data_inicio, data_fim, descricao, status } = body;

      if (!agendamentoId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID do agendamento é obrigatório' })
        };
      }

      const result = await client.query(`
        UPDATE agendamentos 
        SET data_inicio = $1, data_fim = $2, descricao = $3, status = $4
        WHERE id = $5
        RETURNING *
      `, [data_inicio, data_fim, descricao, status, agendamentoId]);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Agendamento não encontrado' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Agendamento atualizado com sucesso!',
          agendamento: result.rows[0]
        })
      };
    }

    // DELETE - Cancelar agendamento
    if (event.httpMethod === 'DELETE') {
      console.log('❌ Cancelando agendamento...');
      
      const agendamentoId = pathToCheck.split('/').pop() || event.queryStringParameters?.id;

      if (!agendamentoId) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID do agendamento é obrigatório' })
        };
      }

      const result = await client.query(`
        UPDATE agendamentos 
        SET status = 'cancelado'
        WHERE id = $1
        RETURNING *
      `, [agendamentoId]);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Agendamento não encontrado' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Agendamento cancelado com sucesso!'
        })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (dbError) {
    console.error('❌ Database error in handleAgendamentos:', dbError);
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
