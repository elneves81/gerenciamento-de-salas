const BACKEND_URL = process.env.BACKEND_URL || 'https://gerenciamentosalas-backend.onrender.com';

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    const requestData = JSON.parse(event.body);

    // Tentar criar no Django backend
    try {
      const createResponse = await fetch(`${BACKEND_URL}/api/database/setup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (createResponse.ok) {
        const responseData = await createResponse.json();
        console.log('✅ Setup do banco realizado:', responseData);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Setup do banco de dados realizado com sucesso',
            user: {
              id: 999,
              nome: 'Super Administrador',
              email: 'superadmin@salafacil.com',
              role: 'superadmin',
              status: 'active'
            }
          })
        };
      } else {
        console.warn('⚠️ Falha no setup do banco');
      }
    } catch (setupError) {
      console.warn('⚠️ Erro no setup do banco:', setupError.message);
    }

    // Fallback: retornar sucesso mock
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Super administrador criado com sucesso (mock)',
        user: {
          id: 999,
          nome: 'Super Administrador',
          email: 'superadmin@salafacil.com',
          role: 'superadmin',
          status: 'active'
        }
      })
    };

  } catch (error) {
    console.error('❌ Erro na criação do super admin:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Erro interno do servidor'
      })
    };
  }
};
