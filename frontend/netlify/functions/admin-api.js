// Sistema SalaFacil - API Completa com dados mock profissionais
// Funciona 100% sem dependências externas
// Agora com integração opcional ao Neon Database

let pool = null;
let pgAvailable = false;

// Tentar conectar ao Neon Database
async function initializeNeonPool() {
  try {
    console.log('🔍 Verificando disponibilidade do módulo pg...');
    
    // Primeiro, tentar uma conexão simples sem pool para testar
    if (process.env.DATABASE_URL) {
      console.log('🔗 Testando conexão direta com Neon (sem pool)...');
      
      // Usar fetch para testar conectividade básica (alternativa sem pg)
      const url = new URL(process.env.DATABASE_URL);
      console.log('📍 Host Neon:', url.hostname);
      console.log('📍 Database:', url.pathname.substring(1));
      
      // Tentar import do pg novamente
      let Pool;
      
      try {
        // Tentativa com require simples
        console.log('🔄 Tentando require("pg")...');
        const pg = require('pg');
        Pool = pg.Pool;
        console.log('✅ require("pg") funcionou!');
      } catch (pgError) {
        console.log('❌ Erro ao importar pg:', pgError.message);
        
        // Verificar se o módulo existe no sistema de arquivos
        try {
          const fs = require('fs');
          const path = require('path');
          const nodeModulesPath = path.join(process.cwd(), 'node_modules', 'pg');
          console.log('📁 Verificando node_modules/pg em:', nodeModulesPath);
          
          if (fs.existsSync(nodeModulesPath)) {
            console.log('✅ Pasta pg encontrada em node_modules');
            const packageJsonPath = path.join(nodeModulesPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
              const pgPackage = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
              console.log('📋 Versão pg instalada:', pgPackage.version);
            }
          } else {
            console.log('❌ Pasta pg NÃO encontrada em node_modules');
          }
        } catch (fsError) {
          console.log('⚠️ Erro ao verificar sistema de arquivos:', fsError.message);
        }
        
        throw new Error('Módulo pg não disponível: ' + pgError.message);
      }
      
      if (!Pool) {
        throw new Error('Pool class não foi encontrada');
      }
      
      console.log('✅ Módulo pg encontrado, inicializando pool...');
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      
      // Testar conexão
      const client = await pool.connect();
      await client.query('SELECT 1 as test');
      client.release();
      
      pgAvailable = true;
      console.log('🎉 Pool Neon Database inicializado e conectado com sucesso!');
      return true;
    } else {
      console.log('⚠️ DATABASE_URL não configurada');
      throw new Error('DATABASE_URL não configurada');
    }
    
  } catch (error) {
    console.log('⚠️ Erro ao inicializar Neon Database:', error.message);
    console.log('🔄 Continuando com sistema mock...');
    pool = null;
    pgAvailable = false;
    return false;
  }
}

// Dados mock realistas e profissionais
const mockDatabase = {
  users: [
    {
      id: 1,
      nome: 'Administrador Principal',
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
      nome: 'João Silva Santos',
      email: 'joao.silva@salafacil.com',
      telefone: '(11) 98888-8888',
      role: 'admin',
      status: 'active',
      department_id: 2,
      department_name: 'Tecnologia da Informação',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      nome: 'Maria Fernanda Costa',
      email: 'maria.costa@salafacil.com',
      telefone: '(11) 97777-7777',
      role: 'manager',
      status: 'active',
      department_id: 3,
      department_name: 'Recursos Humanos',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      nome: 'Pedro Henrique Oliveira',
      email: 'pedro.oliveira@salafacil.com',
      telefone: '(11) 96666-6666',
      role: 'user',
      status: 'active',
      department_id: 2,
      department_name: 'Tecnologia da Informação',
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      nome: 'Ana Beatriz Santos',
      email: 'ana.santos@salafacil.com',
      telefone: '(11) 95555-5555',
      role: 'user',
      status: 'active',
      department_id: 4,
      department_name: 'Financeiro',
      created_at: new Date().toISOString()
    },
    {
      id: 6,
      nome: 'Carlos Eduardo Lima',
      email: 'carlos.lima@salafacil.com',
      telefone: '(11) 94444-4444',
      role: 'user',
      status: 'blocked',
      department_id: 5,
      department_name: 'Marketing',
      created_at: new Date().toISOString()
    }
  ],
  departments: [
    { id: 1, name: 'Administração', description: 'Administração Geral e Governança Corporativa', users_count: 1 },
    { id: 2, name: 'Tecnologia da Informação', description: 'Desenvolvimento, Infraestrutura e Suporte Técnico', users_count: 2 },
    { id: 3, name: 'Recursos Humanos', description: 'Gestão de Pessoas e Desenvolvimento Organizacional', users_count: 1 },
    { id: 4, name: 'Financeiro', description: 'Controladoria, Contabilidade e Planejamento Financeiro', users_count: 1 },
    { id: 5, name: 'Marketing', description: 'Marketing Digital, Vendas e Relacionamento com Cliente', users_count: 1 },
    { id: 6, name: 'Operações', description: 'Gestão de Salas, Equipamentos e Logística', users_count: 0 },
    { id: 7, name: 'Qualidade', description: 'Controle de Qualidade e Processos', users_count: 0 }
  ]
};

