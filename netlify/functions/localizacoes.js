const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = await pool.connect();

  try {
    // Extrair user_id do token se necessário
    let userId = null;
    const authHeader = event.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.user_id;
      } catch (error) {
        console.log('Erro ao decodificar token:', error.message);
      }
    }

    if (event.httpMethod === 'GET') {
      // Listar todas as localizações
      const result = await client.query(`
        SELECT id, nome, endereco, cidade, estado, cep, ativa, criado_em 
        FROM localizacoes 
        ORDER BY nome ASC
      `);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows || [])
      };
    }

    if (event.httpMethod === 'POST') {
      const { nome, endereco, cidade, estado, cep, ativa = true } = JSON.parse(event.body);

      if (!nome) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Nome é obrigatório' })
        };
      }

      // Criar tabela se não existir
      await client.query(`
        CREATE TABLE IF NOT EXISTS localizacoes (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          endereco TEXT,
          cidade VARCHAR(100),
          estado VARCHAR(50),
          cep VARCHAR(20),
          ativa BOOLEAN DEFAULT TRUE,
          criado_em TIMESTAMP DEFAULT NOW()
        );
      `);

      // Inserir nova localização
      const result = await client.query(`
        INSERT INTO localizacoes (nome, endereco, cidade, estado, cep, ativa, criado_em)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `, [nome, endereco, cidade, estado, cep, ativa]);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (event.httpMethod === 'PUT') {
      const localizacaoId = event.path.split('/').pop();
      const { nome, endereco, cidade, estado, cep, ativa } = JSON.parse(event.body);

      const result = await client.query(`
        UPDATE localizacoes 
        SET nome = $1, endereco = $2, cidade = $3, estado = $4, cep = $5, ativa = $6
        WHERE id = $7
        RETURNING *
      `, [nome, endereco, cidade, estado, cep, ativa, localizacaoId]);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Localização não encontrada' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (event.httpMethod === 'DELETE') {
      const localizacaoId = event.path.split('/').pop();

      const result = await client.query(`
        DELETE FROM localizacoes 
        WHERE id = $1
        RETURNING *
      `, [localizacaoId]);

      if (result.rows.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Localização não encontrada' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Localização removida com sucesso' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    console.error('Erro na API de localizações:', error);
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
