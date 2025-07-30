import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Users, Building2, Clock, Plus } from 'lucide-react';
import ChatSystem from '../components/ChatSystem';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    minhas_reservas_hoje: 0,
    total_salas: 0,
    salas_ocupadas_agora: 0,
    salas_disponiveis_agora: 0,
    proximas_reservas: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/reservas/dashboard/');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <a
          href="/nova-reserva"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Reserva
        </a>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Minhas Reservas Hoje
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.minhas_reservas_hoje}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Building2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Salas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.total_salas}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Salas Ocupadas
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.salas_ocupadas_agora}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Salas Disponíveis
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {dashboardData.salas_disponiveis_agora}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Próximas reservas */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Próximas Reservas</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {(Array.isArray(dashboardData.proximas_reservas) ? dashboardData.proximas_reservas : []).length > 0 ? (
            (Array.isArray(dashboardData.proximas_reservas) ? dashboardData.proximas_reservas : []).map((reserva) => (
              <div key={reserva.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">
                      {reserva.titulo}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {reserva.sala_nome} - {' '}
                      {new Date(reserva.data_inicio).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    reserva.status === 'agendada' 
                      ? 'bg-blue-100 text-blue-800'
                      : reserva.status === 'em_andamento'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {reserva.status === 'agendada' ? 'Agendada' : 
                     reserva.status === 'em_andamento' ? 'Em Andamento' : 'Concluída'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-6 py-4 text-center text-gray-500">
              Nenhuma reserva próxima encontrada
            </div>
          )}
        </div>
      </div>
      
      {/* Sistema de Chat Global */}
      <ChatSystem />
    </div>
  );
};

export default Dashboard;
