import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  Tooltip,
  Switch,
  FormControlLabel,
  useMediaQuery,
  Tabs,
  Tab,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MeetingRoom,
  ArrowBack,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  LocationOn,
  Business,
  Settings,
  People
} from '@mui/icons-material';
import api from '../services/api';
import GerenciarLocalizacoes from '../components/GerenciarLocalizacoes';

const GerenciarSalas = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:768px)');
  const [activeTab, setActiveTab] = useState(0);
  const [salas, setSalas] = useState([]);
  const [localizacoes, setLocalizacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSala, setEditingSala] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  const [formData, setFormData] = useState({
    nome: '',
    capacidade: '',
    descricao: '',
    localizacao_id: '',
    ativa: true
  });

  useEffect(() => {
    loadSalas();
    loadLocalizacoes();
  }, []);

  const loadSalas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/salas');
      const salasData = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setSalas(salasData);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar salas:', err);
      setError('Erro ao carregar salas');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalizacoes = async () => {
    try {
      const response = await api.get('/localizacoes');
      const localizacoesData = Array.isArray(response.data) ? response.data : response.data?.results || [];
      setLocalizacoes(localizacoesData);
    } catch (err) {
      console.error('Erro ao carregar localizações:', err);
      // Não mostrar erro se as localizações falharem
    }
  };

  const handleOpenDialog = (sala = null) => {
    if (sala) {
      setEditingSala(sala);
      setFormData({
        nome: sala.nome || '',
        capacidade: sala.capacidade || '',
        descricao: sala.descricao || '',
        localizacao_id: sala.localizacao_id || '',
        ativa: sala.ativa !== false
      });
    } else {
      setEditingSala(null);
      setFormData({
        nome: '',
        capacidade: '',
        descricao: '',
        localizacao_id: '',
        ativa: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingSala(null);
    setFormData({
      nome: '',
      capacidade: '',
      descricao: '',
      localizacao_id: '',
      ativa: true
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.nome.trim()) {
        showSnackbar('Nome da sala é obrigatório', 'warning');
        return;
      }

      const salaData = {
        nome: formData.nome.trim(),
        capacidade: parseInt(formData.capacidade) || 0,
        descricao: formData.descricao.trim(),
        localizacao_id: formData.localizacao_id || null,
        ativa: formData.ativa
      };

      if (editingSala) {
        await api.put(`/salas/${editingSala.id}`, salaData);
        showSnackbar('Sala atualizada com sucesso!', 'success');
      } else {
        await api.post('/salas', salaData);
        showSnackbar('Sala criada com sucesso!', 'success');
      }

      handleCloseDialog();
      await loadSalas();
    } catch (error) {
      console.error('Erro ao salvar sala:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erro ao salvar sala';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (salaId, salaNome) => {
    if (window.confirm(`Tem certeza que deseja excluir a sala "${salaNome}"?`)) {
      try {
        await api.delete(`/salas/${salaId}`);
        showSnackbar('Sala excluída com sucesso!', 'success');
        await loadSalas();
      } catch (error) {
        console.error('Erro ao excluir sala:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erro ao excluir sala';
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const handleToggleAtiva = async (sala) => {
    try {
      const updatedSala = { ...sala, ativa: !sala.ativa };
      await api.put(`/salas/${sala.id}`, updatedSala);
      showSnackbar(`Sala ${updatedSala.ativa ? 'ativada' : 'desativada'} com sucesso!`, 'success');
      await loadSalas();
    } catch (error) {
      console.error('Erro ao alterar status da sala:', error);
      showSnackbar('Erro ao alterar status da sala', 'error');
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <Typography variant="h4">Carregando salas...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton 
                onClick={() => navigate('/dashboard')} 
                sx={{ color: 'white' }}
              >
                <ArrowBack />
              </IconButton>
              <MeetingRoom sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                  Gerenciar Salas
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9 }}>
                  Administração de salas do sistema
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              Nova Sala
            </Button>
          </Box>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Estatísticas */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {salas.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de Salas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                  {salas.filter(s => s.ativa !== false).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Salas Ativas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                  {salas.filter(s => s.ativa === false).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Salas Inativas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 'bold' }}>
                  {Math.round(salas.reduce((acc, sala) => acc + (sala.capacidade || 0), 0) / (salas.length || 1))}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Capacidade Média
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs de Navegação */}
        <Paper elevation={2} sx={{ mb: 3 }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '& .MuiTab-root': {
                minWidth: isMobile ? 120 : 'auto',
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                padding: isMobile ? '6px 12px' : '12px 16px'
              }
            }}
          >
            <Tab 
              label="Salas"
              icon={<MeetingRoom />} 
              iconPosition={isMobile ? "top" : "start"}
            />
            <Tab 
              label="Localizações" 
              icon={<LocationOn />} 
              iconPosition={isMobile ? "top" : "start"}
            />
          </Tabs>
        </Paper>

        {/* Conteúdo das Tabs */}
        {activeTab === 0 && (
          <>
            {/* Tabela de Salas */}
            <Paper elevation={2}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.100' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Capacidade</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salas.length > 0 ? (
                      salas.map((sala) => (
                        <TableRow 
                          key={sala.id}
                          sx={{ 
                            '&:hover': { bgcolor: 'grey.50' },
                            opacity: sala.ativa === false ? 0.6 : 1
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <MeetingRoom color={sala.ativa !== false ? 'primary' : 'disabled'} />
                              <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                {sala.nome}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`${sala.capacidade || 0} pessoas`}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {sala.descricao || 'Sem descrição'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip 
                                label={sala.ativa !== false ? 'Ativa' : 'Inativa'}
                                color={sala.ativa !== false ? 'success' : 'error'}
                                size="small"
                              />
                              <Switch
                                checked={sala.ativa !== false}
                                onChange={() => handleToggleAtiva(sala)}
                                size="small"
                              />
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenDialog(sala)}
                                  color="primary"
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Excluir">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(sala.id, sala.nome)}
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                          <MeetingRoom sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" gutterBottom>
                            Nenhuma sala cadastrada
                          </Typography>
                          <Button 
                            variant="contained" 
                            startIcon={<Add />}
                            onClick={() => handleOpenDialog()}
                            sx={{ mt: 2 }}
                          >
                            Criar Primeira Sala
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </>
        )}

        {activeTab === 1 && (
          <GerenciarLocalizacoes />
        )}

        {/* Tabela de Salas */}
        <Paper elevation={2} sx={{ display: 'none' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Capacidade</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {salas.length > 0 ? (
                  salas.map((sala) => (
                    <TableRow 
                      key={sala.id}
                      sx={{ 
                        '&:hover': { bgcolor: 'grey.50' },
                        opacity: sala.ativa === false ? 0.6 : 1
                      }}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <MeetingRoom color={sala.ativa !== false ? 'primary' : 'disabled'} />
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {sala.nome}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${sala.capacidade || 0} pessoas`}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {sala.descricao || 'Sem descrição'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip 
                            label={sala.ativa !== false ? 'Ativa' : 'Inativa'}
                            color={sala.ativa !== false ? 'success' : 'error'}
                            size="small"
                          />
                          <Switch
                            checked={sala.ativa !== false}
                            onChange={() => handleToggleAtiva(sala)}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="Editar sala">
                            <IconButton 
                              color="primary" 
                              size="small"
                              onClick={() => handleOpenDialog(sala)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir sala">
                            <IconButton 
                              color="error" 
                              size="small"
                              onClick={() => handleDelete(sala.id, sala.nome)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Nenhuma sala cadastrada
                      </Typography>
                      <Button 
                        variant="contained" 
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                        sx={{ mt: 2 }}
                      >
                        Criar Primeira Sala
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Dialog de Criação/Edição */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingSala ? 'Editar Sala' : 'Nova Sala'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Nome da Sala *"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="Ex: Sala de Reunião A"
              />
              <TextField
                fullWidth
                type="number"
                label="Capacidade"
                value={formData.capacidade}
                onChange={(e) => setFormData({ ...formData, capacidade: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="Ex: 10"
                inputProps={{ min: 1 }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Descrição"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="Descreva os recursos da sala..."
              />
              
              {/* Campo de Localização */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Localização</InputLabel>
                <Select
                  value={formData.localizacao_id}
                  label="Localização"
                  onChange={(e) => setFormData({ ...formData, localizacao_id: e.target.value })}
                >
                  <MenuItem value="">
                    <em>Nenhuma localização</em>
                  </MenuItem>
                  {localizacoes.map((local) => (
                    <MenuItem key={local.id} value={local.id}>
                      {local.nome} ({local.tipo})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativa}
                    onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                  />
                }
                label="Sala ativa"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
              {editingSala ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default GerenciarSalas;
