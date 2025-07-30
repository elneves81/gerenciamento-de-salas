import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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
  Badge,
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
  Collapse,
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
  Warning,
  Info,
  Settings,
  Analytics,
  Notifications,
  Dashboard as DashboardIcon,
  EventAvailable,
  EventBusy,
  AccessTime,
  LocationOn,
  DarkMode,
  LightMode,
  Close,
  PersonAdd,
  Edit,
  Delete,
  Visibility,
  FilterList,
  Search,
  Today,
  ViewWeek,
  BarChart,
  PieChart,
  ExpandMore,
  ExpandLess,
  Assessment,
  Logout,
  History,
  Lightbulb,
  Room
} from '@mui/icons-material';
import { format, isToday, isTomorrow, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import ChatSystem from '../components/ChatSystem';
import SalaFacilLogo from '../components/SalaFacilLogo';
import GraficosInterativosSimples from '../components/GraficosInterativosSimples';
import RelatoriosAvancados from '../components/RelatoriosAvancados';
import GoogleCalendarResponsive from '../components/GoogleCalendarResponsive';
import CalendarioEstilizado from '../components/CalendarioEstilizado';
import { useNotifications, useAutoNotifications } from '../components/NotificationSystem';
import useReunioesAutoUpdate from '../hooks/useReunioesAutoUpdate';

const DashboardPremium = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { addNotification } = useNotifications();
  
  // Estados principais
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    total_salas: 0,
    salas_ocupadas_agora: 0,
    salas_disponiveis_agora: 0,
    minhas_reservas_hoje: 0,
    proximas_reservas: []
  });
  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [proximasReservas, setProximasReservas] = useState([]);
  const [reservasHoje, setReservasHoje] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados de UI
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [selectedPeriod, setSelectedPeriod] = useState('hoje');
  const [quickActionDialog, setQuickActionDialog] = useState(false);
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [allReservas, setAllReservas] = useState([]);
  
  // Responsividade
  const isMobile = useMediaQuery('(max-width:768px)');
  
  // Estados para análises e relatórios
  const [analytics, setAnalytics] = useState({
    ocupacao: [],
    utilizacao: [],
    tendencias: [],
    relatorios: []
  });
  const [reportData, setReportData] = useState({
    period: 'week',
    loading: false,
    data: []
  });
  
  // Estados para nova reserva rápida
  const [quickReserva, setQuickReserva] = useState({
    titulo: '',
    sala: '',
    data_inicio: '',
    data_fim: '',
    participantes: 1
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
    setLoading(true);
    loadAllData();
  };
  
  // Aplicar o modo escuro na inicialização
  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    loadAllData();
    // Atualizar dados a cada 30 segundos apenas se o usuário estiver logado
    const interval = setInterval(() => {
      const token = localStorage.getItem('token');
      if (token) {
        loadAllData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Hook para notificações automáticas
  const { notifyReservationEvent } = useAutoNotifications(reservas);

  // Hook para atualização automática de reuniões
  const { verificarReunioesTerminadas } = useReunioesAutoUpdate(allReservas, (reservaAtualizada) => {
    // Callback para quando uma reserva é atualizada automaticamente
    setAllReservas(prev => prev.map(r => r.id === reservaAtualizada.id ? reservaAtualizada : r));
    loadAllData(); // Recarregar dados para sincronizar
  });

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        return;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Carregar dados em paralelo com error handling
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
        if (Array.isArray(responseData)) {
          salasData = responseData;
        } else if (responseData && Array.isArray(responseData.results)) {
          salasData = responseData.results;
        } else if (responseData && typeof responseData === 'object') {
          // Se for um objeto, tenta extrair array
          salasData = Object.values(responseData).filter(item => 
            item && typeof item === 'object' && item.id
          );
        }
        setSalas(Array.isArray(salasData) ? salasData : []);
      } else {
        console.warn('Erro ao carregar salas:', salasResponse.reason);
        setSalas([]);
      }
      
      // Processar resposta dos agendamentos
      let reservasData = [];
      if (agendamentosResponse.status === 'fulfilled') {
        const responseData = agendamentosResponse.value.data;
        if (Array.isArray(responseData)) {
          reservasData = responseData;
        } else if (responseData && Array.isArray(responseData.results)) {
          reservasData = responseData.results;
        } else if (responseData && typeof responseData === 'object') {
          // Se for um objeto, tenta extrair array
          reservasData = Object.values(responseData).filter(item => 
            item && typeof item === 'object' && item.id
          );
        }
        setReservas(Array.isArray(reservasData) ? reservasData : []);
        setAllReservas(Array.isArray(reservasData) ? reservasData : []);
      } else {
        console.warn('Erro ao carregar agendamentos:', agendamentosResponse.reason);
        setReservas([]);
        setAllReservas([]);
      }
      
      // Calcular estatísticas do dashboard
      const agora = new Date();
      const hoje = agora.toISOString().split('T')[0];
      
      // Filtrar reservas de hoje
      const reservasHojeFiltered = reservasData.filter(reserva => 
        reserva.data_inicio && reserva.data_inicio.startsWith(hoje)
      );
      setReservasHoje(reservasHojeFiltered);
      
      // Filtrar próximas reservas (próximos 7 dias)
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
      
      // Calcular salas ocupadas agora
      const salasOcupadasAgora = reservasData.filter(reserva => {
        if (!reserva.data_inicio || !reserva.data_fim) return false;
        const inicio = new Date(reserva.data_inicio);
        const fim = new Date(reserva.data_fim);
        return inicio <= agora && fim >= agora && reserva.status === 'em_andamento';
      }).length;
      
      // Atualizar dados do dashboard
      setDashboardData({
        total_salas: salasData.length,
        salas_ocupadas_agora: salasOcupadasAgora,
        salas_disponiveis_agora: salasData.length - salasOcupadasAgora,
        minhas_reservas_hoje: reservasHojeFiltered.length,
        proximas_reservas: proximasReservasFiltered
      });
      
      // Calcular dados de análise
      generateAnalyticsData(reservasData, salasData);
      
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError(`Erro ao carregar dados: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Função para gerar dados de análise
  const generateAnalyticsData = (reservasData, salasData) => {
    try {
      const hoje = new Date();
      const ultimos7Dias = Array.from({length: 7}, (_, i) => {
        const data = new Date(hoje);
        data.setDate(hoje.getDate() - i);
        return data.toISOString().split('T')[0];
      }).reverse();
      
      const ocupacaoPorDia = ultimos7Dias.map(dia => {
        const reservasDoDia = reservasData.filter(r => 
          r.data_inicio && r.data_inicio.startsWith(dia)
        );
        return {
          dia: format(new Date(dia), 'dd/MM', { locale: ptBR }),
          ocupacao: reservasDoDia.length,
          disponivel: salasData.length - reservasDoDia.length
        };
      });
      
      const utilizacaoPorSala = salasData.map(sala => {
        const reservasDaSala = reservasData.filter(r => r.sala_id === sala.id);
        return {
          sala: sala.nome,
          total: reservasDaSala.length,
          ativas: reservasDaSala.filter(r => r.status === 'agendada').length,
          utilizacao: Math.round((reservasDaSala.length / (reservasData.length || 1)) * 100)
        };
      });
      
      setAnalytics({
        ocupacao: ocupacaoPorDia,
        utilizacao: utilizacaoPorSala,
        tendencias: reservasData.slice(-10),
        relatorios: reservasData
      });
    } catch (error) {
      console.error('Erro ao gerar dados de análise:', error);
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

  // Calcular estatísticas para o dashboard interativo
  const salasStats = {
    total: dashboardData.total_salas,
    ocupadas: dashboardData.salas_ocupadas_agora,
    disponiveis: dashboardData.salas_disponiveis_agora
  };

  const reservasStats = {
    hoje: dashboardData.minhas_reservas_hoje,
    concluidas: reservas.filter(r => r.status === 'concluida').length,
    agendadas: reservas.filter(r => r.status === 'agendada').length
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header Premium do Dashboard */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={3}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 80, height: 60, borderRadius: 2 }}>
                <SalaFacilLogo 
                  size="small" 
                  sx={{ 
                    filter: 'brightness(0) invert(1)',
                    width: 70,
                    height: 50
                  }} 
                />
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
              {/* Botão de Logout */}
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
                <IconButton 
                  onClick={() => setNotificationDialog(true)}
                  sx={{ color: 'white' }}
                >
                  <Badge badgeContent={proximasReservas.length} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
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
                      {dashboardData?.total_salas || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total de Salas
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {dashboardData?.salas_disponiveis_agora || 0} disponíveis agora
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
                      {dashboardData?.minhas_reservas_hoje || 0}
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
                      {dashboardData?.salas_ocupadas_agora || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Salas em Uso
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                      {Math.round(((dashboardData?.salas_ocupadas_agora || 0) / (dashboardData?.total_salas || 1)) * 100)}% ocupação
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

        {/* Tabs de Navegação */}
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
                padding: isMobile ? '6px 12px' : '12px 16px',
                fontWeight: 'bold'
              }
            }}
          >
            <Tab 
              label={isMobile ? "Dashboard" : "Visão Geral"}
              icon={<DashboardIcon />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label={isMobile ? "Calendário" : "📅 Calendário de Reuniões"} 
              icon={<CalendarToday />} 
              iconPosition={isMobile ? "top" : "start"}
              sx={{ 
                backgroundColor: activeTab === 1 ? 'primary.light' : 'transparent',
                color: activeTab === 1 ? 'primary.contrastText' : 'inherit',
                '&:hover': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText'
                }
              }}
            />
            <Tab 
              label="Análises" 
              icon={<Assessment />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Relatórios" 
              icon={<BarChart />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Gráficos" 
              icon={<Analytics />} 
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
                      startIcon={<Visibility />}
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
                    <Box>
                      {/* Dashboard Interativo quando não há reservas */}
                      <Grid container spacing={3}>
                        {/* Ações Rápidas */}
                        <Grid item xs={12} md={6}>
                          <Box textAlign="center" p={3} sx={{ 
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 3,
                            color: 'white'
                          }}>
                            <Add sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                              Nova Reserva
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                              Agende uma sala rapidamente
                            </Typography>
                            <Button 
                              variant="contained" 
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                              }}
                              onClick={() => setQuickActionDialog(true)}
                              startIcon={<Add />}
                            >
                              Criar Agora
                            </Button>
                          </Box>
                        </Grid>

                        {/* Salas Disponíveis Agora */}
                        <Grid item xs={12} md={6}>
                          <Box textAlign="center" p={3} sx={{ 
                            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                            borderRadius: 3,
                            color: 'white'
                          }}>
                            <MeetingRoom sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                              Salas Livres
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                              {salasStats.disponiveis} salas disponíveis agora
                            </Typography>
                            <Button 
                              variant="contained"
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                              }}
                              onClick={() => navigate('/reservas')}
                              startIcon={<Visibility />}
                            >
                              Ver Salas
                            </Button>
                          </Box>
                        </Grid>

                        {/* Histórico Recente */}
                        <Grid item xs={12} md={6}>
                          <Box textAlign="center" p={3} sx={{ 
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            borderRadius: 3,
                            color: 'white'
                          }}>
                            <History sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                              Histórico
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
                              {reservasStats.concluidas} reservas concluídas
                            </Typography>
                            <Button 
                              variant="contained"
                              sx={{ 
                                bgcolor: 'rgba(255,255,255,0.2)',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                              }}
                              onClick={() => navigate('/reservas?status=concluida')}
                              startIcon={<BarChart />}
                            >
                              Ver Relatório
                            </Button>
                          </Box>
                        </Grid>

                        {/* Dicas e Recursos */}
                        <Grid item xs={12} md={6}>
                          <Box textAlign="center" p={3} sx={{ 
                            background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                            borderRadius: 3,
                            color: '#8B4513'
                          }}>
                            <Lightbulb sx={{ fontSize: 40, mb: 1 }} />
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                              Dicas do Sistema
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
                              Otimize o uso das suas salas
                            </Typography>
                            <Button 
                              variant="contained"
                              sx={{ 
                                bgcolor: 'rgba(139,69,19,0.2)',
                                color: '#8B4513',
                                '&:hover': { bgcolor: 'rgba(139,69,19,0.3)' }
                              }}
                              onClick={() => setShowTips(true)}
                              startIcon={<Info />}
                            >
                              Ver Dicas
                            </Button>
                          </Box>
                        </Grid>

                        {/* Estatísticas Rápidas */}
                        <Grid item xs={12}>
                          <Card sx={{ background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                            <CardContent>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                📊 Resumo do Dia
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={3}>
                                  <Box textAlign="center">
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                                      {reservasStats.hoje}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Reservas Hoje
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={3}>
                                  <Box textAlign="center">
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#388e3c' }}>
                                      {salasStats.disponiveis}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Salas Livres
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={3}>
                                  <Box textAlign="center">
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
                                      {salasStats.ocupadas}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Em Uso
                                    </Typography>
                                  </Box>
                                </Grid>
                                <Grid item xs={3}>
                                  <Box textAlign="center">
                                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#7b1fa2' }}>
                                      {Math.round((salasStats.ocupadas / salasStats.total) * 100) || 0}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Ocupação
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
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
                            onClick={() => navigate('/salas')}
                          >
                            Ver Salas
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Settings />}
                            onClick={() => navigate('/gerenciar-salas')}
                          >
                            Gerenciar Salas
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
                            {Math.round(((dashboardData?.salas_ocupadas_agora || 0) / (dashboardData?.total_salas || 1)) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={((dashboardData?.salas_ocupadas_agora || 0) / (dashboardData?.total_salas || 1)) * 100}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      
                      <Box display="flex" justifyContent="between" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="success.main">
                          ● Disponíveis: {dashboardData?.salas_disponiveis_agora || 0}
                        </Typography>
                        <Typography variant="body2" color="error.main">
                          ● Ocupadas: {dashboardData?.salas_ocupadas_agora || 0}
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
        {activeTab === 2 && (
          <Grid container spacing={3}>
            {/* Gráfico de Ocupação por Dia */}
            <Grid item xs={12} lg={8}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Ocupação dos Últimos 7 Dias
                  </Typography>
                  {analytics.ocupacao?.length > 0 ? (
                    <Box sx={{ mt: 2 }}>
                      {analytics.ocupacao.map((item, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {item.dia}
                            </Typography>
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                              {item.ocupacao} reservas
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min((item.ocupacao / (salas.length || 1)) * 100, 100)}
                            sx={{ 
                              height: 8, 
                              borderRadius: 4,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: `linear-gradient(45deg, #667eea 30%, #764ba2 90%)`
                              }
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <BarChart sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        Dados de análise indisponíveis
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Utilização por Sala */}
            <Grid item xs={12} lg={4}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    <PieChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Utilização por Sala
                  </Typography>
                  {analytics.utilizacao?.length > 0 ? (
                    <List dense>
                      {analytics.utilizacao.slice(0, 6).map((sala, index) => (
                        <ListItem key={index} sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar 
                              sx={{ 
                                bgcolor: `hsl(${(index * 60) % 360}, 70%, 50%)`,
                                width: 32,
                                height: 32
                              }}
                            >
                              <MeetingRoom sx={{ fontSize: 16 }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {sala.sala}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {sala.total} reservas • {sala.ativas} ativas
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={sala.utilizacao}
                                  sx={{ 
                                    mt: 0.5, 
                                    height: 4, 
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(0,0,0,0.1)',
                                    '& .MuiLinearProgress-bar': {
                                      borderRadius: 2,
                                      backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)`
                                    }
                                  }}
                                />
                              </Box>
                            }
                          />
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', ml: 1 }}>
                            {sala.utilizacao}%
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <PieChart sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                      <Typography variant="body2" color="text.secondary">
                        Nenhum dado disponível
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Tendências Recentes */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Atividade Recente
                  </Typography>
                  {analytics.tendencias?.length > 0 ? (
                    <List>
                      {analytics.tendencias.slice(0, 5).map((reserva, index) => (
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
                                  <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
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
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    📍 {reserva.sala_nome} • ⏰ {formatDateTime(reserva.data_inicio)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                          {index < analytics.tendencias.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ py: 4, textAlign: 'center' }}>
                      <Analytics sx={{ fontSize: 64, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        Nenhuma atividade recente
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab de Relatórios */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            {/* Controles de Filtro */}
            <Grid item xs={12}>
              <Card elevation={2} sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      <FilterList sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Filtros de Relatório
                    </Typography>
                    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Período</InputLabel>
                        <Select
                          value={reportData.period}
                          onChange={(e) => setReportData({...reportData, period: e.target.value})}
                        >
                          <MenuItem value="week">Esta Semana</MenuItem>
                          <MenuItem value="month">Este Mês</MenuItem>
                          <MenuItem value="quarter">Este Trimestre</MenuItem>
                          <MenuItem value="year">Este Ano</MenuItem>
                        </Select>
                      </FormControl>
                      <Button
                        variant="contained"
                        startIcon={<Refresh />}
                        onClick={loadAllData}
                        disabled={refreshing}
                        size="small"
                      >
                        Atualizar
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Métricas Principais */}
            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48, mx: 'auto', mb: 1 }}>
                    <Event sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {allReservas.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total de Reservas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48, mx: 'auto', mb: 1 }}>
                    <CheckCircle sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {allReservas.filter(r => r.status === 'agendada').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Reservas Ativas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48, mx: 'auto', mb: 1 }}>
                    <Schedule sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {allReservas.filter(r => r.status === 'em_andamento').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Em Andamento
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card elevation={3} sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 48, height: 48, mx: 'auto', mb: 1 }}>
                    <Cancel sx={{ fontSize: 24 }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {allReservas.filter(r => r.status === 'cancelada').length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Canceladas
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Relatório de Ocupação */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Relatório de Ocupação
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Taxa de ocupação geral do sistema
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={((dashboardData?.salas_ocupadas_agora || 0) / (dashboardData?.total_salas || 1)) * 100}
                      sx={{ 
                        height: 12, 
                        borderRadius: 6, 
                        mb: 1,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)'
                        }
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(((dashboardData?.salas_ocupadas_agora || 0) / (dashboardData?.total_salas || 1)) * 100)}% das salas estão ocupadas
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center" sx={{ p: 1, borderRadius: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {dashboardData?.salas_disponiveis_agora || 0}
                        </Typography>
                        <Typography variant="body2">
                          Disponíveis
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center" sx={{ p: 1, borderRadius: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {dashboardData?.salas_ocupadas_agora || 0}
                        </Typography>
                        <Typography variant="body2">
                          Ocupadas
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Atividade do Sistema */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Atividade do Sistema
                  </Typography>
                  
                  <List dense>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                          <Event sx={{ fontSize: 20 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            Total de Reservas
                          </Typography>
                        }
                        secondary={`${allReservas.length} reservas registradas no sistema`}
                      />
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        {allReservas.length}
                      </Typography>
                    </ListItem>
                    
                    <Divider variant="inset" component="li" />
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main', width: 40, height: 40 }}>
                          <CheckCircle sx={{ fontSize: 20 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            Taxa de Sucesso
                          </Typography>
                        }
                        secondary={`${Math.round((allReservas.filter(r => r.status !== 'cancelada').length / (allReservas.length || 1)) * 100)}% das reservas não foram canceladas`}
                      />
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                        {Math.round((allReservas.filter(r => r.status !== 'cancelada').length / (allReservas.length || 1)) * 100)}%
                      </Typography>
                    </ListItem>
                    
                    <Divider variant="inset" component="li" />
                    
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'info.main', width: 40, height: 40 }}>
                          <Today sx={{ fontSize: 20 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            Reservas Hoje
                          </Typography>
                        }
                        secondary={`${reservasHoje.length} reservas agendadas para hoje`}
                      />
                      <Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>
                        {reservasHoje.length}
                      </Typography>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Relatório Detalhado */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Relatório Detalhado
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        endIcon={showAnalytics ? <ExpandLess /> : <ExpandMore />}
                      >
                        {showAnalytics ? 'Ocultar' : 'Mostrar'} Detalhes
                      </Button>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Analytics />}
                        onClick={() => navigate('/relatorios')}
                      >
                        Ver Relatório Completo
                      </Button>
                    </Box>
                  </Box>
                  
                  <Collapse in={showAnalytics}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center', 
                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                            border: '1px solid rgba(102, 126, 234, 0.2)'
                          }}
                        >
                          <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {Math.round(allReservas.length / (salas.length || 1))}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Média de reservas por sala
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)',
                            border: '1px solid rgba(76, 175, 80, 0.2)'
                          }}
                        >
                          <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {Math.round((allReservas.filter(r => r.status !== 'cancelada').length / (allReservas.length || 1)) * 100)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Taxa de sucesso
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(21, 101, 192, 0.1) 100%)',
                            border: '1px solid rgba(33, 150, 243, 0.2)'
                          }}
                        >
                          <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {reservasHoje.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reservas hoje
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper 
                          elevation={2} 
                          sx={{ 
                            p: 2, 
                            textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(245, 124, 0, 0.1) 100%)',
                            border: '1px solid rgba(255, 152, 0, 0.2)'
                          }}
                        >
                          <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {proximasReservas.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Próximas reservas
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Collapse>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Tab de Calendário - Aba Principal de Reuniões */}
        {activeTab === 1 && (
          <Box sx={{ mt: 2, height: 'calc(100vh - 200px)' }}>
            <CalendarioEstilizado 
              reservas={allReservas} 
              salas={salas} 
              onNovaReserva={loadAllData}
            />
          </Box>
        )}

        {/* Tab de Gráficos */}
        {activeTab === 4 && (
          <Box sx={{ mt: 2 }}>
            <GraficosInterativosSimples reservas={allReservas} salas={salas} />
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

        {/* Snackbar para notificações */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({...snackbar, open: false})}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Diálogo de Notificações */}
        <Dialog open={notificationDialog} onClose={() => setNotificationDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Notificações</Typography>
              <IconButton onClick={() => setNotificationDialog(false)} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            {proximasReservas.length > 0 ? (
              <List>
                {proximasReservas.slice(0, 5).map((reserva) => (
                  <ListItem key={reserva.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: getStatusColor(reserva.status) + '.main' }}>
                        {getStatusIcon(reserva.status)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={reserva.titulo}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {reserva.sala_nome}
                          </Typography>
                          {" — "}
                          {formatDateTime(reserva.data_inicio)}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Notifications sx={{ fontSize: 60, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="body1" color="text.secondary">
                  Nenhuma notificação no momento
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNotificationDialog(false)}>Fechar</Button>
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
                  secondary="SalaFácil v1.0.0"
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
        
        {/* Sistema de Chat Global */}
        <ChatSystem />
      </Box>
    </Container>
  );
};

export default DashboardPremium;
