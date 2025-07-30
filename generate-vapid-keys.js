// Script para gerar chaves VAPID para push notifications
const crypto = require('crypto');

function generateVAPIDKeys() {
  // Gerar par de chaves EC P-256
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });

  // Converter chave pública para o formato correto (extrair apenas os 65 bytes da chave)
  // Remove o header ASN.1 e pega apenas os 65 bytes da chave EC
  const publicKeyRaw = publicKey.slice(-65);
  const publicKeyBase64url = publicKeyRaw.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  // Converter chave privada para base64url
  const privateKeyBase64url = privateKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    publicKey: publicKeyBase64url,
    privateKey: privateKeyBase64url
  };
}

// Gerar as chaves
const vapidKeys = generateVAPIDKeys();

console.log('🔑 CHAVES VAPID GERADAS:');
console.log('');
console.log('📋 COPIE ESTAS CHAVES PARA O NETLIFY:');
console.log('=====================================');
console.log('');
console.log('VAPID_PUBLIC_KEY =', vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY =', vapidKeys.privateKey);
console.log('VAPID_EMAIL = admin@salafacil.com');
console.log('');
console.log('📋 PARA O FRONTEND (.env):');
console.log('==========================');
console.log('');
console.log('VITE_VAPID_PUBLIC_KEY =', vapidKeys.publicKey);
console.log('');
console.log('✅ Adicione essas variáveis no Netlify Dashboard:');
console.log('   Site Settings > Environment Variables');
console.log('');
console.log('⚠️  IMPORTANTE: No Netlify, altere a variável:');
console.log('   REACT_APP_VAPID_PUBLIC_KEY → remover');
console.log('   VITE_VAPID_PUBLIC_KEY → adicionar');
console.log('');
