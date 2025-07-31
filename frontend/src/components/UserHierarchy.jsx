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
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Alert
} from '@mui/material';
import {
  People,
  Person,
  PersonAdd,
  Edit,
  Delete,
  AdminPanelSettings,
  SupervisorAccount,
  ExpandMore,
  ChevronRight,
  Security,
  Group
} from '@mui/icons-material';

const UserHierarchy = () => {
  const [users, setUsers] = useState([
    {
      id: 1,
      nome: 'João Silva',
      email: 'joao.silva@salafacil.com',
      role: 'admin',
      department: 'TI',
      supervisor: null,
      status: 'active',
      avatar: null
    },
    {
      id: 2,
      nome: 'Maria Costa',
      email: 'maria.costa@salafacil.com',
      role: 'manager',
      department: 'RH',
      supervisor: 1,
      status: 'active',
      avatar: null
    },
    {
      id: 3,
      nome: 'Pedro Santos',
      email: 'pedro.santos@salafacil.com',
      role: 'user',
      department: 'Vendas',
      supervisor: 2,
      status: 'active',
      avatar: null
    }
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    role: 'user',
    department: '',
    supervisor: '',
    status: 'active'
  });

  const roles = [
    { value: 'superadmin', label: 'Super Administrador', color: 'error' },
    { value: 'admin', label: 'Administrador', color: 'warning' },
    { value: 'manager', label: 'Gerente', color: 'info' },
    { value: 'user', label: 'Usuário', color: 'default' }
  ];

  const departments = [
    'TI', 'RH', 'Vendas', 'Marketing', 'Financeiro', 'Operações'
  ];

  const statusOptions = [
    { value: 'active', label: 'Ativo', color: 'success' },
    { value: 'inactive', label: 'Inativo', color: 'default' },
    { value: 'suspended', label: 'Suspenso', color: 'error' }
  ];

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData(user);
    } else {
      setEditingUser(null);
      setFormData({
        nome: '',
        email: '',
        role: 'user',
        department: '',
        supervisor: '',
        status: 'active'
      });
    }
    setDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (editingUser) {
      setUsers(prev => prev.map(u => 
        u.id === editingUser.id ? { ...formData, id: editingUser.id } : u
      ));
    } else {
      setUsers(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    setDialogOpen(false);
  };

  const handleDeleteUser = (id) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[3];
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getUsersByDepartment = () => {
    const departmentGroups = {};
    users.forEach(user => {
      if (!departmentGroups[user.department]) {
        departmentGroups[user.department] = [];
      }
      departmentGroups[user.department].push(user);
    });
    return departmentGroups;
  };

  const getSubordinates = (userId) => {
    return users.filter(user => user.supervisor === userId);
  };

  const renderUserCard = (user) => (
    <Card key={user.id} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar>
              {user.nome.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Box>
              <Typography variant="h6">{user.nome}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.department}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1}>
            <Chip 
              label={getRoleInfo(user.role).label}
              color={getRoleInfo(user.role).color}
              size="small"
            />
            <Chip 
              label={getStatusInfo(user.status).label}
              color={getStatusInfo(user.status).color}
              size="small"
            />
            <Box>
              <IconButton 
                size="small" 
                onClick={() => handleOpenDialog(user)}
              >
                <Edit />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={() => handleDeleteUser(user.id)}
                color="error"
              >
                <Delete />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Hierarquia de Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog()}
        >
          Novo Usuário
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Gerencie usuários, roles e hierarquia organizacional do sistema.
      </Alert>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            Por Departamento
          </Typography>
          {Object.entries(getUsersByDepartment()).map(([department, users]) => (
            <Box key={department} mb={3}>
              <Typography variant="h6" color="primary" gutterBottom>
                {department} ({users.length})
              </Typography>
              {users.map(renderUserCard)}
            </Box>
          ))}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h5" gutterBottom>
            Estatísticas
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h3" color="primary">
                    {users.length}
                  </Typography>
                  <Typography variant="body2">Total de Usuários</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h3" color="success.main">
                    {users.filter(u => u.status === 'active').length}
                  </Typography>
                  <Typography variant="body2">Usuários Ativos</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h3" color="warning.main">
                    {users.filter(u => u.role === 'admin').length}
                  </Typography>
                  <Typography variant="body2">Administradores</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6}>
              <Card>
                <CardContent>
                  <Typography variant="h3" color="info.main">
                    {departments.length}
                  </Typography>
                  <Typography variant="body2">Departamentos</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Dialog para criar/editar usuário */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  {roles.map(role => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  {statusOptions.map(status => (
                    <MenuItem key={status.value} value={status.value}>
                      {status.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Supervisor</InputLabel>
                <Select
                  value={formData.supervisor}
                  onChange={(e) => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {users.filter(u => u.id !== editingUser?.id).map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.nome}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button 
            onClick={handleSaveUser}
            variant="contained"
            disabled={!formData.nome || !formData.email}
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserHierarchy;