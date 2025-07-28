// Teste das Netlify Functions - SalaFácil
// Execute no console do navegador depois do deploy

const API_BASE = '/.netlify/functions';

// Teste 1: Login
async function testeLogin() {
  try {
    const response = await fetch(`${API_BASE}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'login',
        username: 'admin',
        password: 'admin123'
      })
    });

    const data = await response.json();
    console.log('✅ Login:', data);
    
    if (data.access) {
      localStorage.setItem('token', JSON.stringify(data.access));
      return data.access;
    }
  } catch (error) {
    console.error('❌ Erro no login:', error);
  }
}

// Teste 2: Listar Salas
async function testeSalas() {
  try {
    const response = await fetch(`${API_BASE}/salas`);
    const data = await response.json();
    console.log('✅ Salas:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao listar salas:', error);
  }
}

// Teste 3: Listar Agendamentos
async function testeAgendamentos() {
  try {
    const response = await fetch(`${API_BASE}/agendamentos`);
    const data = await response.json();
    console.log('✅ Agendamentos:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao listar agendamentos:', error);
  }
}

// Teste 4: Criar Agendamento
async function testeNovoAgendamento(token) {
  try {
    const response = await fetch(`${API_BASE}/agendamentos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        titulo: 'Teste da API',
        descricao: 'Agendamento criado via teste',
        data_inicio: new Date(Date.now() + 3600000).toISOString(), // +1 hora
        data_fim: new Date(Date.now() + 7200000).toISOString(), // +2 horas
        sala_id: 1,
        usuario_id: 1
      })
    });

    const data = await response.json();
    console.log('✅ Novo agendamento:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
  }
}

// Executar todos os testes
async function executarTestes() {
  console.log('🚀 Iniciando testes das Functions...\n');
  
  // 1. Login
  console.log('1️⃣ Testando login...');
  const token = await testeLogin();
  
  // 2. Salas
  console.log('\n2️⃣ Testando listagem de salas...');
  await testeSalas();
  
  // 3. Agendamentos
  console.log('\n3️⃣ Testando listagem de agendamentos...');
  await testeAgendamentos();
  
  // 4. Criar agendamento (se tiver token)
  if (token) {
    console.log('\n4️⃣ Testando criação de agendamento...');
    await testeNovoAgendamento(token);
  }
  
  console.log('\n✅ Testes concluídos!');
}

// Para executar, digite no console:
// executarTestes()

console.log('📝 Para testar as functions, execute: executarTestes()');
