exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request (CORS preflight)
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
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Debug: log do body recebido
    console.log('Body recebido:', event.body);
    
    const bodyData = JSON.parse(event.body || '{}');
    console.log('Body parseado:', bodyData);
    
    // Aceitar tanto 'token' quanto 'credential' (Google retorna credential)
    const token = bodyData.token || bodyData.credential || bodyData.id_token;
    
    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Token Google é obrigatório',
          received: bodyData,
          debug: 'Campos esperados: token, credential ou id_token'
        })
      };
    }

    // Verificar token do Google
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    const googleData = await response.json();
    
    if (googleData.error) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Token Google inválido' })
      };
    }

    // Por enquanto, simular usuário logado sem banco
    const userData = {
      id: googleData.sub,
      email: googleData.email,
      name: googleData.name,
      picture: googleData.picture,
      role: 'user' // Simulando role padrão
    };

    // Simular JWT token
    const jwtToken = 'mock-jwt-token-' + Date.now();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token: jwtToken,
        user: userData,
        message: 'Login realizado com sucesso'
      })
    };

  } catch (error) {
    console.error('Erro no login Google:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      })
    };
  }
};
