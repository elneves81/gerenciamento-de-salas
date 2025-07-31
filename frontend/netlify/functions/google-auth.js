// Redirect para admin-api - Google Auth
// Simples proxy para admin-api.js

const { handler: adminHandler } = require('./admin-api');

exports.handler = async (event, context) => {
  console.log('🔄 Google Auth Proxy - Redirecionando para admin-api');
  return await adminHandler(event, context);
};