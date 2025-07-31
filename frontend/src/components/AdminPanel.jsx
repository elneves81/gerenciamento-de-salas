import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
  Business as BusinessIcon,
  SupervisorAccount as SupervisorAccountIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

// Configuração da API
const API_BASE_URL = '/api';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(''); // 'user', 'department'
  const [editingItem, setEditingItem] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados dos formulários
  const [userForm, setUserForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'user',
    department: '',
    manager: ''
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    parent: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadDepartments(),
        loadStats()
      ]);
    } catch (error) {
      setError('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/`);
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      const data = await response.json();
      setUsers(data.results || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      // Fallback para dados mock se API falhar
      setUsers([
        {
          id: 1,
          nome: 'Usuário Demo',
          email: 'demo@salafacil.com',
          telefone: '(11) 99999-9999',
          role: 'admin',
          status: 'active',
          department_name: 'Administração',
          created_at: new Date().toISOString()
        }
      ]);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/departments/`);
      if (!response.ok) throw new Error('Erro ao carregar departamentos');
      const data = await response.json();
      setDepartments(data.results || []);
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error);
      // Fallback para dados mock
      setDepartments([
        { id: 1, name: 'Administração', description: 'Departamento Administrativo', users_count: 5 },
        { id: 2, name: 'TI', description: 'Tecnologia da Informação', users_count: 3 },
        { id: 3, name: 'RH', description: 'Recursos Humanos', users_count: 2 }
      ]);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats/`);
      if (!response.ok) throw new Error('Erro ao carregar estatísticas');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Fallback para dados mock
      setStats({
        total_users: 10,
        active_users: 8,
        blocked_users: 2,
        admin_users: 3,
        total_departments: 3,
        recent_logins: 5
      });
    }
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm)
      });

      if (!response.ok) throw new Error('Erro ao criar usuário');
      
      setSuccess('Usuário criado com sucesso!');
      setOpenDialog(false);
      resetForms();
      loadUsers();
    } catch (error) {
      setError('Erro ao criar usuário: ' + error.message);
    }
  };

  const handleUpdateUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${editingItem.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm)
      });

      if (!response.ok) throw new Error('Erro ao atualizar usuário');
      
      setSuccess('Usuário atualizado com sucesso!');
      setOpenDialog(false);
      resetForms();
      loadUsers();
    } catch (error) {
      setError('Erro ao atualizar usuário: ' + error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao excluir usuário');
      
      setSuccess('Usuário excluído com sucesso!');
      loadUsers();
    } catch (error) {
      setError('Erro ao excluir usuário: ' + error.message);
    }
  };

  const handleBlockUser = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/block_user/`, {
        method: 'PATCH'
      });

      if (!response.ok) throw new Error('Erro ao bloquear/desbloquear usuário');
      
      setSuccess('Status do usuário alterado com sucesso!');
      loadUsers();
    } catch (error) {
      setError('Erro ao alterar status do usuário: ' + error.message);
    }
  };

  const handleCreateDepartment = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/departments/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentForm)
      });

      if (!response.ok) throw new Error('Erro ao criar departamento');
      
      setSuccess('Departamento criado com sucesso!');
      setOpenDialog(false);
      resetForms();
      loadDepartments();
    } catch (error) {
      setError('Erro ao criar departamento: ' + error.message);
    }
  };

  const openUserDialog = (user = null) => {
    setDialogType('user');
    setEditingItem(user);
    if (user) {
      setUserForm({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        role: user.role || 'user',
        department: user.department_id || '',
        manager: user.manager_id || ''
      });
    }
    setOpenDialog(true);
  };

  const openDepartmentDialog = (department = null) => {
    setDialogType('department');
    setEditingItem(department);
    if (department) {
      setDepartmentForm({
        name: department.name || '',
        description: department.description || '',
        parent: department.parent_id || ''
      });
    }
    setOpenDialog(true);
  };

  const resetForms = () => {
    setUserForm({
      nome: '',
      email: '',
      telefone: '',
      role: 'user',
      department: '',
      manager: ''
    });
    setDepartmentForm({
      name: '',
      description: '',
      parent: ''
    });
    setEditingItem(null);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    resetForms();
    setError('');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return 'error';
      case 'admin': return 'warning';
      case 'manager': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status) => {
    return status === 'active' ? 'success' : 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Alertas */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Typography variant="h4" component="h1" gutterBottom>
        Painel Administrativo
      </Typography>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <GroupIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total de Usuários
                  </Typography>
                  <Typography variant="h5">
                    {stats.total_users || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Usuários Ativos
                  </Typography>
                  <Typography variant="h5">
                    {stats.active_users || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SupervisorAccountIcon color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Administradores
                  </Typography>
                  <Typography variant="h5">
                    {stats.admin_users || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <BusinessIcon color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Departamentos
                  </Typography>
                  <Typography variant="h5">
                    {stats.total_departments || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs de Navegação */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Usuários" />
          <Tab label="Departamentos" />
        </Tabs>
      </Box>

      {/* Tab de Usuários */}
      {activeTab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Gerenciar Usuários</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openUserDialog()}
            >
              Novo Usuário
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Telefone</TableCell>
                  <TableCell>Função</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.nome}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.telefone || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.department_name || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openUserDialog(user)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleBlockUser(user.id)}
                        color={user.status === 'active' ? 'error' : 'success'}
                      >
                        <BlockIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUser(user.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Tab de Departamentos */}
      {activeTab === 1 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Gerenciar Departamentos</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => openDepartmentDialog()}
            >
              Novo Departamento
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Usuários</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell>{dept.description || '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${dept.users_count || 0} usuários`}
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => openDepartmentDialog(dept)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Dialog de Usuário */}
      <Dialog open={openDialog && dialogType === 'user'} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome"
                value={userForm.nome}
                onChange={(e) => setUserForm({ ...userForm, nome: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={userForm.telefone}
                onChange={(e) => setUserForm({ ...userForm, telefone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Função</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                >
                  <MenuItem value="user">Usuário</MenuItem>
                  <MenuItem value="manager">Gerente</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                  <MenuItem value="superadmin">Super Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button
            onClick={editingItem ? handleUpdateUser : handleCreateUser}
            variant="contained"
          >
            {editingItem ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Departamento */}
      <Dialog open={openDialog && dialogType === 'department'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Editar Departamento' : 'Novo Departamento'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={3}
                value={departmentForm.description}
                onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Departamento Pai</InputLabel>
                <Select
                  value={departmentForm.parent}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, parent: e.target.value })}
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancelar</Button>
          <Button
            onClick={handleCreateDepartment}
            variant="contained"
          >
            {editingItem ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminPanel;
