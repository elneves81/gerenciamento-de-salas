const { Pool } = require('pg');

// Configuração da conexão com Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_30vfdEapKsji@ep-polished-glitter-ad3ve5sr-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    console.log('🔗 Testando conexão com Neon Database...');
    
    // Testar conexão básica
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    
    // Verificar se tabela usuarios existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      );
    `);
    
    // Contar usuários se tabela existir
    let userCount = 0;
    if (tableCheck.rows[0].exists) {
      const userCountResult = await client.query('SELECT COUNT(*) as count FROM usuarios');
      userCount = parseInt(userCountResult.rows[0].count);
    }
    
    client.release();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: '🎉 Conexão com Neon Database funcionando!',
        connection_info: {
          connected: true,
          current_time: result.rows[0].current_time,
          postgres_version: result.rows[0].postgres_version,
          table_usuarios_exists: tableCheck.rows[0].exists,
          user_count: userCount
        },
        database_url: process.env.DATABASE_URL ? 'Configurado via ENV' : 'Usando URL padrão',
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ Erro ao conectar com Neon:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro ao conectar com banco Neon',
        connection_info: {
          connected: false,
          error_code: error.code,
          error_detail: error.detail
        },
        timestamp: new Date().toISOString()
      })
    };
  }
};
