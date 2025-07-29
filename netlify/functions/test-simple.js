exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      { id: 1, nome: 'Sala A', capacidade: 10 },
      { id: 2, nome: 'Sala B', capacidade: 15 }
    ])
  };
};
