const { Client } = require('pg');
const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Verificar se a tabela usuarios existe
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'usuarios' AND table_schema = 'public'
    `);

    if (tableCheck.rows.length === 0) {
      // Tabela usuarios não existe, vamos criá-la
      await client.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255),
          nome VARCHAR(100) NOT NULL,
          telefone VARCHAR(20),
          google_id VARCHAR(255) UNIQUE,
          avatar_url TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Criar índices
      await client.query('CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)');
      await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id)');
    }

    // 2. Verificar se admin já existe
    const existingUser = await client.query(
      'SELECT username, email FROM usuarios WHERE username = $1 OR email = $2',
      ['admin', 'admin@salafacil.com']
    );

    if (existingUser.rows.length > 0) {
      // Se já existe, vamos resetar a senha
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await client.query(
        'UPDATE usuarios SET password = $1 WHERE username = $2 OR email = $3',
        [hashedPassword, 'admin', 'admin@salafacil.com']
      );

      await client.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Senha do usuário admin resetada com sucesso!',
          credentials: {
            email: 'admin@salafacil.com',
            password: 'admin123'
          },
          instructions: 'Use o email "admin@salafacil.com" e senha "admin123" para fazer login'
        })
      };
    }

    // 3. Criar hash da senha admin123
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // 4. Inserir usuário admin na tabela usuarios
    const result = await client.query(`
      INSERT INTO usuarios (username, email, password, nome, telefone, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, username, email, nome
    `, [
      'admin',
      'admin@salafacil.com',
      hashedPassword,
      'Administrador do Sistema',
      '(11) 99999-9999'
    ]);

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Usuário admin criado com sucesso no novo sistema!',
        user: result.rows[0],
        credentials: {
          email: 'admin@salafacil.com',
          password: 'admin123'
        },
        instructions: 'Use o email "admin@salafacil.com" e senha "admin123" para fazer login'
      })
    };

  } catch (error) {
    try {
      await client.end();
    } catch (e) {}

    console.error('Erro ao criar admin:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
        message: 'Erro ao criar/resetar usuário admin.',
        debug_info: {
          database_url: process.env.DATABASE_URL ? 'URL configurada' : 'URL não configurada',
          error_details: error.toString()
        }
      })
    };
  }
};
