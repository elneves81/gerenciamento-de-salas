import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMediaQuery } from '@mui/material';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Container,
  Paper,
  Avatar,
  Chip,
  Alert,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Snackbar,
  Tabs,
  Tab,
  Switch
} from '@mui/material';
import '../styles/darkMode.css';
import {
  MeetingRoom,
  Event,
  People,
  TrendingUp,
  Add,
  Refresh,
  CalendarToday,
  Schedule,
  Cancel,
  CheckCircle,
  Settings,
  Analytics,
  Notifications,
  Dashboard as DashboardIcon,
  EventAvailable,
  AccessTime,
  LocationOn,
  DarkMode,
  LightMode,
  Close,
  Assessment,
  Logout,
  Today,
  BarChart,
  History,
  Info
} from '@mui/icons-material';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import GraficosInterativosSimples from '../components/GraficosInterativosSimples';
import GoogleCalendarResponsive from '../components/GoogleCalendarResponsive';
import AdminPanel from '../components/AdminPanel';
import NotificationCenter from '../components/NotificationCenter';
import UserHierarchy from '../components/UserHierarchy';
import IntegracaoCalendario from '../components/IntegracaoCalendario';
import EmailTemplates from '../components/EmailTemplates';
import { useNotifications } from '../contexts/NotificationContext';
import useReunioesAutoUpdate from '../hooks/useReunioesAutoUpdate';

