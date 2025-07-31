import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert
} from '@mui/material';
import {
  Email,
  Add,
  Edit,
  Delete,
  Send,
  Preview,
  ContentCopy
} from '@mui/icons-material';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([
    {
      id: 1,
      nome: 'Confirmação de Reserva',
      assunto: 'Reserva Confirmada - Sala {sala_nome}',
      corpo: `Olá {usuario_nome},

Sua reserva foi confirmada com sucesso!

Detalhes da reserva:
- Sala: {sala_nome}
- Data: {data_inicio}
- Horário: {hora_inicio} às {hora_fim}
- Participantes: {participantes}

Atenciosamente,
Equipe SalaFácil`,
      tipo: 'confirmacao',
      ativo: true
    },
    {
      id: 2,
      nome: 'Lembrete de Reunião',
      assunto: 'Lembrete - Reunião em {sala_nome} às {hora_inicio}',
      corpo: `Olá {usuario_nome},

Este é um lembrete de sua reunião hoje:

- Sala: {sala_nome}
- Horário: {hora_inicio} às {hora_fim}
- Local: {sala_localizacao}

Não se esqueça!

Atenciosamente,
Equipe SalaFácil`,
      tipo: 'lembrete',
      ativo: true
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    assunto: '',
    corpo: '',
    tipo: 'confirmacao',
    ativo: true
  });

  const tiposTemplate = [
    { value: 'confirmacao', label: 'Confirmação de Reserva' },
    { value: 'lembrete', label: 'Lembrete de Reunião' },
    { value: 'cancelamento', label: 'Cancelamento' },
    { value: 'modificacao', label: 'Modificação' }
  ];

  const variaveis = [
    '{usuario_nome}', '{sala_nome}', '{data_inicio}', '{hora_inicio}',
    '{hora_fim}', '{participantes}', '{sala_localizacao}', '{observacoes}'
  ];

  const handleOpenDialog = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData(template);
    } else {
      setEditingTemplate(null);
      setFormData({
        nome: '',
        assunto: '',
        corpo: '',
        tipo: 'confirmacao',
        ativo: true
      });
    }
    setDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => 
        t.id === editingTemplate.id ? { ...formData, id: editingTemplate.id } : t
      ));
    } else {
      setTemplates(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setDialogOpen(false);
  };

  const handleDeleteTemplate = (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  };

  const insertVariable = (variable) => {
    setFormData(prev => ({
      ...prev,
      corpo: prev.corpo + variable
    }));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
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

      <Alert severity="info" sx={{ mb: 3 }}>
        Os templates de email são usados para enviar notificações automáticas aos usuários sobre suas reservas.
      </Alert>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} md={6} key={template.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6">{template.nome}</Typography>
                  <Box>
                    <Chip 
                      label={template.ativo ? 'Ativo' : 'Inativo'}
                      color={template.ativo ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Tipo: {tiposTemplate.find(t => t.value === template.tipo)?.label}
                </Typography>
                
                <Typography variant="subtitle2" gutterBottom>
                  Assunto: {template.assunto}
                </Typography>
                
                <Typography variant="body2" sx={{ 
                  maxHeight: 100, 
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'pre-wrap'
                }}>
                  {template.corpo}
                </Typography>
                
                <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
                  <IconButton 
                    size="small" 
                    onClick={() => handleOpenDialog(template)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteTemplate(template.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog para criar/editar template */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Editar Template' : 'Novo Template'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome do Template"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                >
                  {tiposTemplate.map(tipo => (
                    <MenuItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Assunto"
                value={formData.assunto}
                onChange={(e) => setFormData(prev => ({ ...prev, assunto: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={8}
                label="Corpo do Email"
                value={formData.corpo}
                onChange={(e) => setFormData(prev => ({ ...prev, corpo: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Variáveis Disponíveis:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {variaveis.map(variavel => (
                  <Chip
                    key={variavel}
                    label={variavel}
                    size="small"
                    onClick={() => insertVariable(variavel)}
                    clickable
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveTemplate}
            variant="contained"
            disabled={!formData.nome || !formData.assunto || !formData.corpo}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmailTemplates;