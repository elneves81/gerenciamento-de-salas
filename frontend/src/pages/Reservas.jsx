import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, X, Users } from 'lucide-react';

const Reservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    minhas: false,
    sala: '',
    data_inicio: '',
    data_fim: ''
  });

  useEffect(() => {
    loadReservas();
  }, [filtros]);

  const loadReservas = async () => {
    try {
      const params = new URLSearchParams();
      if (filtros.minhas) params.append('minhas', 'true');
      if (filtros.sala) params.append('sala', filtros.sala);
      if (filtros.data_inicio) params.append('data_inicio', filtros.data_inicio);
      if (filtros.data_fim) params.append('data_fim', filtros.data_fim);

      const response = await api.get(`/reservas/?${params.toString()}`);
      setReservas(response.data);
    } catch (error) {
      console.error('Erro ao carregar reservas:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (reservaId) => {
    if (window.confirm('Tem certeza que deseja cancelar esta reserva?')) {
      try {
        await api.post(`/reservas/${reservaId}/cancelar/`);
        loadReservas();
      } catch (error) {
        console.error('Erro ao cancelar reserva:', error);
        alert('Erro ao cancelar reserva');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'agendada':
        return 'bg-blue-100 text-blue-800';
      case 'em_andamento':
        return 'bg-green-100 text-green-800';
      case 'concluida':
        return 'bg-gray-100 text-gray-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'agendada':
        return 'Agendada';
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluida':
        return 'Concluída';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filtros.minhas}
                onChange={(e) => setFiltros({...filtros, minhas: e.target.checked})}
                className="mr-2"
              />
              Apenas minhas reservas
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data início
            </label>
            <input
              type="date"
              value={filtros.data_inicio}
              onChange={(e) => setFiltros({...filtros, data_inicio: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data fim
            </label>
            <input
              type="date"
              value={filtros.data_fim}
              onChange={(e) => setFiltros({...filtros, data_fim: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFiltros({minhas: false, sala: '', data_inicio: '', data_fim: ''})}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Lista de reservas */}
      <div className="space-y-4">
        {reservas.map((reserva) => (
          <div key={reserva.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {reserva.titulo}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reserva.status)}`}>
                    {getStatusText(reserva.status)}
                  </span>
                </div>
                
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(reserva.data_inicio).toLocaleDateString('pt-BR')}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {new Date(reserva.data_inicio).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})} - {new Date(reserva.data_fim).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    {reserva.participantes} participantes
                  </div>
                </div>

                <div className="mt-2 text-sm text-gray-600">
                  <strong>Sala:</strong> {reserva.sala_nome}
                </div>

                {reserva.descricao && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Descrição:</strong> {reserva.descricao}
                  </div>
                )}
              </div>

              {reserva.status === 'agendada' && (
                <div className="ml-4">
                  <button
                    onClick={() => cancelarReserva(reserva.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-red-300 text-sm font-medium rounded text-red-700 bg-white hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {reservas.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma reserva encontrada</h3>
          <p className="mt-1 text-sm text-gray-500">
            Não há reservas com os filtros aplicados.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reservas;
