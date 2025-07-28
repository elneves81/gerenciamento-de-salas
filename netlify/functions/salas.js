const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    await client.connect();

    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(headers);
      case 'POST':
        return await handlePost(event, headers);
      case 'PUT':
        return await handlePut(event, headers);
      case 'DELETE':
        return await handleDelete(event, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  } finally {
    await client.end();
  }
};

async function handleGet(headers) {
  try {
    const result = await client.query('SELECT * FROM agendamento_sala ORDER BY id');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error('Error fetching salas:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error fetching salas', details: error.message }),
    };
  }
}

async function handlePost(event, headers) {
  try {
    const { nome, capacidade, equipamentos, descricao } = JSON.parse(event.body);
    
    if (!nome || !capacidade) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nome e capacidade são obrigatórios' }),
      };
    }

    const result = await client.query(
      'INSERT INTO agendamento_sala (nome, capacidade, equipamentos, descricao, disponivel) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nome, capacidade, equipamentos || '', descricao || '', true]
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error('Error creating sala:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error creating sala', details: error.message }),
    };
  }
}

async function handlePut(event, headers) {
  try {
    const { id, nome, capacidade, equipamentos, descricao, disponivel } = JSON.parse(event.body);
    
    if (!id || !nome || !capacidade) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID, nome e capacidade são obrigatórios' }),
      };
    }

    const result = await client.query(
      'UPDATE agendamento_sala SET nome = $1, capacidade = $2, equipamentos = $3, descricao = $4, disponivel = $5 WHERE id = $6 RETURNING *',
      [nome, capacidade, equipamentos || '', descricao || '', disponivel !== undefined ? disponivel : true, id]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Sala não encontrada' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error('Error updating sala:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error updating sala', details: error.message }),
    };
  }
}

async function handleDelete(event, headers) {
  try {
    const { id } = JSON.parse(event.body);
    
    if (!id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID é obrigatório' }),
      };
    }

    const result = await client.query('DELETE FROM agendamento_sala WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Sala não encontrada' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Sala deletada com sucesso', sala: result.rows[0] }),
    };
  } catch (error) {
    console.error('Error deleting sala:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Error deleting sala', details: error.message }),
    };
  }
}
