import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  Divider,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Email,
  Add,
  Edit,
  Delete,
  Send,
  Schedule,
  Notifications,
  Person,
  Event,
  CheckCircle
} from '@mui/icons-material';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      nome: 'Confirmação de Agendamento',
      tipo: 'confirmacao',
      assunto: 'Agendamento Confirmado - Sala {{sala_nome}}',
      corpo: `Olá {{usuario_nome}},\n\nSeu agendamento foi confirmado!\n\nDetalhes:\n- Sala: {{sala_nome}}\n- Data: {{data}}\n- Horário: {{horario}}\n- Duração: {{duracao}}\n\nPor favor, chegue com 5 minutos de antecedência.\n\nAtenciosamente,\nEquipe SalaFácil`,
      ativo: true,
      automatico: true
    },
    {
      id: 2,
      nome: 'Lembrete de Reunião',
      tipo: 'lembrete',
      assunto: 'Lembrete - Reunião em {{sala_nome}} em 1 hora',
      corpo: `Olá {{usuario_nome}},\n\nLembrando que você tem uma reunião agendada:\n\n- Sala: {{sala_nome}}\n- Horário: {{horario}}\n- Local: {{endereco}}\n\nNão se esqueça!\n\nEquipe SalaFácil`,
      ativo: true,
      automatico: true
    },
    {
      id: 3,
      nome: 'Cancelamento de Agendamento',
      tipo: 'cancelamento',
      assunto: 'Agendamento Cancelado - {{sala_nome}}',
      corpo: `Olá {{usuario_nome}},\n\nInformamos que o agendamento foi cancelado:\n\n- Sala: {{sala_nome}}\n- Data: {{data}}\n- Horário: {{horario}}\n\nSe tiver dúvidas, entre em contato conosco.\n\nEquipe SalaFácil`,
      ativo: true,
      automatico: true
    }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'confirmacao',
    assunto: '',
    corpo: '',
    ativo: true,
    automatico: false
  });

  const tipos = {
    confirmacao: { label: 'Confirmação', icon: <CheckCircle />, color: 'success' },
    lembrete: { label: 'Lembrete', icon: <Schedule />, color: 'warning' },
    cancelamento: { label: 'Cancelamento', icon: <Notifications />, color: 'error' },
    convite: { label: 'Convite', icon: <Email />, color: 'primary' }
  };

  const variaveis = [
    '{{usuario_nome}}',
    '{{sala_nome}}',
    '{{data}}',
    '{{horario}}',
    '{{duracao}}',
    '{{endereco}}',
    '{{descricao}}',
    '{{organizador}}'
  ];

  const handleOpenDialog = (template = null) => {
    if (template) {
      setSelectedTemplate(template);
      setFormData(template);
    } else {
      setSelectedTemplate(null);
      setFormData({
        nome: '',
        tipo: 'confirmacao',
        assunto: '',
        corpo: '',
        ativo: true,
        automatico: false
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTemplate(null);
  };

  const handleSubmit = () => {
    if (selectedTemplate) {
      // Editar template existente
      setTemplates(templates.map(template => 
        template.id === selectedTemplate.id ? { ...formData, id: selectedTemplate.id } : template
      ));
    } else {
      // Criar novo template
      const newTemplate = {
        ...formData,
        id: Date.now()
      };
      setTemplates([...templates, newTemplate]);
    }
    handleCloseDialog();
  };

  const handleDelete = (templateId) => {
    setTemplates(templates.filter(template => template.id !== templateId));
  };

  const handleToggleAtivo = (templateId) => {
    setTemplates(templates.map(template =>
      template.id === templateId ? { ...template, ativo: !template.ativo } : template
    ));
  };

  const insertVariable = (variavel) => {
    setFormData({
      ...formData,
      corpo: formData.corpo + variavel
    });
  };

  const getTipoIcon = (tipo) => {
    return tipos[tipo]?.icon || <Email />;
  };

  const getTipoColor = (tipo) => {
    return tipos[tipo]?.color || 'default';
  };

  const getTipoLabel = (tipo) => {
    return tipos[tipo]?.label || 'Template';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
          Templates de Email
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Template
        </Button>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} lg={4} key={template.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {template.nome}
                    </Typography>
                    <Chip
                      icon={getTipoIcon(template.tipo)}
                      label={getTipoLabel(template.tipo)}
                      color={getTipoColor(template.tipo)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(template.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Assunto:
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                  {template.assunto}
                </Typography>

                <Typography variant="subtitle2" gutterBottom>
                  Conteúdo:
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    mb: 2, 
                    whiteSpace: 'pre-line',
                    maxHeight: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {template.corpo.substring(0, 150)}
                  {template.corpo.length > 150 ? '...' : ''}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={template.ativo ? 'Ativo' : 'Inativo'}
                    color={template.ativo ? 'success' : 'default'}
                    size="small"
                  />
                  {template.automatico && (
                    <Chip
                      label="Automático"
                      color="info"
                      size="small"
                    />
                  )}
                </Box>

                <Box sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={template.ativo}
                        onChange={() => handleToggleAtivo(template.id)}
                        size="small"
                      />
                    }
                    label="Ativo"
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog para adicionar/editar template */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedTemplate ? 'Editar Template' : 'Novo Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome do Template"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    label="Tipo"
                  >
                    {Object.entries(tipos).map(([key, value]) => (
                      <MenuItem key={key} value={key}>{value.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Assunto"
                  value={formData.assunto}
                  onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Conteúdo do Email"
                  multiline
                  rows={8}
                  value={formData.corpo}
                  onChange={(e) => setFormData({ ...formData, corpo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Variáveis Disponíveis:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {variaveis.map((variavel) => (
                    <Chip
                      key={variavel}
                      label={variavel}
                      variant="outlined"
                      size="small"
                      onClick={() => insertVariable(variavel)}
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.ativo}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    />
                  }
                  label="Template Ativo"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.automatico}
                      onChange={(e) => setFormData({ ...formData, automatico: e.target.checked })}
                    />
                  }
                  label="Envio Automático"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.nome || !formData.assunto || !formData.corpo}
          >
            {selectedTemplate ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplates;