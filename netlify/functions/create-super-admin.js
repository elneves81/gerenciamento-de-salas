const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  const client = await pool.connect();

  try {
    // Verificar se já existe um super admin
    const existingAdmin = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      ['superadmin@salafacil.com']
    );

    if (existingAdmin.rows.length > 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Super admin já existe',
          email: 'superadmin@salafacil.com'
        })
      };
    }

    // Criar departamento de administração se não existir
    await client.query(`
      INSERT INTO departments (name, description, created_at) 
      VALUES ('Administração Geral', 'Departamento de administração do sistema', NOW())
      ON CONFLICT (name) DO NOTHING
    `);

    // Hash da senha padrão: admin123
    const passwordHash = await bcrypt.hash('admin123', 10);

    // Criar super admin
    const result = await client.query(`
      INSERT INTO usuarios (
        nome, 
        email, 
        password_hash, 
        role, 
        status,
        department_id,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        (SELECT id FROM departments WHERE name = 'Administração Geral' LIMIT 1),
        NOW()
      ) RETURNING id, nome, email, role, status
    `, [
      'Super Administrador',
      'superadmin@salafacil.com',
      passwordHash,
      'admin',
      'active'
    ]);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Super admin criado com sucesso!',
        user: result.rows[0],
        credentials: {
          email: 'superadmin@salafacil.com',
          password: 'admin123'
        }
      })
    };

  } catch (error) {
    console.error('Erro ao criar super admin:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      })
    };
  } finally {
    client.release();
  }
};
