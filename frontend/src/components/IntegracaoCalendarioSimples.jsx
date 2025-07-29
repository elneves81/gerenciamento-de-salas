import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon
} from 'lucide-react';

const IntegracaoCalendarioSimples = ({ reservas = [], salas = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Navegar meses
  const proximoMes = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const mesAnterior = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Gerar dias do calendário
  const gerarDiasCalendario = () => {
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();

    const dias = [];

    // Dias vazios no início
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push(null);
    }

    // Dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataCompleta = new Date(ano, mes, dia);
      const dataStr = dataCompleta.toISOString().split('T')[0];
      
      const reservasDoDia = reservas.filter(reserva => {
        if (!reserva.data_inicio) return false;
        return reserva.data_inicio.startsWith(dataStr);
      });

      dias.push({
        dia,
        data: dataCompleta,
        reservas: reservasDoDia,
        isToday: dataStr === new Date().toISOString().split('T')[0]
      });
    }

    return dias;
  };

  const dias = gerarDiasCalendario();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon size={24} />
            Calendário de Reservas
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={mesAnterior} size="small">
              <ChevronLeft size={20} />
            </IconButton>
            
            <Typography variant="h6" sx={{ minWidth: 200, textAlign: 'center', fontWeight: 'medium' }}>
              {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            
            <IconButton onClick={proximoMes} size="small">
              <ChevronRight size={20} />
            </IconButton>
          </Box>
        </Box>

        {/* Header dos dias da semana */}
        <Grid container spacing={0} sx={{ mb: 1 }}>
          {diasSemana.map(dia => (
            <Grid item xs key={dia} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.secondary', py: 1 }}>
                {dia}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Grid do calendário */}
        <Grid container spacing={0}>
          {dias.map((diaInfo, index) => (
            <Grid item xs key={index} sx={{ aspectRatio: '1', border: '1px solid', borderColor: 'divider' }}>
              <Paper 
                sx={{ 
                  height: '100%', 
                  p: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  backgroundColor: diaInfo ? (diaInfo.isToday ? 'primary.light' : 'background.paper') : 'grey.50',
                  cursor: diaInfo ? 'pointer' : 'default',
                  '&:hover': {
                    backgroundColor: diaInfo ? 'action.hover' : 'grey.50'
                  }
                }}
                elevation={0}
              >
                {diaInfo && (
                  <>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: diaInfo.isToday ? 'bold' : 'normal',
                        color: diaInfo.isToday ? 'primary.contrastText' : 'text.primary',
                        mb: 0.5
                      }}
                    >
                      {diaInfo.dia}
                    </Typography>
                    
                    {diaInfo.reservas.length > 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, overflow: 'hidden' }}>
                        {diaInfo.reservas.slice(0, 2).map((reserva, idx) => (
                          <Chip
                            key={idx}
                            label={reserva.titulo || 'Reserva'}
                            size="small"
                            sx={{
                              height: 16,
                              fontSize: '0.6rem',
                              '& .MuiChip-label': {
                                px: 0.5,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }
                            }}
                            color={
                              reserva.status === 'agendada' ? 'primary' :
                              reserva.status === 'em_andamento' ? 'warning' :
                              reserva.status === 'concluida' ? 'success' : 'error'
                            }
                          />
                        ))}
                        
                        {diaInfo.reservas.length > 2 && (
                          <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary' }}>
                            +{diaInfo.reservas.length - 2} mais
                          </Typography>
                        )}
                      </Box>
                    )}
                  </>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="Agendada" size="small" color="primary" />
            <Chip label="Em Andamento" size="small" color="warning" />
            <Chip label="Concluída" size="small" color="success" />
            <Chip label="Cancelada" size="small" color="error" />
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => window.location.href = '/nova-reserva'}
          >
            Nova Reserva
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default IntegracaoCalendarioSimples;
