const { Client } = require('pg');

// Função para criar nova conexão
const createClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  const client = createClient();

  try {
    await client.connect();

    // Verificar se precisa criar a tabela agendamento_agendamento
    await client.query(`
      CREATE TABLE IF NOT EXISTS agendamento_agendamento (
        id SERIAL PRIMARY KEY,
        sala_id INTEGER REFERENCES agendamento_sala(id),
        data_inicio TIMESTAMP NOT NULL,
        data_fim TIMESTAMP NOT NULL,
        titulo VARCHAR(200) NOT NULL,
        descricao TEXT,
        usuario_id INTEGER,
        criado_em TIMESTAMP DEFAULT NOW()
      )
    `);

    // Adicionar coluna equipamentos se não existir
    await client.query(`
      ALTER TABLE agendamento_sala 
      ADD COLUMN IF NOT EXISTS equipamentos TEXT DEFAULT ''
    `);

    switch (event.httpMethod) {
      case 'GET':
        return await handleGet(client, headers);
      case 'POST':
        return await handlePost(event, client, headers);
      case 'PUT':
        return await handlePut(event, client, headers);
      case 'DELETE':
        return await handleDelete(event, client, headers);
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
    try {
      await client.end();
    } catch (e) {
      console.error('Error closing client:', e);
    }
  }
};

async function handleGet(client, headers) {
  try {
    const result = await client.query('SELECT id, nome, capacidade, equipamentos, descricao, ativa as disponivel, criado_em FROM agendamento_sala ORDER BY nome');
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

async function handlePost(event, client, headers) {
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
      'INSERT INTO agendamento_sala (nome, capacidade, equipamentos, descricao, ativa, criado_em) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
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

async function handlePut(event, client, headers) {
  try {
    const pathParts = event.path.split('/');
    const salaId = pathParts[pathParts.length - 1];
    
    if (!salaId || salaId === 'salas') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID da sala é obrigatório na URL' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { nome, capacidade, descricao, disponivel, equipamentos } = body;

    // Se apenas alterando status
    if (disponivel !== undefined && !nome && !capacidade) {
      const result = await client.query(
        'UPDATE agendamento_sala SET ativa = $1 WHERE id = $2 RETURNING id, nome, capacidade, equipamentos, descricao, ativa as disponivel, criado_em',
        [disponivel, salaId]
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
    }

    // Atualização completa
    if (!nome || !capacidade) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Nome e capacidade são obrigatórios' }),
      };
    }

    const result = await client.query(
      'UPDATE agendamento_sala SET nome = $1, capacidade = $2, equipamentos = $3, descricao = $4, ativa = $5 WHERE id = $6 RETURNING id, nome, capacidade, equipamentos, descricao, ativa as disponivel, criado_em',
      [nome, capacidade, equipamentos || '', descricao || '', disponivel !== undefined ? disponivel : true, salaId]
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

async function handleDelete(event, client, headers) {
  try {
    const pathParts = event.path.split('/');
    const salaId = pathParts[pathParts.length - 1];
    
    if (!salaId || salaId === 'salas') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'ID da sala é obrigatório na URL' }),
      };
    }

    // Verificar se há agendamentos ativos
    const agendamentosAtivos = await client.query(
      'SELECT COUNT(*) as count FROM agendamento_agendamento WHERE sala_id = $1 AND data_fim > NOW()',
      [salaId]
    );

    if (parseInt(agendamentosAtivos.rows[0].count) > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Não é possível excluir sala com agendamentos ativos' }),
      };
    }

    // Deletar agendamentos passados primeiro
    await client.query('DELETE FROM agendamento_agendamento WHERE sala_id = $1', [salaId]);

    // Deletar a sala
    const result = await client.query('DELETE FROM agendamento_sala WHERE id = $1 RETURNING *', [salaId]);

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