// Headers CORS completos
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache'
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
    console.log('🚀 SalaFacil API Request:', httpMethod, path);

    // Rota para estatísticas
    if (path.includes('stats')) {
      const stats = {
        total_users: mockDatabase.users.length,
        active_users: mockDatabase.users.filter(u => u.status === 'active').length,
        blocked_users: mockDatabase.users.filter(u => u.status === 'blocked').length,
        admin_users: mockDatabase.users.filter(u => ['admin', 'superadmin', 'manager'].includes(u.role)).length,
        total_departments: mockDatabase.departments.length,
        recent_logins: Math.floor(mockDatabase.users.length * 0.7),
        system_health: 'Excelente',
        uptime: '99.9%',
        last_backup: new Date().toISOString(),
        database_type: 'Sistema Mock Profissional'
      };

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(stats)
      };
    }

    // Rota para usuários
    if (path.includes('users')) {
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
          email: body.email || `user${Date.now()}@salafacil.com`,
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
          
          // Atualizar nome do departamento se mudou
          if (body.department_id) {
            const dept = mockDatabase.departments.find(d => d.id == body.department_id);
            if (dept) {
              mockDatabase.users[userIndex].department_name = dept.name;
            }
          }
          
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(mockDatabase.users[userIndex])
          };
        }
        
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Usuário não encontrado' })
        };
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
        
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Usuário não encontrado' })
        };
      }
    }

    // Rota para departamentos
    if (path.includes('departments')) {
      if (httpMethod === 'GET') {
        // Recalcular contagem de usuários
        const departmentsWithCount = mockDatabase.departments.map(dept => ({
          ...dept,
          users_count: mockDatabase.users.filter(u => u.department_id === dept.id).length
        }));
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ results: departmentsWithCount })
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

    // TESTE DE CONEXÃO NEON DATABASE
    if (path.includes('/test-neon') || path.includes('/neon-test')) {
      console.log('🔗 Iniciando teste de conexão Neon...');
      
      // Tentar inicializar pool se ainda não foi feito
      if (!pgAvailable && !pool) {
        console.log('🔄 Tentando inicializar pool Neon...');
        await initializeNeonPool();
      }
      
      if (!pool || !pgAvailable) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            message: '⚠️ Neon Database não disponível - usando sistema mock',
            mode: 'mock',
            mock_users: mockDatabase.users.length,
            mock_departments: mockDatabase.departments.length,
            debug_info: {
              pool_exists: !!pool,
              pg_available: pgAvailable,
              env_database_url: !!process.env.DATABASE_URL
            },
            timestamp: new Date().toISOString()
          })
        };
      }

      try {
        console.log('🔗 Testando conexão com Neon Database...');
        
        const client = await pool.connect();
        console.log('✅ Conexão Neon estabelecida!');
        
        // Testar query simples
        const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
        
        // Verificar tabela usuarios
        const tableCheck = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'usuarios'
          );
        `);
        
        let userCount = 0;
        if (tableCheck.rows[0].exists) {
          const userCountResult = await client.query('SELECT COUNT(*) as count FROM usuarios');
          userCount = parseInt(userCountResult.rows[0].count);
        }
        
        client.release();
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            message: '🎉 Neon Database conectado e funcionando!',
            connection_info: {
              connected: true,
              current_time: result.rows[0].current_time,
              postgres_version: result.rows[0].postgres_version,
              table_usuarios_exists: tableCheck.rows[0].exists,
              user_count: userCount
            },
            mode: 'neon_database',
            debug_info: {
              env_database_url: !!process.env.DATABASE_URL,
              connection_string_used: process.env.DATABASE_URL ? 'ENV variable' : 'Hardcoded'
            },
            timestamp: new Date().toISOString()
          })
        };
        
      } catch (error) {
        console.error('❌ Erro Neon:', error);
        
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            success: false,
            error: error.message,
            message: 'Erro ao conectar com Neon - usando fallback mock',
            mode: 'mock_fallback',
            error_details: {
              code: error.code,
              detail: error.detail,
              stack: error.stack
            },
            timestamp: new Date().toISOString()
          })
        };
      }
    }

    // Rota para inicialização/setup do sistema
    if (path.includes('setup') || path.includes('database/setup')) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          message: 'Sistema inicializado com sucesso',
          users_created: mockDatabase.users.length,
          departments_created: mockDatabase.departments.length,
          database_type: 'Mock Professional System',
          timestamp: new Date().toISOString()
        })
      };
    }

    // REGISTRO DE NOVOS USUÁRIOS
    if (path.includes('/register')) {
      if (httpMethod === 'POST') {
        const body = JSON.parse(event.body || '{}');
        const { email, password, nome, telefone } = body;
        
        console.log('📝 Tentativa de registro:', { email, nome });
        
        // Verificar se email já existe
        const existingUser = mockDatabase.users.find(u => u.email === email);
        if (existingUser) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              message: 'Email já está sendo usado por outro usuário'
            })
          };
        }
        
        // Criar novo usuário
        const newUser = {
          id: mockDatabase.users.length + 1,
          nome: nome || 'Novo Usuário',
          email: email,
          telefone: telefone || '(11) 00000-0000',
          role: 'user',
          status: 'active',
          department_id: 1,
          department_name: 'Administração',
          created_at: new Date().toISOString(),
          password: password // Em produção real, seria hash
        };
        
        mockDatabase.users.push(newUser);
        
        // Retornar token para login automático
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            message: 'Usuário criado com sucesso!',
            token: 'token_' + Date.now() + '_' + newUser.id,
            refreshToken: 'refresh_' + Date.now() + '_' + newUser.id,
            user: {
              id: newUser.id,
              username: newUser.email,
              email: newUser.email,
              first_name: newUser.nome.split(' ')[0],
              last_name: newUser.nome.split(' ').slice(1).join(' '),
              name: newUser.nome,
              role: newUser.role,
              department: newUser.department_name,
              is_staff: false,
              is_superuser: false
            }
          })
        };
      }
      
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    // LOGIN TRADICIONAL - Nova implementação para usuário e senha
    if (path.includes('/auth') && !path.includes('google-auth')) {
      if (httpMethod === 'GET' && path.includes('/auth/me')) {
        // Endpoint para verificar usuário atual baseado no token
        const authHeader = event.headers.authorization || event.headers.Authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return {
            statusCode: 401,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Token de autorização requerido' })
          };
        }
        
        const token = authHeader.substring(7); // Remove 'Bearer '
        
        // Simular validação de token (extrair user_id do token)
        const tokenParts = token.split('_');
        if (tokenParts.length >= 3) {
          const userId = parseInt(tokenParts[2]);
          const user = mockDatabase.users.find(u => u.id === userId);
          
          if (user && user.status === 'active') {
            return {
              statusCode: 200,
              headers: corsHeaders,
              body: JSON.stringify({
                id: user.id,
                username: user.email,
                email: user.email,
                first_name: user.nome.split(' ')[0],
                last_name: user.nome.split(' ').slice(1).join(' '),
                name: user.nome,
                role: user.role,
                department: user.department_name,
                is_staff: ['admin', 'superadmin'].includes(user.role),
                is_superuser: user.role === 'superadmin'
              })
            };
          }
        }
        
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Token inválido' })
        };
      }
      
      if (httpMethod === 'POST') {
        const body = JSON.parse(event.body || '{}');
        const { username, password, action } = body;
        
        console.log('🔐 Tentativa de login:', { username, action });
        
        if (action === 'login') {
          // Credenciais fixas para produção + busca por email/username
          const validCredentials = [
            { username: 'admin', password: 'admin123', user_id: 1 },
            { username: 'admin@salafacil.com', password: 'admin123', user_id: 1 },
            { username: 'joao.silva@salafacil.com', password: 'user123', user_id: 2 },
            { username: 'maria.costa@salafacil.com', password: 'manager123', user_id: 3 }
          ];
          
          // Verificar credenciais
          const credential = validCredentials.find(c => 
            c.username === username && c.password === password
          );
          
          if (credential) {
            // Buscar usuário no mock database
            const user = mockDatabase.users.find(u => u.id === credential.user_id);
            
            if (user && user.status === 'active') {
              return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({
                  success: true,
                  message: 'Login realizado com sucesso!',
                  access: 'token_' + Date.now() + '_' + user.id,
                  refresh: 'refresh_' + Date.now() + '_' + user.id,
                  user: {
                    id: user.id,
                    username: user.email,
                    email: user.email,
                    first_name: user.nome.split(' ')[0],
                    last_name: user.nome.split(' ').slice(1).join(' '),
                    name: user.nome,
                    role: user.role,
                    department: user.department_name,
                    is_staff: ['admin', 'superadmin'].includes(user.role),
                    is_superuser: user.role === 'superadmin'
                  }
                })
              };
            }
          }
          
          // Credenciais inválidas
          return {
            statusCode: 401,
            headers: corsHeaders,
            body: JSON.stringify({
              success: false,
              detail: 'Credenciais inválidas. Tente: admin/admin123',
              non_field_errors: ['Username ou senha incorretos']
            })
          };
        }
        
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Ação não reconhecida' })
        };
      }
      
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    // Google Auth (mock implementation funcional)
    if (path.includes('google-auth')) {
      if (httpMethod === 'POST') {
        const body = JSON.parse(event.body || '{}');
        
        // Simular decodificação do token Google (mock)
        const mockGoogleUser = {
          email: 'admin@salafacil.com',
          name: 'Administrador Principal',
          picture: 'https://via.placeholder.com/150?text=Admin'
        };
        
        // Encontrar ou criar usuário baseado no email do Google
        let user = mockDatabase.users.find(u => u.email === mockGoogleUser.email);
        
        if (!user) {
          // Criar novo usuário se não existir
          user = {
            id: mockDatabase.users.length + 1,
            nome: mockGoogleUser.name,
            email: mockGoogleUser.email,
            telefone: '(11) 99999-0000',
            role: 'admin',
            status: 'active',
            department_id: 1,
            department_name: 'Administração',
            created_at: new Date().toISOString(),
            google_auth: true,
            picture: mockGoogleUser.picture
          };
          mockDatabase.users.push(user);
        }
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            success: true,
            message: 'Login com Google realizado com sucesso!',
            user: {
              id: user.id,
              name: user.nome,
              email: user.email,
              role: user.role,
              picture: user.picture || mockGoogleUser.picture,
              department: user.department_name
            },
            token: 'google_token_' + Date.now() + '_' + user.id,
            refreshToken: 'refresh_google_' + Date.now()
          })
        };
      }
      
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Método não permitido' })
      };
    }

    // Admin status check (mock implementation)
    if (path.includes('check-admin-status')) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          is_admin: true,
          has_super_admin: true,
          system_ready: true,
          user: {
            name: 'Sistema Admin',
            email: 'admin@salafacil.com',
            role: 'superadmin'
          }
        })
      };
    }

    // Rota padrão - informações da API
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        message: '🚀 SalaFacil API - Sistema Completo Funcionando!',
        version: '2.0.0',
        status: 'ONLINE',
        path: path,
        method: httpMethod,
        features: {
          users_management: true,
          departments_management: true,
          statistics: true,
          mock_auth: true,
          admin_panel: true
        },
        endpoints: {
          setup: '/api/database/setup',
          stats: '/api/admin/stats',
          users: '/api/admin/users',
          departments: '/api/admin/departments',
          auth: '/api/auth (POST: username, password, action=login)',
          register: '/api/register (POST: email, password, nome, telefone)',
          google_auth: '/api/google-auth',
          admin_check: '/api/check-admin-status',
          neon_test: '/api/test-neon (GET: testa conexão Neon DB)'
        },
        data_summary: {
          total_users: mockDatabase.users.length,
          total_departments: mockDatabase.departments.length,
          system_type: 'Mock Professional System'
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
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString(),
        debug_info: {
          path: event.path,
          method: event.httpMethod
        }
      })
    };
  }
};
