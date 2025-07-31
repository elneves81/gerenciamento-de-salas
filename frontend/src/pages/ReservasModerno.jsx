import React, { useState, useEffect, useMemo } from 'react';
import agendamentosService from '../services/agendamentosService';
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

const ReservasModerno = () => {
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
  const [reservasPorPagina] = useState(6);
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    loadReservas();
  }, []);

  const loadReservas = async () => {
    setLoading(true);
    try {
      const agendamentosData = await agendamentosService.listarAgendamentos();
      setReservas(Array.isArray(agendamentosData) ? agendamentosData : []);
      console.log('✅ Agendamentos carregados:', agendamentosData?.length || 0);
    } catch (error) {
      console.error('❌ Erro ao carregar reservas:', error);
      setReservas([]);
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (reservaId) => {
    if (!window.confirm('⚠️ Tem certeza que deseja cancelar esta reserva?')) {
      return;
    }

    setDeletingId(reservaId);
    
    try {
      const result = await agendamentosService.cancelarAgendamento(reservaId);
      console.log('✅ Agendamento cancelado:', result);
      
      // Atualizar lista localmente
      setReservas(prev => prev.map(r => 
        r.id === reservaId ? { ...r, status: 'cancelado' } : r
      ));
      
      // Toast de sucesso
      const toast = document.createElement('div');
      toast.className = 'toast-success';
      toast.innerHTML = '✅ Reserva cancelada com sucesso!';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
      
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      
      const toast = document.createElement('div');
      toast.className = 'toast-error';
      toast.innerHTML = '❌ Erro ao cancelar reserva. Tente novamente.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  const reservasFiltradas = useMemo(() => {
    let resultado = [...reservas];

    if (filtros.status !== 'todas') {
      resultado = resultado.filter(r => r.status === filtros.status);
    }

    if (filtros.sala) {
      resultado = resultado.filter(r => 
        r.sala?.toLowerCase().includes(filtros.sala.toLowerCase())
      );
    }

    if (filtros.data) {
      resultado = resultado.filter(r => 
        r.data_inicio?.includes(filtros.data)
      );
    }

    if (filtros.busca) {
      const busca = filtros.busca.toLowerCase();
      resultado = resultado.filter(r => 
        r.titulo?.toLowerCase().includes(busca) ||
        r.descricao?.toLowerCase().includes(busca) ||
        r.sala?.toLowerCase().includes(busca) ||
        r.solicitante?.toLowerCase().includes(busca)
      );
    }

    return resultado.sort((a, b) => {
      if (ordenacao === 'data_inicio') {
        return new Date(b.data_inicio) - new Date(a.data_inicio);
      }
      return a[ordenacao]?.localeCompare(b[ordenacao]) || 0;
    });
  }, [reservas, filtros, ordenacao]);

  const totalPaginas = Math.ceil(reservasFiltradas.length / reservasPorPagina);
  const reservasPaginadas = reservasFiltradas.slice(
    (paginaAtual - 1) * reservasPorPagina,
    paginaAtual * reservasPorPagina
  );

  const estatisticas = useMemo(() => {
    const total = reservas.length;
    const agendadas = reservas.filter(r => r.status === 'agendada').length;
    const concluidas = reservas.filter(r => r.status === 'concluida').length;
    const andamento = reservas.filter(r => r.status === 'em_andamento').length;

    return { total, agendadas, concluidas, andamento };
  }, [reservas]);

  const formatarData = (dataString) => {
    if (!dataString) return 'Data não disponível';
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dataString;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'agendada': return 'status-agendada';
      case 'concluida': return 'status-concluida';
      case 'em_andamento': return 'status-andamento';
      case 'cancelada': return 'status-cancelada';
      default: return 'status-default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'agendada': return 'Agendada';
      case 'concluida': return 'Concluída';
      case 'em_andamento': return 'Em Andamento';
      case 'cancelada': return 'Cancelada';
      default: return 'Indefinido';
    }
  };

  return (
    <div className="reservas-moderno" data-page="reservas">
      <style jsx>{`
        .reservas-moderno {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .header-moderno {
          background: rgba(255, 255, 255, 0.95);
          padding: 25px 30px;
          border-radius: 20px;
          margin-bottom: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .header-titulo {
          font-size: 28px;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-subtitulo {
          color: #7f8c8d;
          font-size: 16px;
          font-weight: 500;
        }

        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 25px 0;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.95);
          padding: 20px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
        }

        .stat-numero {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 8px;
          background: linear-gradient(45deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          color: #5a6c7d;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .controls-container {
          background: rgba(255, 255, 255, 0.95);
          padding: 25px;
          border-radius: 20px;
          margin-bottom: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .filters-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .filter-label {
          font-size: 14px;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-input {
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: #ffffff;
        }

        .filter-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
        }

        .btn-moderno {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
        }

        .btn-moderno::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .btn-moderno:hover::before {
          left: 100%;
        }

        .btn-primary {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }

        .btn-success {
          background: linear-gradient(45deg, #48bb78, #38a169);
          color: white;
          box-shadow: 0 4px 15px rgba(72, 187, 120, 0.3);
        }

        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(72, 187, 120, 0.4);
        }

        .btn-secondary {
          background: linear-gradient(45deg, #a0aec0, #718096);
          color: white;
          box-shadow: 0 4px 15px rgba(160, 174, 192, 0.3);
        }

        .btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(160, 174, 192, 0.4);
        }

        .btn-danger {
          background: linear-gradient(45deg, #f56565, #e53e3e);
          color: white;
          box-shadow: 0 4px 15px rgba(245, 101, 101, 0.3);
        }

        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(245, 101, 101, 0.4);
        }

        .view-toggle {
          display: flex;
          background: #f7fafc;
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }

        .view-btn {
          padding: 8px 12px;
          border: none;
          background: transparent;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .view-btn.active {
          background: linear-gradient(45deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .reservas-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 25px;
          margin-bottom: 30px;
        }

        .reserva-card {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          position: relative;
          overflow: hidden;
        }

        .reserva-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(45deg, #667eea, #764ba2);
        }

        .reserva-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .card-titulo {
          font-size: 20px;
          font-weight: 700;
          color: #2d3748;
          margin-bottom: 8px;
          line-height: 1.3;
        }

        .card-info {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 20px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #5a6c7d;
          font-size: 14px;
        }

        .info-icon {
          width: 18px;
          height: 18px;
          color: #667eea;
        }

        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-agendada {
          background: linear-gradient(45deg, #4299e1, #3182ce);
          color: white;
        }

        .status-concluida {
          background: linear-gradient(45deg, #48bb78, #38a169);
          color: white;
        }

        .status-andamento {
          background: linear-gradient(45deg, #ed8936, #dd6b20);
          color: white;
        }

        .status-cancelada {
          background: linear-gradient(45deg, #f56565, #e53e3e);
          color: white;
        }

        .card-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }

        .btn-icon {
          padding: 10px;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
        }

        .pagination-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 15px;
          margin-top: 30px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          backdrop-filter: blur(10px);
        }

        .pagination-info {
          color: #5a6c7d;
          font-size: 14px;
          font-weight: 500;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 60px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          color: #cbd5e0;
        }

        .empty-title {
          font-size: 24px;
          font-weight: 700;
          color: #4a5568;
          margin-bottom: 12px;
        }

        .empty-text {
          color: #7f8c8d;
          font-size: 16px;
          line-height: 1.5;
        }

        /* Toast Notifications */
        .toast-success, .toast-error {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 16px 24px;
          border-radius: 12px;
          color: white;
          font-weight: 600;
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }

        .toast-success {
          background: linear-gradient(45deg, #48bb78, #38a169);
        }

        .toast-error {
          background: linear-gradient(45deg, #f56565, #e53e3e);
        }

        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .reservas-moderno {
            padding: 15px;
          }

          .header-titulo {
            font-size: 24px;
          }

          .filters-row {
            grid-template-columns: 1fr;
          }

          .actions-bar {
            flex-direction: column;
            align-items: stretch;
          }

          .reservas-grid {
            grid-template-columns: 1fr;
          }

          .btn-moderno {
            padding: 10px 20px;
            font-size: 13px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="header-moderno">
        <div className="header-titulo">
          <Calendar className="info-icon" />
          Sistema de Reservas
        </div>
        <div className="header-subtitulo">
          Gestão Inteligente de Salas e Recursos
        </div>
      </div>

      {/* Estatísticas */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-numero">{estatisticas.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-numero">{estatisticas.agendadas}</div>
          <div className="stat-label">Agendadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-numero">{estatisticas.andamento}</div>
          <div className="stat-label">Em Andamento</div>
        </div>
        <div className="stat-card">
          <div className="stat-numero">{estatisticas.concluidas}</div>
          <div className="stat-label">Concluídas</div>
        </div>
      </div>

      {/* Controles */}
      <div className="controls-container">
        <div className="filters-row">
          <div className="filter-group">
            <label className="filter-label">Buscar</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Pesquisar por título, descrição ou sala..."
              value={filtros.busca}
              onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Status</label>
            <select
              className="filter-input"
              value={filtros.status}
              onChange={(e) => setFiltros(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="todas">Todos os Status</option>
              <option value="agendada">Agendadas</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluida">Concluídas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Sala</label>
            <input
              type="text"
              className="filter-input"
              placeholder="Filtrar por sala..."
              value={filtros.sala}
              onChange={(e) => setFiltros(prev => ({ ...prev, sala: e.target.value }))}
            />
          </div>

          <div className="filter-group">
            <label className="filter-label">Data</label>
            <input
              type="date"
              className="filter-input"
              value={filtros.data}
              onChange={(e) => setFiltros(prev => ({ ...prev, data: e.target.value }))}
            />
          </div>
        </div>

        <div className="actions-bar">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-moderno btn-primary" onClick={loadReservas}>
              <RefreshCw size={16} />
              Atualizar
            </button>
            <button className="btn-moderno btn-success">
              <Download size={16} />
              Exportar
            </button>
            <button
              className="btn-moderno btn-secondary"
              onClick={() => setFiltros({ status: 'todas', sala: '', data: '', busca: '' })}
            >
              <X size={16} />
              Limpar Filtros
            </button>
          </div>

          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="loading-container">
          <Loader2 size={40} className="loading-spinner" />
          <span style={{ marginLeft: '16px', fontSize: '18px', color: '#5a6c7d' }}>
            Carregando reservas...
          </span>
        </div>
      ) : reservasPaginadas.length === 0 ? (
        <div className="empty-state">
          <Calendar className="empty-icon" />
          <div className="empty-title">Nenhuma reserva encontrada</div>
          <div className="empty-text">
            {filtros.busca || filtros.status !== 'todas' || filtros.sala || filtros.data
              ? 'Tente ajustar os filtros ou limpar a busca'
              : 'Comece criando sua primeira reserva'}
          </div>
        </div>
      ) : (
        <>
          <div className="reservas-grid">
            {reservasPaginadas.map(reserva => (
              <div key={reserva.id} className="reserva-card">
                <div className="card-header">
                  <div>
                    <div className="card-titulo">
                      {reserva.titulo || reserva.descricao || 'Reserva sem título'}
                    </div>
                    <span className={`status-badge ${getStatusColor(reserva.status)}`}>
                      {getStatusText(reserva.status)}
                    </span>
                  </div>
                </div>

                <div className="card-info">
                  <div className="info-item">
                    <MapPin className="info-icon" />
                    <span>{reserva.sala || 'Sala não especificada'}</span>
                  </div>
                  <div className="info-item">
                    <Clock className="info-icon" />
                    <span>{formatarData(reserva.data_inicio)}</span>
                  </div>
                  <div className="info-item">
                    <Users className="info-icon" />
                    <span>{reserva.solicitante || 'Solicitante não informado'}</span>
                  </div>
                  {reserva.num_pessoas && (
                    <div className="info-item">
                      <Users className="info-icon" />
                      <span>{reserva.num_pessoas} pessoas</span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button
                    className="btn-icon btn-primary"
                    title="Visualizar"
                    style={{ background: 'linear-gradient(45deg, #4299e1, #3182ce)' }}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="btn-icon btn-success"
                    title="Editar"
                    style={{ background: 'linear-gradient(45deg, #48bb78, #38a169)' }}
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    className="btn-icon btn-danger"
                    title="Cancelar"
                    onClick={() => cancelarReserva(reserva.id)}
                    disabled={deletingId === reserva.id}
                    style={{ background: 'linear-gradient(45deg, #f56565, #e53e3e)' }}
                  >
                    {deletingId === reserva.id ? (
                      <Loader2 size={16} className="loading-spinner" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="pagination-container">
              <button
                className="btn-moderno btn-secondary"
                onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                disabled={paginaAtual === 1}
              >
                <ChevronLeft size={16} />
                Anterior
              </button>

              <div className="pagination-info">
                Página {paginaAtual} de {totalPaginas} • 
                {reservasFiltradas.length} reserva{reservasFiltradas.length !== 1 ? 's' : ''}
              </div>

              <button
                className="btn-moderno btn-secondary"
                onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                disabled={paginaAtual === totalPaginas}
              >
                Próxima
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReservasModerno;
