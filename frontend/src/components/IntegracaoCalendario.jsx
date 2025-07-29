import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Delete,
  Clock,
  MapPin,
  Users,
  CalendarDays,
  RefreshCw,
  Download,
  Upload,
  Settings,
  Bell
} from 'lucide-react';

const IntegracaoCalendario = ({ reservas = [], salas = [], onNovaReserva, onEditarReserva, onDeletarReserva }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogReserva, setDialogReserva] = useState(false);
  const [dialogSync, setDialogSync] = useState(false);
  const [novaReserva, setNovaReserva] = useState({
    titulo: '',
    descricao: '',
    sala: '',
    data_inicio: '',
    hora_inicio: '',
    data_fim: '',
    hora_fim: '',
    participantes: 1,
    recorrencia: 'none'
  });
  const [syncConfig, setSyncConfig] = useState({
    googleCalendar: false,
    outlookCalendar: false,
    notificacoes: true,
    lembretes: true
  });

  // Configuração do calendário
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Gerar dias do mês
  const gerarDiasDoMes = () => {
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();
    
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();
    
    const dias = [];
    
    // Dias do mês anterior (para completar a primeira semana)
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const diaAnterior = new Date(ano, mes, -i);
      dias.push({
        dia: diaAnterior.getDate(),
        date: diaAnterior,
        isCurrentMonth: false,
        reservas: getReservasParaData(diaAnterior)
      });
    }
    
    // Dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataCompleta = new Date(ano, mes, dia);
      dias.push({
        dia,
        date: dataCompleta,
        isCurrentMonth: true,
        isToday: isToday(dataCompleta),
        reservas: getReservasParaData(dataCompleta)
      });
    }
    
    // Dias do próximo mês (para completar a última semana)
    const diasRestantes = 42 - dias.length; // 6 semanas * 7 dias
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const proximoDia = new Date(ano, mes + 1, dia);
      dias.push({
        dia,
        date: proximoDia,
        isCurrentMonth: false,
        reservas: getReservasParaData(proximoDia)
      });
    }
    
    return dias;
  };

  const getReservasParaData = (data) => {
    const dataStr = data.toISOString().split('T')[0];
    return reservas.filter(reserva => 
      reserva.data_inicio && reserva.data_inicio.startsWith(dataStr)
    );
  };

  const isToday = (data) => {
    const hoje = new Date();
    return data.toDateString() === hoje.toDateString();
  };

  const navegarMes = (direcao) => {
    const novaData = new Date(currentDate);
    novaData.setMonth(currentDate.getMonth() + direcao);
    setCurrentDate(novaData);
  };

  const selecionarDia = (diaObj) => {
    setSelectedDate(diaObj.date);
    if (diaObj.reservas.length === 0) {
      // Se não há reservas, abrir dialog para criar nova
      const dataFormatada = diaObj.date.toISOString().split('T')[0];
      setNovaReserva(prev => ({
        ...prev,
        data_inicio: dataFormatada,
        data_fim: dataFormatada
      }));
      setDialogReserva(true);
    }
  };

  const criarReserva = () => {
    if (onNovaReserva) {
      const reservaCompleta = {
        ...novaReserva,
        data_inicio: `${novaReserva.data_inicio}T${novaReserva.hora_inicio}:00`,
        data_fim: `${novaReserva.data_fim}T${novaReserva.hora_fim}:00`
      };
      onNovaReserva(reservaCompleta);
    }
    setDialogReserva(false);
    resetNovaReserva();
  };

  const resetNovaReserva = () => {
    setNovaReserva({
      titulo: '',
      descricao: '',
      sala: '',
      data_inicio: '',
      hora_inicio: '',
      data_fim: '',
      hora_fim: '',
      participantes: 1,
      recorrencia: 'none'
    });
  };

  const exportarParaCalendario = (reserva) => {
    // Criar arquivo .ics para importar em calendários
    const startDate = new Date(reserva.data_inicio);
    const endDate = new Date(reserva.data_fim);
    
    const formatarDataICS = (data) => {
      return data.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Sistema de Salas//PT
BEGIN:VEVENT
UID:${reserva.id}@sistema-salas.com
DTSTAMP:${formatarDataICS(new Date())}
DTSTART:${formatarDataICS(startDate)}
DTEND:${formatarDataICS(endDate)}
SUMMARY:${reserva.titulo}
DESCRIPTION:${reserva.descricao || ''}
LOCATION:${reserva.sala_nome || ''}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reserva-${reserva.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCorStatus = (status) => {
    switch (status) {
      case 'agendada': return '#3B82F6';
      case 'em_andamento': return '#F59E0B';
      case 'concluida': return '#10B981';
      case 'cancelada': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const diasDoMes = gerarDiasDoMes();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Cabeçalho do Calendário */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Calendar size={24} />
            Calendário Inteligente
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshCw size={16} />}
              onClick={() => setDialogSync(true)}
            >
              Sincronizar
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={() => setDialogReserva(true)}
            >
              Nova Reserva
            </Button>
          </Box>
        </Box>

        {/* Navegação do Mês */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navegarMes(-1)}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Typography>
          <IconButton onClick={() => navegarMes(1)}>
            <ChevronRight />
          </IconButton>
        </Box>

        {/* Grade do Calendário */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          {/* Cabeçalho dos dias da semana */}
          <Grid container spacing={1} sx={{ mb: 1 }}>
            {diasSemana.map(dia => (
              <Grid item xs key={dia}>
                <Typography
                  variant="subtitle2"
                  align="center"
                  sx={{ fontWeight: 'bold', color: 'text.secondary' }}
                >
                  {dia}
                </Typography>
              </Grid>
            ))}
          </Grid>

          {/* Grade dos dias */}
          <Grid container spacing={1}>
            {diasDoMes.map((diaObj, index) => (
              <Grid item xs key={index}>
                <Paper
                  variant="outlined"
                  sx={{
                    minHeight: 80,
                    p: 1,
                    cursor: 'pointer',
                    backgroundColor: diaObj.isCurrentMonth
                      ? diaObj.isToday
                        ? '#e3f2fd'
                        : 'white'
                      : '#f5f5f5',
                    border: diaObj.isToday ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    '&:hover': {
                      backgroundColor: diaObj.isCurrentMonth ? '#f0f7ff' : '#f0f0f0'
                    }
                  }}
                  onClick={() => selecionarDia(diaObj)}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: diaObj.isToday ? 'bold' : 'normal',
                      color: diaObj.isCurrentMonth ? 'text.primary' : 'text.secondary'
                    }}
                  >
                    {diaObj.dia}
                  </Typography>

                  {/* Indicadores de reservas */}
                  <Box sx={{ mt: 0.5 }}>
                    {diaObj.reservas.slice(0, 3).map((reserva, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          width: '100%',
                          height: 4,
                          backgroundColor: getCorStatus(reserva.status),
                          borderRadius: 1,
                          mb: 0.5
                        }}
                      />
                    ))}
                    {diaObj.reservas.length > 3 && (
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                        +{diaObj.reservas.length - 3} mais
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Legenda */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#3B82F6', borderRadius: 1 }} />
            <Typography variant="caption">Agendada</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#F59E0B', borderRadius: 1 }} />
            <Typography variant="caption">Em Andamento</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#10B981', borderRadius: 1 }} />
            <Typography variant="caption">Concluída</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 12, height: 12, backgroundColor: '#EF4444', borderRadius: 1 }} />
            <Typography variant="caption">Cancelada</Typography>
          </Box>
        </Box>

        {/* Dialog Nova Reserva */}
        <Dialog open={dialogReserva} onClose={() => setDialogReserva(false)} maxWidth="md" fullWidth>
          <DialogTitle>Nova Reserva</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título da Reserva"
                  value={novaReserva.titulo}
                  onChange={(e) => setNovaReserva(prev => ({ ...prev, titulo: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Descrição"
                  value={novaReserva.descricao}
                  onChange={(e) => setNovaReserva(prev => ({ ...prev, descricao: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Sala</InputLabel>
                  <Select
                    value={novaReserva.sala}
                    label="Sala"
                    onChange={(e) => setNovaReserva(prev => ({ ...prev, sala: e.target.value }))}
                  >
                    {salas.map(sala => (
                      <MenuItem key={sala.id} value={sala.id}>
                        {sala.nome || `Sala ${sala.id}`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Número de Participantes"
                  value={novaReserva.participantes}
                  onChange={(e) => setNovaReserva(prev => ({ ...prev, participantes: parseInt(e.target.value) }))}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data Início"
                  InputLabelProps={{ shrink: true }}
                  value={novaReserva.data_inicio}
                  onChange={(e) => setNovaReserva(prev => ({ ...prev, data_inicio: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="time"
                  label="Hora Início"
                  InputLabelProps={{ shrink: true }}
                  value={novaReserva.hora_inicio}
                  onChange={(e) => setNovaReserva(prev => ({ ...prev, hora_inicio: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Data Fim"
                  InputLabelProps={{ shrink: true }}
                  value={novaReserva.data_fim}
                  onChange={(e) => setNovaReserva(prev => ({ ...prev, data_fim: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  type="time"
                  label="Hora Fim"
                  InputLabelProps={{ shrink: true }}
                  value={novaReserva.hora_fim}
                  onChange={(e) => setNovaReserva(prev => ({ ...prev, hora_fim: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Recorrência</InputLabel>
                  <Select
                    value={novaReserva.recorrencia}
                    label="Recorrência"
                    onChange={(e) => setNovaReserva(prev => ({ ...prev, recorrencia: e.target.value }))}
                  >
                    <MenuItem value="none">Não repetir</MenuItem>
                    <MenuItem value="daily">Diário</MenuItem>
                    <MenuItem value="weekly">Semanal</MenuItem>
                    <MenuItem value="monthly">Mensal</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogReserva(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={criarReserva}
              disabled={!novaReserva.titulo || !novaReserva.sala || !novaReserva.data_inicio}
            >
              Criar Reserva
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Sincronização */}
        <Dialog open={dialogSync} onClose={() => setDialogSync(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Configurações de Sincronização</DialogTitle>
          <DialogContent>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CalendarDays />
                </ListItemIcon>
                <ListItemText
                  primary="Google Calendar"
                  secondary="Sincronizar com sua conta Google"
                />
                <Switch
                  checked={syncConfig.googleCalendar}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, googleCalendar: e.target.checked }))}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Calendar />
                </ListItemIcon>
                <ListItemText
                  primary="Outlook Calendar"
                  secondary="Sincronizar com Microsoft Outlook"
                />
                <Switch
                  checked={syncConfig.outlookCalendar}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, outlookCalendar: e.target.checked }))}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Bell />
                </ListItemIcon>
                <ListItemText
                  primary="Notificações"
                  secondary="Receber notificações sobre reservas"
                />
                <Switch
                  checked={syncConfig.notificacoes}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, notificacoes: e.target.checked }))}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Clock />
                </ListItemIcon>
                <ListItemText
                  primary="Lembretes"
                  secondary="Lembretes 15 minutos antes das reservas"
                />
                <Switch
                  checked={syncConfig.lembretes}
                  onChange={(e) => setSyncConfig(prev => ({ ...prev, lembretes: e.target.checked }))}
                />
              </ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogSync(false)}>Fechar</Button>
            <Button variant="contained">Salvar Configurações</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default IntegracaoCalendario;
