import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
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
  Chip
} from '@mui/material';
import { TrendingUp, BarChart3, PieChart as PieIcon, Activity } from 'lucide-react';

const GraficosInterativos = ({ reservas = [], salas = [] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [periodo, setPeriodo] = useState('semana');

  // Preparar dados para os gráficos
  const prepararDados = () => {
    const hoje = new Date();
    const diasAtras = periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : 90;
    
    // Dados de ocupação por dia
    const ocupacaoPorDia = Array.from({ length: diasAtras }, (_, i) => {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - (diasAtras - 1 - i));
      const dataStr = data.toISOString().split('T')[0];
      
      const reservasDoDia = reservas.filter(r => 
        r.data_inicio && r.data_inicio.startsWith(dataStr)
      ).length;
      
      return {
        data: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        reservas: reservasDoDia,
        ocupacao: Math.round((reservasDoDia / salas.length) * 100) || 0
      };
    });

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

    // Dados de horários mais populares
    const horariosPico = Array.from({ length: 24 }, (_, hora) => {
      const reservasNoHorario = reservas.filter(r => {
        if (!r.data_inicio) return false;
        const horaReserva = new Date(r.data_inicio).getHours();
        return horaReserva === hora;
      }).length;

      return {
        hora: `${hora.toString().padStart(2, '0')}:00`,
        reservas: reservasNoHorario
      };
    }).filter(h => h.reservas > 0);

    return { ocupacaoPorDia, statusData, reservasPorSala, horariosPico };
  };

  const { ocupacaoPorDia, statusData, reservasPorSala, horariosPico } = prepararDados();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e2e8f0'
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            {label}
          </Typography>
          {payload.map((entry, index) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
              {entry.dataKey === 'ocupacao' && '%'}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Activity size={24} />
            Análise Inteligente
          </Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={periodo}
              label="Período"
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <MenuItem value="semana">7 dias</MenuItem>
              <MenuItem value="mes">30 dias</MenuItem>
              <MenuItem value="trimestre">90 dias</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab icon={<TrendingUp size={18} />} label="Tendências" />
          <Tab icon={<BarChart3 size={18} />} label="Por Sala" />
          <Tab icon={<PieIcon size={18} />} label="Status" />
          <Tab icon={<Activity size={18} />} label="Horários" />
        </Tabs>

        <Box sx={{ height: 400 }}>
          {/* Tab 1: Gráfico de Tendências */}
          {activeTab === 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ocupacaoPorDia}>
                <defs>
                  <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#667eea" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorOcupacao" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#764ba2" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#764ba2" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="reservas"
                  stroke="#667eea"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorReservas)"
                  name="Reservas"
                />
                <Area
                  type="monotone"
                  dataKey="ocupacao"
                  stroke="#764ba2"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorOcupacao)"
                  name="% Ocupação"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* Tab 2: Gráfico por Sala */}
          {activeTab === 1 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reservasPorSala} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" />
                <YAxis dataKey="sala" type="category" stroke="#666" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="reservas"
                  fill="url(#colorBar)"
                  radius={[4, 4, 0, 0]}
                  name="Reservas"
                >
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#764ba2" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {/* Tab 3: Pizza de Status */}
          {activeTab === 2 && (
            <Grid container spacing={3} sx={{ height: '100%' }}>
              <Grid item xs={12} md={8}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
                  {statusData.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: item.color
                        }}
                      />
                      <Typography variant="body2">
                        {item.name}: <strong>{item.value}</strong>
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Tab 4: Horários de Pico */}
          {activeTab === 3 && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={horariosPico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hora" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="reservas"
                  fill="#667eea"
                  radius={[4, 4, 0, 0]}
                  name="Reservas por Horário"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* Insights Automáticos */}
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            💡 Insights Automáticos:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {reservasPorSala[0] && (
              <Chip
                label={`Sala mais popular: ${reservasPorSala[0].sala}`}
                color="primary"
                size="small"
              />
            )}
            {horariosPico[0] && (
              <Chip
                label={`Horário de pico: ${horariosPico[0].hora}`}
                color="secondary"
                size="small"
              />
            )}
            <Chip
              label={`Taxa média de ocupação: ${Math.round(ocupacaoPorDia.reduce((acc, day) => acc + day.ocupacao, 0) / ocupacaoPorDia.length)}%`}
              color="success"
              size="small"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GraficosInterativos;
