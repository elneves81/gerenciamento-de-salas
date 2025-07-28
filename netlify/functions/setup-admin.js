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

    // Verificar se admin já existe na nova tabela usuarios
    const existingUser = await client.query(
      'SELECT username FROM usuarios WHERE username = $1 OR email = $2',
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

    // Criar hash da senha admin123
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Inserir usuário admin na nova tabela usuarios
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
        message: 'Erro ao criar/resetar usuário admin. Verifique se a tabela usuarios existe.'
      })
    };
  }
};
