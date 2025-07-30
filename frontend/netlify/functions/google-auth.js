const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método não permitido' })
    };
  }

  try {
    const { token } = JSON.parse(event.body);

    if (!token) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Token não fornecido' })
      };
    }

    // Verificar token com Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, sub: google_id, picture } = payload;

    // Sincronizar com banco via API interna
    try {
      const syncResponse = await fetch(`${process.env.URL}/.netlify/functions/api/database/sync-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          id: google_id,
          picture
        })
      });

      if (syncResponse.ok) {
        const userData = await syncResponse.json();
        console.log('✅ Usuário sincronizado com banco:', userData);
      } else {
        console.log('⚠️ Falha na sincronização, usando dados do Google');
      }
    } catch (syncError) {
      console.log('⚠️ Erro na sincronização:', syncError.message);
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        user: {
          email,
          name,
          google_id,
          picture,
          verified: true
        }
      })
    };

  } catch (error) {
    console.error('Erro na autenticação Google:', error);
    
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Token inválido'
      })
    };
  }
};
