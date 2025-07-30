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
    // Inicializar banco se necessário
    await initializeDatabase();

    const { httpMethod, path, body } = event;
    const requestBody = body ? JSON.parse(body) : {};

    // Roteamento das APIs
    if (path.includes('/api/admin/users')) {
      return await handleUsers(httpMethod, path, requestBody);
    } else if (path.includes('/api/admin/departments')) {
      return await handleDepartments(httpMethod, path, requestBody);
    } else if (path.includes('/api/admin/stats')) {
      return await handleStats(httpMethod);
    } else if (path.includes('/api/database/setup')) {
      return await handleDatabaseSetup(httpMethod, requestBody);
    } else if (path.includes('/api/database/sync-user')) {
      return await handleSyncUser(httpMethod, requestBody);
    } else if (path.includes('/api/database/check-admin')) {
      return await handleCheckAdmin(httpMethod, requestBody);
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint não encontrado' })
    };

  } catch (error) {
    console.error('Erro na API:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
};

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // Criar tabela usuarios se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(254) UNIQUE NOT NULL,
        telefone VARCHAR(20),
        password_hash VARCHAR(128),
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        department_id INTEGER,
        manager_id INTEGER,
        created_by INTEGER,
        blocked_at TIMESTAMP,
        last_login TIMESTAMP,
        google_id VARCHAR(100) UNIQUE,
        picture_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Criar tabela departments se não existir
    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        parent_id INTEGER REFERENCES departments(id),
        created_at TIMESTAMP DEFAULT NOW(),
        created_by INTEGER
      );
    `);

    // Criar índices
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
      CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
      CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
    `);

    // Inserir departamentos padrão
    await client.query(`
      INSERT INTO departments (name, description) VALUES 
      ('Administração', 'Departamento Administrativo'),
      ('TI', 'Tecnologia da Informação'),
      ('RH', 'Recursos Humanos')
      ON CONFLICT DO NOTHING;
    `);

    client.release();
    console.log('✅ Banco de dados inicializado');
  } catch (error) {
    console.error('Erro ao inicializar banco:', error);
  }
}

async function handleUsers(method, path, body) {
  const client = await pool.connect();
  
  try {
    if (method === 'GET') {
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

    if (method === 'POST') {
      // Criar usuário
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

    if (method === 'PUT') {
      // Atualizar usuário
      const userId = path.split('/').pop();
      const { nome, email, telefone, role, department, manager } = body;
      
      const result = await client.query(`
        UPDATE usuarios 
        SET nome = $1, email = $2, telefone = $3, role = $4, 
            department_id = $5, manager_id = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `, [nome, email, telefone, role, department, manager, userId]);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.rows[0])
      };
    }

    if (method === 'DELETE') {
      // Deletar usuário
      const userId = path.split('/').pop();
      
      await client.query('DELETE FROM usuarios WHERE id = $1', [userId]);
      
      return {
        statusCode: 204,
        headers: corsHeaders,
        body: ''
      };
    }

    // PATCH para bloquear/desbloquear
    if (method === 'PATCH' && path.includes('block_user')) {
      const userId = path.split('/')[path.split('/').length - 2];
      
      const result = await client.query(`
        UPDATE usuarios 
        SET status = CASE 
          WHEN status = 'blocked' THEN 'active' 
          ELSE 'blocked' 
        END,
        blocked_at = CASE 
          WHEN status = 'blocked' THEN NULL 
          ELSE NOW() 
        END
        WHERE id = $1
        RETURNING *
      `, [userId]);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result.rows[0])
      };
    }

  } finally {
    client.release();
  }
}

async function handleDepartments(method, path, body) {
  const client = await pool.connect();
  
  try {
    if (method === 'GET') {
      const result = await client.query(`
        SELECT d.*, p.name as parent_name,
               (SELECT COUNT(*) FROM usuarios WHERE department_id = d.id) as users_count
        FROM departments d 
        LEFT JOIN departments p ON d.parent_id = p.id 
        ORDER BY d.name
      `);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ results: result.rows })
      };
    }

    if (method === 'POST') {
      const { name, description, parent } = body;
      
      const result = await client.query(`
        INSERT INTO departments (name, description, parent_id, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `, [name, description, parent]);
      
      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify(result.rows[0])
      };
    }
  } finally {
    client.release();
  }
}

async function handleStats(method) {
  if (method !== 'GET') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  const client = await pool.connect();
  
  try {
    const stats = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked_users,
        COUNT(*) FILTER (WHERE role IN ('admin', 'superadmin')) as admin_users,
        (SELECT COUNT(*) FROM departments) as total_departments,
        COUNT(*) FILTER (WHERE last_login >= NOW() - INTERVAL '7 days') as recent_logins
      FROM usuarios
    `);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(stats.rows[0])
    };
  } finally {
    client.release();
  }
}

async function handleDatabaseSetup(method, body) {
  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    await initializeDatabase();
    
    // Criar super admin
    const client = await pool.connect();
    
    await client.query(`
      INSERT INTO usuarios (nome, email, role, status, created_at)
      VALUES ('Super Administrador', 'superadmin@salafacil.com', 'superadmin', 'active', NOW())
      ON CONFLICT (email) DO UPDATE SET
        nome = EXCLUDED.nome,
        role = EXCLUDED.role,
        status = EXCLUDED.status
    `);
    
    client.release();
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: 'Banco de dados configurado com sucesso'
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}

async function handleSyncUser(method, body) {
  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  const { email, name, id: google_id, picture } = body;
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      INSERT INTO usuarios (nome, email, google_id, picture_url, role, status, created_at, last_login)
      VALUES ($1, $2, $3, $4, 'user', 'active', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET
        nome = EXCLUDED.nome,
        google_id = EXCLUDED.google_id,
        picture_url = EXCLUDED.picture_url,
        last_login = NOW()
      RETURNING id, nome, email, role, status
    `, [name, email, google_id, picture]);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        user: result.rows[0]
      })
    };
  } finally {
    client.release();
  }
}

async function handleCheckAdmin(method, body) {
  if (method !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  const { email } = body;
  
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT role, status FROM usuarios WHERE email = $1
    `, [email]);
    
    if (result.rows.length > 0) {
      const { role, status } = result.rows[0];
      const isAdmin = ['admin', 'superadmin'].includes(role) && status === 'active';
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          is_admin: isAdmin,
          role: role,
          status: status,
          needs_setup: false
        })
      };
    } else {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          is_admin: false,
          needs_setup: true
        })
      };
    }
  } finally {
    client.release();
  }
}
