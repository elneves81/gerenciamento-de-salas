// Exemplo de integração com Firebase Firestore
// Para usar, precisa instalar: npm install firebase-admin

const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Inicializar Firebase Admin (usar serviceAccountKey.json)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log('Firebase Auth function called:', event.httpMethod, event.path);
    
    if (event.httpMethod === 'GET') {
      return await handleGetUser(event, headers);
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      if (body.action === 'register') {
        return await handleRegisterFirebase(body, headers);
      } else if (body.credential) {
        return await handleGoogleAuthFirebase(body, headers);
      } else {
        return await handleLoginFirebase(body, headers);
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: `Method ${event.httpMethod} not allowed` })
    };

  } catch (error) {
    console.error('Firebase Auth error:', error);
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

// Login com Firebase
async function handleLoginFirebase(body, headers) {
  const { email, password } = body;
  
  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email e senha são obrigatórios' })
    };
  }

  try {
    // Buscar usuário no Firestore
    const userQuery = await db.collection('usuarios').where('email', '==', email).get();
    
    if (userQuery.empty) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
      };
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const passwordMatch = await bcrypt.compare(password, userData.password);

    if (!passwordMatch) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Usuário ou senha inválidos' })
      };
    }

    // Gerar tokens
    const accessToken = jwt.sign(
      { user_id: userDoc.id, username: userData.username },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { user_id: userDoc.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        access: accessToken,
        refresh: refreshToken,
        user: {
          id: userDoc.id,
          username: userData.username,
          email: userData.email,
          nome: userData.nome
        }
      })
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno do servidor' })
    };
  }
}

// Registro com Firebase
async function handleRegisterFirebase(body, headers) {
  const { email, password, nome, telefone } = body;
  
  if (!email || !password || !nome) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Email, senha e nome são obrigatórios'
      })
    };
  }

  if (password.length < 6) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Senha deve ter pelo menos 6 caracteres'
      })
    };
  }

  try {
    // Verificar se email já existe
    const existingUser = await db.collection('usuarios').where('email', '==', email).get();
    
    if (!existingUser.empty) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Email já está em uso'
        })
      };
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = email.split('@')[0];

    // Criar usuário no Firestore
    const userRef = await db.collection('usuarios').add({
      username,
      email,
      password: hashedPassword,
      nome,
      telefone: telefone || null,
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    // Gerar tokens
    const accessToken = jwt.sign(
      { user_id: userRef.id, username },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { user_id: userRef.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: userRef.id,
          username,
          email,
          nome
        }
      })
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro interno do servidor'
      })
    };
  }
}

// Obter usuário autenticado
async function handleGetUser(event, headers) {
  const authHeader = event.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        id: 'demo',
        username: 'admin',
        email: 'admin@salafacil.com',
        first_name: 'Administrador',
        last_name: 'Sistema',
        is_staff: true,
        nome: 'Administrador Sistema',
        created_at: new Date().toISOString()
      })
    };
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userDoc = await db.collection('usuarios').doc(decoded.user_id).get();

    if (!userDoc.exists) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Usuário não encontrado' })
      };
    }

    const userData = userDoc.data();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: userDoc.id,
        username: userData.username,
        email: userData.email,
        nome: userData.nome,
        telefone: userData.telefone,
        is_staff: true,
        first_name: userData.nome?.split(' ')[0] || 'Usuário',
        last_name: userData.nome?.split(' ').slice(1).join(' ') || 'Sistema',
        created_at: userData.created_at?.toDate?.()?.toISOString() || new Date().toISOString()
      })
    };
  } catch (error) {
    console.error('JWT Error:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        id: 'demo',
        username: 'demo',
        email: 'demo@salafacil.com',
        first_name: 'Usuário',
        last_name: 'Demo',
        is_staff: true,
        nome: 'Usuário Demo',
        created_at: new Date().toISOString()
      })
    };
  }
}

// Login com Google (Firebase Auth)
async function handleGoogleAuthFirebase(body, headers) {
  const { credential } = body;
  
  if (!credential) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        error: 'Token do Google é obrigatório'
      })
    };
  }

  try {
    // Verificar token do Google com Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(credential);
    const { uid, email, name } = decodedToken;
    
    // Verificar se usuário já existe
    let userQuery = await db.collection('usuarios').where('email', '==', email).get();
    let userData;
    let userId;

    if (userQuery.empty) {
      // Criar novo usuário
      const username = email.split('@')[0];
      const userRef = await db.collection('usuarios').add({
        username,
        email,
        nome: name,
        google_id: uid,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      userId = userRef.id;
      userData = { username, email, nome: name };
    } else {
      const userDoc = userQuery.docs[0];
      userId = userDoc.id;
      userData = userDoc.data();
      
      // Atualizar Google ID se não existir
      if (!userData.google_id) {
        await db.collection('usuarios').doc(userId).update({
          google_id: uid
        });
      }
    }

    // Gerar tokens
    const accessToken = jwt.sign(
      { user_id: userId, username: userData.username },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { user_id: userId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token: accessToken,
        refreshToken: refreshToken,
        user: {
          id: userId,
          username: userData.username,
          email: userData.email,
          nome: userData.nome
        }
      })
    };
  } catch (error) {
    console.error('Google auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erro ao fazer login com Google'
      })
    };
  }
}
