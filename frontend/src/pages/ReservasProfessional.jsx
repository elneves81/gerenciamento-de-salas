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
  TrendingUp,
  Building2,
  FileText,
  Activity
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
  const [reservasPorPagina] = useState(8);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'

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
      // Tentar diferentes métodos de cancelamento
      try {
        await api.put(`/agendamentos/${reservaId}`, { status: 'cancelada' });
      } catch (putError) {
        try {
          await api.patch(`/agendamentos/${reservaId}`, { status: 'cancelada' });
        } catch (patchError) {
          try {
            await api.delete(`/agendamentos/${reservaId}`);
          } catch (deleteError) {
            await api.post(`/agendamentos/${reservaId}/cancelar`);
          }
        }
      }
      
      // Remover da lista local
      setReservas(prev => prev.filter(r => r.id !== reservaId));
      
      // Feedback de sucesso
      showNotification('Reserva cancelada com sucesso!', 'success');
      
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      showNotification('Erro ao cancelar reserva. Tente novamente.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-red-500';
    const icon = type === 'success' ? 
      '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>' :
      '<svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>';
    
    notification.innerHTML = `
      <div class="fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center transform transition-all duration-300 translate-x-0">
        ${icon}
        ${message}
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.firstChild.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
  };

  const reservasFiltradas = useMemo(() => {
    let filtered = [...reservas];

    if (filtros.busca) {
      filtered = filtered.filter(r => 
        r.titulo?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        r.descricao?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        r.sala_nome?.toLowerCase().includes(filtros.busca.toLowerCase())
      );
    }

    if (filtros.status !== 'todas') {
      const agora = new Date();
      filtered = filtered.filter(r => {
        const inicio = new Date(r.data_inicio);
        const fim = new Date(r.data_fim);
        
        switch (filtros.status) {
          case 'agendadas':
            return agora < inicio;
          case 'andamento':
            return agora >= inicio && agora <= fim;
          case 'concluidas':
            return agora > fim;
          default:
            return true;
        }
      });
    }

    if (filtros.sala) {
      filtered = filtered.filter(r => 
        r.sala_nome?.toLowerCase().includes(filtros.sala.toLowerCase()) ||
        r.sala_id?.toString() === filtros.sala
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

  const indexInicial = (paginaAtual - 1) * reservasPorPagina;
  const indexFinal = indexInicial + reservasPorPagina;
  const reservasPaginadas = reservasFiltradas.slice(indexInicial, indexFinal);
  const totalPaginas = Math.ceil(reservasFiltradas.length / reservasPorPagina);

  const getStatusInfo = (reserva) => {
    const agora = new Date();
    const inicio = new Date(reserva.data_inicio);
    const fim = new Date(reserva.data_fim);
    
    if (agora < inicio) {
      return {
        text: 'Agendada',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Calendar className="w-4 h-4" />
      };
    } else if (agora >= inicio && agora <= fim) {
      return {
        text: 'Em Andamento',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <Activity className="w-4 h-4" />
      };
    } else {
      return {
        text: 'Concluída',
        color: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: <CheckCircle className="w-4 h-4" />
      };
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  };

  const getStatistics = () => {
    const total = reservasFiltradas.length;
    const agora = new Date();
    
    const agendadas = reservasFiltradas.filter(r => new Date(r.data_inicio) > agora).length;
    const emAndamento = reservasFiltradas.filter(r => {
      const inicio = new Date(r.data_inicio);
      const fim = new Date(r.data_fim);
      return agora >= inicio && agora <= fim;
    }).length;
    const concluidas = reservasFiltradas.filter(r => new Date(r.data_fim) < agora).length;
    
    return { total, agendadas, emAndamento, concluidas };
  };

  const stats = getStatistics();

  if (loading && reservas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center space-y-8 min-h-[70vh]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-slate-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Carregando Sistema de Reservas</h3>
              <p className="text-slate-600 text-lg">Preparando a melhor experiência para você...</p>
              <div className="mt-6 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-slate-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Header Profissional */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-slate-100 p-3 rounded-full mr-4">
                <Building2 className="w-8 h-8 text-slate-700" />
              </div>
              <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                Sistema de Reservas
              </h1>
            </div>
            <p className="text-xl text-slate-600 font-medium mb-6">
              Gestão Inteligente de Salas e Recursos
            </p>
            
            {/* Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-sm text-slate-600 font-medium">Total</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{stats.agendadas}</div>
                <div className="text-sm text-blue-600 font-medium">Agendadas</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-700">{stats.emAndamento}</div>
                <div className="text-sm text-emerald-600 font-medium">Em Andamento</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="text-2xl font-bold text-slate-700">{stats.concluidas}</div>
                <div className="text-sm text-slate-600 font-medium">Concluídas</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controles e Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <button
                onClick={loadReservas}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-200 font-medium"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              
              <div className="flex items-center space-x-2 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                placeholder="Buscar por título, descrição ou sala..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              >
                <option value="todas">Todos os Status</option>
                <option value="agendadas">Agendadas</option>
                <option value="andamento">Em Andamento</option>
                <option value="concluidas">Concluídas</option>
              </select>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={filtros.sala}
                onChange={(e) => setFiltros({...filtros, sala: e.target.value})}
                placeholder="Filtrar por sala..."
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="date"
                value={filtros.data}
                onChange={(e) => setFiltros({...filtros, data: e.target.value})}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4 mb-4 sm:mb-0">
              <div className="flex items-center space-x-2">
                <SortAsc className="w-4 h-4 text-slate-500" />
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-sm"
                >
                  <option value="data_inicio">Data de Início</option>
                  <option value="data_fim">Data de Fim</option>
                  <option value="sala">Sala</option>
                  <option value="titulo">Título</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setFiltros({ status: 'todas', sala: '', data: '', busca: '' });
                setPaginaAtual(1);
              }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all font-medium"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
              <p className="text-slate-600 font-medium">Carregando reservas...</p>
            </div>
          </div>
        )}

        {/* Conteúdo Principal */}
        {!loading && (
          <>
            {reservasPaginadas.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="max-w-md mx-auto">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-slate-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    {reservas.length === 0 ? 'Nenhuma reserva encontrada' : 'Nenhuma reserva corresponde aos filtros'}
                  </h3>
                  <p className="text-slate-600">
                    {reservas.length === 0 
                      ? 'As reservas aparecerão aqui quando forem criadas'
                      : 'Tente ajustar os filtros para ver mais resultados'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                    {reservasPaginadas.map((reserva) => {
                      const statusInfo = getStatusInfo(reserva);
                      return (
                        <div key={reserva.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <h3 className="text-lg font-semibold text-slate-900 line-clamp-2">
                                {reserva.titulo || 'Reunião de Trabalho'}
                              </h3>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                {statusInfo.icon}
                                <span className="ml-1">{statusInfo.text}</span>
                              </span>
                            </div>
                            
                            <div className="space-y-3 mb-6">
                              <div className="flex items-center text-slate-600">
                                <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                                <span className="text-sm font-medium">{reserva.sala_nome || 'Sala de Reunião B'}</span>
                              </div>
                              
                              <div className="flex items-center text-slate-600">
                                <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                <span className="text-sm">31/07/2025</span>
                              </div>
                              
                              <div className="flex items-center text-slate-600">
                                <Clock className="h-4 w-4 mr-2 text-slate-400" />
                                <span className="text-sm">11:00 - 14:00</span>
                              </div>

                              {reserva.descricao && (
                                <div className="flex items-start text-slate-600">
                                  <FileText className="h-4 w-4 mr-2 text-slate-400 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm line-clamp-2">{reserva.descricao}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                              <div className="flex items-center text-slate-500">
                                <Users className="h-4 w-4 mr-1" />
                                <span className="text-sm">{reserva.participantes || 5} pessoas</span>
                              </div>
                              
                              <button
                                onClick={() => cancelarReserva(reserva.id)}
                                disabled={deletingId === reserva.id}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                              >
                                {deletingId === reserva.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="divide-y divide-slate-200">
                      {reservasPaginadas.map((reserva) => {
                        const statusInfo = getStatusInfo(reserva);
                        return (
                          <div key={reserva.id} className="p-6 hover:bg-slate-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-lg font-semibold text-slate-900 truncate">
                                    {reserva.titulo || 'Reunião de Trabalho'}
                                  </h3>
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color} ml-4`}>
                                    {statusInfo.icon}
                                    <span className="ml-1">{statusInfo.text}</span>
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600">
                                  <div className="flex items-center">
                                    <Building2 className="h-4 w-4 mr-2 text-slate-400" />
                                    <span className="font-medium">{reserva.sala_nome || 'Sala de Reunião B'}</span>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                                    <span>31/07/2025</span>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2 text-slate-400" />
                                    <span>11:00 - 14:00</span>
                                  </div>

                                  <div className="flex items-center">
                                    <Users className="h-4 w-4 mr-2 text-slate-400" />
                                    <span>{reserva.participantes || 5} pessoas</span>
                                  </div>
                                </div>

                                {reserva.descricao && (
                                  <div className="mt-3 flex items-start text-slate-600">
                                    <FileText className="h-4 w-4 mr-2 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm">{reserva.descricao}</span>
                                  </div>
                                )}
                              </div>

                              <div className="ml-6 flex-shrink-0">
                                <button
                                  onClick={() => cancelarReserva(reserva.id)}
                                  disabled={deletingId === reserva.id}
                                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                                >
                                  {deletingId === reserva.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <X className="h-4 w-4 mr-2" />
                                  )}
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Paginação */}
                {totalPaginas > 1 && (
                  <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                          disabled={paginaAtual === 1}
                          className="relative inline-flex items-center px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                        >
                          <ChevronLeft className="w-4 h-4 mr-1" />
                          Anterior
                        </button>
                        <button
                          onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                          disabled={paginaAtual === totalPaginas}
                          className="ml-3 relative inline-flex items-center px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-slate-700 font-medium">
                            Mostrando{' '}
                            <span className="font-bold text-slate-900">{indexInicial + 1}</span>
                            {' '}até{' '}
                            <span className="font-bold text-slate-900">
                              {Math.min(indexFinal, reservasFiltradas.length)}
                            </span>
                            {' '}de{' '}
                            <span className="font-bold text-slate-900">{reservasFiltradas.length}</span>
                            {' '}resultados
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                            <button
                              onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                              disabled={paginaAtual === 1}
                              className="relative inline-flex items-center px-3 py-2 rounded-l-lg text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span className="sr-only">Anterior</span>
                            </button>
                            {Array.from({ length: Math.min(totalPaginas, 7) }, (_, i) => {
                              let pageNumber;
                              if (totalPaginas <= 7) {
                                pageNumber = i + 1;
                              } else if (paginaAtual <= 4) {
                                pageNumber = i + 1;
                              } else if (paginaAtual >= totalPaginas - 3) {
                                pageNumber = totalPaginas - 6 + i;
                              } else {
                                pageNumber = paginaAtual - 3 + i;
                              }
                              
                              return (
                                <button
                                  key={pageNumber}
                                  onClick={() => setPaginaAtual(pageNumber)}
                                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-all ${
                                    pageNumber === paginaAtual
                                      ? 'z-10 bg-slate-600 border-slate-600 text-white'
                                      : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  {pageNumber}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                              disabled={paginaAtual === totalPaginas}
                              className="relative inline-flex items-center px-3 py-2 rounded-r-lg text-slate-500 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                              <span className="sr-only">Próxima</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReservasProfessional;
