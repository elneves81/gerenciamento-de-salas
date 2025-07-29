import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  Building2, 
  Save, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
  MapPin,
  Wifi,
  Monitor,
  Coffee,
  Car,
  Star,
  Eye,
  RefreshCw,
  Plus,
  X,
  Search
} from 'lucide-react';

const NovaReserva = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Estados principais
  const [currentStep, setCurrentStep] = useState(1);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availabilityCheck, setAvailabilityCheck] = useState(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [selectedSalaDetails, setSelectedSalaDetails] = useState(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    sala: '',
    data_inicio: '',
    hora_inicio: '',
    data_fim: '',
    hora_fim: '',
    participantes: 1,
    recorrente: false,
    tipo_recorrencia: 'semanal',
    fim_recorrencia: '',
    participantes_emails: []
  });

  // Estados de UI
  const [showSalaPreview, setShowSalaPreview] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [searchSala, setSearchSala] = useState('');

  const steps = [
    { id: 1, title: 'Informações Básicas', icon: Info },
    { id: 2, title: 'Sala & Horário', icon: Building2 },
    { id: 3, title: 'Participantes', icon: Users },
    { id: 4, title: 'Confirmação', icon: CheckCircle }
  ];

  useEffect(() => {
    loadSalas();
    
    // Pré-selecionar sala se veio da URL
    const params = new URLSearchParams(location.search);
    const salaId = params.get('sala');
    if (salaId) {
      setFormData(prev => ({ ...prev, sala: salaId }));
      setCurrentStep(2);
    }
  }, [location]);

  const loadSalas = async () => {
    try {
      const response = await api.get('/get-salas/');
      setSalas(response.data);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
      setError('Erro ao carregar salas disponíveis');
    }
  };

  const checkAvailability = useCallback(async () => {
    if (!formData.sala || !formData.data_inicio || !formData.hora_inicio || 
        !formData.data_fim || !formData.hora_fim) {
      return;
    }

    setCheckingAvailability(true);
    try {
      const dataInicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);
      const dataFim = new Date(`${formData.data_fim}T${formData.hora_fim}`);

      const response = await api.post('/reservas/check-availability/', {
        sala: parseInt(formData.sala),
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString()
      });

      setAvailabilityCheck(response.data);
    } catch (error) {
      setAvailabilityCheck({ 
        available: false, 
        message: 'Erro ao verificar disponibilidade' 
      });
    } finally {
      setCheckingAvailability(false);
    }
  }, [formData.sala, formData.data_inicio, formData.hora_inicio, formData.data_fim, formData.hora_fim]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkAvailability();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [checkAvailability]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSalaSelect = async (salaId) => {
    setFormData(prev => ({ ...prev, sala: salaId }));
    
    // Carregar detalhes da sala
    try {
      const response = await api.get(`/salas/${salaId}/`);
      setSelectedSalaDetails(response.data);
    } catch (error) {
      console.error('Erro ao carregar detalhes da sala:', error);
    }
  };

  const addParticipante = () => {
    if (emailInput && !formData.participantes_emails.includes(emailInput)) {
      setFormData(prev => ({
        ...prev,
        participantes_emails: [...prev.participantes_emails, emailInput]
      }));
      setEmailInput('');
    }
  };

  const removeParticipante = (email) => {
    setFormData(prev => ({
      ...prev,
      participantes_emails: prev.participantes_emails.filter(e => e !== email)
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const dataInicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);
      const dataFim = new Date(`${formData.data_fim}T${formData.hora_fim}`);

      const reservaData = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        sala: parseInt(formData.sala),
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        participantes: parseInt(formData.participantes),
        participantes_emails: formData.participantes_emails,
        recorrente: formData.recorrente,
        tipo_recorrencia: formData.recorrente ? formData.tipo_recorrencia : null,
        fim_recorrencia: formData.recorrente ? formData.fim_recorrencia : null
      };

      await api.post('/reservas/', reservaData);
      setSuccess('Reserva criada com sucesso!');
      
      setTimeout(() => {
        navigate('/reservas');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.non_field_errors?.[0] ||
                          'Erro ao criar reserva';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalas = salas.filter(sala => 
    sala.nome.toLowerCase().includes(searchSala.toLowerCase()) ||
    sala.recursos.toLowerCase().includes(searchSala.toLowerCase())
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id;
        const isCompleted = currentStep > step.id;
        
        return (
          <div key={step.id} className="flex items-center">
            <div className={`
              flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
              ${isActive ? 'bg-primary-500 border-primary-500 text-white shadow-glow' : 
                isCompleted ? 'bg-success-500 border-success-500 text-white' : 
                'bg-white border-gray-300 text-gray-400'}
            `}>
              {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
            </div>
            
            {index < steps.length - 1 && (
              <div className={`
                w-16 h-0.5 mx-2 transition-all duration-300
                ${isCompleted ? 'bg-success-500' : 'bg-gray-300'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Informações da Reunião</h2>
        <p className="text-gray-600">Vamos começar com as informações básicas da sua reunião</p>
      </div>

      <div className="space-y-6">
        <div className="floating-label">
          <input
            type="text"
            id="titulo"
            name="titulo"
            required
            value={formData.titulo}
            onChange={handleInputChange}
            placeholder=" "
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200 peer"
          />
          <label htmlFor="titulo" className="absolute left-4 top-3 text-gray-500 transition-all duration-200 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary-500 peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-75">
            Título da Reunião *
          </label>
        </div>

        <div className="floating-label">
          <textarea
            id="descricao"
            name="descricao"
            rows={4}
            value={formData.descricao}
            onChange={handleInputChange}
            placeholder=" "
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200 peer resize-none"
          />
          <label htmlFor="descricao" className="absolute left-4 top-3 text-gray-500 transition-all duration-200 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-primary-500 peer-[:not(:placeholder-shown)]:-translate-y-6 peer-[:not(:placeholder-shown)]:scale-75">
            Descrição da Reunião
          </label>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center mb-4">
            <Info className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="font-semibold text-blue-900">Dicas para uma boa reunião</h3>
          </div>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use um título claro e descritivo</li>
            <li>• Inclua o objetivo principal na descrição</li>
            <li>• Mencione se há necessidade de equipamentos específicos</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Escolha da Sala e Horário</h2>
        <p className="text-gray-600">Selecione a sala ideal e defina o horário da reunião</p>
      </div>

      {/* Busca de Salas */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar salas por nome ou recursos..."
          value={searchSala}
          onChange={(e) => setSearchSala(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200"
        />
      </div>

      {/* Lista de Salas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-64 overflow-y-auto">
        {filteredSalas.map((sala) => (
          <div
            key={sala.id}
            onClick={() => handleSalaSelect(sala.id)}
            className={`
              p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 card-hover
              ${formData.sala == sala.id ? 
                'border-primary-500 bg-primary-50 shadow-glow' : 
                'border-gray-200 bg-white hover:border-primary-300'}
            `}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{sala.nome}</h3>
              <div className="flex items-center text-sm text-gray-500">
                <Users className="w-4 h-4 mr-1" />
                {sala.capacidade}
              </div>
            </div>
            
            {sala.recursos && (
              <div className="flex flex-wrap gap-1 mb-2">
                {sala.recursos.split(',').map((recurso, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    {recurso.trim()}
                  </span>
                ))}
              </div>
            )}
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSalaDetails(sala);
                setShowSalaPreview(true);
              }}
              className="text-primary-500 text-sm hover:text-primary-700 flex items-center"
            >
              <Eye className="w-4 h-4 mr-1" />
              Ver detalhes
            </button>
          </div>
        ))}
      </div>

      {/* Horários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data e Hora de Início *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                name="data_inicio"
                required
                value={formData.data_inicio}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="time"
                name="hora_inicio"
                required
                value={formData.hora_inicio}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data e Hora de Fim *
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="date"
                name="data_fim"
                required
                value={formData.data_fim}
                onChange={handleInputChange}
                min={formData.data_inicio || new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200"
              />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="time"
                name="hora_fim"
                required
                value={formData.hora_fim}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Verificação de Disponibilidade */}
      {(checkingAvailability || availabilityCheck) && (
        <div className={`
          p-4 rounded-xl border-2 transition-all duration-300
          ${availabilityCheck?.available ? 
            'bg-success-50 border-success-200' : 
            'bg-error-50 border-error-200'}
        `}>
          <div className="flex items-center">
            {checkingAvailability ? (
              <>
                <RefreshCw className="w-5 h-5 text-gray-500 mr-2 animate-spin" />
                <span className="text-gray-700">Verificando disponibilidade...</span>
              </>
            ) : (
              <>
                {availabilityCheck?.available ? (
                  <CheckCircle className="w-5 h-5 text-success-500 mr-2" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-error-500 mr-2" />
                )}
                <span className={availabilityCheck?.available ? 'text-success-700' : 'text-error-700'}>
                  {availabilityCheck?.message || 
                   (availabilityCheck?.available ? 'Horário disponível!' : 'Horário não disponível')}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Reunião Recorrente */}
      <div className="bg-gray-50 p-6 rounded-xl">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="recorrente"
            name="recorrente"
            checked={formData.recorrente}
            onChange={handleInputChange}
            className="custom-checkbox"
          />
          <label htmlFor="recorrente" className="ml-3 font-medium text-gray-900">
            Reunião recorrente
          </label>
        </div>

        {formData.recorrente && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequência
              </label>
              <select
                name="tipo_recorrencia"
                value={formData.tipo_recorrencia}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200"
              >
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fim da recorrência
              </label>
              <input
                type="date"
                name="fim_recorrencia"
                value={formData.fim_recorrencia}
                onChange={handleInputChange}
                min={formData.data_fim || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Participantes</h2>
        <p className="text-gray-600">Defina quantas pessoas participarão e convide por email</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de Participantes *
        </label>
        <div className="relative">
          <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="number"
            name="participantes"
            required
            min="1"
            max={selectedSalaDetails?.capacidade || 100}
            value={formData.participantes}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200"
          />
        </div>
        {selectedSalaDetails && formData.participantes > selectedSalaDetails.capacidade && (
          <p className="text-error-500 text-sm mt-1">
            A sala selecionada comporta apenas {selectedSalaDetails.capacidade} pessoas
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Convidar Participantes (opcional)
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="email@exemplo.com"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addParticipante())}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-0 transition-all duration-200"
          />
          <button
            type="button"
            onClick={addParticipante}
            className="px-4 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all duration-200 flex items-center"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {formData.participantes_emails.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Participantes Convidados</h3>
          <div className="space-y-2">
            {formData.participantes_emails.map((email, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg">
                <span className="text-gray-700">{email}</span>
                <button
                  type="button"
                  onClick={() => removeParticipante(email)}
                  className="text-error-500 hover:text-error-700 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmação</h2>
        <p className="text-gray-600">Revise os detalhes da sua reserva antes de confirmar</p>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Informações da Reunião</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Título:</span> {formData.titulo}</div>
              {formData.descricao && (
                <div><span className="font-medium">Descrição:</span> {formData.descricao}</div>
              )}
              <div><span className="font-medium">Participantes:</span> {formData.participantes}</div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Sala e Horário</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Sala:</span> {salas.find(s => s.id == formData.sala)?.nome}</div>
              <div><span className="font-medium">Data:</span> {new Date(formData.data_inicio).toLocaleDateString('pt-BR')}</div>
              <div><span className="font-medium">Horário:</span> {formData.hora_inicio} - {formData.hora_fim}</div>
              {formData.recorrente && (
                <div><span className="font-medium">Recorrência:</span> {formData.tipo_recorrencia} até {new Date(formData.fim_recorrencia).toLocaleDateString('pt-BR')}</div>
              )}
            </div>
          </div>
        </div>

        {formData.participantes_emails.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Participantes Convidados</h3>
            <div className="flex flex-wrap gap-2">
              {formData.participantes_emails.map((email, index) => (
                <span key={index} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                  {email}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-error-50 border-2 border-error-200 text-error-700 px-4 py-3 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-50 border-2 border-success-200 text-success-700 px-4 py-3 rounded-xl flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Nova Reserva</h1>
          <p className="text-white/80">Crie sua reserva de sala em poucos passos</p>
        </div>

        {/* Main Card */}
        <div className="glass rounded-2xl p-8 shadow-large">
          {renderStepIndicator()}
          
          <form onSubmit={handleSubmit}>
            {renderCurrentStep()}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/reservas')}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancelar
              </button>

              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-6 py-3 border-2 border-primary-300 rounded-xl text-primary-700 bg-primary-50 hover:bg-primary-100 transition-all duration-200 flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Anterior
                  </button>
                )}

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && !formData.titulo) ||
                      (currentStep === 2 && (!formData.sala || !formData.data_inicio || !formData.hora_inicio || !formData.data_fim || !formData.hora_fim)) ||
                      (currentStep === 3 && !formData.participantes)
                    }
                    className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className={`
                      px-6 py-3 bg-success-500 text-white rounded-xl hover:bg-success-600 
                      disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 
                      flex items-center ${loading ? 'btn-loading' : ''}
                    `}
                  >
                    {!loading && <Save className="w-4 h-4 mr-2" />}
                    {loading ? 'Salvando...' : 'Confirmar Reserva'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modal de Preview da Sala */}
        {showSalaPreview && selectedSalaDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{selectedSalaDetails.nome}</h3>
                  <button
                    onClick={() => setShowSalaPreview(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-500 mr-2" />
                      <span>Capacidade: {selectedSalaDetails.capacidade} pessoas</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-5 h-5 text-gray-500 mr-2" />
                      <span>Localização: Andar {selectedSalaDetails.andar || 'N/A'}</span>
                    </div>
                  </div>

                  {selectedSalaDetails.recursos && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Recursos Disponíveis</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedSalaDetails.recursos.split(',').map((recurso, index) => {
                          const recursoTrim = recurso.trim().toLowerCase();
                          let icon = <Star className="w-4 h-4" />;
                          
                          if (recursoTrim.includes('projetor') || recursoTrim.includes('tv')) {
                            icon = <Monitor className="w-4 h-4" />;
                          } else if (recursoTrim.includes('wifi')) {
                            icon = <Wifi className="w-4 h-4" />;
                          } else if (recursoTrim.includes('café') || recursoTrim.includes('coffee')) {
                            icon = <Coffee className="w-4 h-4" />;
                          } else if (recursoTrim.includes('estacionamento')) {
                            icon = <Car className="w-4 h-4" />;
                          }

                          return (
                            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                              {icon}
                              <span className="ml-2 text-sm">{recurso.trim()}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowSalaPreview(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => {
                        handleSalaSelect(selectedSalaDetails.id);
                        setShowSalaPreview(false);
                      }}
                      className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                    >
                      Selecionar Esta Sala
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NovaReserva;
