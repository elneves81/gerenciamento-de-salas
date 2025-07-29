import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Calendar, Clock, X, Filter, Search, RefreshCw, MapPin, Users } from 'lucide-react';

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
      const response = await api.get('/agendamentos', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
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

  // Filtrar e ordenar reservas
  const reservasFiltradas = React.useMemo(() => {
    let filtered = [...reservas];

    // Filtro por busca
    if (filtros.busca) {
      filtered = filtered.filter(r => 
        r.titulo?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        r.descricao?.toLowerCase().includes(filtros.busca.toLowerCase()) ||
        r.sala_nome?.toLowerCase().includes(filtros.busca.toLowerCase())
      );
    }

    // Filtro por status
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

    // Filtro por sala
    if (filtros.sala) {
      filtered = filtered.filter(r => 
        r.sala_nome?.toLowerCase().includes(filtros.sala.toLowerCase()) ||
        r.sala_id?.toString() === filtros.sala
      );
    }

    // Filtro por data
    if (filtros.data) {
      filtered = filtered.filter(r => {
        const dataReserva = new Date(r.data_inicio).toISOString().split('T')[0];
        return dataReserva === filtros.data;
      });
    }

    // Ordenação
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
      {/* Header com Título e Ações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-600 mt-1">
            {reservasFiltradas.length} reserva{reservasFiltradas.length !== 1 ? 's' : ''} encontrada{reservasFiltradas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={loadReservas}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Busca */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Search className="h-4 w-4 inline mr-1" />
              Buscar
            </label>
            <input
              type="text"
              value={filtros.busca}
              onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
              placeholder="Título, descrição ou sala..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Filter className="h-4 w-4 inline mr-1" />
              Status
            </label>
            <select
              value={filtros.status}
              onChange={(e) => setFiltros({...filtros, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="agendadas">Agendadas</option>
              <option value="andamento">Em Andamento</option>
              <option value="concluidas">Concluídas</option>
            </select>
          </div>

          {/* Sala */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4 inline mr-1" />
              Sala
            </label>
            <input
              type="text"
              value={filtros.sala}
              onChange={(e) => setFiltros({...filtros, sala: e.target.value})}
              placeholder="Nome ou ID da sala"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Data
            </label>
            <input
              type="date"
              value={filtros.data}
              onChange={(e) => setFiltros({...filtros, data: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Ordenação */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="data_inicio">Data de Início</option>
              <option value="data_fim">Data de Fim</option>
              <option value="sala">Sala</option>
              <option value="titulo">Título</option>
            </select>
          </div>

          {/* Limpar Filtros */}
          <button
            onClick={() => {
              setFiltros({ status: 'todas', sala: '', data: '', busca: '' });
              setPaginaAtual(1);
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="ml-4 text-gray-600">Carregando reservas...</p>
        </div>
      )}

      {/* Tabela de Reservas */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {reservasPaginadas.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                {reservas.length === 0 ? 'Nenhuma reserva encontrada' : 'Nenhuma reserva corresponde aos filtros'}
              </p>
              <p className="text-gray-400 text-sm">
                {reservas.length === 0 
                  ? 'As reservas aparecerão aqui quando forem criadas'
                  : 'Tente ajustar os filtros para ver mais resultados'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Tabela Desktop */}
              <div className="hidden lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reserva
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sala
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data e Horário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservasPaginadas.map((reserva) => (
                      <tr key={reserva.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reserva.titulo || 'Reunião'}
                            </div>
                            {reserva.descricao && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {reserva.descricao}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">
                              {reserva.sala_nome || `Sala ${reserva.sala_id}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                              {formatDateTime(reserva.data_inicio).split(' ')[0]}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-1" />
                              {formatDateTime(reserva.data_inicio).split(' ')[1]} - {formatDateTime(reserva.data_fim).split(' ')[1]}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reserva)}`}>
                            {getStatusText(reserva)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => cancelarReserva(reserva.id)}
                            className="inline-flex items-center px-3 py-1 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards Mobile */}
              <div className="lg:hidden">
                {reservasPaginadas.map((reserva) => (
                  <div key={reserva.id} className="border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {reserva.titulo || 'Reunião'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(reserva)}`}>
                        {getStatusText(reserva)}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {reserva.sala_nome || `Sala ${reserva.sala_id}`}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDateTime(reserva.data_inicio).split(' ')[0]}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDateTime(reserva.data_inicio).split(' ')[1]} - {formatDateTime(reserva.data_fim).split(' ')[1]}
                      </div>
                      {reserva.descricao && (
                        <div className="flex items-start">
                          <Users className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                          <span>{reserva.descricao}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => cancelarReserva(reserva.id)}
                        className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancelar Reserva
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                      disabled={paginaAtual === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                      disabled={paginaAtual === totalPaginas}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Próximo
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
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
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                          disabled={paginaAtual === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((numero) => (
                          <button
                            key={numero}
                            onClick={() => setPaginaAtual(numero)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              numero === paginaAtual
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {numero}
                          </button>
                        ))}
                        <button
                          onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                          disabled={paginaAtual === totalPaginas}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                          Próximo
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reservas;
