const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const client = await pool.connect();

  try {
    let results = [];

    // 1. Criar uma notificação de teste para deletar
    results.push('🧪 Criando notificação de teste para deletar...');
    const createResult = await client.query(`
      INSERT INTO notifications (user_id, title, message, type, read)
      VALUES (1, '🗑️ Teste de Deleção', 'Esta notificação será deletada para testar a funcionalidade.', 'test', false)
      RETURNING id, title
    `);
    
    const testNotificationId = createResult.rows[0].id;
    results.push(`✅ Notificação de teste criada com ID: ${testNotificationId}`);

    // 2. Verificar se a notificação existe
    const checkBefore = await client.query(`
      SELECT COUNT(*) FROM notifications WHERE id = $1
    `, [testNotificationId]);
    results.push(`📊 Notificação existe antes da deleção: ${checkBefore.rows[0].count === '1' ? 'Sim' : 'Não'}`);

    // 3. Testar DELETE via SQL direto
    const deleteResult = await client.query(`
      DELETE FROM notifications 
      WHERE id = $1
      RETURNING id, title
    `, [testNotificationId]);

    if (deleteResult.rows.length > 0) {
      results.push(`✅ DELETE funcionou! Notificação ${deleteResult.rows[0].id} removida`);
    } else {
      results.push('❌ DELETE não funcionou - nenhuma linha afetada');
    }

    // 4. Verificar se a notificação foi realmente deletada
    const checkAfter = await client.query(`
      SELECT COUNT(*) FROM notifications WHERE id = $1
    `, [testNotificationId]);
    results.push(`📊 Notificação existe após deleção: ${checkAfter.rows[0].count === '1' ? 'Sim' : 'Não'}`);

    // 5. Contar total de notificações
    const totalCount = await client.query('SELECT COUNT(*) FROM notifications');
    results.push(`📈 Total de notificações no banco: ${totalCount.rows[0].count}`);

    // 6. Criar uma nova notificação de teste para testar via API
    results.push('🔗 Criando nova notificação para testar via endpoint API...');
    const newTestResult = await client.query(`
      INSERT INTO notifications (user_id, title, message, type, read)
      VALUES (1, '🌐 Teste DELETE via API', 'Use DELETE /.netlify/functions/notifications/{id}/ para deletar esta notificação.', 'info', false)
      RETURNING id, title
    `);
    
    const apiTestId = newTestResult.rows[0].id;
    results.push(`✅ Nova notificação criada para teste API: ID ${apiTestId}`);
    results.push(`🔗 Para testar: DELETE /.netlify/functions/notifications/${apiTestId}/`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Teste de DELETE concluído!',
        test_notification_deleted: testNotificationId,
        api_test_notification_created: apiTestId,
        results: results,
        instructions: [
          `1. Teste via DevTools: DELETE /.netlify/functions/notifications/${apiTestId}/`,
          '2. Ou use o botão de deletar no frontend',
          '3. Verifique se a notificação desaparece da lista'
        ]
      })
    };

  } catch (error) {
    console.error('Erro no teste de DELETE:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro no teste de DELETE',
        details: error.message
      })
    };
  } finally {
    client.release();
  }
};
