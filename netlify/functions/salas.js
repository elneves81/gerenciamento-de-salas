const { Client } = require('pg');

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

  const client = getDbClient();

  try {
    await client.connect();

    switch (event.httpMethod) {
      case 'GET':
        // Listar salas
        const salas = await client.query('SELECT * FROM agendamento_sala ORDER BY nome');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(salas.rows)
        };

      case 'POST':
        // Criar sala
        const { nome, capacidade, descricao } = JSON.parse(event.body || '{}');
        const novaSala = await client.query(
          'INSERT INTO agendamento_sala (nome, capacidade, descricao) VALUES ($1, $2, $3) RETURNING *',
          [nome, capacidade, descricao]
        );
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(novaSala.rows[0])
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  } finally {
    await client.end();
  }
};
