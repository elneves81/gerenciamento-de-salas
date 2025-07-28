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
        // Listar agendamentos
        const agendamentos = await client.query(`
          SELECT a.*, s.nome as sala_nome 
          FROM agendamento_agendamento a 
          JOIN agendamento_sala s ON a.sala_id = s.id 
          ORDER BY a.data_inicio
        `);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(agendamentos.rows)
        };

      case 'POST':
        // Criar agendamento
        const { sala_id, data_inicio, data_fim, titulo, descricao, usuario_id } = JSON.parse(event.body || '{}');
        
        // Verificar conflitos
        const conflito = await client.query(`
          SELECT * FROM agendamento_agendamento 
          WHERE sala_id = $1 AND (
            (data_inicio <= $2 AND data_fim > $2) OR
            (data_inicio < $3 AND data_fim >= $3) OR
            (data_inicio >= $2 AND data_fim <= $3)
          )
        `, [sala_id, data_inicio, data_fim]);

        if (conflito.rows.length > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Sala já está ocupada neste horário' })
          };
        }

        const novoAgendamento = await client.query(
          `INSERT INTO agendamento_agendamento 
           (sala_id, data_inicio, data_fim, titulo, descricao, usuario_id, criado_em) 
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
          [sala_id, data_inicio, data_fim, titulo, descricao, usuario_id]
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(novoAgendamento.rows[0])
        };

      case 'DELETE':
        // Deletar agendamento
        const agendamentoId = event.path.split('/').pop();
        await client.query('DELETE FROM agendamento_agendamento WHERE id = $1', [agendamentoId]);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Agendamento deletado com sucesso' })
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
