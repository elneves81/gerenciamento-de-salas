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
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          is_admin: false,
          needs_setup: true 
        })
      };
    }

    // Verificar com Django backend
    try {
      const checkResponse = await fetch(`${BACKEND_URL}/api/database/check-admin/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (checkResponse.ok) {
        const adminData = await checkResponse.json();
        console.log('✅ Status admin verificado:', adminData);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(adminData)
        };
      } else {
        console.warn('⚠️ Falha na verificação admin');
      }
    } catch (checkError) {
      console.warn('⚠️ Erro na verificação admin:', checkError.message);
    }

    // Fallback: verificar se é o super admin padrão
    const isSuperAdmin = email === 'superadmin@salafacil.com' || 
                        email === 'elber.neves@guarapuava.pr.gov.br';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        is_admin: isSuperAdmin,
        role: isSuperAdmin ? 'superadmin' : 'user',
        status: 'active',
        needs_setup: !isSuperAdmin
      })
    };

  } catch (error) {
    console.error('❌ Erro na verificação admin:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        is_admin: false,
        needs_setup: true,
        error: error.message
      })
    };
  }
};
