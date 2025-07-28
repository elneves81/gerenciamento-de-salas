const { Client } = require('pg');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Verificar variáveis de ambiente
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      DATABASE_URL_LENGTH: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0
    };

    // Testar conexão com banco
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Verificar se existe o usuário admin
    const userCheck = await client.query(
      'SELECT username, email, id FROM auth_user WHERE username = $1',
      ['admin']
    );

    // Contar total de usuários
    const userCount = await client.query('SELECT COUNT(*) FROM auth_user');

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        environment: envCheck,
        database: {
          connected: true,
          adminExists: userCheck.rows.length > 0,
          adminData: userCheck.rows[0] || null,
          totalUsers: parseInt(userCount.rows[0].count)
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        environment: {
          DATABASE_URL: !!process.env.DATABASE_URL,
          JWT_SECRET: !!process.env.JWT_SECRET
        }
      })
    };
  }
};
