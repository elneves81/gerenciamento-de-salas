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
} from 'lucide-react';

const CalendarioEstilizado = ({ reservas = [], salas = [], onNovaReserva }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogReserva, setDialogReserva] = useState(false);
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

  const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

  // Navegar entre meses
  const navegarMes = (direcao) => {
    const novaData = new Date(currentDate);
    novaData.setMonth(currentDate.getMonth() + direcao);
    setCurrentDate(novaData);
  };

  // Gerar dias do calendário
  const gerarDiasCalendario = () => {
    const ano = currentDate.getFullYear();
    const mes = currentDate.getMonth();
    
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const primeiroDiaSemana = primeiroDia.getDay();
    
    const dias = [];
    
    // Dias do mês anterior (para preencher o início)
    const mesAnterior = new Date(ano, mes - 1, 0);
    const diasMesAnterior = mesAnterior.getDate();
    
    for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
      dias.push({
        dia: diasMesAnterior - i,
        ehMesAtual: false,
        data: new Date(ano, mes - 1, diasMesAnterior - i),
        reservas: []
      });
    }
    
    // Dias do mês atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataAtual = new Date(ano, mes, dia);
      const reservasDoDia = reservas.filter(reserva => {
        const dataReserva = new Date(reserva.data_inicio);
        return dataReserva.toDateString() === dataAtual.toDateString();
      });
      
      dias.push({
        dia,
        ehMesAtual: true,
        data: dataAtual,
        reservas: reservasDoDia
      });
    }
    
    // Dias do próximo mês (para preencher o final)
    const totalCelulas = Math.ceil(dias.length / 7) * 7;
    let diaProximoMes = 1;
    
    while (dias.length < totalCelulas) {
      dias.push({
        dia: diaProximoMes,
        ehMesAtual: false,
        data: new Date(ano, mes + 1, diaProximoMes),
        reservas: []
      });
      diaProximoMes++;
    }
    
    return dias;
  };

  // Função para obter cor do status do dia
  const getStatusDia = (diaInfo) => {
    if (!diaInfo.ehMesAtual) return { color: '#f8f9fa', textColor: '#adb5bd' };
    
    const hoje = new Date();
    const ehHoje = diaInfo.data.toDateString() === hoje.toDateString();
    
    if (ehHoje) {
      return { color: '#e3f2fd', textColor: '#1976d2', border: '2px solid #1976d2' };
    }
    
    if (diaInfo.reservas.length === 0) {
      // Salas Livres - Verde
      return { color: '#e8f5e8', textColor: '#2e7d32', text: 'Salas Livres' };
    } else {
      // Com reuniões
      const totalSalas = salas.length;
      const salasOcupadas = diaInfo.reservas.length;
      
      if (salasOcupadas >= totalSalas) {
        // Reunião em Andamento - Vermelho
        return { color: '#ffebee', textColor: '#c62828', text: 'Reunião em Andamento' };
      } else {
        // Parcialmente Ocupado - Amarelo
        return { color: '#fff8e1', textColor: '#f57f17', text: 'Parcialmente Ocupado' };
      }
    }
  };

  const handleSalvarReserva = async () => {
    try {
      if (!novaReserva.titulo || !novaReserva.sala || !novaReserva.data_inicio) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const dataInicio = `${novaReserva.data_inicio}T${novaReserva.hora_inicio}:00`;
      const dataFim = `${novaReserva.data_fim || novaReserva.data_inicio}T${novaReserva.hora_fim}:00`;

      const reservaData = {
        titulo: novaReserva.titulo,
        descricao: novaReserva.descricao,
        sala_id: parseInt(novaReserva.sala),
        data_inicio: dataInicio,
        data_fim: dataFim,
        usuario_id: 1
      };

      const response = await fetch('/.netlify/functions/agendamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')?.replace(/"/g, '')}`
        },
        body: JSON.stringify(reservaData)
      });

      const result = await response.json();

      if (response.ok) {
        alert('Reserva criada com sucesso!');
        
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

        if (onNovaReserva) {
          onNovaReserva();
        }
      } else {
        alert(result.error || 'Erro ao criar reserva');
      }
    } catch (error) {
      console.error('Erro ao salvar reserva:', error);
      alert('Erro ao salvar reserva. Tente novamente.');
    }
  };

  const diasCalendario = gerarDiasCalendario();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header com botões e legenda - Exatamente como na imagem */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          {/* Botões à esquerda */}
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Plus size={16} />}
              size="small"
              onClick={() => setDialogReserva(true)}
              sx={{ textTransform: 'none', borderRadius: 1 }}
            >
              Criar
            </Button>
            <Button
              variant="outlined"
              size="small"
              sx={{ textTransform: 'none', borderRadius: 1 }}
            >
              Hoje
            </Button>
          </Box>

          {/* Navegação do mês */}
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navegarMes(-1)} size="small">
              <ChevronLeft size={20} />
            </IconButton>
            <Typography variant="h6" sx={{ minWidth: 120, textAlign: 'center', fontWeight: 600 }}>
              {meses[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Typography>
            <IconButton onClick={() => navegarMes(1)} size="small">
              <ChevronRight size={20} />
            </IconButton>
          </Box>

          <Box width={120} /> {/* Espaçador para centralizar */}
        </Box>

        {/* Legenda de cores - Exatamente como na imagem */}
        <Box display="flex" justifyContent="center" gap={3}>
          <Chip 
            label="Salas Livres" 
            sx={{ 
              bgcolor: '#e8f5e8', 
              color: '#2e7d32',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 28
            }} 
            size="small" 
          />
          <Chip 
            label="Parcialmente Ocupado" 
            sx={{ 
              bgcolor: '#fff8e1', 
              color: '#f57f17',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 28
            }} 
            size="small" 
          />
          <Chip 
            label="Reunião em Andamento" 
            sx={{ 
              bgcolor: '#ffebee', 
              color: '#c62828',
              fontWeight: 500,
              fontSize: '0.75rem',
              height: 28
            }} 
            size="small" 
          />
        </Box>
      </Paper>

      {/* Calendário */}
      <Paper elevation={1} sx={{ flex: 1, overflow: 'hidden' }}>
        {/* Cabeçalho dos dias da semana */}
        <Box sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: '#fafafa' }}>
          <Grid container>
            {diasSemana.map((dia) => (
              <Grid item xs={12/7} key={dia}>
                <Box sx={{ p: 1, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#666' }}>
                    {dia}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Grade do calendário */}
        <Box sx={{ height: 'calc(100% - 40px)', overflow: 'auto' }}>
          <Grid container sx={{ height: '100%' }}>
            {diasCalendario.map((diaInfo, index) => {
              const statusDia = getStatusDia(diaInfo);
              
              return (
                <Grid 
                  item 
                  xs={12/7} 
                  key={index}
                  sx={{ 
                    borderRight: '1px solid #e0e0e0',
                    borderBottom: '1px solid #e0e0e0',
                    minHeight: 120,
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      p: 1,
                      bgcolor: statusDia.color,
                      color: statusDia.textColor,
                      border: statusDia.border || 'none',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: statusDia.color === '#f8f9fa' ? '#f8f9fa' : `${statusDia.color}dd`,
                      }
                    }}
                    onClick={() => {
                      if (diaInfo.ehMesAtual) {
                        const dataFormatada = diaInfo.data.toISOString().split('T')[0];
                        setNovaReserva(prev => ({ ...prev, data_inicio: dataFormatada, data_fim: dataFormatada }));
                        setDialogReserva(true);
                      }
                    }}
                  >
                    {/* Número do dia */}
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: diaInfo.ehMesAtual ? 600 : 400,
                        opacity: diaInfo.ehMesAtual ? 1 : 0.4,
                        mb: 0.5
                      }}
                    >
                      {diaInfo.dia}
                    </Typography>

                    {/* Eventos do dia */}
                    {diaInfo.reservas.slice(0, 3).map((reserva, idx) => {
                      const cores = [
                        '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#d32f2f'
                      ];
                      const cor = cores[idx % cores.length];
                      
                      return (
                        <Box
                          key={idx}
                          sx={{
                            bgcolor: cor,
                            color: 'white',
                            px: 0.5,
                            py: 0.25,
                            mb: 0.25,
                            borderRadius: '2px',
                            fontSize: '10px',
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {reserva.titulo}
                        </Box>
                      );
                    })}

                    {diaInfo.reservas.length > 3 && (
                      <Typography variant="caption" sx={{ fontSize: '9px', opacity: 0.7 }}>
                        +{diaInfo.reservas.length - 3} mais
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Paper>

      {/* Dialog para nova reserva */}
      <Dialog open={dialogReserva} onClose={() => setDialogReserva(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nova Reserva</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Título da Reunião"
              fullWidth
              value={novaReserva.titulo}
              onChange={(e) => setNovaReserva({...novaReserva, titulo: e.target.value})}
            />
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={2}
              value={novaReserva.descricao}
              onChange={(e) => setNovaReserva({...novaReserva, descricao: e.target.value})}
            />
            <FormControl fullWidth>
              <InputLabel>Sala</InputLabel>
              <Select
                value={novaReserva.sala}
                label="Sala"
                onChange={(e) => setNovaReserva({...novaReserva, sala: e.target.value})}
              >
                {salas.map(sala => (
                  <MenuItem key={sala.id} value={sala.id}>
                    {sala.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display="flex" gap={2}>
              <TextField
                label="Data"
                type="date"
                fullWidth
                value={novaReserva.data_inicio}
                onChange={(e) => setNovaReserva({...novaReserva, data_inicio: e.target.value, data_fim: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            <Box display="flex" gap={2}>
              <TextField
                label="Hora Início"
                type="time"
                fullWidth
                value={novaReserva.hora_inicio}
                onChange={(e) => setNovaReserva({...novaReserva, hora_inicio: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Hora Fim"
                type="time"
                fullWidth
                value={novaReserva.hora_fim}
                onChange={(e) => setNovaReserva({...novaReserva, hora_fim: e.target.value})}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogReserva(false)}>Cancelar</Button>
          <Button onClick={handleSalvarReserva} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarioEstilizado;
