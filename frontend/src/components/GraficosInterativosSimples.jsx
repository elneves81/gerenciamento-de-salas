import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper
} from '@mui/material';
import { TrendingUp, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

const GraficosInterativosSimples = ({ reservas = [], salas = [] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [periodo, setPeriodo] = useState('semana');

  // Estatísticas básicas
  const estatisticas = {
    totalReservas: reservas.length,
    reservasAtivas: reservas.filter(r => r.status === 'agendada' || r.status === 'em_andamento').length,
    salasDisponiveis: salas.length,
    taxaOcupacao: salas.length > 0 ? Math.round((reservas.filter(r => r.status === 'em_andamento').length / salas.length) * 100) : 0
  };

  // Dados por status
  const statusData = [
    { name: 'Agendadas', value: reservas.filter(r => r.status === 'agendada').length, color: '#3B82F6' },
    { name: 'Em Andamento', value: reservas.filter(r => r.status === 'em_andamento').length, color: '#F59E0B' },
    { name: 'Concluídas', value: reservas.filter(r => r.status === 'concluida').length, color: '#10B981' },
    { name: 'Canceladas', value: reservas.filter(r => r.status === 'cancelada').length, color: '#EF4444' }
  ];

  // Dados por sala (top 5)
  const reservasPorSala = salas.map(sala => ({
    sala: sala.nome || `Sala ${sala.id}`,
    reservas: reservas.filter(r => r.sala_id === sala.id).length
  })).sort((a, b) => b.reservas - a.reservas).slice(0, 5);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const StatCard = ({ title, value, subtitle, color = 'primary' }) => (
    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: `${color}.50` }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: `${color}.main`, mb: 1 }}>
        {value}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 0.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChart3 size={24} />
            Analytics e Relatórios
          </Typography>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              label="Período"
            >
              <MenuItem value="semana">Esta Semana</MenuItem>
              <MenuItem value="mes">Este Mês</MenuItem>
              <MenuItem value="trimestre">Trimestre</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Visão Geral" icon={<Activity size={16} />} />
          <Tab label="Por Status" icon={<PieIcon size={16} />} />
          <Tab label="Por Sala" icon={<BarChart3 size={16} />} />
          <Tab label="Tendências" icon={<TrendingUp size={16} />} />
        </Tabs>

        {/* Tab 0 - Visão Geral */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total de Reservas"
                value={estatisticas.totalReservas}
                subtitle="Todas as reservas"
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Reservas Ativas"
                value={estatisticas.reservasAtivas}
                subtitle="Agendadas + Em andamento"
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Salas Disponíveis"
                value={estatisticas.salasDisponiveis}
                subtitle="Total de salas"
                color="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Taxa de Ocupação"
                value={`${estatisticas.taxaOcupacao}%`}
                subtitle="Ocupação atual"
                color="success"
              />
            </Grid>
          </Grid>
        )}

        {/* Tab 1 - Por Status */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {statusData.map((item, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: item.color,
                      margin: '0 auto 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                      {item.value}
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                    {item.name}
                  </Typography>
                  <Chip 
                    label={`${Math.round((item.value / reservas.length) * 100) || 0}%`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 2 - Por Sala */}
        {activeTab === 2 && (
          <Grid container spacing={2}>
            {reservasPorSala.length > 0 ? (
              reservasPorSala.map((item, index) => (
                <Grid item xs={12} key={index}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                        {item.sala}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                          {item.reservas}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          reservas
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        width: '100%',
                        height: 8,
                        backgroundColor: 'grey.200',
                        borderRadius: 4,
                        mt: 1,
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          width: `${Math.min((item.reservas / Math.max(...reservasPorSala.map(s => s.reservas))) * 100, 100)}%`,
                          height: '100%',
                          backgroundColor: 'primary.main',
                          borderRadius: 'inherit'
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Nenhum dado disponível para o período selecionado
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}

        {/* Tab 3 - Tendências */}
        {activeTab === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium' }}>
                  Resumo de Tendências
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                      <TrendingUp size={32} color="#10B981" />
                      <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
                        Crescimento
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        +15% este mês
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.50', borderRadius: 2 }}>
                      <Activity size={32} color="#F59E0B" />
                      <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
                        Pico de Uso
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        14h - 16h
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                      <BarChart3 size={32} color="#3B82F6" />
                      <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
                        Eficiência
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        85% ocupação
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default GraficosInterativosSimples;
