const { Client } = require('pg');

const connectToDatabase = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
};

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = connectToDatabase();
  
  try {
    await client.connect();

    if (event.httpMethod === 'GET') {
      const result = await client.query(`
        SELECT id, nome, capacidade, 
               COALESCE(equipamentos, '') as equipamentos,
               descricao, ativa as disponivel, criado_em 
        FROM agendamento_sala 
        ORDER BY id ASC
      `);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows),
      };
    }

    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);

      if (!data.nome) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Campo "nome" é obrigatório.' }),
        };
      }

      const insert = await client.query(
        `INSERT INTO agendamento_sala (nome, capacidade, equipamentos, descricao, ativa, criado_em) 
         VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
        [
          data.nome, 
          data.capacidade || 10, 
          data.equipamentos || '', 
          data.descricao || '', 
          true
        ]
      );

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ 
          message: 'Sala criada com sucesso!', 
          sala: insert.rows[0] 
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido.' }),
    };

  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor', 
        details: err.message 
      }),
    };
  } finally {
    try {
      await client.end();
    } catch (e) {
      console.error('Error closing client:', e);
    }
  }
};
