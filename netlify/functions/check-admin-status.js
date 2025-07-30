const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

exports.handler = async (event, context) => {
  // Permitir apenas GET
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: ''
    };
  }

  try {
    const client = await pool.connect();

    try {
      // Verificar se existe pelo menos um admin no sistema
      const adminCheck = await client.query(
        'SELECT COUNT(*) as admin_count FROM usuarios WHERE role = $1',
        ['admin']
      );

      const adminCount = parseInt(adminCheck.rows[0].admin_count);
      const hasAdmin = adminCount > 0;

      // Se existe admin, verificar se é o super admin específico
      let hasSuperAdmin = false;
      if (hasAdmin) {
        const superAdminCheck = await client.query(
          'SELECT id FROM usuarios WHERE email = $1 AND role = $2',
          ['superadmin@salafacil.com', 'admin']
        );
        hasSuperAdmin = superAdminCheck.rows.length > 0;
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify({
          hasAdmin,
          hasSuperAdmin,
          adminCount,
          needsSetup: !hasAdmin,
          message: hasAdmin 
            ? (hasSuperAdmin ? 'Super admin configurado' : 'Sistema possui admin(s), mas não o super admin padrão')
            : 'Sistema precisa de configuração inicial'
        })
      };

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ 
        message: 'Erro interno do servidor',
        error: error.message 
      })
    };
  }
};
