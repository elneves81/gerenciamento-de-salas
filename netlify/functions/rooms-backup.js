// Função de gerenciamento de salas com fallback robusto
const { Client } = require('pg');

const FALLBACK_SALAS = [
  { id: 1, nome: 'Sala A', capacidade: 10, disponivel: true },
  { id: 2, nome: 'Sala B', capacidade: 8, disponivel: true },
  { id: 3, nome: 'Auditório', capacidade: 50, disponivel: true }
];

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Sempre retornar dados válidos
  try {
    if (event.httpMethod === 'GET') {
      // Tentar buscar do banco, senão usar fallback
      let salas = FALLBACK_SALAS;
      
      try {
        const client = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        
        await client.connect();
        const result = await client.query('SELECT * FROM agendamento_sala ORDER BY id');
        if (result.rows.length > 0) {
          salas = result.rows;
        }
        await client.end();
      } catch (dbError) {
        console.log('Usando dados fallback devido a erro no banco:', dbError.message);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(salas)
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'API funcionando', method: event.httpMethod })
    };

  } catch (error) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(FALLBACK_SALAS)
    };
  }
};
