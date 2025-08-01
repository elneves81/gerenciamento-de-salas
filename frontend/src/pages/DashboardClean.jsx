import React, { useState, useEffect } from 'react';
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
  Fab,
  Snackbar,
  Switch
} from '@mui/material';
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
  BarChart
} from '@mui/icons-material';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import salasService from '../services/salasService';
import agendamentosService from '../services/agendamentosService';
import { useNotifications } from '../contexts/NotificationContext';

const DashboardClean = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addNotification } = useNotifications();
  const isMobile = useMediaQuery('(max-width:768px)');
  
  // Estados principais
  const [dashboardData, setDashboardData] = useState({
    total_salas: 0,
    salas_ocupadas_agora: 0,
    salas_disponiveis_agora: 0,
    minhas_reservas_hoje: 0,
    proximas_reservas: []
  });
  const [salas, setSalas] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando dados do dashboard...');

      // Carregar salas
      const salasData = await salasService.listarSalas();
      setSalas(Array.isArray(salasData) ? salasData : []);
      console.log('✅ Salas carregadas:', salasData?.length || 0);

      // Carregar agendamentos
      const agendamentosData = await agendamentosService.listarAgendamentos();
      setAgendamentos(Array.isArray(agendamentosData) ? agendamentosData : []);
      console.log('✅ Agendamentos carregados:', agendamentosData?.length || 0);

      // Processar dados para o dashboard
      const hoje = new Date();
      const proximasReservas = Array.isArray(agendamentosData) 
        ? agendamentosData
            .filter(ag => new Date(ag.data_inicio) >= hoje)
            .sort((a, b) => new Date(a.data_inicio) - new Date(b.data_inicio))
            .slice(0, 5)
        : [];

      const reservasHoje = Array.isArray(agendamentosData)
        ? agendamentosData.filter(ag => {
            const dataAgendamento = new Date(ag.data_inicio);
            return isToday(dataAgendamento) && ag.usuario_id === user?.id;
          }).length
        : 0;

      setDashboardData({
        total_salas: Array.isArray(salasData) ? salasData.length : 0,
        salas_ocupadas_agora: 0, // Calcular baseado em agendamentos ativos
        salas_disponiveis_agora: Array.isArray(salasData) ? salasData.length : 0,
        minhas_reservas_hoje: reservasHoje,
        proximas_reservas: proximasReservas
      });

    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      setSnackbar({
        open: true,
        message: 'Erro ao carregar dados do dashboard',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatarDataHora = (dataISO) => {
    try {
      const data = parseISO(dataISO);
      return format(data, "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch {
      return 'Data inválida';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmado': return 'success';
      case 'cancelado': return 'error';
      case 'pendente': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'confirmado': return 'Confirmado';
      case 'cancelado': return 'Cancelado';
      case 'pendente': return 'Pendente';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <LinearProgress sx={{ width: '100%', maxWidth: 400 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Dashboard SalaFácil
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Bem-vindo, {user?.first_name || user?.nome || 'Usuário'}!
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          <Tooltip title="Alternar tema">
            <IconButton onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Atualizar dados">
            <IconButton onClick={loadDashboardData}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/nova-reserva')}
            sx={{ ml: 2 }}
          >
            Nova Reserva
          </Button>
        </Box>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <MeetingRoom />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Total de Salas
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.total_salas}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Disponíveis Agora
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.salas_disponiveis_agora}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Ocupadas Agora
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.salas_ocupadas_agora}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <Today />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Minhas Reservas Hoje
                  </Typography>
                  <Typography variant="h4">
                    {dashboardData.minhas_reservas_hoje}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Conteúdo Principal */}
      <Grid container spacing={3}>
        {/* Próximas Reservas */}
        <Grid item xs={12} lg={8}>
          <Card elevation={3}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
                <Typography variant="h6" component="h2">
                  <EventAvailable sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Próximas Reservas
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  startIcon={<CalendarToday />}
                  onClick={() => navigate('/reservas')}
                >
                  Ver Todas
                </Button>
              </Box>

              {dashboardData.proximas_reservas.length > 0 ? (
                <List>
                  {dashboardData.proximas_reservas.map((reserva, index) => (
                    <React.Fragment key={reserva.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Schedule />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle1" component="span">
                                {reserva.titulo || 'Reunião'}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={getStatusLabel(reserva.status)}
                                color={getStatusColor(reserva.status)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography component="span" variant="body2" color="text.primary">
                                <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                {reserva.sala_nome}
                              </Typography>
                              <br />
                              <Typography component="span" variant="body2" color="text.secondary">
                                <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                {formatarDataHora(reserva.data_inicio)}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="Ver detalhes">
                            <IconButton edge="end" onClick={() => navigate('/reservas')}>
                              <Event />
                            </IconButton>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < dashboardData.proximas_reservas.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Nenhuma reserva próxima encontrada.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Ações Rápidas */}
        <Grid item xs={12} lg={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                Ações Rápidas
              </Typography>
              
              <Box display="flex" flexDirection="column" gap={2} mt={2}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<Add />}
                  onClick={() => navigate('/nova-reserva')}
                >
                  Nova Reserva
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<CalendarToday />}
                  onClick={() => navigate('/reservas')}
                >
                  Minhas Reservas
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<MeetingRoom />}
                  onClick={() => navigate('/salas')}
                >
                  Gerenciar Salas
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<Analytics />}
                  onClick={() => navigate('/relatorios')}
                >
                  Relatórios
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Salas Disponíveis */}
          <Card elevation={3} sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                <MeetingRoom sx={{ mr: 1, verticalAlign: 'middle' }} />
                Salas Disponíveis
              </Typography>
              
              {salas.length > 0 ? (
                <List dense>
                  {salas.slice(0, 5).map((sala) => (
                    <ListItem key={sala.id}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'success.main', width: 32, height: 32 }}>
                          <MeetingRoom sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={sala.nome}
                        secondary={`${sala.capacidade} pessoas`}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title="Reservar sala">
                          <IconButton 
                            edge="end" 
                            size="small"
                            onClick={() => navigate(`/nova-reserva?sala=${sala.id}`)}
                          >
                            <Add />
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Alert severity="warning">
                  Nenhuma sala disponível no momento.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* FAB para Nova Reserva */}
      <Fab
        color="primary"
        aria-label="nova reserva"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', lg: 'none' } // Só mostra no mobile
        }}
        onClick={() => navigate('/nova-reserva')}
      >
        <Add />
      </Fab>

      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default DashboardClean;
