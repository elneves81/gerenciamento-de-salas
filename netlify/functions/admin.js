const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Função para extrair user_id do token JWT
const extractUserFromToken = (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
};

// Verificar se usuário é administrador
const isAdmin = async (userId) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT role FROM usuarios WHERE id = $1', [userId]);
    return result.rows[0]?.role === 'admin';
  } finally {
    client.release();
  }
};

// Log de ações administrativas
const logAdminAction = async (adminId, action, targetUserId, details, ipAddress) => {
  const client = await pool.connect();
  try {
    await client.query(`
      INSERT INTO admin_logs (admin_id, action, target_user_id, details, ip_address)
      VALUES ($1, $2, $3, $4, $5)
    `, [adminId, action, targetUserId, details, ipAddress]);
  } catch (error) {
    console.error('Erro ao salvar log:', error);
  } finally {
    client.release();
  }
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Extrair usuário do token
  const userPayload = extractUserFromToken(event.headers?.authorization);
  if (!userPayload) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token de autenticação necessário' })
    };
  }

  // Verificar se é administrador
  const adminCheck = await isAdmin(userPayload.user_id);
  if (!adminCheck) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Acesso negado. Apenas administradores.' })
    };
  }

  const client = await pool.connect();
  const path = event.path;
  const method = event.httpMethod;

  try {
    // **GERENCIAR USUÁRIOS**
    if (path.includes('/admin/users')) {
      
      // GET - Listar todos os usuários
      if (method === 'GET' && path === '/.netlify/functions/admin/users') {
        const result = await client.query(`
          SELECT 
            u.id, u.nome, u.email, u.telefone, u.role, u.status,
            u.department_id, d.name as department_name,
            u.manager_id, m.nome as manager_name,
            u.created_at, u.last_login
          FROM usuarios u
          LEFT JOIN departments d ON u.department_id = d.id
          LEFT JOIN usuarios m ON u.manager_id = m.id
          ORDER BY u.created_at DESC
        `);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      }

      // POST - Criar usuário
      if (method === 'POST' && path === '/.netlify/functions/admin/users') {
        const { nome, email, telefone, role, department_id, manager_id } = JSON.parse(event.body);

        const result = await client.query(`
          INSERT INTO usuarios (nome, email, telefone, role, status, department_id, manager_id, created_by)
          VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)
          RETURNING *
        `, [nome, email, telefone, role || 'user', department_id || null, manager_id || null, userPayload.user_id]);

        // Log da ação
        await logAdminAction(
          userPayload.user_id,
          'CREATE_USER',
          result.rows[0].id,
          `Criou usuário: ${nome} (${email})`,
          event.requestContext?.identity?.sourceIp
        );

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      }

      // PUT - Atualizar usuário
      if (method === 'PUT' && path.includes('/admin/users/')) {
        const userId = path.split('/').pop();
        const { nome, email, telefone, role, department_id, manager_id } = JSON.parse(event.body);

        const result = await client.query(`
          UPDATE usuarios 
          SET nome = $1, email = $2, telefone = $3, role = $4, 
              department_id = $5, manager_id = $6, updated_at = NOW()
          WHERE id = $7
          RETURNING *
        `, [nome, email, telefone, role, department_id || null, manager_id || null, userId]);

        // Log da ação
        await logAdminAction(
          userPayload.user_id,
          'UPDATE_USER',
          userId,
          `Atualizou usuário: ${nome}`,
          event.requestContext?.identity?.sourceIp
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      }

      // PATCH - Alterar status do usuário
      if (method === 'PATCH' && path.includes('/status')) {
        const userId = path.split('/')[path.split('/').length - 2];
        const { status } = JSON.parse(event.body);

        const result = await client.query(`
          UPDATE usuarios 
          SET status = $1, blocked_at = CASE WHEN $1 = 'blocked' THEN NOW() ELSE NULL END
          WHERE id = $2
          RETURNING *
        `, [status, userId]);

        // Log da ação
        await logAdminAction(
          userPayload.user_id,
          status === 'blocked' ? 'BLOCK_USER' : 'UNBLOCK_USER',
          userId,
          `Status alterado para: ${status}`,
          event.requestContext?.identity?.sourceIp
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      }

      // DELETE - Deletar usuário
      if (method === 'DELETE' && path.includes('/admin/users/')) {
        const userId = path.split('/').pop();

        // Buscar nome do usuário antes de deletar
        const userResult = await client.query('SELECT nome FROM usuarios WHERE id = $1', [userId]);
        const userName = userResult.rows[0]?.nome;

        await client.query('DELETE FROM usuarios WHERE id = $1', [userId]);

        // Log da ação
        await logAdminAction(
          userPayload.user_id,
          'DELETE_USER',
          userId,
          `Deletou usuário: ${userName}`,
          event.requestContext?.identity?.sourceIp
        );

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Usuário deletado' })
        };
      }
    }

    // **GERENCIAR DEPARTAMENTOS**
    if (path.includes('/admin/departments')) {
      
      // GET - Listar departamentos
      if (method === 'GET') {
        const result = await client.query(`
          SELECT d.*, p.name as parent_name
          FROM departments d
          LEFT JOIN departments p ON d.parent_id = p.id
          ORDER BY d.name
        `);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      }

      // POST - Criar departamento
      if (method === 'POST') {
        const { name, description, parent_id } = JSON.parse(event.body);

        const result = await client.query(`
          INSERT INTO departments (name, description, parent_id, created_by)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [name, description, parent_id || null, userPayload.user_id]);

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result.rows[0])
        };
      }
    }

    // **NOTIFICAÇÕES ADMINISTRATIVAS**
    if (path.includes('/admin/notifications')) {
      
      if (method === 'POST') {
        const { title, message, recipient_id, type } = JSON.parse(event.body);

        // Se recipient_id não especificado, enviar para todos
        if (!recipient_id) {
          const usersResult = await client.query('SELECT id FROM usuarios WHERE status = $1', ['active']);
          
          for (const user of usersResult.rows) {
            await client.query(`
              INSERT INTO push_notifications (sender_id, recipient_id, title, message, type)
              VALUES ($1, $2, $3, $4, $5)
            `, [userPayload.user_id, user.id, title, message, type || 'admin_message']);
          }
        } else {
          await client.query(`
            INSERT INTO push_notifications (sender_id, recipient_id, title, message, type)
            VALUES ($1, $2, $3, $4, $5)
          `, [userPayload.user_id, recipient_id, title, message, type || 'admin_message']);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'Notificação enviada' })
        };
      }
    }

    // **ÁRVORE HIERÁRQUICA DE USUÁRIOS**
    if (path.includes('/admin/user-hierarchy')) {
      
      if (method === 'GET') {
        const result = await client.query(`
          SELECT * FROM user_hierarchy
        `);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      }
    }

    // **LOGS ADMINISTRATIVOS**
    if (path.includes('/admin/logs')) {
      
      if (method === 'GET') {
        const result = await client.query(`
          SELECT 
            al.*,
            a.nome as admin_name,
            u.nome as target_user_name
          FROM admin_logs al
          LEFT JOIN usuarios a ON al.admin_id = a.id
          LEFT JOIN usuarios u ON al.target_user_id = u.id
          ORDER BY al.created_at DESC
          LIMIT 100
        `);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result.rows)
        };
      }
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Endpoint não encontrado' })
    };

  } catch (error) {
    console.error('Erro na API Admin:', error);
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
