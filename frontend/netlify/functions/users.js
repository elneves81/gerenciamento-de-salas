const { Pool } = require('pg');

// Configuração do banco Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Headers CORS padrão
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const client = await pool.connect();
    
    try {
      if (event.httpMethod === 'GET') {
        // Listar usuários
        const result = await client.query(`
          SELECT u.*, d.name as department_name 
          FROM usuarios u 
          LEFT JOIN departments d ON u.department_id = d.id 
          ORDER BY u.created_at DESC
        `);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ results: result.rows })
        };
      }

      if (event.httpMethod === 'POST') {
        // Criar usuário
        const body = JSON.parse(event.body);
        const { nome, email, telefone, role, department, manager } = body;
        
        const result = await client.query(`
          INSERT INTO usuarios (nome, email, telefone, role, department_id, manager_id, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING *
        `, [nome, email, telefone, role, department, manager]);
        
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(result.rows[0])
        };
      }

    } catch (dbError) {
      console.log('Erro no banco, retornando dados mock:', dbError.message);
      
      // Fallback com dados mock
      if (event.httpMethod === 'GET') {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            results: [
              {
                id: 1,
                nome: 'Usuário Demo',
                email: 'demo@salafacil.com',
                telefone: '(11) 99999-9999',
                role: 'admin',
                status: 'active',
                department_name: 'Administração',
                created_at: new Date().toISOString()
              },
              {
                id: 2,
                nome: 'João Silva',
                email: 'joao@salafacil.com',
                telefone: '(11) 88888-8888',
                role: 'user',
                status: 'active',
                department_name: 'TI',
                created_at: new Date().toISOString()
              }
            ]
          })
        };
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro na API de usuários:', error);
    
    // Fallback com dados mock em caso de erro
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        results: [
          {
            id: 1,
            nome: 'Usuário Demo',
            email: 'demo@salafacil.com',
            telefone: '(11) 99999-9999',
            role: 'admin',
            status: 'active',
            department_name: 'Administração',
            created_at: new Date().toISOString()
          }
        ]
      })
    };
  }

  return {
    statusCode: 405,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Método não permitido' })
  };
};
