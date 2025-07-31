import api from './api';

// Serviço para gerenciamento de salas
class SalasService {
  // Listar todas as salas
  async listarSalas() {
    try {
      console.log('🔍 Buscando salas...');
      const response = await api.get('/salas');
      console.log('✅ Salas carregadas:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar salas:', error);
      throw error;
    }
  }

  // Criar nova sala
  async criarSala(dados) {
    try {
      console.log('➕ Criando sala:', dados);
      const response = await api.post('/salas', dados);
      console.log('✅ Sala criada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar sala:', error);
      throw error;
    }
  }

  // Atualizar sala
  async atualizarSala(id, dados) {
    try {
      console.log('✏️ Atualizando sala:', id, dados);
      // Incluir o ID nos dados para garantir que o backend receba
      const dadosComId = { ...dados, id };
      const response = await api.put(`/salas/${id}`, dadosComId);
      console.log('✅ Sala atualizada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar sala:', error);
      throw error;
    }
  }

  // Deletar sala
  async deletarSala(id) {
    try {
      console.log('🗑️ Deletando sala:', id);
      const response = await api.delete(`/salas/${id}`, {
        data: { id } // Enviar ID também no body como fallback
      });
      console.log('✅ Sala deletada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao deletar sala:', error);
      throw error;
    }
  }
}

export default new SalasService();
