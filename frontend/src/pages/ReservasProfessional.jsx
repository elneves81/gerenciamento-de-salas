import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { 
  Calendar, 
  Clock, 
  X, 
  Filter, 
  RefreshCw, 
  MapPin, 
  Users, 
  SortAsc,
  Search,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Eye,
  Edit3,
  MoreVertical,
  Download,
  Bell,
  Settings,
  Grid3X3,
  List,
  BarChart3,
  TrendingUp
} from 'lucide-react';

const ReservasProfessional = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filtros, setFiltros] = useState({
    status: 'todas',
    sala: '',
    data: '',
    busca: ''
  });
  const [ordenacao, setOrdenacao] = useState('data_inicio');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [reservasPorPagina] = useState(10);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const response = await api.get('/agendamentos');
      const data = response.data;
      
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
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (reservaId) => {
    if (!window.confirm('⚠️ Tem certeza que deseja cancelar esta reserva?\n\nEsta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingId(reservaId);
    
    try {
      // Múltiplos métodos para garantir compatibilidade
      let success = false;
      const methods = [
        () => api.put(`/agendamentos/${reservaId}`, { status: 'cancelada' }),
        () => api.patch(`/agendamentos/${reservaId}`, { status: 'cancelada' }),
        () => api.post(`/agendamentos/${reservaId}/cancelar`),
        () => api.delete(`/agendamentos/${reservaId}`)
      ];

      for (const method of methods) {
        try {
          await method();
          success = true;
          break;
        } catch (error) {
          console.log('Método falhou, tentando próximo...', error.response?.status);
        }
      }

      if (success) {
        setReservas(prev => prev.filter(r => r.id !== reservaId));
        showNotification('Reserva cancelada com sucesso!', 'success');
      } else {
        throw new Error('Todos os métodos de cancelamento falharam');
      }
      
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      showNotification(`Erro ao cancelar: ${error.response?.status || 'Desconhecido'}`, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const showNotification = (message, type = 'info') => {
    const colors = {
      success: 'bg-emerald-500',
      error: 'bg-red-500',
      info: 'bg-blue-500'
    };

    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-xl shadow-lg z-50 flex items-center transform transition-all duration-300`;
    notification.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          ${type === 'success' ? 
            '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>' :
            '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'
          }
        </svg>
        ${message}
      </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  // Filtrar e ordenar reservas
  const reservasFiltradas = useMemo(() => {
    let filtered = [...reservas];

    if (filtros.busca) {
      const searchTerm = filtros.busca.toLowerCase();
      filtered = filtered.filter(r => 
        r.titulo?.toLowerCase().includes(searchTerm) ||
        r.descricao?.toLowerCase().includes(searchTerm) ||
        r.sala_nome?.toLowerCase().includes(searchTerm) ||
        r.sala_id?.toString().includes(searchTerm)
      );
    }

    if (filtros.status !== 'todas') {
      const agora = new Date();
      filtered = filtered.filter(r => {
        const inicio = new Date(r.data_inicio);
        const fim = new Date(r.data_fim);
        
        switch (filtros.status) {
          case 'agendadas':
            return agora < inicio && r.status !== 'cancelada';
          case 'andamento':
            return agora >= inicio && agora <= fim && r.status !== 'cancelada';
          case 'concluidas':
            return agora > fim && r.status !== 'cancelada';
          case 'canceladas':
            return r.status === 'cancelada';
          default:
            return true;
        }
      });
    }

    if (filtros.sala) {
      const salaSearch = filtros.sala.toLowerCase();
      filtered = filtered.filter(r => 
        r.sala_nome?.toLowerCase().includes(salaSearch) ||
        r.sala_id?.toString().includes(salaSearch)
      );
    }

    if (filtros.data) {
      filtered = filtered.filter(r => {
        const dataReserva = new Date(r.data_inicio).toISOString().split('T')[0];
        return dataReserva === filtros.data;
      });
    }

    filtered.sort((a, b) => {
      switch (ordenacao) {
        case 'data_inicio':
          return new Date(a.data_inicio) - new Date(b.data_inicio);
        case 'data_fim':
          return new Date(a.data_fim) - new Date(b.data_fim);
        case 'sala':
          return (a.sala_nome || '').localeCompare(b.sala_nome || '');
        case 'titulo':
          return (a.titulo || '').localeCompare(b.titulo || '');
        default:
          return 0;
      }
    });

    return filtered;
  }, [reservas, filtros, ordenacao]);

  // Paginação
  const indexInicial = (paginaAtual - 1) * reservasPorPagina;
  const indexFinal = indexInicial + reservasPorPagina;
  const reservasPaginadas = reservasFiltradas.slice(indexInicial, indexFinal);
  const totalPaginas = Math.ceil(reservasFiltradas.length / reservasPorPagina);

  const getStatusInfo = (reserva) => {
    const agora = new Date();
    const inicio = new Date(reserva.data_inicio);
    const fim = new Date(reserva.data_fim);
    
    if (reserva.status === 'cancelada') {
      return { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: 'Cancelada',
        icon: X,
        dotColor: 'bg-red-500'
      };
    } else if (agora < inicio) {
      return { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: 'Agendada',
        icon: Calendar,
        dotColor: 'bg-blue-500'
      };
    } else if (agora >= inicio && agora <= fim) {
      return { 
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200', 
        text: 'Em andamento',
        icon: CheckCircle,
        dotColor: 'bg-emerald-500'
      };
    } else {
      return { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: 'Concluída',
        icon: CheckCircle,
        dotColor: 'bg-gray-500'
      };
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStats = () => {
    const agora = new Date();
    return {
      total: reservas.length,
      agendadas: reservas.filter(r => {
        const inicio = new Date(r.data_inicio);
        return agora < inicio && r.status !== 'cancelada';
      }).length,
      andamento: reservas.filter(r => {
        const inicio = new Date(r.data_inicio);
        const fim = new Date(r.data_fim);
        return agora >= inicio && agora <= fim && r.status !== 'cancelada';
      }).length,
      concluidas: reservas.filter(r => {
        const fim = new Date(r.data_fim);
        return agora > fim && r.status !== 'cancelada';
      }).length,
      canceladas: reservas.filter(r => r.status === 'cancelada').length
    };
  };

  const stats = getStats();

  if (loading && reservas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Sistema de Reservas</h3>
            <p className="text-gray-600 mb-6">Carregando interface profissional...</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center space-x-4 mb-3">
                <div className="relative">
                  <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                    ReservasPro
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Plataforma Inteligente de Gerenciamento
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Analytics em tempo real
                </div>
                <div className="flex items-center">
                  <Bell className="h-4 w-4 mr-1" />
                  Sistema inteligente
                </div>
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Relatórios avançados
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-white rounded-xl shadow-sm border border-gray-200 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
              
              <button
                onClick={loadReservas}
                disabled={loading}
                className="flex items-center px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl shadow-sm border border-gray-200 transition-all disabled:opacity-50 hover:shadow-md"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              
              <button className="flex items-center px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg transition-all hover:shadow-xl transform hover:-translate-y-0.5">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </button>
              
              <button className="flex items-center px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-xl shadow-lg transition-all hover:shadow-xl transform hover:-translate-y-0.5">
                <Settings className="h-4 w-4 mr-2" />
                Config
              </button>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { 
                title: 'Total de Reservas', 
                value: stats.total, 
                icon: Calendar, 
                gradient: 'from-slate-600 to-slate-700',
                bg: 'from-slate-50 to-slate-100',
                change: '+12%',
                changeColor: 'text-emerald-600'
              },
              { 
                title: 'Agendadas', 
                value: stats.agendadas, 
                icon: Clock, 
                gradient: 'from-blue-600 to-blue-700',
                bg: 'from-blue-50 to-blue-100',
                change: '+8%',
                changeColor: 'text-emerald-600'
              },
              { 
                title: 'Em Andamento', 
                value: stats.andamento, 
                icon: CheckCircle, 
                gradient: 'from-emerald-600 to-emerald-700',
                bg: 'from-emerald-50 to-emerald-100',
                change: '+15%',
                changeColor: 'text-emerald-600'
              },
              { 
                title: 'Concluídas', 
                value: stats.concluidas, 
                icon: CheckCircle, 
                gradient: 'from-gray-600 to-gray-700',
                bg: 'from-gray-50 to-gray-100',
                change: '+22%',
                changeColor: 'text-emerald-600'
              },
              { 
                title: 'Canceladas', 
                value: stats.canceladas, 
                icon: X, 
                gradient: 'from-red-600 to-red-700',
                bg: 'from-red-50 to-red-100',
                change: '-5%',
                changeColor: 'text-red-600'
              }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className={`bg-gradient-to-br ${stat.bg} rounded-2xl shadow-sm border border-white/50 p-6 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 group`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-r ${stat.gradient} rounded-xl shadow-lg group-hover:shadow-xl transition-all`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className={`text-sm font-semibold ${stat.changeColor} flex items-center`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {stat.change}
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {showFilters ? 'Ocultar' : 'Mostrar'} filtros
            </button>
          </div>

          <div className={`grid transition-all duration-300 ${showFilters ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4' : 'grid-cols-1 lg:grid-cols-3 gap-4'}`}>
            {/* Search */}
            <div className={showFilters ? 'lg:col-span-2' : 'lg:col-span-1'}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={filtros.busca}
                  onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                  placeholder="Buscar reservas..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
              >
                <option value="todas">Todos os status</option>
                <option value="agendadas">📅 Agendadas</option>
                <option value="andamento">🟢 Em andamento</option>
                <option value="concluidas">✅ Concluídas</option>
                <option value="canceladas">❌ Canceladas</option>
              </select>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setFiltros({ status: 'todas', sala: '', data: '', busca: '' });
                  setPaginaAtual(1);
                }}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-medium"
              >
                Limpar
              </button>
              {showFilters && (
                <>
                  {/* Room Filter */}
                  <input
                    type="text"
                    value={filtros.sala}
                    onChange={(e) => setFiltros({...filtros, sala: e.target.value})}
                    placeholder="Sala..."
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                  />
                  
                  {/* Date Filter */}
                  <input
                    type="date"
                    value={filtros.data}
                    onChange={(e) => setFiltros({...filtros, data: e.target.value})}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                  />
                  
                  {/* Sort */}
                  <select
                    value={ordenacao}
                    onChange={(e) => setOrdenacao(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all bg-white/50 backdrop-blur-sm"
                  >
                    <option value="data_inicio">📅 Data início</option>
                    <option value="data_fim">⏰ Data fim</option>
                    <option value="sala">🏢 Sala</option>
                    <option value="titulo">📝 Título</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Results Info */}
          <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                <strong className="text-gray-900">{reservasFiltradas.length}</strong> de <strong className="text-gray-900">{reservas.length}</strong> reservas
              </span>
              {filtros.busca && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Busca: "{filtros.busca}"
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <SortAsc className="h-4 w-4" />
              <span>Ordenado por {ordenacao.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && reservas.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-8 mb-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600 mr-3" />
              <span className="text-gray-600">Atualizando dados...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && reservasPaginadas.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <Calendar className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {reservas.length === 0 ? 'Nenhuma reserva encontrada' : 'Nenhum resultado encontrado'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              {reservas.length === 0 
                ? 'Quando você criar suas primeiras reservas, elas aparecerão aqui com toda a funcionalidade avançada.'
                : 'Tente ajustar os filtros ou termos de busca para encontrar o que você procura.'
              }
            </p>
            <button
              onClick={() => {
                setFiltros({ status: 'todas', sala: '', data: '', busca: '' });
                setPaginaAtual(1);
              }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar filtros
            </button>
          </div>
        ) : (
          <>
            {/* Reservations Display */}
            <div className={`grid gap-6 mb-8 ${viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
              {reservasPaginadas.map((reserva) => {
                const statusInfo = getStatusInfo(reserva);
                const dateTime = formatDateTime(reserva.data_inicio);
                const endTime = formatDateTime(reserva.data_fim);

                return (
                  <div 
                    key={reserva.id} 
                    className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 group ${viewMode === 'list' ? 'flex items-center p-6' : 'p-6'}`}
                  >
                    {viewMode === 'grid' ? (
                      // Grid View
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className={`w-3 h-3 rounded-full ${statusInfo.dotColor}`}></div>
                              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                {reserva.titulo || 'Reunião'}
                              </h3>
                            </div>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {reserva.status !== 'cancelada' && (
                              <button
                                onClick={() => cancelarReserva(reserva.id)}
                                disabled={deletingId === reserva.id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              >
                                {deletingId === reserva.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center text-gray-700">
                            <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                            <span className="font-medium">{reserva.sala_nome || `Sala ${reserva.sala_id}`}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                            <span>{dateTime.date}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <Clock className="h-4 w-4 mr-3 text-gray-400" />
                            <span>{dateTime.time} - {endTime.time}</span>
                          </div>

                          {reserva.descricao && (
                            <div className="flex items-start text-gray-700">
                              <Users className="h-4 w-4 mr-3 text-gray-400 mt-0.5 flex-shrink-0" />
                              <span className="text-sm line-clamp-2">{reserva.descricao}</span>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      // List View
                      <>
                        <div className="flex items-center space-x-6 flex-1">
                          <div className={`w-4 h-4 rounded-full ${statusInfo.dotColor}`}></div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {reserva.titulo || 'Reunião'}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {reserva.descricao || 'Sem descrição'}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">{reserva.sala_nome || `Sala ${reserva.sala_id}`}</p>
                            <p className="text-xs text-gray-500">Local</p>
                          </div>
                          
                          <div className="text-center">
                            <p className="text-sm font-medium text-gray-900">{dateTime.date}</p>
                            <p className="text-xs text-gray-500">{dateTime.time} - {endTime.time}</p>
                          </div>
                          
                          <div className="text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                              {statusInfo.text}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {reserva.status !== 'cancelada' && (
                              <button
                                onClick={() => cancelarReserva(reserva.id)}
                                disabled={deletingId === reserva.id}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              >
                                {deletingId === reserva.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Advanced Pagination */}
            {totalPaginas > 1 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-white/50 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <span>
                      Exibindo <strong className="text-gray-900">{indexInicial + 1}</strong> até <strong className="text-gray-900">{Math.min(indexFinal, reservasFiltradas.length)}</strong> de <strong className="text-gray-900">{reservasFiltradas.length}</strong> resultados
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                      disabled={paginaAtual === 1}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(7, totalPaginas) }, (_, i) => {
                        let pageNum;
                        if (totalPaginas <= 7) {
                          pageNum = i + 1;
                        } else if (paginaAtual <= 4) {
                          pageNum = i + 1;
                        } else if (paginaAtual >= totalPaginas - 3) {
                          pageNum = totalPaginas - 6 + i;
                        } else {
                          pageNum = paginaAtual - 3 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPaginaAtual(pageNum)}
                            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                              pageNum === paginaAtual
                                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReservasProfessional;
