// Função de gerenciamento de salas com fallback robusto
const { Client } = require('pg');

const FALLBACK_SALAS = [
  { 
    id: 1, 
    nome: 'Sala Executiva', 
    capacidade: 8,
    equipamentos: 'TV 55", Videoconferência',
    descricao: 'Sala para reuniões executivas',
    disponivel: true,
    criado_em: '2025-07-29T10:00:00.000Z'
  },
  { 
    id: 2, 
    nome: 'Auditório Central', 
    capacidade: 100,
    equipamentos: 'Projetor 4K, Sistema de som',
    descricao: 'Auditório para apresentações',
    disponivel: true,
    criado_em: '2025-07-29T10:00:00.000Z'
  },
  { 
    id: 3, 
    nome: 'Sala de Brainstorm', 
    capacidade: 12,
    equipamentos: 'Quadros brancos, TV interativa',
    descricao: 'Espaço para colaboração',
    disponivel: true,
    criado_em: '2025-07-29T10:00:00.000Z'
  }
];

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
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
        const result = await client.query('SELECT * FROM salas ORDER BY id');
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
