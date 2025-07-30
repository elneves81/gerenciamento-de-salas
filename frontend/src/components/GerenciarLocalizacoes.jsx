import React, { useState, useEffect } from 'react';
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
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  useMediaQuery
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  LocationOn,
  Business,
  Save,
  Cancel,
  People,
  MeetingRoom,
  AdminPanelSettings
} from '@mui/icons-material';
import api from '../services/api';

const GerenciarLocalizacoes = ({ onClose }) => {
  const isMobile = useMediaQuery('(max-width:768px)');
  const [localizacoes, setLocalizacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLocal, setEditingLocal] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    endereco: '',
    tipo: 'prefeitura', // prefeitura, saude, educacao, outros
    ativa: true
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    loadLocalizacoes();
  }, []);

  const loadLocalizacoes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/localizacoes');
      setLocalizacoes(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar localizações:', error);
      showSnackbar('Erro ao carregar localizações', 'error');
      setLocalizacoes([]);
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (local = null) => {
    if (local) {
      setEditingLocal(local);
      setFormData({
        nome: local.nome || '',
        descricao: local.descricao || '',
        endereco: local.endereco || '',
        tipo: local.tipo || 'prefeitura',
        ativa: local.ativa !== false
      });
    } else {
      setEditingLocal(null);
      setFormData({
        nome: '',
        descricao: '',
        endereco: '',
        tipo: 'prefeitura',
        ativa: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLocal(null);
    setFormData({
      nome: '',
      descricao: '',
      endereco: '',
      tipo: 'prefeitura',
      ativa: true
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.nome.trim()) {
        showSnackbar('Nome da localização é obrigatório', 'warning');
        return;
      }

      const localData = {
        nome: formData.nome.trim(),
        descricao: formData.descricao.trim(),
        endereco: formData.endereco.trim(),
        tipo: formData.tipo,
        ativa: formData.ativa
      };

      if (editingLocal) {
        await api.put(`/localizacoes/${editingLocal.id}`, localData);
        showSnackbar('Localização atualizada com sucesso!', 'success');
      } else {
        await api.post('/localizacoes', localData);
        showSnackbar('Localização criada com sucesso!', 'success');
      }

      handleCloseDialog();
      await loadLocalizacoes();
    } catch (error) {
      console.error('Erro ao salvar localização:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erro ao salvar localização';
      showSnackbar(errorMessage, 'error');
    }
  };

  const handleDelete = async (localId, localNome) => {
    if (window.confirm(`Tem certeza que deseja excluir a localização "${localNome}"?`)) {
      try {
        await api.delete(`/localizacoes/${localId}`);
        showSnackbar('Localização excluída com sucesso!', 'success');
        await loadLocalizacoes();
      } catch (error) {
        console.error('Erro ao excluir localização:', error);
        const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Erro ao excluir localização';
        showSnackbar(errorMessage, 'error');
      }
    }
  };

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'prefeitura':
        return <AdminPanelSettings />;
      case 'saude':
        return <LocationOn />;
      case 'educacao':
        return <Business />;
      default:
        return <LocationOn />;
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'prefeitura':
        return 'Prefeitura';
      case 'saude':
        return 'Saúde';
      case 'educacao':
        return 'Educação';
      default:
        return 'Outros';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <Typography variant="h6">Carregando localizações...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <LocationOn sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Gerenciar Localizações
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Configure os locais de agendamento do sistema
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" gap={1}>
              <Button
                variant="contained"
                onClick={() => handleOpenDialog()}
                startIcon={<Add />}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                  ...(isMobile && { minWidth: 'auto', px: 2 })
                }}
              >
                {isMobile ? '' : 'Nova Localização'}
                {isMobile && <Add />}
              </Button>
              {onClose && (
                <Button
                  variant="outlined"
                  onClick={onClose}
                  sx={{ 
                    color: 'white', 
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Fechar
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Lista de Localizações */}
        <Grid container spacing={3}>
          {localizacoes.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <LocationOn sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Nenhuma localização cadastrada
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => handleOpenDialog()}
                  startIcon={<Add />}
                  sx={{ mt: 2 }}
                >
                  Criar primeira localização
                </Button>
              </Paper>
            </Grid>
          ) : (
            localizacoes.map((local) => (
              <Grid item xs={12} md={6} lg={4} key={local.id}>
                <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getTipoIcon(local.tipo)}
                        <Typography variant="h6" component="h2" noWrap>
                          {local.nome}
                        </Typography>
                      </Box>
                      <Chip
                        label={getTipoLabel(local.tipo)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    
                    {local.descricao && (
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        {local.descricao}
                      </Typography>
                    )}
                    
                    {local.endereco && (
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        📍 {local.endereco}
                      </Typography>
                    )}
                    
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Chip
                        label={local.ativa ? 'Ativa' : 'Inativa'}
                        size="small"
                        color={local.ativa ? 'success' : 'default'}
                      />
                      
                      <Box>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(local)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(local.id, local.nome)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Dialog para Criar/Editar */}
        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <LocationOn />
              {editingLocal ? 'Editar Localização' : 'Nova Localização'}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                autoFocus
                fullWidth
                label="Nome da Localização"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                label="Descrição"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Endereço"
                value={formData.endereco}
                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                select
                label="Tipo"
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                SelectProps={{
                  native: true,
                }}
                sx={{ mb: 2 }}
              >
                <option value="prefeitura">Prefeitura</option>
                <option value="saude">Saúde</option>
                <option value="educacao">Educação</option>
                <option value="outros">Outros</option>
              </TextField>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.ativa}
                    onChange={(e) => setFormData({ ...formData, ativa: e.target.checked })}
                  />
                }
                label="Localização ativa"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog} startIcon={<Cancel />}>
              Cancelar
            </Button>
            <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
              {editingLocal ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default GerenciarLocalizacoes;
