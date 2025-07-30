exports.handler = async function(event, context) {
  // Mock: sempre retorna sucesso
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: 'Super admin criado com sucesso (mock)!',
      user: {
        id: 999,
        nome: 'Super Admin',
        email: 'superadmin@salafacil.com',
        role: 'superadmin',
        status: 'active'
      }
    })
  };
};
