import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Schedule,
  EventAvailable,
  EventBusy,
  People,
  MeetingRoom,
  AccessTime,
  CalendarToday
} from '@mui/icons-material';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DashboardCharts = ({ dashboardData, reservas, salas }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('semana');
  const [chartData, setChartData] = useState({
    ocupacaoPorDia: [],
    salasMaisUsadas: [],
    horariosPico: [],
    tendencias: {}
  });

  useEffect(() => {
    if (reservas && salas) {
      processChartData();
    }
  }, [reservas, salas, selectedPeriod]);

  const processChartData = () => {
    const hoje = new Date();
    let periodo;

    switch (selectedPeriod) {
      case 'semana':
        periodo = {
          inicio: startOfWeek(hoje, { locale: ptBR }),
          fim: endOfWeek(hoje, { locale: ptBR })
        };
        break;
      case 'mes':
        periodo = {
          inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
          fim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        };
        break;
      default:
        periodo = {
          inicio: hoje,
          fim: hoje
        };
    }

    // Processar ocupação por dia
    const diasPeriodo = eachDayOfInterval(periodo);
    const ocupacaoPorDia = diasPeriodo.map(dia => {
      const reservasDia = reservas.filter(reserva => {
        const dataReserva = parseISO(reserva.data_inicio);
        return format(dataReserva, 'yyyy-MM-dd') === format(dia, 'yyyy-MM-dd');
      });

      return {
        dia: format(dia, 'dd/MM', { locale: ptBR }),
        reservas: reservasDia.length,
        ocupacao: Math.round((reservasDia.length / (salas.length || 1)) * 100),
        isToday: isToday(dia)
      };
    });

    // Processar salas mais usadas
    const usoPorSala = {};
    reservas.forEach(reserva => {
      const salaId = reserva.sala;
      usoPorSala[salaId] = (usoPorSala[salaId] || 0) + 1;
    });

    const salasMaisUsadas = Object.entries(usoPorSala)
      .map(([salaId, uso]) => {
        const sala = salas.find(s => s.id === parseInt(salaId));
        return {
          nome: sala?.nome || `Sala ${salaId}`,
          uso,
          porcentagem: Math.round((uso / reservas.length) * 100)
        };
      })
      .sort((a, b) => b.uso - a.uso)
      .slice(0, 5);

    // Processar horários pico
    const usoPorHora = {};
    reservas.forEach(reserva => {
      const hora = format(parseISO(reserva.data_inicio), 'HH');
      usoPorHora[hora] = (usoPorHora[hora] || 0) + 1;
    });

    const horariosPico = Object.entries(usoPorHora)
      .map(([hora, uso]) => ({
        hora: `${hora}:00`,
        uso,
        porcentagem: Math.round((uso / reservas.length) * 100)
      }))
      .sort((a, b) => b.uso - a.uso)
      .slice(0, 5);

    // Calcular tendências
    const reservasHoje = reservas.filter(reserva => 
      isToday(parseISO(reserva.data_inicio))
    ).length;

    const reservasOntem = reservas.filter(reserva => {
      const ontem = new Date();
      ontem.setDate(ontem.getDate() - 1);
      return format(parseISO(reserva.data_inicio), 'yyyy-MM-dd') === format(ontem, 'yyyy-MM-dd');
    }).length;

    const tendencias = {
      reservasHoje,
      reservasOntem,
      variacao: reservasOntem > 0 ? Math.round(((reservasHoje - reservasOntem) / reservasOntem) * 100) : 0,
      crescimento: reservasHoje >= reservasOntem
    };

    setChartData({
      ocupacaoPorDia,
      salasMaisUsadas,
      horariosPico,
      tendencias
    });
  };

  return (
    <Grid container spacing={3}>
      {/* Controles */}
      <Grid item xs={12}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Análises e Relatórios
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <MenuItem value="hoje">Hoje</MenuItem>
              <MenuItem value="semana">Esta Semana</MenuItem>
              <MenuItem value="mes">Este Mês</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Grid>

      {/* Tendências */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
              Tendências
            </Typography>
            <Box display="flex" alignItems="center" gap={2} sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {chartData.tendencias.reservasHoje}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reservas hoje
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                {chartData.tendencias.crescimento ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingDown color="error" />
                )}
                <Typography 
                  variant="body2" 
                  color={chartData.tendencias.crescimento ? 'success.main' : 'error.main'}
                  sx={{ fontWeight: 'bold' }}
                >
                  {chartData.tendencias.variacao > 0 ? '+' : ''}{chartData.tendencias.variacao}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Comparado com ontem ({chartData.tendencias.reservasOntem} reservas)
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Ocupação por Dia */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
              Ocupação por Dia
            </Typography>
            <List dense>
              {chartData.ocupacaoPorDia.map((dia, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" sx={{ minWidth: 50 }}>
                          {dia.dia}
                        </Typography>
                        {dia.isToday && (
                          <Chip label="Hoje" size="small" color="primary" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box display="flex" justifyContent="between" alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="caption">
                            {dia.reservas} reservas
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            {dia.ocupacao}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={dia.ocupacao} 
                          sx={{ height: 6, borderRadius: 3 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Salas Mais Usadas */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              <MeetingRoom sx={{ mr: 1, verticalAlign: 'middle' }} />
              Salas Mais Utilizadas
            </Typography>
            <List dense>
              {chartData.salasMaisUsadas.map((sala, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Chip 
                      label={index + 1} 
                      size="small" 
                      color={index === 0 ? 'primary' : 'default'}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={sala.nome}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box display="flex" justifyContent="between" alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="caption">
                            {sala.uso} reservas
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            {sala.porcentagem}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={sala.porcentagem} 
                          sx={{ height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Horários Pico */}
      <Grid item xs={12} md={6}>
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
              Horários de Pico
            </Typography>
            <List dense>
              {chartData.horariosPico.map((horario, index) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Schedule color={index < 2 ? 'primary' : 'action'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={horario.hora}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box display="flex" justifyContent="between" alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography variant="caption">
                            {horario.uso} reservas
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                            {horario.porcentagem}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={horario.porcentagem} 
                          sx={{ height: 4, borderRadius: 2 }}
                          color={index < 2 ? 'primary' : 'inherit'}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default DashboardCharts;
