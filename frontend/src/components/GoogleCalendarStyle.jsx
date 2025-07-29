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
  Divider,
  Avatar,
  Tooltip
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

const GoogleCalendarStyle = ({ reservas = [], salas = [], onNovaReserva }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogReserva, setDialogReserva] = useState(false);
  const [viewMode, setViewMode] = useState('month'); // month, week, day
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

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const diasSemanaCompleto = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Cores para diferentes tipos de reserva (estilo Google)
  const getCoreReserva = (status) => {
    switch (status) {
      case 'agendada': return '#1a73e8'; // Azul Google
      case 'em_andamento': return '#f9ab00'; // Amarelo Google
      case 'concluida': return '#137333'; // Verde Google
      case 'cancelada': return '#d93025'; // Vermelho Google
      default: return '#5f6368'; // Cinza Google
    }
  };

  // Navegar entre períodos
  const proximoPeriodo = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'week') {
      const novaData = new Date(currentDate);
      novaData.setDate(currentDate.getDate() + 7);
      setCurrentDate(novaData);
    } else {
      const novaData = new Date(currentDate);
      novaData.setDate(currentDate.getDate() + 1);
      setCurrentDate(novaData);
    }
  };

  const periodoAnterior = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'week') {
      const novaData = new Date(currentDate);
      novaData.setDate(currentDate.getDate() - 7);
      setCurrentDate(novaData);
    } else {
      const novaData = new Date(currentDate);
      novaData.setDate(currentDate.getDate() - 1);
      setCurrentDate(novaData);
    }
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
        reservas: []
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
        reservas: reservasDoDia
      });
    }

    // Dias do próximo mês (cinza)
    const totalCelulas = 42; // 6 semanas x 7 dias
    const diasRestantes = totalCelulas - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const data = new Date(ano, mes + 1, dia);
      dias.push({
        dia,
        data,
        isCurrentMonth: false,
        reservas: []
      });
    }

    return dias;
  };

  const handleNovaReserva = (data = null) => {
    if (data) {
      const dataFormatada = data.toISOString().split('T')[0];
      setNovaReserva(prev => ({
        ...prev,
        data_inicio: dataFormatada,
        data_fim: dataFormatada
      }));
    }
    setDialogReserva(true);
  };

  const handleSalvarReserva = () => {
    // Aqui você pode chamar a função onNovaReserva ou fazer a requisição para salvar
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
    if (viewMode === 'month') {
      return `${meses[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewMode === 'week') {
      const inicioSemana = new Date(currentDate);
      inicioSemana.setDate(currentDate.getDate() - currentDate.getDay());
      const fimSemana = new Date(inicioSemana);
      fimSemana.setDate(inicioSemana.getDate() + 6);
      
      if (inicioSemana.getMonth() === fimSemana.getMonth()) {
        return `${inicioSemana.getDate()} - ${fimSemana.getDate()} de ${meses[inicioSemana.getMonth()]} ${inicioSemana.getFullYear()}`;
      } else {
        return `${inicioSemana.getDate()} ${meses[inicioSemana.getMonth()]} - ${fimSemana.getDate()} ${meses[fimSemana.getMonth()]} ${inicioSemana.getFullYear()}`;
      }
    } else {
      return `${currentDate.getDate()} de ${meses[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    }
  };

  const dias = gerarDiasCalendario();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      {/* Toolbar estilo Google Calendar */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

          <Button
            variant="outlined"
            startIcon={<CalendarDays size={16} />}
            onClick={irParaHoje}
            sx={{
              textTransform: 'none',
              color: '#5f6368',
              borderColor: '#dadce0',
              '&:hover': {
                borderColor: '#dadce0',
                bgcolor: '#f8f9fa'
              }
            }}
          >
            Hoje
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={periodoAnterior}
            sx={{ 
              color: '#5f6368',
              '&:hover': { bgcolor: '#f8f9fa' }
            }}
          >
            <ChevronLeft size={20} />
          </IconButton>
          
          <IconButton 
            onClick={proximoPeriodo}
            sx={{ 
              color: '#5f6368',
              '&:hover': { bgcolor: '#f8f9fa' }
            }}
          >
            <ChevronRight size={20} />
          </IconButton>

          <Typography 
            variant="h6" 
            sx={{ 
              mx: 2,
              fontWeight: 400,
              color: '#3c4043',
              minWidth: 200,
              textAlign: 'center'
            }}
          >
            {getTituloHeader()}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#dadce0'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#dadce0'
                }
              }}
            >
              <MenuItem value="month">Mês</MenuItem>
              <MenuItem value="week">Semana</MenuItem>
              <MenuItem value="day">Dia</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Calendário - Visualização Mensal */}
      {viewMode === 'month' && (
        <Box sx={{ flex: 1, p: 1 }}>
          {/* Header dos dias da semana */}
          <Grid container sx={{ mb: 1 }}>
            {diasSemana.map((dia, index) => (
              <Grid item xs key={dia} sx={{ textAlign: 'center', py: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 500,
                    color: '#70757a',
                    fontSize: '11px',
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
                  minHeight: 120,
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: '#f8f9fa'
                  }
                }}
                onClick={() => diaInfo.isCurrentMonth && handleNovaReserva(diaInfo.data)}
              >
                <Box sx={{ p: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: diaInfo.isCurrentMonth ? 
                        (diaInfo.isToday ? '#1a73e8' : '#3c4043') : 
                        '#9aa0a6',
                      fontWeight: diaInfo.isToday ? 600 : 400,
                      mb: 0.5,
                      fontSize: '13px'
                    }}
                  >
                    {diaInfo.dia}
                  </Typography>
                  
                  {diaInfo.isToday && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: '#1a73e8',
                        alignSelf: 'flex-start',
                        mb: 0.5
                      }}
                    />
                  )}

                  <Box sx={{ flex: 1, overflow: 'hidden' }}>
                    {diaInfo.reservas.slice(0, 3).map((reserva, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          bgcolor: getCoreReserva(reserva.status),
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          mb: 0.5,
                          borderRadius: '4px',
                          fontSize: '11px',
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
                          // Aqui você pode abrir detalhes da reserva
                        }}
                      >
                        {reserva.titulo || 'Reserva'}
                      </Box>
                    ))}
                    
                    {diaInfo.reservas.length > 3 && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#5f6368',
                          fontSize: '10px',
                          fontWeight: 500
                        }}
                      >
                        +{diaInfo.reservas.length - 3} mais
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Outras visualizações (semana/dia) podem ser implementadas aqui */}
      {(viewMode === 'week' || viewMode === 'day') && (
        <Box sx={{ flex: 1, p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Visualização de {viewMode === 'week' ? 'Semana' : 'Dia'} será implementada em breve
          </Typography>
        </Box>
      )}

      {/* Dialog para nova reserva */}
      <Dialog 
        open={dialogReserva} 
        onClose={() => setDialogReserva(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px'
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

export default GoogleCalendarStyle;
