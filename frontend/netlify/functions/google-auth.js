const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = '36056591466-9e4p0fv7kjld87cr1b1q0i7o2i94jjvd.apps.googleusercontent.com';
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
    const { token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Token não fornecido' })
      };
    }

    // Verificar token Google
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userData = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture
    };

    // Sincronizar com Django backend
    try {
      const syncResponse = await fetch(`${BACKEND_URL}/api/database/sync-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        console.log('✅ Usuário sincronizado com backend:', syncData);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            user: {
              ...userData,
              role: syncData.user?.role || 'user',
              status: syncData.user?.status || 'active'
            }
          })
        };
      } else {
        console.warn('⚠️ Falha na sincronização, continuando com dados do Google');
      }
    } catch (syncError) {
      console.warn('⚠️ Erro na sincronização com backend:', syncError.message);
    }

    // Retornar dados do Google mesmo se a sincronização falhar
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: {
          ...userData,
          role: 'user',
          status: 'active'
        }
      })
    };

  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
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
