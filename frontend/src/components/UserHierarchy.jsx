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
  Chip,
  Avatar,
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
  Divider
} from '@mui/material';
import {
  Person,
  AdminPanelSettings,
  SupervisorAccount,
  Group,
  Add,
  Edit,
  Delete,
  Email,
  Phone,
  Business
} from '@mui/icons-material';

const UserHierarchy = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      nome: 'Administrador Sistema',
      email: 'admin@salafacil.com',
      telefone: '(11) 99999-9999',
      role: 'admin',
      departamento: 'TI',
      status: 'ativo',
      avatar: null
    },
    {
      id: 2,
      nome: 'João Silva',
      email: 'joao@empresa.com',
      telefone: '(11) 88888-8888',
      role: 'manager',
      departamento: 'Vendas',
      status: 'ativo',
      avatar: null
    },
    {
      id: 3,
      nome: 'Maria Santos',
      email: 'maria@empresa.com',
      telefone: '(11) 77777-7777',
      role: 'user',
      departamento: 'Marketing',
      status: 'ativo',
      avatar: null
    }
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'user',
    departamento: '',
    status: 'ativo'
  });

  const roles = {
    admin: { label: 'Administrador', icon: <AdminPanelSettings />, color: 'error' },
    manager: { label: 'Gerente', icon: <SupervisorAccount />, color: 'warning' },
    user: { label: 'Usuário', icon: <Person />, color: 'primary' }
  };

  const departamentos = ['TI', 'Vendas', 'Marketing', 'RH', 'Financeiro', 'Operações'];

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData(user);
    } else {
      setSelectedUser(null);
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        role: 'user',
        departamento: '',
        status: 'ativo'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleSubmit = () => {
    if (selectedUser) {
      // Editar usuário existente
      setUsers(users.map(user => 
        user.id === selectedUser.id ? { ...formData, id: selectedUser.id } : user
      ));
    } else {
      // Criar novo usuário
      const newUser = {
        ...formData,
        id: Date.now(),
        avatar: null
      };
      setUsers([...users, newUser]);
    }
    handleCloseDialog();
  };

  const handleDelete = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const getRoleIcon = (role) => {
    return roles[role]?.icon || <Person />;
  };

  const getRoleColor = (role) => {
    return roles[role]?.color || 'default';
  };

  const getRoleLabel = (role) => {
    return roles[role]?.label || 'Usuário';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          <Group sx={{ mr: 1, verticalAlign: 'middle' }} />
          Hierarquia de Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Usuário
        </Button>
      </Box>

      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} md={6} lg={4} key={user.id}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                    {user.nome.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{user.nome}</Typography>
                    <Chip
                      icon={getRoleIcon(user.role)}
                      label={getRoleLabel(user.role)}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => handleOpenDialog(user)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDelete(user.id)}
                      disabled={user.role === 'admin'}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <Email fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={user.email}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Phone fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={user.telefone}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Business fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={user.departamento}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                </List>

                <Chip
                  label={user.status}
                  color={user.status === 'ativo' ? 'success' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Dialog para adicionar/editar usuário */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Papel</InputLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    label="Papel"
                  >
                    <MenuItem value="admin">Administrador</MenuItem>
                    <MenuItem value="manager">Gerente</MenuItem>
                    <MenuItem value="user">Usuário</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Departamento</InputLabel>
                  <Select
                    value={formData.departamento}
                    onChange={(e) => setFormData({ ...formData, departamento: e.target.value })}
                    label="Departamento"
                  >
                    {departamentos.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Status"
                  >
                    <MenuItem value="ativo">Ativo</MenuItem>
                    <MenuItem value="inativo">Inativo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.nome || !formData.email}
          >
            {selectedUser ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserHierarchy;