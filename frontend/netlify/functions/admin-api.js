const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura';

// Configuração do banco Google Cloud SQL
const getDbClient = () => {
  // Configuração direta do Google Cloud SQL (não usa DATABASE_URL para evitar conflitos)
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

  console.log('🔗 Conectando diretamente com Google Cloud SQL:', {
    host: dbConfig.host,
    database: dbConfig.database,
    user: dbConfig.user,
    port: dbConfig.port
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
    
    // ROTEAMENTO PRINCIPAL - SEM DUPLICAÇÕES
    
    // TESTE DE CONEXÃO COM BANCO
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
    
    // ROTEAMENTO DE AUTENTICAÇÃO
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

    // Endpoint padrão
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: '🚀 SalaFacil API funcionando!',
        timestamp: new Date().toISOString(),
        path: pathToCheck,
        method: event.httpMethod
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
        details: dbError.message
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

      const result = await client.query(`
        INSERT INTO salas (nome, capacidade, localizacao, equipamentos, descricao, preco_hora, ativa, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING *
      `, [
        nome,
        parseInt(capacidade),
        localizacao || '',
        Array.isArray(equipamentos) ? JSON.stringify(equipamentos) : (equipamentos || '[]'),
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
      const { sala_id, usuario_id, data_inicio, data_fim, titulo, descricao, status } = body;

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
        INSERT INTO agendamentos (sala_id, usuario_id, data_inicio, data_fim, titulo, descricao, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [
        sala_id,
        usuario_id,
        data_inicio,
        data_fim,
        titulo || 'Reserva sem título',
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

// Função para obter dados do usuário autenticado
async function handleGetUser(event, headers) {
  console.log('👤 Getting user data...');
  
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

// Função para login tradicional
async function handleLogin(body, headers) {
  console.log('🔑 Processing login...');
  
  const { username, password, email } = body;
  
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

  return {
    statusCode: 401,
    headers,
    body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
  };
}

// Função para registro de usuário
async function handleRegister(body, headers) {
  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({
      token: 'demo-register-token',
      user: { id: 2, username: 'user', email: 'user@salafacil.com' }
    })
  };
}

// Função para login com Google
async function handleGoogleAuth(body, headers) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      token: 'demo-google-token',
      user: { id: 1, username: 'admin', email: 'admin@salafacil.com' }
    })
  };
}
