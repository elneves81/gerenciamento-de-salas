// Simulação de banco para não depender de configurações externas
const mockDatabase = {
  users: [
    {
      id: 1,
      nome: 'Administrador',
      email: 'admin@salafacil.com',
      telefone: '(11) 99999-9999',
      role: 'superadmin',
      status: 'active',
      department_id: 1,
      department_name: 'Administração',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      nome: 'João Silva',
      email: 'joao@salafacil.com',
      telefone: '(11) 88888-8888',
      role: 'admin',
      status: 'active',
      department_id: 2,
      department_name: 'TI',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      nome: 'Maria Santos',
      email: 'maria@salafacil.com',
      telefone: '(11) 77777-7777',
      role: 'user',
      status: 'active',
      department_id: 3,
      department_name: 'RH',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      nome: 'Pedro Costa',
      email: 'pedro@salafacil.com',
      telefone: '(11) 66666-6666',
      role: 'manager',
      status: 'blocked',
      department_id: 2,
      department_name: 'TI',
      created_at: new Date().toISOString()
    }
  ],
  departments: [
    { id: 1, name: 'Administração', description: 'Departamento Administrativo', users_count: 1 },
    { id: 2, name: 'TI', description: 'Tecnologia da Informação', users_count: 2 },
    { id: 3, name: 'RH', description: 'Recursos Humanos', users_count: 1 },
    { id: 4, name: 'Financeiro', description: 'Setor Financeiro', users_count: 0 },
    { id: 5, name: 'Marketing', description: 'Marketing e Vendas', users_count: 0 }
  ]
};

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
    const { httpMethod, path } = event;
    
    console.log('🚀 API Call:', httpMethod, path);

    // STATS ENDPOINT
    if (path.includes('stats') || path.includes('admin/stats')) {
      const stats = {
        total_users: mockDatabase.users.length,
        active_users: mockDatabase.users.filter(u => u.status === 'active').length,
        blocked_users: mockDatabase.users.filter(u => u.status === 'blocked').length,
        admin_users: mockDatabase.users.filter(u => ['admin', 'superadmin'].includes(u.role)).length,
        total_departments: mockDatabase.departments.length,
        recent_logins: Math.floor(mockDatabase.users.length * 0.6)
      };

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(stats)
      };
    }

    // USERS ENDPOINT
    if (path.includes('users') || path.includes('admin/users')) {
      if (httpMethod === 'GET') {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ results: mockDatabase.users })
        };
      }

      if (httpMethod === 'POST') {
        const body = JSON.parse(event.body);
        const newUser = {
          id: mockDatabase.users.length + 1,
          nome: body.nome || 'Novo Usuário',
          email: body.email || 'novo@salafacil.com',
          telefone: body.telefone || '(11) 00000-0000',
          role: body.role || 'user',
          status: 'active',
          department_id: body.department || 1,
          department_name: mockDatabase.departments.find(d => d.id == body.department)?.name || 'Administração',
          created_at: new Date().toISOString()
        };

        mockDatabase.users.push(newUser);
        
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(newUser)
        };
      }

      if (httpMethod === 'PUT') {
        const userId = path.split('/').pop();
        const body = JSON.parse(event.body);
        const userIndex = mockDatabase.users.findIndex(u => u.id == userId);
        
        if (userIndex >= 0) {
          mockDatabase.users[userIndex] = {
            ...mockDatabase.users[userIndex],
            ...body,
            updated_at: new Date().toISOString()
          };
          
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(mockDatabase.users[userIndex])
          };
        }
      }

      if (httpMethod === 'DELETE') {
        const userId = path.split('/').pop();
        const userIndex = mockDatabase.users.findIndex(u => u.id == userId);
        
        if (userIndex >= 0) {
          mockDatabase.users.splice(userIndex, 1);
          return {
            statusCode: 204,
            headers: corsHeaders,
            body: ''
          };
        }
      }
    }

    // DEPARTMENTS ENDPOINT
    if (path.includes('departments') || path.includes('admin/departments')) {
      if (httpMethod === 'GET') {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ results: mockDatabase.departments })
        };
      }

      if (httpMethod === 'POST') {
        const body = JSON.parse(event.body);
        const newDept = {
          id: mockDatabase.departments.length + 1,
          name: body.name || 'Novo Departamento',
          description: body.description || 'Descrição do departamento',
          users_count: 0,
          created_at: new Date().toISOString()
        };

        mockDatabase.departments.push(newDept);
        
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify(newDept)
        };
      }
    }

    // DATABASE SETUP
    if (path.includes('database/setup') || path.includes('setup')) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Banco de dados configurado com sucesso',
          users_created: mockDatabase.users.length,
          departments_created: mockDatabase.departments.length,
          timestamp: new Date().toISOString()
        })
      };
    }

    // DEFAULT RESPONSE - API INFO
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: '🚀 SalaFacil API Funcionando!',
        path: path,
        method: httpMethod,
        endpoints: {
          stats: '/admin/stats',
          users: '/admin/users',
          departments: '/admin/departments',
          setup: '/database/setup'
        },
        data: {
          total_users: mockDatabase.users.length,
          total_departments: mockDatabase.departments.length
        },
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Erro na API:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message,
        message: 'Erro interno do servidor'
      })
    };
  }
};
