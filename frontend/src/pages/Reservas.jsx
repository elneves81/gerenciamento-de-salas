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

const Reservas = () => {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    status: 'todas',
    sala: '',
    data: '',
    busca: ''
  });
  const [ordenacao, setOrdenacao] = useState('data_inicio');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [reservasPorPagina] = useState(10);

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
        // Método 1: PUT para marcar como cancelada
        await api.put(`/agendamentos/${reservaId}`, { 
          status: 'cancelada' 
        });
      } catch (putError) {
        try {
          // Método 2: PATCH para atualizar status
          await api.patch(`/agendamentos/${reservaId}`, { 
            status: 'cancelada' 
          });
        } catch (patchError) {
          try {
            // Método 3: DELETE tradicional
            await api.delete(`/agendamentos/${reservaId}`);
          } catch (deleteError) {
            // Método 4: POST para cancelamento
            await api.post(`/agendamentos/${reservaId}/cancelar`);
          }
        }
      }
      
      // Remover da lista local imediatamente para melhor UX
      setReservas(prev => prev.filter(r => r.id !== reservaId));
      
      // Mostrar feedback de sucesso
      const successDiv = document.createElement('div');
      successDiv.innerHTML = `
        <div class="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
          </svg>
          Reserva cancelada com sucesso!
        </div>
      `;
      document.body.appendChild(successDiv);
      setTimeout(() => document.body.removeChild(successDiv), 3000);
      
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      
      // Feedback de erro mais informativo
      const errorDiv = document.createElement('div');
      errorDiv.innerHTML = `
        <div class="fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center max-w-md">
          <svg class="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
          </svg>
          <div>
            <div class="font-semibold">Erro ao cancelar reserva</div>
            <div class="text-sm opacity-90">Status: ${error.response?.status || 'Desconhecido'}</div>
          </div>
        </div>
      `;
      document.body.appendChild(errorDiv);
      setTimeout(() => document.body.removeChild(errorDiv), 5000);
      
    } finally {
      setDeletingId(null);
    }
  };

  const reservasFiltradas = React.useMemo(() => {
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

  const getStatusColor = (reserva) => {
    const agora = new Date();
    const inicio = new Date(reserva.data_inicio);
    const fim = new Date(reserva.data_fim);
    
    if (agora < inicio) {
      return 'bg-blue-100 text-blue-800';
    } else if (agora >= inicio && agora <= fim) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (reserva) => {
    const agora = new Date();
    const inicio = new Date(reserva.data_inicio);
    const fim = new Date(reserva.data_fim);
    
    if (agora < inicio) {
      return 'Agendada';
    } else if (agora >= inicio && agora <= fim) {
      return 'Em andamento';
    } else {
      return 'Concluída';
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

  if (loading && reservas.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center space-y-6 min-h-[70vh]">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Carregando Sistema de Reservas</h3>
              <p className="text-gray-600">Preparando a melhor experiência para você...</p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-purple-600 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-2">Reservas</h1>
          <p className="text-white text-lg opacity-90 mb-4">
            {reservasFiltradas.length} reserva{reservasFiltradas.length !== 1 ? 's' : ''} encontrada{reservasFiltradas.length !== 1 ? 's' : ''}
          </p>
          <button
            onClick={loadReservas}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-50 transition-all backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                value={filtros.busca}
                onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                placeholder="Título, descrição ou sala..."
                className="w-full px-4 py-3 bg-white bg-opacity-90 border-0 rounded-lg placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white transition-all"
              />
            </div>

            <div>
              <div className="flex items-center text-white mb-2">
                <Filter className="h-4 w-4 mr-2" />
                <span className="font-medium">Status</span>
              </div>
              <select
                value={filtros.status}
                onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                className="w-full px-4 py-3 bg-white bg-opacity-90 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white transition-all"
              >
                <option value="todas">Todas</option>
                <option value="agendadas">Agendadas</option>
                <option value="andamento">Em Andamento</option>
                <option value="concluidas">Concluídas</option>
              </select>
            </div>

            <div>
              <div className="flex items-center text-white mb-2">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="font-medium">Sala</span>
              </div>
              <input
                type="text"
                value={filtros.sala}
                onChange={(e) => setFiltros({...filtros, sala: e.target.value})}
                placeholder="Nome ou ID da sala"
                className="w-full px-4 py-3 bg-white bg-opacity-90 border-0 rounded-lg placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <div className="flex items-center text-white mb-2">
                <Calendar className="h-4 w-4 mr-2" />
                <span className="font-medium">Data</span>
              </div>
              <input
                type="date"
                value={filtros.data}
                onChange={(e) => setFiltros({...filtros, data: e.target.value})}
                className="w-full px-4 py-3 bg-white bg-opacity-90 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white transition-all"
              />
            </div>

            <div>
              <div className="flex items-center text-white mb-2">
                <SortAsc className="h-4 w-4 mr-2" />
                <span className="font-medium">Ordenar por</span>
              </div>
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-90 border-0 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:bg-white transition-all"
              >
                <option value="data_inicio">Data de Início</option>
                <option value="data_fim">Data de Fim</option>
                <option value="sala">Sala</option>
                <option value="titulo">Título</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFiltros({ status: 'todas', sala: '', data: '', busca: '' });
                  setPaginaAtual(1);
                }}
                className="w-full px-4 py-3 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 focus:outline-none focus:ring-2 focus:ring-white transition-all backdrop-blur-sm font-medium"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64 bg-white bg-opacity-20 backdrop-blur-md rounded-xl">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="ml-4 text-white">Carregando reservas...</p>
          </div>
        )}

        {!loading && (
          <div className="space-y-4">
            {reservasPaginadas.length === 0 ? (
              <div className="text-center py-12 bg-white bg-opacity-20 backdrop-blur-md rounded-xl">
                <Calendar className="h-16 w-16 mx-auto text-white opacity-60 mb-4" />
                <p className="text-white text-lg mb-2">
                  {reservas.length === 0 ? 'Nenhuma reserva encontrada' : 'Nenhuma reserva corresponde aos filtros'}
                </p>
                <p className="text-white opacity-70 text-sm">
                  {reservas.length === 0 
                    ? 'As reservas aparecerão aqui quando forem criadas'
                    : 'Tente ajustar os filtros para ver mais resultados'
                  }
                </p>
              </div>
            ) : (
              reservasPaginadas.map((reserva) => (
                <div key={reserva.id} className="bg-white bg-opacity-95 backdrop-blur-md rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {reserva.titulo || 'testes'}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reserva)}`}>
                          {getStatusText(reserva)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-purple-600" />
                          <span className="font-medium">{reserva.sala_nome || `Sala de Reunião B`}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                          <span>31/07/2025</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Clock className="h-5 w-5 mr-2 text-purple-600" />
                          <span>11:00 - 14:00</span>
                        </div>

                        {reserva.descricao && (
                          <div className="flex items-start">
                            <Users className="h-5 w-5 mr-2 text-purple-600 mt-0.5" />
                            <span className="text-sm">{reserva.descricao}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-6">
                      <button
                        onClick={() => cancelarReserva(reserva.id)}
                        className="inline-flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar Reserva
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            {totalPaginas > 1 && (
              <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-xl px-6 py-4 flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                    disabled={paginaAtual === 1}
                    className="relative inline-flex items-center px-4 py-2 text-white bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 disabled:opacity-50 transition-all"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="ml-3 relative inline-flex items-center px-4 py-2 text-white bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 disabled:opacity-50 transition-all"
                  >
                    Próxima
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-white opacity-90">
                      Mostrando{' '}
                      <span className="font-medium">{indexInicial + 1}</span>
                      {' '}até{' '}
                      <span className="font-medium">
                        {Math.min(indexFinal, reservasFiltradas.length)}
                      </span>
                      {' '}de{' '}
                      <span className="font-medium">{reservasFiltradas.length}</span>
                      {' '}resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                      <button
                        onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                        disabled={paginaAtual === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-lg text-white bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 transition-all"
                      >
                        Anterior
                      </button>
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
                        <button
                          key={numero}
                          onClick={() => setPaginaAtual(numero)}
                          className={`relative inline-flex items-center px-4 py-2 text-white transition-all ${ 
                            numero === paginaAtual
                              ? 'z-10 bg-white bg-opacity-40 font-bold'
                              : 'bg-white bg-opacity-20 hover:bg-opacity-30'
                          }`}
                        >
                          {numero}
                        </button>
                      ))}
                      <button
                        onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                        disabled={paginaAtual === totalPaginas}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-lg text-white bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50 transition-all"
                      >
                        Próxima
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservas;
