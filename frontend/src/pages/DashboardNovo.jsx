import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Calendar, 
  Users, 
  Clock, 
  Plus,
  TrendingUp,
  MapPin,
  Settings,
  Bell,
  Search,
  Filter,
  ChevronRight,
  CalendarDays,
  Timer,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Activity,
  BarChart3,
  Zap
} from 'lucide-react';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    minhasReservas: 0,
    totalSalas: 0,
    salasOcupadas: 0,
    salasDisponiveis: 0
  });
  const [reservasProximas, setReservasProximas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Usar o endpoint dedicado do dashboard
      const response = await api.get('/reservas/dashboard/');
      const dashboardData = response.data;

      setStats({
        minhasReservas: dashboardData.minhas_reservas_hoje,
        totalSalas: dashboardData.total_salas,
        salasOcupadas: dashboardData.salas_ocupadas_agora,
        salasDisponiveis: dashboardData.salas_disponiveis_agora
      });
      
      // Processar próximas reservas
      const proximasReservas = dashboardData.proximas_reservas.map(reserva => {
        const dataInicio = new Date(reserva.data_inicio);
        const dataFim = new Date(reserva.data_fim);
        const hoje = new Date();
        const amanha = new Date(hoje);
        amanha.setDate(hoje.getDate() + 1);

        let dataTexto = 'Hoje';
        if (dataInicio.toDateString() === amanha.toDateString()) {
          dataTexto = 'Amanhã';
        } else if (dataInicio.toDateString() !== hoje.toDateString()) {
          dataTexto = dataInicio.toLocaleDateString('pt-BR');
        }

        return {
          id: reserva.id,
          titulo: reserva.titulo,
          sala: reserva.sala_nome || `Sala ${reserva.sala}`,
          horario: `${dataInicio.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})} - ${dataFim.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}`,
          data: dataTexto,
          status: reserva.status === 'agendada' ? 'confirmada' : reserva.status
        };
      });

      setReservasProximas(proximasReservas);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Dados de demonstração em caso de erro da API
      setStats({
        minhasReservas: 3,
        totalSalas: 12,
        salasOcupadas: 4,
        salasDisponiveis: 8
      });
      
      // Dados de exemplo para demonstração
      setReservasProximas([
        {
          id: 1,
          titulo: 'Reunião de Equipe',
          sala: 'Sala de Conferência A',
          horario: '14:00 - 15:30',
          data: 'Hoje',
          status: 'confirmada'
        },
        {
          id: 2,
          titulo: 'Apresentação do Projeto',
          sala: 'Auditório Principal',
          horario: '09:00 - 11:00',
          data: 'Amanhã',
          status: 'confirmada'
        }
      ]);
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue", trend, gradient = false }) => (
    <div className={`${gradient ? 'bg-gradient-to-br from-white to-gray-50' : 'bg-white'} rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:scale-105 transition-all duration-300 group`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 ${
              color === 'blue' ? 'bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200' :
              color === 'green' ? 'bg-gradient-to-br from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-200' :
              color === 'orange' ? 'bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200' :
              color === 'purple' ? 'bg-gradient-to-br from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200' : 'bg-gradient-to-br from-blue-50 to-blue-100'
            }`}>
              <Icon className={`h-6 w-6 ${
                color === 'blue' ? 'text-blue-600' :
                color === 'green' ? 'text-green-600' :
                color === 'orange' ? 'text-orange-600' :
                color === 'purple' ? 'text-purple-600' : 'text-blue-600'
              }`} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-3xl font-bold text-gray-900 transition-all duration-300 group-hover:text-4xl">{value}</p>
              {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
        {trend && (
          <div className="flex items-center space-x-1 text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );

  const ReservaCard = ({ reserva }) => (
    <div className="bg-gradient-to-r from-white to-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md hover:border-blue-300 transition-all duration-300 cursor-pointer group">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg transition-all duration-300 group-hover:scale-110 ${
              reserva.status === 'confirmada' ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-yellow-100 to-yellow-200'
            }`}>
              {reserva.status === 'confirmada' ? 
                <CheckCircle2 className={`h-4 w-4 text-green-600`} /> :
                <AlertCircle className={`h-4 w-4 text-yellow-600`} />
              }
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{reserva.titulo}</h4>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center space-x-1 text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs">{reserva.sala}</span>
                </div>
                <div className="flex items-center space-x-1 text-gray-500">
                  <Timer className="h-3 w-3" />
                  <span className="text-xs">{reserva.horario}</span>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 transition-all duration-300 ${
                reserva.data === 'Hoje' ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 group-hover:from-blue-200 group-hover:to-blue-300' : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800'
              }`}>
                {reserva.data}
              </span>
            </div>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-r-purple-400 animate-spin mx-auto" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <p className="mt-6 text-gray-600 font-medium">Carregando dashboard...</p>
          <div className="mt-2 flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header integrado com gradiente */}
      <div className="bg-gradient-to-r from-white via-blue-50 to-purple-50 border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">Sistema de Agendamento</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar salas, reservas..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white/80 backdrop-blur-sm"
                />
              </div>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-all duration-200">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white/50 transition-all duration-200">
                <Settings className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Olá, {user?.first_name || user?.username || 'Usuário'}</p>
                  <p className="text-xs text-gray-500">Administrador</p>
                </div>
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shadow-lg">
                  {(user?.first_name || user?.username || 'U')[0].toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section com gradiente */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Bem-vindo de volta! 👋
              </h2>
              <p className="text-blue-100 text-lg">
                Aqui está um resumo das suas atividades e do sistema hoje.
              </p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-blue-100">
                <div className="flex items-center space-x-1">
                  <Activity className="h-4 w-4" />
                  <span>Sistema Online</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>Atualizado agora</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                <BarChart3 className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid com animações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            title="Minhas Reservas"
            value={stats.minhasReservas}
            subtitle="ativas hoje"
            color="blue"
            gradient={true}
          />
          <StatCard
            icon={Building2}
            title="Total de Salas"
            value={stats.totalSalas}
            subtitle="no sistema"
            color="green"
            gradient={true}
          />
          <StatCard
            icon={Users}
            title="Salas Ocupadas"
            value={stats.salasOcupadas}
            subtitle="em uso agora"
            color="orange"
            gradient={true}
          />
          <StatCard
            icon={Clock}
            title="Salas Disponíveis"
            value={stats.salasDisponiveis}
            subtitle="livres agora"
            color="purple"
            gradient={true}
          />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Próximas Reservas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Próximas Reservas</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                      <Filter className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => navigate('/nova-reserva')}
                      className="inline-flex items-center px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Nova Reserva
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {reservasProximas.length > 0 ? (
                  <div className="space-y-4">
                    {reservasProximas.map((reserva) => (
                      <ReservaCard key={reserva.id} reserva={reserva} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma reserva próxima</h3>
                    <p className="text-gray-500 mb-6">Você não tem reservas agendadas no momento</p>
                    <button 
                      onClick={() => navigate('/nova-reserva')}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Nova Reserva
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Ações Rápidas</h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/nova-reserva')}
                    className="w-full flex items-center space-x-3 p-4 text-left rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200"
                  >
                    <Plus className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Nova Reserva</span>
                  </button>
                  <button 
                    onClick={() => navigate('/salas')}
                    className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Building2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Gerenciar Salas</span>
                  </button>
                  <button 
                    onClick={() => navigate('/reservas')}
                    className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Ver Todas as Reservas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Status do Sistema */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Status do Sistema</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Sistema</span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ● Online
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Última atualização</span>
                    <span className="text-xs text-gray-500">Agora mesmo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total de usuários</span>
                    <span className="text-sm font-medium text-gray-900">Ativo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
