import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, X } from 'lucide-react';

const Reservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/agendamentos');
      const data = response.data;
      
      // Garantir que sempre temos um array
      if (Array.isArray(data)) {
        setReservas(data);
      } else if (data && Array.isArray(data.results)) {
        setReservas(data.results);
      } else if (data && typeof data === 'object') {
        setReservas(Object.values(data).filter(item => item && item.id));
      } else {
        setReservas([]);
      }
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
      setReservas([]); // Garantir array vazio em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (reservaId) => {
    if (window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
      try {
        await api.delete(`/agendamentos/${reservaId}`);
        loadReservas(); // Recarregar a lista
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        alert('Erro ao cancelar reserva. Tente novamente.');
      }
    }
  };

  const getStatusColor = (reserva) => {
    const agora = new Date();
    const inicio = new Date(reserva.data_inicio);
    const fim = new Date(reserva.data_fim);
    
    if (agora < inicio) {
      return 'bg-blue-100 text-blue-800'; // Agendada
    } else if (agora >= inicio && agora <= fim) {
      return 'bg-green-100 text-green-800'; // Em andamento
    } else {
      return 'bg-gray-100 text-gray-800'; // Concluída
    }
  };

  const getStatusText = (reserva) => {
    const agora = new Date();
    const inicio = new Date(reserva.data_inicio);
    const fim = new Date(reserva.data_fim);
    
    if (agora < inicio) {
      return 'Agendada';
    } else if (agora >= inicio && agora <= fim) {
      return 'Em Andamento';
    } else {
      return 'Concluída';
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Carregando reservas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
        <button
          onClick={loadReservas}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Atualizar
        </button>
      </div>

      {/* Lista de reservas */}
      <div className="space-y-4">
        {reservas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Nenhuma reserva encontrada</p>
            <p className="text-gray-400 text-sm mt-2">
              As reservas aparecerão aqui quando forem criadas
            </p>
          </div>
        ) : (
          reservas.map((reserva) => (
            <div key={reserva.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      {reserva.titulo || 'Reunião'}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reserva)}`}>
                      {getStatusText(reserva)}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDateTime(reserva.data_inicio).split(' ')[0]}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDateTime(reserva.data_inicio).split(' ')[1]} - {formatDateTime(reserva.data_fim).split(' ')[1]}
                    </div>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Sala:</strong> {reserva.sala_nome || `Sala ${reserva.sala_id}`}
                  </div>

                  {reserva.descricao && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Descrição:</strong> {reserva.descricao}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => cancelarReserva(reserva.id)}
                    className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reservas;
