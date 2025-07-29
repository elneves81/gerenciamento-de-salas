exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod === 'GET') {
      // Mock data for testing
      const mockSalas = [
        {
          id: 1,
          nome: 'Sala de Reunião A',
          capacidade: 10,
          recursos: ['Projetor', 'Wi-Fi', 'Quadro']
        },
        {
          id: 2,
          nome: 'Sala de Reunião B',
          capacidade: 6,
          recursos: ['TV', 'Wi-Fi', 'Mesa Redonda']
        },
        {
          id: 3,
          nome: 'Auditório',
          capacidade: 50,
          recursos: ['Projetor', 'Microfone', 'Wi-Fi']
        }
      ];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(mockSalas)
      };
    }

    if (event.httpMethod === 'POST') {
      const { nome, capacidade, recursos } = JSON.parse(event.body);
      const novaSala = {
        id: Date.now(),
        nome,
        capacidade,
        recursos
      };

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(novaSala)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    console.error('Erro na função salas:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
};