const DashboardPremium = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addNotification } = useNotifications();
  const isMobile = useMediaQuery('(max-width:768px)');
  
  // Estados principais consolidados
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    total_salas: 0,
    salas_ocupadas_agora: 0,
    salas_disponiveis_agora: 0,
    minhas_reservas_hoje: 0,
    proximas_reservas: []
  });
  const [salas, setSalas] = useState([]);
  const [allReservas, setAllReservas] = useState([]);
  const [proximasReservas, setProximasReservas] = useState([]);
  const [reservasHoje, setReservasHoje] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de UI simplificados
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [quickActionDialog, setQuickActionDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState(0);
  
  // Estado para nova reserva rápida
  const [quickReserva, setQuickReserva] = useState({
    titulo: '',
    sala: '',
    data_inicio: '',
    data_fim: '',
    participantes: 1
  });

  // Hook para atualização automática de reuniões
  const { verificarReunioesTerminadas } = useReunioesAutoUpdate(allReservas, (reservaAtualizada) => {
    setAllReservas(prev => prev.map(r => r.id === reservaAtualizada.id ? reservaAtualizada : r));
    loadAllData();
  });

  // Função de logout
  const handleLogout = () => {
    logout();
  };
  
  // Função para alternar entre modo claro e escuro
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.body.classList.toggle('dark-mode', newDarkMode);
    showSnackbar(`Modo ${newDarkMode ? 'escuro' : 'claro'} ativado`, 'success');
  };
  
  // Função para recarregar os dados
  const handleRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };
  
  // Aplicar o modo escuro na inicialização
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        loadAllData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        return;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const [userResponse, salasResponse, agendamentosResponse] = await Promise.allSettled([
        api.get('/auth'),
        api.get('/get-salas'),
        api.get('/agendamentos')
      ]);
      
      // Processar resposta do usuário
      if (userResponse.status === 'fulfilled') {
        setUserData(userResponse.value.data);
      }
      
      // Processar resposta das salas
      let salasData = [];
      if (salasResponse.status === 'fulfilled') {
        const responseData = salasResponse.value.data;
        salasData = Array.isArray(responseData) ? responseData : 
                   Array.isArray(responseData?.results) ? responseData.results : 
                   Object.values(responseData || {}).filter(item => item?.id);
        setSalas(salasData);
      } else {
        console.warn('Erro ao carregar salas:', salasResponse.reason);
        setSalas([]);
      }
      
      // Processar resposta dos agendamentos
      let reservasData = [];
      if (agendamentosResponse.status === 'fulfilled') {
        const responseData = agendamentosResponse.value.data;
        reservasData = Array.isArray(responseData) ? responseData : 
                      Array.isArray(responseData?.results) ? responseData.results : 
                      Object.values(responseData || {}).filter(item => item?.id);
        setAllReservas(reservasData);
      } else {
        console.warn('Erro ao carregar agendamentos:', agendamentosResponse.reason);
        setAllReservas([]);
      }
      
      // Calcular estatísticas do dashboard
      const agora = new Date();
      const hoje = agora.toISOString().split('T')[0];
      
      const reservasHojeFiltered = reservasData.filter(reserva => 
        reserva.data_inicio && reserva.data_inicio.startsWith(hoje)
      );
      setReservasHoje(reservasHojeFiltered);
      
      const proximosDias = new Date();
      proximosDias.setDate(agora.getDate() + 7);
      
      const proximasReservasFiltered = reservasData.filter(reserva => {
        if (!reserva.data_inicio) return false;
        const dataReserva = new Date(reserva.data_inicio);
        return dataReserva > agora && 
               dataReserva <= proximosDias && 
               ['agendada', 'em_andamento'].includes(reserva.status);
      }).sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));
      
      setProximasReservas(proximasReservasFiltered);
      
      const salasOcupadasAgora = reservasData.filter(reserva => {
        if (!reserva.data_inicio || !reserva.data_fim) return false;
        const inicio = new Date(reserva.data_inicio);
        const fim = new Date(reserva.data_fim);
        return inicio <= agora && fim >= agora && reserva.status === 'em_andamento';
      }).length;
      
      setDashboardData({
        total_salas: salasData.length,
        salas_ocupadas_agora: salasOcupadasAgora,
        salas_disponiveis_agora: salasData.length - salasOcupadasAgora,
        minhas_reservas_hoje: reservasHojeFiltered.length,
        proximas_reservas: proximasReservasFiltered
      });
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(`Erro ao carregar dados: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleQuickReserva = async () => {
    try {
      if (!quickReserva.titulo || !quickReserva.sala || !quickReserva.data_inicio || !quickReserva.data_fim) {
        showSnackbar('Preencha todos os campos obrigatórios', 'warning');
        return;
      }

      const reservaData = {
        titulo: quickReserva.titulo,
        sala_id: quickReserva.sala,
        data_inicio: quickReserva.data_inicio,
        data_fim: quickReserva.data_fim,
        participantes: quickReserva.participantes
      };

      await api.post('/agendamentos', reservaData);
      setQuickActionDialog(false);
      setQuickReserva({
        titulo: '',
        sala: '',
        data_inicio: '',
        data_fim: '',
        participantes: 1
      });
      showSnackbar('Reserva criada com sucesso!', 'success');
      await loadAllData();
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erro ao criar reserva';
      showSnackbar(errorMessage, 'error');
    }
  };

  const cancelarReserva = async (reservaId) => {
    try {
      await api.patch(`/agendamentos/${reservaId}/cancelar`);
      showSnackbar('Reserva cancelada com sucesso!', 'success');
      await loadAllData();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erro ao cancelar reserva';
      showSnackbar(errorMessage, 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'agendada': return 'primary';
      case 'em_andamento': return 'success';
      case 'concluida': return 'default';
      case 'cancelada': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'agendada': return <Schedule />;
      case 'em_andamento': return <CheckCircle />;
      case 'concluida': return <CheckCircle />;
      case 'cancelada': return <Cancel />;
      default: return <Info />;
    }
  };

  const formatDateTime = (dateString) => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) {
        return `Hoje às ${format(date, 'HH:mm')}`;
      } else if (isTomorrow(date)) {
        return `Amanhã às ${format(date, 'HH:mm')}`;
      } else {
        return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
      }
    } catch {
      return dateString;
    }
  };

  // Memoized calculations para otimizar performance
  const stats = useMemo(() => ({
    salas: {
      total: dashboardData.total_salas,
      ocupadas: dashboardData.salas_ocupadas_agora,
      disponiveis: dashboardData.salas_disponiveis_agora
    },
    reservas: {
      hoje: dashboardData.minhas_reservas_hoje,
      concluidas: allReservas.filter(r => r.status === 'concluida').length,
      agendadas: allReservas.filter(r => r.status === 'agendada').length
    }
  }), [dashboardData, allReservas]);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Carregando Dashboard Premium...
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={loadAllData} startIcon={<Refresh />}>
            Tentar Novamente
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header Premium do Dashboard */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 64, height: 64 }}>
                <DashboardIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  SalaFácil <span style={{fontWeight:400, fontSize:'1.5rem'}}>– Gestão de Salas</span>
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Bem-vindo(a), {userData?.first_name || 'Usuário'}!
                </Typography>
                <Box display="flex" alignItems="center" gap={2} sx={{ mt: 1 }}>
                  <Chip 
                    label={userData?.is_staff ? 'Administrador' : 'Usuário'} 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    size="small"
                  />
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {userData?.email}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Box display="flex" gap={1} alignItems="center">
              <Tooltip title="Sair do Sistema">
                <Button
                  onClick={handleLogout}
                  startIcon={<Logout />}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    boxShadow: 2,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.25)',
                      color: '#f5576c',
                    },
                  }}
                >
                  Sair
                </Button>
              </Tooltip>
              <Tooltip title="Atualizar dados">
                <IconButton 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  sx={{ color: 'white' }}
                >
                  <Refresh className={refreshing ? 'animate-spin' : ''} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Notificações">
                <NotificationCenter />
              </Tooltip>
              <Tooltip title="Configurações">
                <IconButton 
                  onClick={() => setSettingsDialog(true)}
                  sx={{ color: 'white' }}
                >
                  <Settings />
                </IconButton>
              </Tooltip>
              <Tooltip title={darkMode ? "Modo Claro" : "Modo Escuro"}>
                <IconButton 
                  onClick={toggleDarkMode}
                  sx={{ color: 'white' }}
                >
                  {darkMode ? <LightMode /> : <DarkMode />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Paper>

        {/* Cards de Estatísticas Premium */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box flex={1}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stats.salas.total}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total de Salas
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {stats.salas.disponiveis} disponíveis agora
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <MeetingRoom sx={{ fontSize: 28 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box flex={1}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stats.reservas.hoje}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Minhas Reservas Hoje
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {reservasHoje.length} total hoje
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <Event sx={{ fontSize: 28 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box flex={1}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {stats.salas.ocupadas}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Salas em Uso
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {Math.round((stats.salas.ocupadas / (stats.salas.total || 1)) * 100)}% ocupação
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <People sx={{ fontSize: 28 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={4} sx={{ height: '100%', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="between">
                  <Box flex={1}>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                      {proximasReservas.length}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Próximas Reservas
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      Nos próximos 7 dias
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 56, height: 56 }}>
                    <TrendingUp sx={{ fontSize: 28 }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs de Navegação - Simplificadas */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                minWidth: isMobile ? 120 : 'auto',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                padding: isMobile ? '6px 12px' : '12px 16px'
              }
            }}
          >
            <Tab 
              label={isMobile ? "Geral" : "Visão Geral"}
              icon={<DashboardIcon />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Análises" 
              icon={<Assessment />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Calendário" 
              icon={<CalendarToday />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Gráficos" 
              icon={<Analytics />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Admin" 
              icon={<Settings />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Usuários" 
              icon={<People />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Integração" 
              icon={<Event />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Email" 
              icon={<Notifications />} 
              iconPosition={isMobile ? "top" : "start"}
            />
          </Tabs>
        </Paper>

        {/* Conteúdo das Tabs */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {/* Próximas Reservas */}
            <Grid item xs={12} lg={8}>
              <Card elevation={3} sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="between" sx={{ mb: 2 }}>
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                      <EventAvailable sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Próximas Reservas
                    </Typography>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => navigate('/reservas')}
                      startIcon={<Analytics />}
                    >
                      Ver Todas
                    </Button>
                  </Box>
                  
                  {proximasReservas.length > 0 ? (
                    <List>
                      {proximasReservas.slice(0, 5).map((reserva, index) => (
                        <React.Fragment key={reserva.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar sx={{ bgcolor: getStatusColor(reserva.status) + '.main' }}>
                                {getStatusIcon(reserva.status)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {reserva.titulo}
                                  </Typography>
                                  <Chip 
                                    label={reserva.status} 
                                    color={getStatusColor(reserva.status)}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box sx={{ mt: 1 }}>
                                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <LocationOn sx={{ fontSize: 16 }} />
                                    {reserva.sala_nome}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <AccessTime sx={{ fontSize: 16 }} />
                                    {formatDateTime(reserva.data_inicio)}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                                    <People sx={{ fontSize: 16 }} />
                                    {reserva.participantes} participantes
                                  </Typography>
                                </Box>
                              }
                            />
                            <ListItemSecondaryAction>
                              {reserva.status === 'agendada' && (
                                <Tooltip title="Cancelar reserva">
                                  <IconButton 
                                    edge="end" 
                                    color="error"
                                    onClick={() => cancelarReserva(reserva.id)}
                                  >
                                    <Cancel />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </ListItemSecondaryAction>
                          </ListItem>
                          {index < proximasReservas.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box textAlign="center" py={4}>
                      <History sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Nenhuma reserva próxima
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Você não tem reservas agendadas no momento
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<Add />}
                        onClick={() => setQuickActionDialog(true)}
                      >
                        Criar Nova Reserva
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Ações Rápidas e Status */}
            <Grid item xs={12} lg={4}>
              <Grid container spacing={2}>
                {/* Ações Rápidas */}
                <Grid item xs={12}>
                  <Card elevation={3}>
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        <DashboardIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Ações Rápidas
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => setQuickActionDialog(true)}
                            sx={{ mb: 1 }}
                          >
                            Nova Reserva
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<CalendarToday />}
                            onClick={() => navigate('/reservas')}
                            sx={{ mb: 1 }}
                          >
                            Ver Agenda
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<MeetingRoom />}
                            onClick={() => navigate('/gerenciar-salas')}
                          >
                            Ver Salas
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Analytics />}
                            onClick={() => navigate('/relatorios')}
                          >
                            Relatórios
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Status das Salas */}
                <Grid item xs={12}>
                  <Card elevation={3}>
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Status das Salas
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="between" alignItems="center" sx={{ mb: 1 }}>
                          <Typography variant="body2">Ocupação Atual</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {Math.round((stats.salas.ocupadas / (stats.salas.total || 1)) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(stats.salas.ocupadas / (stats.salas.total || 1)) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      
                      <Box display="flex" justifyContent="between" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="success.main">
                          ● Disponíveis: {stats.salas.disponiveis}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          ● Ocupadas: {stats.salas.ocupadas}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Reservas de Hoje */}
                <Grid item xs={12}>
                  <Card elevation={3}>
                    <CardContent>
                      <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                        <Today sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Reservas de Hoje
                      </Typography>
                      {reservasHoje.length > 0 ? (
                        <List dense>
                          {reservasHoje.slice(0, 3).map((reserva) => (
                            <ListItem key={reserva.id} disablePadding>
                              <ListItemText
                                primary={reserva.titulo}
                                secondary={`${reserva.sala_nome} - ${format(parseISO(reserva.data_inicio), 'HH:mm')}`}
                              />
                              <Chip 
                                label={reserva.status} 
                                color={getStatusColor(reserva.status)}
                                size="small"
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                          Nenhuma reserva para hoje
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}

        {/* Tab de Análises */}
        {activeTab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h5" gutterBottom>
              Análises e Métricas
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Ocupação das Salas
                    </Typography>
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <BarChart sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        Dados de análise em desenvolvimento
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Estatísticas Gerais
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Total de Reservas" 
                          secondary={`${allReservas.length} reservas no sistema`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Taxa de Ocupação" 
                          secondary={`${Math.round((stats.salas.ocupadas / (stats.salas.total || 1)) * 100)}% das salas em uso`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Reservas Hoje" 
                          secondary={`${reservasHoje.length} reservas agendadas`}
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Tab de Calendário */}
        {activeTab === 2 && (
          <Box sx={{ mt: 2, height: { xs: 'auto', md: '70vh' } }}>
            <GoogleCalendarResponsive reservas={allReservas} salas={salas} />
          </Box>
        )}

        {/* Tab de Gráficos */}
        {activeTab === 3 && (
          <Box sx={{ mt: 2 }}>
            <GraficosInterativosSimples reservas={allReservas} salas={salas} />
          </Box>
        )}

        {/* Tab de Admin */}
        {activeTab === 4 && (
          <Box sx={{ mt: 2 }}>
            <AdminPanel />
          </Box>
        )}

        {/* Tab de Usuários */}
        {activeTab === 5 && (
          <Box sx={{ mt: 2 }}>
            <UserHierarchy />
          </Box>
        )}

        {/* Tab de Integração */}
        {activeTab === 6 && (
          <Box sx={{ mt: 2 }}>
            <IntegracaoCalendario 
              reservas={allReservas} 
              salas={salas}
              onNovaReserva={() => navigate('/nova-reserva')}
              onEditarReserva={(id) => navigate(`/reservas?edit=${id}`)}
              onDeletarReserva={cancelarReserva}
            />
          </Box>
        )}

        {/* Tab de Email */}
        {activeTab === 7 && (
          <Box sx={{ mt: 2 }}>
            <EmailTemplates />
          </Box>
        )}

        {/* FAB para Nova Reserva */}
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setQuickActionDialog(true)}
        >
          <Add />
        </Fab>

        {/* Dialog para Nova Reserva Rápida */}
        <Dialog open={quickActionDialog} onClose={() => setQuickActionDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Nova Reserva Rápida</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Título da Reserva"
                value={quickReserva.titulo}
                onChange={(e) => setQuickReserva({...quickReserva, titulo: e.target.value})}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Sala</InputLabel>
                <Select
                  value={quickReserva.sala}
                  onChange={(e) => setQuickReserva({...quickReserva, sala: e.target.value})}
                >
                  {salas.map((sala) => (
                    <MenuItem key={sala.id} value={sala.id}>
                      {sala.nome} (Cap: {sala.capacidade})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="datetime-local"
                label="Data/Hora Início"
                value={quickReserva.data_inicio}
                onChange={(e) => setQuickReserva({...quickReserva, data_inicio: e.target.value})}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="datetime-local"
                label="Data/Hora Fim"
                value={quickReserva.data_fim}
                onChange={(e) => setQuickReserva({...quickReserva, data_fim: e.target.value})}
                sx={{ mb: 2 }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                type="number"
                label="Número de Participantes"
                value={quickReserva.participantes}
                onChange={(e) => setQuickReserva({...quickReserva, participantes: parseInt(e.target.value)})}
                inputProps={{ min: 1 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQuickActionDialog(false)}>Cancelar</Button>
            <Button onClick={handleQuickReserva} variant="contained">Criar Reserva</Button>
          </DialogActions>
        </Dialog>

        {/* Diálogo de Configurações */}
        <Dialog open={settingsDialog} onClose={() => setSettingsDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Configurações</Typography>
              <IconButton onClick={() => setSettingsDialog(false)} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Tema" 
                  secondary="Altere entre modo claro e escuro"
                />
                <Switch 
                  edge="end"
                  checked={darkMode}
                  onChange={toggleDarkMode}
                  color="primary"
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Notificações" 
                  secondary="Receber notificações do sistema"
                />
                <Switch edge="end" defaultChecked color="primary" />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Atualização Automática" 
                  secondary="Atualizar dados a cada 30 segundos"
                />
                <Switch edge="end" defaultChecked color="primary" />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText 
                  primary="Versão do Sistema" 
                  secondary="SalaFácil v2.0.0 - Otimizado"
                />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSettingsDialog(false)}>Fechar</Button>
            <Button onClick={() => setSettingsDialog(false)} variant="contained" color="primary">
              Salvar Alterações
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar para notificações do sistema */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default DashboardPremium;
