import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  BarChart3,
  PieChart,
  Filter,
  Share,
  Printer,
  Mail
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const RelatoriosAvancados = ({ reservas = [], salas = [] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [periodo, setPeriodo] = useState('mes');
  const [tipoRelatorio, setTipoRelatorio] = useState('ocupacao');
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    sala: '',
    status: '',
    usuario: ''
  });
  const [dialogExport, setDialogExport] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    formato: 'xlsx',
    incluirGraficos: true,
    incluirDetalhes: true
  });

  // Dados processados para relatórios
  const [dadosRelatorio, setDadosRelatorio] = useState({
    ocupacao: [],
    utilizacao: [],
    performance: [],
    custos: []
  });

  useEffect(() => {
    processarDados();
  }, [reservas, salas, periodo, filtros]);

  const processarDados = () => {
    const hoje = new Date();
    const diasPeriodo = periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : periodo === 'trimestre' ? 90 : 365;
    
    // Filtrar reservas por período
    const reservasFiltradas = reservas.filter(reserva => {
      const dataReserva = new Date(reserva.data_inicio);
      const dataLimite = new Date(hoje.getTime() - diasPeriodo * 24 * 60 * 60 * 1000);
      
      let passou = dataReserva >= dataLimite;
      
      // Aplicar filtros adicionais
      if (filtros.sala && reserva.sala_id !== filtros.sala) passou = false;
      if (filtros.status && reserva.status !== filtros.status) passou = false;
      if (filtros.dataInicio && dataReserva < new Date(filtros.dataInicio)) passou = false;
      if (filtros.dataFim && dataReserva > new Date(filtros.dataFim)) passou = false;
      
      return passou;
    });

    // Relatório de Ocupação
    const ocupacaoPorSala = salas.map(sala => {
      const reservasSala = reservasFiltradas.filter(r => r.sala_id === sala.id);
      const horasTotal = diasPeriodo * 12; // 12 horas úteis por dia
      const horasOcupadas = reservasSala.length * 2; // Assumindo 2h por reserva em média
      
      return {
        sala: sala.nome || `Sala ${sala.id}`,
        reservas: reservasSala.length,
        horasOcupadas,
        horasTotal,
        percentualOcupacao: Math.round((horasOcupadas / horasTotal) * 100),
        receita: reservasSala.length * 50, // R$ 50 por reserva
        status: horasOcupadas / horasTotal > 0.7 ? 'Alta' : horasOcupadas / horasTotal > 0.4 ? 'Média' : 'Baixa'
      };
    });

    // Relatório de Utilização por Período
    const utilizacaoPorPeriodo = Array.from({ length: Math.min(diasPeriodo, 30) }, (_, i) => {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - i);
      const dataStr = data.toISOString().split('T')[0];
      
      const reservasDia = reservasFiltradas.filter(r => 
        r.data_inicio && r.data_inicio.startsWith(dataStr)
      );
      
      return {
        data: data.toLocaleDateString('pt-BR'),
        reservas: reservasDia.length,
        salasUtilizadas: new Set(reservasDia.map(r => r.sala_id)).size,
        taxaOcupacao: Math.round((reservasDia.length / salas.length) * 100),
        receita: reservasDia.length * 50
      };
    }).reverse();

    // Relatório de Performance
    const performancePorStatus = [
      { status: 'Concluídas', quantidade: reservasFiltradas.filter(r => r.status === 'concluida').length, cor: '#10B981' },
      { status: 'Agendadas', quantidade: reservasFiltradas.filter(r => r.status === 'agendada').length, cor: '#3B82F6' },
      { status: 'Em Andamento', quantidade: reservasFiltradas.filter(r => r.status === 'em_andamento').length, cor: '#F59E0B' },
      { status: 'Canceladas', quantidade: reservasFiltradas.filter(r => r.status === 'cancelada').length, cor: '#EF4444' }
    ];

    // Relatório de Custos e Receita
    const totalReceita = reservasFiltradas.length * 50;
    const custoOperacional = salas.length * diasPeriodo * 10; // R$ 10 por sala por dia
    const lucroLiquido = totalReceita - custoOperacional;

    const relatorioCustos = {
      receita: totalReceita,
      custos: custoOperacional,
      lucro: lucroLiquido,
      margemLucro: totalReceita > 0 ? Math.round((lucroLiquido / totalReceita) * 100) : 0,
      ticketMedio: reservasFiltradas.length > 0 ? Math.round(totalReceita / reservasFiltradas.length) : 0
    };

    setDadosRelatorio({
      ocupacao: ocupacaoPorSala,
      utilizacao: utilizacaoPorPeriodo,
      performance: performancePorStatus,
      custos: relatorioCustos
    });
  };

  const exportarExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Aba de Ocupação
    const wsOcupacao = XLSX.utils.json_to_sheet(dadosRelatorio.ocupacao);
    XLSX.utils.book_append_sheet(wb, wsOcupacao, 'Ocupação por Sala');
    
    // Aba de Utilização
    const wsUtilizacao = XLSX.utils.json_to_sheet(dadosRelatorio.utilizacao);
    XLSX.utils.book_append_sheet(wb, wsUtilizacao, 'Utilização por Período');
    
    // Aba de Performance
    const wsPerformance = XLSX.utils.json_to_sheet(dadosRelatorio.performance);
    XLSX.utils.book_append_sheet(wb, wsPerformance, 'Performance');
    
    // Salvar arquivo
    XLSX.writeFile(wb, `relatorio-salas-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Gestão de Salas', 20, 20);
    
    // Período
    doc.setFontSize(12);
    doc.text(`Período: ${periodo} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 35);
    
    // Resumo Executivo
    doc.setFontSize(16);
    doc.text('Resumo Executivo', 20, 55);
    
    doc.setFontSize(10);
    const resumo = [
      `Total de Reservas: ${reservas.length}`,
      `Receita Total: R$ ${dadosRelatorio.custos.receita?.toLocaleString('pt-BR')}`,
      `Taxa Média de Ocupação: ${Math.round(dadosRelatorio.ocupacao.reduce((acc, sala) => acc + sala.percentualOcupacao, 0) / dadosRelatorio.ocupacao.length)}%`,
      `Salas Mais Utilizadas: ${dadosRelatorio.ocupacao.sort((a, b) => b.reservas - a.reservas).slice(0, 3).map(s => s.sala).join(', ')}`
    ];
    
    resumo.forEach((linha, index) => {
      doc.text(linha, 20, 70 + (index * 8));
    });
    
    // Tabela de Ocupação por Sala
    doc.autoTable({
      startY: 110,
      head: [['Sala', 'Reservas', 'Ocupação (%)', 'Status', 'Receita (R$)']],
      body: dadosRelatorio.ocupacao.map(sala => [
        sala.sala,
        sala.reservas,
        `${sala.percentualOcupacao}%`,
        sala.status,
        `R$ ${sala.receita.toLocaleString('pt-BR')}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [102, 126, 234] }
    });
    
    // Salvar
    doc.save(`relatorio-salas-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const StatusChip = ({ status }) => {
    const cores = {
      'Alta': 'success',
      'Média': 'warning',
      'Baixa': 'error'
    };
    return <Chip label={status} color={cores[status]} size="small" />;
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileText size={24} />
            Relatórios Avançados
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
                <MenuItem value="ano">1 ano</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<Download size={18} />}
              onClick={() => setDialogExport(true)}
              sx={{ textTransform: 'none' }}
            >
              Exportar
            </Button>
          </Box>
        </Box>

        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab icon={<BarChart3 size={18} />} label="Ocupação" />
          <Tab icon={<TrendingUp size={18} />} label="Utilização" />
          <Tab icon={<PieChart size={18} />} label="Performance" />
          <Tab icon={<FileText size={18} />} label="Financeiro" />
        </Tabs>

        {/* Tab 1: Relatório de Ocupação */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>Ocupação por Sala</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Sala</strong></TableCell>
                    <TableCell align="center"><strong>Reservas</strong></TableCell>
                    <TableCell align="center"><strong>Horas Ocupadas</strong></TableCell>
                    <TableCell align="center"><strong>Taxa de Ocupação</strong></TableCell>
                    <TableCell align="center"><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Receita</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dadosRelatorio.ocupacao.map((sala, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{sala.sala}</TableCell>
                      <TableCell align="center">{sala.reservas}</TableCell>
                      <TableCell align="center">{sala.horasOcupadas}h</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={sala.percentualOcupacao}
                            sx={{ width: 60, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="body2">{sala.percentualOcupacao}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <StatusChip status={sala.status} />
                      </TableCell>
                      <TableCell align="right">R$ {sala.receita.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 2: Utilização por Período */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Utilização por Período</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Data</strong></TableCell>
                    <TableCell align="center"><strong>Reservas</strong></TableCell>
                    <TableCell align="center"><strong>Salas Utilizadas</strong></TableCell>
                    <TableCell align="center"><strong>Taxa Ocupação</strong></TableCell>
                    <TableCell align="right"><strong>Receita</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dadosRelatorio.utilizacao.map((dia, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{dia.data}</TableCell>
                      <TableCell align="center">{dia.reservas}</TableCell>
                      <TableCell align="center">{dia.salasUtilizadas}</TableCell>
                      <TableCell align="center">{dia.taxaOcupacao}%</TableCell>
                      <TableCell align="right">R$ {dia.receita.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 3: Performance */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>Performance por Status</Typography>
            <Grid container spacing={3}>
              {dadosRelatorio.performance.map((item, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: item.cor, fontWeight: 'bold' }}>
                        {item.quantidade}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.status}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {Math.round((item.quantidade / reservas.length) * 100)}% do total
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Tab 4: Relatório Financeiro */}
        {activeTab === 3 && (
          <Box>
            <Typography variant="h6" gutterBottom>Análise Financeira</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      💰 Receita Total
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      R$ {dadosRelatorio.custos.receita?.toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Período: {periodo}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" color="error.main" gutterBottom>
                      💸 Custos Operacionais
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      R$ {dadosRelatorio.custos.custos?.toLocaleString('pt-BR')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manutenção e operação
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      📈 Lucro Líquido
                    </Typography>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 'bold',
                      color: dadosRelatorio.custos.lucro >= 0 ? 'success.main' : 'error.main'
                    }}>
                      R$ {dadosRelatorio.custos.lucro?.toLocaleString('pt-BR')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      📊 Margem de Lucro
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {dadosRelatorio.custos.margemLucro}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      🎯 Ticket Médio
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      R$ {dadosRelatorio.custos.ticketMedio}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Dialog de Exportação */}
        <Dialog open={dialogExport} onClose={() => setDialogExport(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Exportar Relatório</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Formato</InputLabel>
                <Select
                  value={exportConfig.formato}
                  label="Formato"
                  onChange={(e) => setExportConfig(prev => ({ ...prev, formato: e.target.value }))}
                >
                  <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                  <MenuItem value="pdf">PDF (.pdf)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogExport(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={() => {
                if (exportConfig.formato === 'xlsx') {
                  exportarExcel();
                } else {
                  exportarPDF();
                }
                setDialogExport(false);
              }}
              startIcon={<Download size={18} />}
            >
              Exportar
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default RelatoriosAvancados;
