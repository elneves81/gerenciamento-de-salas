// Redirect para admin-api - API Google Auth
// Proxy específico para chamadas via /api/

const { handler: adminHandler } = require('../admin-api');

exports.handler = async (event, context) => {
  console.log('🔄 API Google Auth Proxy - Redirecionando para admin-api');
  return await adminHandler(event, context);
};
