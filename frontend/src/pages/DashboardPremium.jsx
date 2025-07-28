import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createTheme, ThemeProvider } from '@mui/material/styles';
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
  Logout
} from '@mui/icons-material';
import { format, isToday, isTomorrow, parseISO, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';

const DashboardPremium = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  // Estados principais
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [activeTab, setActiveTab] = useState(0);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [allReservas, setAllReservas] = useState([]);
  
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

  const loadAllData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        logout();
        return;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Carregar dados em paralelo
      const [userResponse, salasResponse, agendamentosResponse] = await Promise.all([
        api.get('/auth'),
        api.get('/salas'),
        api.get('/agendamentos')
      ]);
      
      setUserData(userResponse.data);
      setSalas(Array.isArray(salasResponse.data) ? salasResponse.data : salasResponse.data.results || []);
      
      const reservasData = Array.isArray(agendamentosResponse.data) ? agendamentosResponse.data : agendamentosResponse.data.results || [];
      setReservas(reservasData);
      setAllReservas(reservasData);
      
      // Filtrar reservas de hoje
      const hoje = new Date().toISOString().split('T')[0];
      const reservasHojeFiltered = reservasData.filter(reserva => 
        reserva.data_inicio.startsWith(hoje)
      );
      setReservasHoje(reservasHojeFiltered);
      
      // Filtrar próximas reservas (próximos 7 dias, excluindo hoje)
      const agora = new Date();
      const proximosDias = new Date();
      proximosDias.setDate(agora.getDate() + 7);
      
      const proximasReservasFiltered = reservasData.filter(reserva => {
        const dataReserva = new Date(reserva.data_inicio);
        return dataReserva > agora && dataReserva <= proximosDias && reserva.status === 'agendada';
      }).sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio));
      
      setProximasReservas(proximasReservasFiltered);
      
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
      await api.post('/agendamentos', quickReserva);
      setQuickActionDialog(false);
      setQuickReserva({
        titulo: '',
        sala: '',
        data_inicio: '',
        data_fim: '',
        participantes: 1
      });
      showSnackbar('Reserva criada com sucesso!', 'success');
      loadAllData();
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      showSnackbar('Erro ao criar reserva', 'error');
    }
  };

  const cancelarReserva = async (reservaId) => {
    try {
      await api.delete(`/agendamentos/${reservaId}`);
      showSnackbar('Reserva cancelada com sucesso!', 'success');
      loadAllData();
    } catch (error) {
      console.error('Erro ao cancelar reserva:', error);
      showSnackbar('Erro ao cancelar reserva', 'error');
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
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              label="Visão Geral" 
              icon={<DashboardIcon />} 
              iconPosition="start"
            />
            <Tab 
              label="Análises" 
              icon={<Assessment />} 
              iconPosition="start"
            />
            <Tab 
              label="Relatórios" 
              icon={<BarChart />} 
              iconPosition="start"
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
                    <Box textAlign="center" py={4}>
                      <EventBusy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        Nenhuma reserva próxima encontrada
                      </Typography>
                      <Button 
                        variant="contained" 
                        sx={{ mt: 2 }}
                        onClick={() => setQuickActionDialog(true)}
                        startIcon={<Add />}
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
                            onClick={() => navigate('/salas')}
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
        {activeTab === 1 && (
          <Box>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Análises e Gráficos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gráficos serão implementados em breve...
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Tab de Relatórios */}
        {activeTab === 2 && (
          <Grid container spacing={3}>
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
                      sx={{ height: 10, borderRadius: 5, mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {Math.round(((dashboardData?.salas_ocupadas_agora || 0) / (dashboardData?.total_salas || 1)) * 100)}% das salas estão ocupadas
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                          {dashboardData?.salas_disponiveis_agora || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Disponíveis
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box textAlign="center">
                        <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                          {dashboardData?.salas_ocupadas_agora || 0}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Ocupadas
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Relatório de Atividade */}
            <Grid item xs={12} md={6}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Atividade do Sistema
                  </Typography>
                  
                  <List dense>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          <Event sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Total de Reservas"
                        secondary={`${allReservas.length} reservas registradas`}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                          <CheckCircle sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Reservas Ativas"
                        secondary={`${allReservas.filter(r => r.status === 'agendada').length} reservas agendadas`}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'warning.main', width: 32, height: 32 }}>
                          <Schedule sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Em Andamento"
                        secondary={`${allReservas.filter(r => r.status === 'em_andamento').length} reservas ativas`}
                      />
                    </ListItem>
                    
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'error.main', width: 32, height: 32 }}>
                          <Cancel sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary="Canceladas"
                        secondary={`${allReservas.filter(r => r.status === 'cancelada').length} reservas canceladas`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            {/* Relatório Detalhado */}
            <Grid item xs={12}>
              <Card elevation={3}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="between" sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Relatório Detalhado
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setShowAnalytics(!showAnalytics)}
                      endIcon={showAnalytics ? <ExpandLess /> : <ExpandMore />}
                    >
                      {showAnalytics ? 'Ocultar' : 'Mostrar'} Detalhes
                    </Button>
                  </Box>
                  
                  <Collapse in={showAnalytics}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                            {Math.round(allReservas.length / (salas.length || 1))}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Média de reservas por sala
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                            {Math.round((allReservas.filter(r => r.status !== 'cancelada').length / allReservas.length) * 100) || 0}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Taxa de sucesso
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" color="info.main" sx={{ fontWeight: 'bold' }}>
                            {reservasHoje.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Reservas hoje
                          </Typography>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6} md={3}>
                        <Paper elevation={1} sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h5" color="warning.main" sx={{ fontWeight: 'bold' }}>
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
      </Box>
    </Container>
  );
};

export default DashboardPremium;
