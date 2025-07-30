import { useEffect, useCallback } from 'react';
import api from '../services/api';

export const useReunioesAutoUpdate = (reservas, onReservaUpdate) => {
  const verificarReunioesTerminadas = useCallback(async () => {
    const agora = new Date();
    
    for (const reserva of reservas) {
      if (reserva.status === 'em_andamento' && reserva.data_fim && reserva.hora_fim) {
        // Construir data/hora de fim da reunião
        const dataFim = new Date(reserva.data_fim + 'T' + reserva.hora_fim);
        
        // Se a reunião já terminou
        if (agora > dataFim) {
          try {
            // Atualizar status para 'concluida'
            const response = await api.put(`/reservas/${reserva.id}/`, {
              ...reserva,
              status: 'concluida'
            });
            
            console.log(`Reunião ${reserva.id} marcada como concluída automaticamente`);
            
            // Notificar sobre a atualização
            if (onReservaUpdate) {
              onReservaUpdate(response.data);
            }
          } catch (error) {
            console.error(`Erro ao atualizar status da reserva ${reserva.id}:`, error);
          }
        }
      }
      
      // Verificar se é hora de iniciar uma reunião agendada
      if (reserva.status === 'agendada' && reserva.data_inicio && reserva.hora_inicio) {
        const dataInicio = new Date(reserva.data_inicio + 'T' + reserva.hora_inicio);
        const tolerancia = 5 * 60 * 1000; // 5 minutos de tolerância
        
        // Se está na hora de começar (com tolerância)
        if (agora >= (dataInicio.getTime() - tolerancia) && agora <= dataInicio.getTime() + tolerancia) {
          try {
            // Atualizar status para 'em_andamento'
            const response = await api.put(`/reservas/${reserva.id}/`, {
              ...reserva,
              status: 'em_andamento'
            });
            
            console.log(`Reunião ${reserva.id} iniciada automaticamente`);
            
            if (onReservaUpdate) {
              onReservaUpdate(response.data);
            }
          } catch (error) {
            console.error(`Erro ao iniciar reunião ${reserva.id}:`, error);
          }
        }
      }
    }
  }, [reservas, onReservaUpdate]);

  useEffect(() => {
    // Verificar a cada minuto
    const interval = setInterval(verificarReunioesTerminadas, 60000);
    
    // Verificar imediatamente
    verificarReunioesTerminadas();
    
    return () => clearInterval(interval);
  }, [verificarReunioesTerminadas]);

  return { verificarReunioesTerminadas };
};

export default useReunioesAutoUpdate;
