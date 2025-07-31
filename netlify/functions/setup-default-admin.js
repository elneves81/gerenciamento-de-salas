const { Client } = require('pg');
const bcrypt = require('bcryptjs');

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
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const client = getDbClient();

  try {
    await client.connect();

    // Verificar se a tabela usuarios existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      // Criar tabela usuarios se não existir
      await client.query(`
        CREATE TABLE usuarios (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255),
          nome VARCHAR(100) NOT NULL,
          telefone VARCHAR(20),
          google_id VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Tabela usuarios criada');
    }

    // Verificar se já existe um usuário admin
    const adminCheck = await client.query(
      'SELECT id FROM usuarios WHERE username = $1 OR email = $2',
      ['admin', 'admin@salafacil.com']
    );

    let adminUser;

    if (adminCheck.rows.length === 0) {
      // Criar usuário admin padrão
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const result = await client.query(`
        INSERT INTO usuarios (username, email, password, nome, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, username, email, nome
      `, ['admin', 'admin@salafacil.com', hashedPassword, 'Administrador']);

      adminUser = result.rows[0];
      console.log('Usuário admin criado:', adminUser);
    } else {
      // Atualizar senha do admin existente
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await client.query(
        'UPDATE usuarios SET password = $1, updated_at = NOW() WHERE username = $2 OR email = $3',
        [hashedPassword, 'admin', 'admin@salafacil.com']
      );

      adminUser = adminCheck.rows[0];
      console.log('Senha do admin atualizada');
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Usuário admin configurado com sucesso',
        admin: {
          username: 'admin',
          email: 'admin@salafacil.com',
          password: 'admin123'
        }
      })
    };

  } catch (error) {
    console.error('Erro ao configurar admin:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro ao configurar usuário admin'
      })
    };
  } finally {
    await client.end();
  }
};
