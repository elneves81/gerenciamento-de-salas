const { Client } = require('pg');

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

    // Verificar se a tabela usuarios existe
    const tableCheck = await client.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('usuarios', 'auth_user', 'agendamento_sala')
      ORDER BY table_name, ordinal_position
    `);

    // Contar registros em cada tabela
    let tableCounts = {};
    
    try {
      const usuariosCount = await client.query('SELECT COUNT(*) FROM usuarios');
      tableCounts.usuarios = usuariosCount.rows[0].count;
    } catch (e) {
      tableCounts.usuarios = 'Tabela não existe';
    }

    try {
      const authCount = await client.query('SELECT COUNT(*) FROM auth_user');
      tableCounts.auth_user = authCount.rows[0].count;
    } catch (e) {
      tableCounts.auth_user = 'Tabela não existe';
    }

    try {
      const salasCount = await client.query('SELECT COUNT(*) FROM agendamento_sala');
      tableCounts.agendamento_sala = salasCount.rows[0].count;
    } catch (e) {
      tableCounts.agendamento_sala = 'Tabela não existe';
    }

    await client.end();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Diagnóstico do banco de dados',
        tables: tableCheck.rows,
        counts: tableCounts,
        database_url: process.env.DATABASE_URL ? 'Configurada' : 'Não configurada'
      })
    };

  } catch (error) {
    try {
      await client.end();
    } catch (e) {}

    console.error('Erro no diagnóstico:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro ao conectar com o banco de dados',
        database_url: process.env.DATABASE_URL ? 'Configurada' : 'Não configurada'
      })
    };
  }
};
