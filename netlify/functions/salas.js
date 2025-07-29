exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      {id: 1, nome: 'Sala A', capacidade: 10, disponivel: true},
      {id: 2, nome: 'Sala B', capacidade: 6, disponivel: true}
    ])
  };
};
