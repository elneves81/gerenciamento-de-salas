import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  IconButton,
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
  Paper,
  useMediaQuery,
  useTheme,
  Fab
} from '@mui/material';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CalendarDays
} from 'lucide-react';

const GoogleCalendarResponsive = ({ reservas = [], salas = [], onNovaReserva }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogReserva, setDialogReserva] = useState(false);
  const [viewMode, setViewMode] = useState(isMobile ? 'month' : 'month');
  const [novaReserva, setNovaReserva] = useState({
    titulo: '',
    descricao: '',
    sala: '',
    data_inicio: '',
    hora_inicio: '09:00',
    data_fim: '',
    hora_fim: '10:00',
    participantes: 1
  });

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasSemana = isMobile ? 
    ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] : 
    ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Função para verificar status da data
  const getStatusData = (data) => {
    const dataStr = data.toISOString().split('T')[0];
    const hoje = new Date();
    const agora = new Date();
    
    // Se é data passada, retorna null (cinza)
    if (data < hoje.setHours(0, 0, 0, 0)) {
      return { status: 'passado', color: '#e5e7eb', textColor: '#9ca3af' };
    }
    
    // Buscar reservas do dia
    const reservasDoDia = reservas.filter(reserva => {
      if (!reserva.data_inicio) return false;
      return reserva.data_inicio.startsWith(dataStr);
    });

    if (reservasDoDia.length === 0) {
      // Todas as salas livres - VERDE
      return { 
        status: 'livre', 
        color: '#dcfce7', 
        textColor: '#166534',
        borderColor: '#22c55e'
      };
    }

    // Verificar se há reuniões em andamento
    const agendadas = reservasDoDia.filter(r => r.status === 'agendada').length;
    const emAndamento = reservasDoDia.filter(r => r.status === 'em_andamento').length;
    const totalSalas = salas.length;

    if (emAndamento > 0) {
      // Tem reuniões em andamento - VERMELHO
      return { 
        status: 'ocupado', 
        color: '#fee2e2', 
        textColor: '#dc2626',
        borderColor: '#ef4444'
      };
    } else if (agendadas > 0 && agendadas < totalSalas) {
      // Parcialmente ocupado - AMARELO  
      return { 
        status: 'parcial', 
        color: '#fef3c7', 
        textColor: '#d97706',
        borderColor: '#f59e0b'
      };
    } else if (agendadas >= totalSalas) {
      // Totalmente agendado - LARANJA
      return { 
        status: 'agendado', 
        color: '#fed7aa', 
        textColor: '#ea580c',
        borderColor: '#fb923c'
      };
    }

    return { 
      status: 'livre', 
      color: '#dcfce7', 
      textColor: '#166534',
      borderColor: '#22c55e'
    };
  };

  // Função para verificar se reuniões terminaram e atualizar status
  const verificarReunioesTerminadas = () => {
    const agora = new Date();
    
    reservas.forEach(reserva => {
      if (reserva.status === 'em_andamento' && reserva.data_fim) {
        const fimReuniao = new Date(reserva.data_fim + 'T' + (reserva.hora_fim || '23:59'));
        
        if (agora > fimReuniao) {
          // Reunião terminou - deveria atualizar status para 'concluida'
          // Aqui você pode fazer uma chamada à API para atualizar o status
          console.log(`Reunião ${reserva.id} deveria ser marcada como concluída`);
        }
      }
    });
  };

  useEffect(() => {
    // Verificar reuniões terminadas a cada minuto
    const interval = setInterval(verificarReunioesTerminadas, 60000);
    return () => clearInterval(interval);
  }, [reservas]);

  // Navegar entre períodos
  const proximoPeriodo = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const periodoAnterior = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const irParaHoje = () => {
    setCurrentDate(new Date());
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

    // Dias do mês anterior (cinza)
    const diasMesAnterior = new Date(ano, mes, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      const data = new Date(ano, mes - 1, dia);
      dias.push({
        dia,
        data,
        isCurrentMonth: false,
        status: getStatusData(data)
      });
    }

    // Dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const data = new Date(ano, mes, dia);
      const dataStr = data.toISOString().split('T')[0];
      
      const reservasDoDia = reservas.filter(reserva => {
        if (!reserva.data_inicio) return false;
        return reserva.data_inicio.startsWith(dataStr);
      });

      dias.push({
        dia,
        data,
        isCurrentMonth: true,
        isToday: dataStr === new Date().toISOString().split('T')[0],
        reservas: reservasDoDia,
        status: getStatusData(data)
      });
    }

    // Dias do próximo mês (cinza)
    const totalCelulas = isMobile ? 35 : 42; // 5 ou 6 semanas
    const diasRestantes = totalCelulas - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const data = new Date(ano, mes + 1, dia);
      dias.push({
        dia,
        data,
        isCurrentMonth: false,
        status: getStatusData(data)
      });
    }

    return dias;
  };

  const handleNovaReserva = (data = null) => {
    if (data) {
      const dataFormatada = data.toISOString().split('T')[0];
      // Salvar no localStorage para usar na página de nova reserva
      localStorage.setItem('preSelectedDate', dataFormatada);
      
      setNovaReserva(prev => ({
        ...prev,
        data_inicio: dataFormatada,
        data_fim: dataFormatada
      }));
      
      // Navegar para página de nova reserva
      window.location.href = '/nova-reserva';
      return;
    }
    setDialogReserva(true);
  };

  const handleSalvarReserva = () => {
    console.log('Nova reserva:', novaReserva);
    setDialogReserva(false);
    setNovaReserva({
      titulo: '',
      descricao: '',
      sala: '',
      data_inicio: '',
      hora_inicio: '09:00',
      data_fim: '',
      hora_fim: '10:00',
      participantes: 1
    });
  };

  const getTituloHeader = () => {
    return `${meses[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  };

  const dias = gerarDiasCalendario();

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      bgcolor: '#fff',
      position: 'relative'
    }}>
      {/* Toolbar responsiva */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: isMobile ? 1 : 2, 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: isMobile ? 1 : 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1 : 2 }}>
          {!isMobile && (
            <Button
              variant="outlined"
              startIcon={<Plus size={16} />}
              onClick={() => handleNovaReserva()}
              sx={{
                borderRadius: '24px',
                textTransform: 'none',
                fontWeight: 500,
                boxShadow: '0 1px 2px 0 rgba(60,64,67,.3), 0 1px 3px 1px rgba(60,64,67,.15)',
                border: 'none',
                '&:hover': {
                  border: 'none',
                  boxShadow: '0 1px 3px 0 rgba(60,64,67,.3), 0 4px 8px 3px rgba(60,64,67,.15)'
                }
              }}
            >
              Criar
            </Button>
          )}

          <Button
            variant="outlined"
            startIcon={<CalendarDays size={16} />}
            onClick={irParaHoje}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              textTransform: 'none',
              color: '#5f6368',
              borderColor: '#dadce0',
              fontSize: isMobile ? '12px' : '14px',
              '&:hover': {
                borderColor: '#dadce0',
                bgcolor: '#f8f9fa'
              }
            }}
          >
            {isMobile ? 'Hoje' : 'Hoje'}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={periodoAnterior}
            size={isMobile ? 'small' : 'medium'}
            sx={{ 
              color: '#5f6368',
              '&:hover': { bgcolor: '#f8f9fa' }
            }}
          >
            <ChevronLeft size={isMobile ? 18 : 20} />
          </IconButton>
          
          <Typography 
            variant={isMobile ? 'subtitle1' : 'h6'} 
            sx={{ 
              fontWeight: 400,
              color: '#3c4043',
              minWidth: isMobile ? 120 : 200,
              textAlign: 'center',
              fontSize: isMobile ? '16px' : '20px'
            }}
          >
            {getTituloHeader()}
          </Typography>
          
          <IconButton 
            onClick={proximoPeriodo}
            size={isMobile ? 'small' : 'medium'}
            sx={{ 
              color: '#5f6368',
              '&:hover': { bgcolor: '#f8f9fa' }
            }}
          >
            <ChevronRight size={isMobile ? 18 : 20} />
          </IconButton>
        </Box>
      </Paper>

      {/* Legenda de cores */}
      <Box sx={{ 
        p: isMobile ? 1 : 2, 
        borderBottom: '1px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: isMobile ? 1 : 2
      }}>
        <Chip 
          label="Salas Livres" 
          size="small" 
          sx={{ 
            bgcolor: '#dcfce7', 
            color: '#166534',
            fontSize: isMobile ? '10px' : '12px',
            height: isMobile ? 24 : 32
          }} 
        />
        <Chip 
          label="Parcialmente Ocupado" 
          size="small" 
          sx={{ 
            bgcolor: '#fef3c7', 
            color: '#d97706',
            fontSize: isMobile ? '10px' : '12px',
            height: isMobile ? 24 : 32
          }} 
        />
        <Chip 
          label="Reunião em Andamento" 
          size="small" 
          sx={{ 
            bgcolor: '#fee2e2', 
            color: '#dc2626',
            fontSize: isMobile ? '10px' : '12px',
            height: isMobile ? 24 : 32
          }} 
        />
      </Box>

      {/* Calendário */}
      <Box sx={{ flex: 1, p: isMobile ? 0.5 : 1 }}>
        {/* Header dos dias da semana */}
        <Grid container sx={{ mb: 1 }}>
          {diasSemana.map((dia, index) => (
            <Grid item xs key={dia} sx={{ textAlign: 'center', py: isMobile ? 0.5 : 1 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: 500,
                  color: '#70757a',
                  fontSize: isMobile ? '10px' : '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}
              >
                {dia}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Grid do calendário */}
        <Grid container sx={{ flex: 1 }}>
          {dias.map((diaInfo, index) => (
            <Grid 
              item 
              xs 
              key={index} 
              sx={{ 
                minHeight: isMobile ? 50 : 80,
                maxHeight: isMobile ? 60 : 120,
                border: '1px solid #e0e0e0',
                cursor: diaInfo.isCurrentMonth ? 'pointer' : 'default',
                '&:hover': {
                  bgcolor: diaInfo.isCurrentMonth ? '#f8f9fa' : 'transparent'
                }
              }}
              onClick={() => diaInfo.isCurrentMonth && handleNovaReserva(diaInfo.data)}
            >
              <Box sx={{ 
                p: isMobile ? 0.5 : 1, 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                bgcolor: diaInfo.status.color,
                borderLeft: diaInfo.isCurrentMonth ? `3px solid ${diaInfo.status.borderColor || 'transparent'}` : 'none'
              }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: diaInfo.isCurrentMonth ? 
                      (diaInfo.isToday ? '#1a73e8' : diaInfo.status.textColor) : 
                      '#9aa0a6',
                    fontWeight: diaInfo.isToday ? 700 : (diaInfo.isCurrentMonth ? 500 : 400),
                    mb: 0.5,
                    fontSize: isMobile ? '11px' : '13px',
                    textAlign: 'center'
                  }}
                >
                  {diaInfo.dia}
                </Typography>
                
                {diaInfo.isToday && (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: '#1a73e8',
                      alignSelf: 'center',
                      mb: 0.5
                    }}
                  />
                )}

                {/* Indicador de reservas no mobile */}
                {isMobile && diaInfo.reservas && diaInfo.reservas.length > 0 && (
                  <Box
                    sx={{
                      width: '100%',
                      height: 3,
                      bgcolor: diaInfo.status.borderColor,
                      borderRadius: 1,
                      mt: 'auto'
                    }}
                  />
                )}

                {/* Reservas detalhadas no desktop */}
                {!isMobile && (
                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    {diaInfo.reservas && diaInfo.reservas.slice(0, 2).map((reserva, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          bgcolor: reserva.status === 'agendada' ? '#1a73e8' : 
                                   reserva.status === 'em_andamento' ? '#dc2626' : '#10b981',
                          color: 'white',
                          px: 1,
                          py: 0.25,
                          mb: 0.25,
                          borderRadius: '3px',
                          fontSize: '9px',
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          '&:hover': {
                            opacity: 0.8
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {reserva.titulo || 'Reserva'}
                      </Box>
                    ))}
                    
                    {diaInfo.reservas && diaInfo.reservas.length > 2 && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#5f6368',
                          fontSize: '8px',
                          fontWeight: 500
                        }}
                      >
                        +{diaInfo.reservas.length - 2}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* FAB para mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => handleNovaReserva()}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16,
            zIndex: 1000,
            bgcolor: '#1a73e8',
            '&:hover': {
              bgcolor: '#1557b0'
            }
          }}
        >
          <Plus size={24} />
        </Fab>
      )}

      {/* Dialog para nova reserva */}
      <Dialog 
        open={dialogReserva} 
        onClose={() => setDialogReserva(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : '12px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon size={20} color="#1a73e8" />
            Nova Reserva
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ pt: '8px !important' }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={novaReserva.titulo}
                onChange={(e) => setNovaReserva({...novaReserva, titulo: e.target.value})}
                variant="outlined"
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Data"
                value={novaReserva.data_inicio}
                onChange={(e) => setNovaReserva({...novaReserva, data_inicio: e.target.value, data_fim: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sala</InputLabel>
                <Select
                  value={novaReserva.sala}
                  onChange={(e) => setNovaReserva({...novaReserva, sala: e.target.value})}
                >
                  {salas.map(sala => (
                    <MenuItem key={sala.id} value={sala.id}>
                      {sala.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="time"
                label="Horário Início"
                value={novaReserva.hora_inicio}
                onChange={(e) => setNovaReserva({...novaReserva, hora_inicio: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="time"
                label="Horário Fim"
                value={novaReserva.hora_fim}
                onChange={(e) => setNovaReserva({...novaReserva, hora_fim: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrição"
                value={novaReserva.descricao}
                onChange={(e) => setNovaReserva({...novaReserva, descricao: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => setDialogReserva(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvarReserva}
            variant="contained"
            sx={{
              textTransform: 'none',
              bgcolor: '#1a73e8',
              '&:hover': {
                bgcolor: '#1557b0'
              }
            }}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoogleCalendarResponsive;
