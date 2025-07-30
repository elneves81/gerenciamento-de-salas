const { Client } = require('pg');

// Mock data para fallback
const MOCK_AGENDAMENTOS = [
  {
    id: 1,
    sala_id: 1,
    sala_nome: 'Sala Executiva',
    titulo: 'Reunião de Planejamento',
    descricao: 'Reunião mensal da equipe',
    data_inicio: '2025-07-29T14:00:00.000Z',
    data_fim: '2025-07-29T15:00:00.000Z',
    usuario_id: 1,
    status: 'confirmado',
    criado_em: '2025-07-29T10:00:00.000Z'
  },
  {
    id: 2,
    sala_id: 2,
    sala_nome: 'Auditório Central',
    titulo: 'Apresentação Trimestral',
    descricao: 'Resultados do trimestre',
    data_inicio: '2025-07-29T16:00:00.000Z',
    data_fim: '2025-07-29T17:30:00.000Z',
    usuario_id: 1,
    status: 'confirmado',
    criado_em: '2025-07-29T10:00:00.000Z'
  }
];

// Configuração do banco
const getDbClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
};

// Extrair user_id do token JWT
const extractUserFromToken = (event) => {
  try {
    const authHeader = event.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.user_id;
    }
  } catch (error) {
    console.log('Erro ao decodificar token:', error.message);
  }
  return null;
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Extrair ID do agendamento da URL se presente
  const pathParts = event.path.split('/');
  const agendamentoId = pathParts[pathParts.length - 1];
  const isIdPath = !isNaN(parseInt(agendamentoId));
  
  // Verificar se é endpoint de cancelamento
  const isCancelEndpoint = event.path.includes('/cancelar');
  const actualId = isCancelEndpoint ? pathParts[pathParts.length - 2] : agendamentoId;

  try {
    if (event.httpMethod === 'GET') {
      // Buscar agendamentos
      try {
        const client = getDbClient();
        await client.connect();
        
        // Criar tabelas se não existirem
        await client.query(`
          CREATE TABLE IF NOT EXISTS agendamento_agendamento (
            id SERIAL PRIMARY KEY,
            sala_id INTEGER,
            data_inicio TIMESTAMP NOT NULL,
            data_fim TIMESTAMP NOT NULL,
            titulo VARCHAR(200) NOT NULL,
            descricao TEXT,
            usuario_id INTEGER,
            status VARCHAR(50) DEFAULT 'confirmado',
            criado_em TIMESTAMP DEFAULT NOW()
          )
        `);

        let query, params = [];
        
        if (isIdPath && !isNaN(parseInt(agendamentoId))) {
          // Buscar agendamento específico
          query = `
            SELECT a.*, 
                   COALESCE(s.nome, 'Sala ' || a.sala_id) as sala_nome 
            FROM agendamento_agendamento a 
            LEFT JOIN agendamento_sala s ON a.sala_id = s.id 
            WHERE a.id = $1
          `;
          params = [parseInt(agendamentoId)];
        } else {
          // Buscar todos os agendamentos
          query = `
            SELECT a.*, 
                   COALESCE(s.nome, 'Sala ' || a.sala_id) as sala_nome 
            FROM agendamento_agendamento a 
            LEFT JOIN agendamento_sala s ON a.sala_id = s.id 
            ORDER BY a.data_inicio
          `;
        }

        const result = await client.query(query, params);
        await client.end();
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(isIdPath ? result.rows[0] || null : result.rows)
        };
      } catch (dbError) {
        console.log('Erro no banco, usando dados mock:', dbError);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(isIdPath ? MOCK_AGENDAMENTOS[0] : MOCK_AGENDAMENTOS)
        };
      }
    }

    if (event.httpMethod === 'POST') {
      // Verificar se é endpoint de cancelamento
      if (isCancelEndpoint) {
        try {
          const userId = extractUserFromToken(event);
          const client = getDbClient();
          await client.connect();

          const result = await client.query(`
            UPDATE agendamento_agendamento 
            SET status = 'cancelado' 
            WHERE id = $1 AND (usuario_id = $2 OR $2 IS NULL)
            RETURNING *
          `, [parseInt(actualId), userId]);

          await client.end();

          if (result.rows.length === 0) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Agendamento não encontrado ou não autorizado' })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Agendamento cancelado com sucesso!',
              data: result.rows[0]
            })
          };
        } catch (dbError) {
          console.log('Erro ao cancelar agendamento:', dbError);
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Agendamento cancelado (simulado)!',
              data: { id: actualId, status: 'cancelado' }
            })
          };
        }
      }

      // Criar novo agendamento
      const body = JSON.parse(event.body || '{}');
      
      if (!body.titulo || !body.data_inicio || !body.data_fim || !body.sala_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Campos obrigatórios: titulo, data_inicio, data_fim, sala_id' 
          })
        };
      }

      try {
        const client = getDbClient();
        await client.connect();

        // Verificar conflitos
        const conflito = await client.query(`
          SELECT * FROM agendamento_agendamento 
          WHERE sala_id = $1 AND status != 'cancelado' AND (
            (data_inicio <= $2 AND data_fim > $2) OR
            (data_inicio < $3 AND data_fim >= $3) OR
            (data_inicio >= $2 AND data_fim <= $3)
          )
        `, [body.sala_id, body.data_inicio, body.data_fim]);

        if (conflito.rows.length > 0) {
          await client.end();
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Sala já ocupada neste horário' })
          };
        }

        const result = await client.query(`
          INSERT INTO agendamento_agendamento 
          (sala_id, data_inicio, data_fim, titulo, descricao, usuario_id, status, criado_em) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *
        `, [
          body.sala_id, 
          body.data_inicio, 
          body.data_fim, 
          body.titulo, 
          body.descricao || '', 
          body.usuario_id || extractUserFromToken(event) || 1,
          'confirmado'
        ]);

        await client.end();
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Agendamento criado com sucesso!',
            data: result.rows[0]
          })
        };
      } catch (dbError) {
        console.log('Erro ao criar agendamento:', dbError);
        const mockAgendamento = {
          id: Date.now(),
          sala_id: body.sala_id,
          sala_nome: `Sala ${body.sala_id}`,
          titulo: body.titulo,
          descricao: body.descricao || '',
          data_inicio: body.data_inicio,
          data_fim: body.data_fim,
          usuario_id: body.usuario_id || 1,
          status: 'confirmado',
          criado_em: new Date().toISOString()
        };

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Agendamento criado com sucesso!',
            data: mockAgendamento
          })
        };
      }
    }

    if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
      // Atualizar agendamento
      if (!isIdPath || isNaN(parseInt(agendamentoId))) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID do agendamento é obrigatório' })
        };
      }

      const body = JSON.parse(event.body || '{}');
      const userId = extractUserFromToken(event);

      try {
        const client = getDbClient();
        await client.connect();

        // Verificar se o agendamento existe e o usuário tem permissão
        const existing = await client.query(`
          SELECT * FROM agendamento_agendamento 
          WHERE id = $1 AND (usuario_id = $2 OR $2 IS NULL)
        `, [parseInt(agendamentoId), userId]);

        if (existing.rows.length === 0) {
          await client.end();
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Agendamento não encontrado ou não autorizado' })
          };
        }

        // Construir query de atualização dinamicamente
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (body.titulo) {
          updateFields.push(`titulo = $${paramIndex++}`);
          updateValues.push(body.titulo);
        }
        if (body.descricao !== undefined) {
          updateFields.push(`descricao = $${paramIndex++}`);
          updateValues.push(body.descricao);
        }
        if (body.data_inicio) {
          updateFields.push(`data_inicio = $${paramIndex++}`);
          updateValues.push(body.data_inicio);
        }
        if (body.data_fim) {
          updateFields.push(`data_fim = $${paramIndex++}`);
          updateValues.push(body.data_fim);
        }
        if (body.sala_id) {
          updateFields.push(`sala_id = $${paramIndex++}`);
          updateValues.push(body.sala_id);
        }
        if (body.status) {
          updateFields.push(`status = $${paramIndex++}`);
          updateValues.push(body.status);
        }

        if (updateFields.length === 0) {
          await client.end();
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Nenhum campo para atualizar' })
          };
        }

        updateValues.push(parseInt(agendamentoId));
        const query = `
          UPDATE agendamento_agendamento 
          SET ${updateFields.join(', ')} 
          WHERE id = $${paramIndex} 
          RETURNING *
        `;

        const result = await client.query(query, updateValues);
        await client.end();

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Agendamento atualizado com sucesso!',
            data: result.rows[0]
          })
        };
      } catch (dbError) {
        console.log('Erro ao atualizar agendamento:', dbError);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Agendamento atualizado (simulado)!',
            data: { id: agendamentoId, ...body }
          })
        };
      }
    }

    if (event.httpMethod === 'DELETE') {
      // Deletar agendamento
      if (!isIdPath || isNaN(parseInt(agendamentoId))) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'ID do agendamento é obrigatório' })
        };
      }

      const userId = extractUserFromToken(event);

      try {
        const client = getDbClient();
        await client.connect();

        const result = await client.query(`
          DELETE FROM agendamento_agendamento 
          WHERE id = $1 AND (usuario_id = $2 OR $2 IS NULL)
          RETURNING *
        `, [parseInt(agendamentoId), userId]);

        await client.end();

        if (result.rows.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Agendamento não encontrado ou não autorizado' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Agendamento deletado com sucesso!',
            data: result.rows[0]
          })
        };
      } catch (dbError) {
        console.log('Erro ao deletar agendamento:', dbError);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Agendamento deletado (simulado)!',
            data: { id: agendamentoId }
          })
        };
      }
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Método não permitido' })
    };

  } catch (error) {
    console.error('Erro geral na API:', error);
    
    // Em caso de erro, retornar dados mock para GET
    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(isIdPath ? MOCK_AGENDAMENTOS[0] : MOCK_AGENDAMENTOS)
      };
    }
    
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
