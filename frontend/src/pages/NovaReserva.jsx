import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, Building2, Save } from 'lucide-react';

const NovaReserva = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    sala: '',
    data_inicio: '',
    hora_inicio: '',
    data_fim: '',
    hora_fim: '',
    participantes: 1
  });

  useEffect(() => {
    loadSalas();
    
    // Pré-selecionar sala se veio da URL
    const params = new URLSearchParams(location.search);
    const salaId = params.get('sala');
    if (salaId) {
      setFormData(prev => ({ ...prev, sala: salaId }));
    }
  }, [location]);

  const loadSalas = async () => {
    try {
      const response = await api.get('/salas/');
      setSalas(response.data);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Combinar data e hora
      const dataInicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);
      const dataFim = new Date(`${formData.data_fim}T${formData.hora_fim}`);

      const reservaData = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        sala: parseInt(formData.sala),
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        participantes: parseInt(formData.participantes)
      };

      await api.post('/reservas/', reservaData);
      navigate('/reservas');
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Erro ao criar reserva';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">Nova Reserva</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
              Título da Reunião *
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              required
              value={formData.titulo}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Reunião de equipe"
            />
          </div>

          <div>
            <label htmlFor="sala" className="block text-sm font-medium text-gray-700 mb-1">
              Sala *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                id="sala"
                name="sala"
                required
                value={formData.sala}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma sala</option>
                {salas.map((sala) => (
                  <option key={sala.id} value={sala.id}>
                    {sala.nome} (Cap: {sala.capacidade})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-700 mb-1">
                Data de Início *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  id="data_inicio"
                  name="data_inicio"
                  required
                  value={formData.data_inicio}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="hora_inicio" className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Início *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  id="hora_inicio"
                  name="hora_inicio"
                  required
                  value={formData.hora_inicio}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="data_fim" className="block text-sm font-medium text-gray-700 mb-1">
                Data de Fim *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  id="data_fim"
                  name="data_fim"
                  required
                  value={formData.data_fim}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="hora_fim" className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Fim *
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="time"
                  id="hora_fim"
                  name="hora_fim"
                  required
                  value={formData.hora_fim}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="participantes" className="block text-sm font-medium text-gray-700 mb-1">
              Número de Participantes *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="number"
                id="participantes"
                name="participantes"
                required
                min="1"
                value={formData.participantes}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              rows={3}
              value={formData.descricao}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descrição da reunião (opcional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/reservas')}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NovaReserva;
