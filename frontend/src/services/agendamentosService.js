import api from './api';

// Serviço para gerenciamento de agendamentos
class AgendamentosService {
  // Listar todos os agendamentos
  async listarAgendamentos() {
    try {
      console.log('📅 Buscando agendamentos...');
      const response = await api.get('/agendamentos');
      console.log('✅ Agendamentos carregados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao listar agendamentos:', error);
      throw error;
    }
  }

  // Criar novo agendamento
  async criarAgendamento(dados) {
    try {
      console.log('📝 Criando agendamento:', dados);
      const response = await api.post('/agendamentos', dados);
      console.log('✅ Agendamento criado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      throw error;
    }
  }

  // Atualizar agendamento
  async atualizarAgendamento(id, dados) {
    try {
      console.log('✏️ Atualizando agendamento:', id, dados);
      // Incluir o ID nos dados para garantir que o backend receba
      const dadosComId = { ...dados, id };
      const response = await api.put(`/agendamentos/${id}`, dadosComId);
      console.log('✅ Agendamento atualizado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao atualizar agendamento:', error);
      throw error;
    }
  }

  // Cancelar agendamento
  async cancelarAgendamento(id) {
    try {
      console.log('❌ Cancelando agendamento:', id);
      const response = await api.delete(`/agendamentos/${id}`, {
        data: { id } // Enviar ID também no body como fallback
      });
      console.log('✅ Agendamento cancelado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao cancelar agendamento:', error);
      throw error;
    }
  }

  // Obter agendamentos por sala
  async obterAgendamentosPorSala(salaId) {
    try {
      console.log('🔍 Buscando agendamentos da sala:', salaId);
      const agendamentos = await this.listarAgendamentos();
      const agendamentosSala = agendamentos.filter(ag => ag.sala_id === salaId);
      console.log('✅ Agendamentos da sala carregados:', agendamentosSala);
      return agendamentosSala;
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos da sala:', error);
      throw error;
    }
  }

  // Verificar disponibilidade de sala
  async verificarDisponibilidade(salaId, dataInicio, dataFim) {
    try {
      const agendamentos = await this.obterAgendamentosPorSala(salaId);
      
      const inicio = new Date(dataInicio);
      const fim = new Date(dataFim);
      
      // Verificar conflitos
      const conflitos = agendamentos.filter(ag => {
        if (ag.status === 'cancelado') return false;
        
        const agInicio = new Date(ag.data_inicio);
        const agFim = new Date(ag.data_fim);
        
        return (
          (inicio >= agInicio && inicio < agFim) ||
          (fim > agInicio && fim <= agFim) ||
          (inicio <= agInicio && fim >= agFim)
        );
      });
      
      return conflitos.length === 0;
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade:', error);
      return false;
    }
  }
}

export default new AgendamentosService();
