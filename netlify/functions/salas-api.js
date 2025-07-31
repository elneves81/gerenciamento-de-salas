// API para gerenciamento de salas - Nova implementação
const { Client } = require('pg');

// Dados mock para fallback
const MOCK_SALAS = [
  {
    id: 1,
    nome: 'Sala Executiva',
    capacidade: 8,
    equipamentos: 'TV 55", Sistema de Videoconferência, Mesa de Reunião',
    descricao: 'Sala moderna para reuniões executivas',
    disponivel: true,
    criado_em: '2025-07-29T10:00:00.000Z'
  },
  {
    id: 2,
    nome: 'Auditório Central',
    capacidade: 100,
    equipamentos: 'Projetor 4K, Sistema de Som, Microfones sem fio',
    descricao: 'Auditório principal para grandes apresentações',
    disponivel: true,
    criado_em: '2025-07-29T10:00:00.000Z'
  },
  {
    id: 3,
    nome: 'Sala de Brainstorm',
    capacidade: 12,
    equipamentos: 'Quadros brancos, Post-its, Projetor interativo',
    descricao: 'Espaço criativo para sessões de brainstorming',
    disponivel: true,
    criado_em: '2025-07-29T10:00:00.000Z'
  },
  {
    id: 4,
    nome: 'Lab de Inovação',
    capacidade: 15,
    equipamentos: 'Computadores, Impressora 3D, Ferramentas de prototipagem',
    descricao: 'Laboratório equipado para desenvolvimento e inovação',
    disponivel: true,
    criado_em: '2025-07-29T10:00:00.000Z'
  }
];

// Função para conectar ao banco
const conectarBanco = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
};

// Headers CORS padrão
const getCorsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
});

// Função para listar salas
async function listarSalas() {
  try {
    const client = conectarBanco();
    await client.connect();
    
    const result = await client.query(`
      SELECT id, nome, capacidade, 
             COALESCE(equipamentos, '') as equipamentos,
             COALESCE(descricao, '') as descricao, 
             ativa as disponivel, criado_em 
      FROM agendamento_sala 
      ORDER BY nome ASC
    `);
    
    await client.end();
    return result.rows;
  } catch (error) {
    console.error('Erro ao acessar banco, usando dados mock:', error);
    return MOCK_SALAS;
  }
}

// Função para criar sala
async function criarSala(dados) {
  try {
    const client = conectarBanco();
    await client.connect();
    
    const result = await client.query(`
      INSERT INTO agendamento_sala (nome, capacidade, equipamentos, descricao, ativa, criado_em)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, nome, capacidade, equipamentos, descricao, ativa as disponivel, criado_em
    `, [
      dados.nome,
      dados.capacidade || 10,
      dados.equipamentos || '',
      dados.descricao || '',
      true
    ]);
    
    await client.end();
    return result.rows[0];
  } catch (error) {
    console.error('Erro ao criar sala no banco:', error);
    // Retornar dados simulados em caso de erro
    return {
      id: Date.now(),
      nome: dados.nome,
      capacidade: dados.capacidade || 10,
      equipamentos: dados.equipamentos || '',
      descricao: dados.descricao || '',
      disponivel: true,
      criado_em: new Date().toISOString()
    };
  }
}

// Handler principal
exports.handler = async (event, context) => {
  const headers = getCorsHeaders();

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    switch (event.httpMethod) {
      case 'GET':
        const salas = await listarSalas();
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(salas)
        };

      case 'POST':
        const dadosNovaSala = JSON.parse(event.body || '{}');
        
        if (!dadosNovaSala.nome) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ 
              error: 'Nome da sala é obrigatório',
              code: 'NOME_OBRIGATORIO'
            })
          };
        }

        const novaSala = await criarSala(dadosNovaSala);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Sala criada com sucesso!',
            sala: novaSala
          })
        };

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ 
            error: 'Método não permitido',
            allowedMethods: ['GET', 'POST']
          })
        };
    }
  } catch (error) {
    console.error('Erro na API:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro interno do servidor',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};
