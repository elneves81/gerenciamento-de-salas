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

    // Verificar se admin já existe
    const existingUser = await client.query(
      'SELECT username FROM auth_user WHERE username = $1',
      ['admin']
    );

    if (existingUser.rows.length > 0) {
      // Se já existe, vamos resetar a senha
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await client.query(
        'UPDATE auth_user SET password = $1 WHERE username = $2',
        [hashedPassword, 'admin']
      );

      await client.end();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Senha do usuário admin resetada com sucesso!',
          credentials: {
            username: 'admin',
            password: 'admin123'
          }
        })
      };
    }

    // Criar hash da senha admin123
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Inserir usuário admin
    const result = await client.query(`
      INSERT INTO auth_user (username, password, email, first_name, last_name, is_staff, is_active, is_superuser, date_joined)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, username, email
    `, [
      'admin',
      hashedPassword,
      'admin@salafacil.com',
      'Admin',
      'Sistema',
      true,
      true,
      true
    ]);

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Usuário admin criado com sucesso!',
        user: result.rows[0],
        credentials: {
          username: 'admin',
          password: 'admin123'
        }
      })
    };

  } catch (error) {
    try {
      await client.end();
    } catch (e) {}

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro ao criar/resetar usuário admin'
      })
    };
  }
};
