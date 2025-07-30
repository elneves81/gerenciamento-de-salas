import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Badge,
  Fab,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  Notifications as NotificationIcon,
  Business as BusinessIcon,
  Send as SendIcon,
  Visibility as ViewIcon,
  AccountTree as TreeIcon,
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import GerenciarSalas from './GerenciarSalas';
import UserHierarchy from './UserHierarchy';
import CreateSuperAdmin from './CreateSuperAdmin';

// Componente de Tab Panel
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalDepartments: 0
  });

  // Função para gerenciar mudança de abas
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Dialogs state
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openNotificationDialog, setOpenNotificationDialog] = useState(false);
  const [openDepartmentDialog, setOpenDepartmentDialog] = useState(false);
  const [openSuperAdminDialog, setOpenSuperAdminDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Forms state
  const [userForm, setUserForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    role: 'user',
    department_id: '',
    manager_id: ''
  });

  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    recipient_id: '',
    type: 'admin_message'
  });

  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    parent_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Carregar usuários
      const usersResponse = await api.get('/admin/users');
      setUsers(usersResponse.data);

      // Carregar departamentos
      const deptsResponse = await api.get('/admin/departments');
      setDepartments(deptsResponse.data);

      // Calcular estatísticas
      const totalUsers = usersResponse.data.length;
      const activeUsers = usersResponse.data.filter(u => u.status === 'active').length;
      const blockedUsers = usersResponse.data.filter(u => u.status === 'blocked').length;
      
      setStats({
        totalUsers,
        activeUsers,
        blockedUsers,
        totalDepartments: deptsResponse.data.length
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleCreateUser = async () => {
    try {
      await api.post('/admin/users', userForm);
      setOpenUserDialog(false);
      setUserForm({ nome: '', email: '', telefone: '', role: 'user', department_id: '', manager_id: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
    }
  };

  const handleUpdateUser = async () => {
    try {
      await api.put(`/admin/users/${selectedUser.id}`, userForm);
      setOpenUserDialog(false);
      setSelectedUser(null);
      setUserForm({ nome: '', email: '', telefone: '', role: 'user', department_id: '', manager_id: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const handleBlockUser = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Tem certeza que deseja deletar este usuário?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        loadData();
      } catch (error) {
        console.error('Erro ao deletar usuário:', error);
      }
    }
  };

  const handleSendNotification = async () => {
    try {
      await api.post('/admin/notifications', notificationForm);
      setOpenNotificationDialog(false);
      setNotificationForm({ title: '', message: '', recipient_id: '', type: 'admin_message' });
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
    }
  };

  const handleCreateDepartment = async () => {
    try {
      await api.post('/admin/departments', departmentForm);
      setOpenDepartmentDialog(false);
      setDepartmentForm({ name: '', description: '', parent_id: '' });
      loadData();
    } catch (error) {
      console.error('Erro ao criar departamento:', error);
    }
  };

  const openEditUser = (userToEdit) => {
    setSelectedUser(userToEdit);
    setUserForm({
      nome: userToEdit.nome,
      email: userToEdit.email,
      telefone: userToEdit.telefone || '',
      role: userToEdit.role,
      department_id: userToEdit.department_id || '',
      manager_id: userToEdit.manager_id || ''
    });
    setOpenUserDialog(true);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          <AdminIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Painel Administrativo
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Gerencie usuários, departamentos, salas e notificações do sistema
        </Typography>
      </Box>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total de Usuários
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
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <Badge badgeContent={stats.activeUsers} color="success">
                    <PeopleIcon />
                  </Badge>
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.activeUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usuários Ativos
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
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <BlockIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.blockedUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Usuários Bloqueados
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
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <BusinessIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalDepartments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Departamentos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Navegação em Abas */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab 
              icon={<PeopleIcon />} 
              label="Usuários" 
              id="admin-tab-0"
              aria-controls="admin-tabpanel-0"
            />
            <Tab 
              icon={<RoomIcon />} 
              label="Gerenciar Salas" 
              id="admin-tab-1"
              aria-controls="admin-tabpanel-1"
            />
            <Tab 
              icon={<TreeIcon />} 
              label="Hierarquia" 
              id="admin-tab-2"
              aria-controls="admin-tabpanel-2"
            />
            <Tab 
              icon={<SettingsIcon />} 
              label="Configurações" 
              id="admin-tab-3"
              aria-controls="admin-tabpanel-3"
            />
          </Tabs>
        </Box>

        {/* Tab Usuários */}
        <TabPanel value={tabValue} index={0}>
          {/* Botões de Ação para Usuários */}
          <Box mb={3} display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setOpenUserDialog(true)}
            >
              Criar Usuário
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<NotificationIcon />}
              onClick={() => setOpenNotificationDialog(true)}
            >
              Enviar Notificação
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<BusinessIcon />}
              onClick={() => setOpenDepartmentDialog(true)}
            >
              Criar Departamento
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<AdminIcon />}
              onClick={() => setOpenSuperAdminDialog(true)}
              color="warning"
            >
              Criar Super Admin
            </Button>
          </Box>

          {/* Tabela de Usuários */}
          <Typography variant="h6" gutterBottom>
            <PeopleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Gerenciamento de Usuários
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Usuário</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Função</TableCell>
                  <TableCell>Departamento</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                          {userItem.nome?.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {userItem.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {userItem.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={userItem.role === 'admin' ? 'Admin' : 'Usuário'}
                        color={userItem.role === 'admin' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {departments.find(d => d.id === userItem.department_id)?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userItem.status === 'active' ? 'Ativo' : 'Bloqueado'}
                        color={userItem.status === 'active' ? 'success' : 'error'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Editar">
                          <IconButton
                            size="small"
                            onClick={() => openEditUser(userItem)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={userItem.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}>
                          <IconButton
                            size="small"
                            color={userItem.status === 'blocked' ? 'success' : 'warning'}
                            onClick={() => handleBlockUser(userItem.id, userItem.status)}
                          >
                            <BlockIcon />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Deletar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteUser(userItem.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Tab Gerenciar Salas */}
        <TabPanel value={tabValue} index={1}>
          <GerenciarSalas />
        </TabPanel>

        {/* Tab Hierarquia */}
        <TabPanel value={tabValue} index={2}>
          <UserHierarchy users={users} departments={departments} />
        </TabPanel>

        {/* Tab Configurações */}
        <TabPanel value={tabValue} index={3}>
          <Box p={3}>
            <Typography variant="h6" gutterBottom>
              Configurações do Sistema
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configurações avançadas do sistema serão implementadas aqui.
            </Typography>
          </Box>
        </TabPanel>
      </Card>

      {/* Dialog de Criar/Editar Usuário */}
      <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Editar Usuário' : 'Criar Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome Completo"
                value={userForm.nome}
                onChange={(e) => setUserForm({...userForm, nome: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Telefone"
                value={userForm.telefone}
                onChange={(e) => setUserForm({...userForm, telefone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Função</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                >
                  <MenuItem value="user">Usuário</MenuItem>
                  <MenuItem value="admin">Administrador</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Departamento</InputLabel>
                <Select
                  value={userForm.department_id}
                  onChange={(e) => setUserForm({...userForm, department_id: e.target.value})}
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Gerente</InputLabel>
                <Select
                  value={userForm.manager_id}
                  onChange={(e) => setUserForm({...userForm, manager_id: e.target.value})}
                >
                  <MenuItem value="">Nenhum</MenuItem>
                  {users.filter(u => u.role === 'admin').map(admin => (
                    <MenuItem key={admin.id} value={admin.id}>{admin.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUserDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={selectedUser ? handleUpdateUser : handleCreateUser}
          >
            {selectedUser ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Enviar Notificação */}
      <Dialog open={openNotificationDialog} onClose={() => setOpenNotificationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enviar Notificação Push</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mensagem"
                multiline
                rows={3}
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Destinatário</InputLabel>
                <Select
                  value={notificationForm.recipient_id}
                  onChange={(e) => setNotificationForm({...notificationForm, recipient_id: e.target.value})}
                >
                  <MenuItem value="">Todos os usuários</MenuItem>
                  {users.map(userItem => (
                    <MenuItem key={userItem.id} value={userItem.id}>
                      {userItem.nome} ({userItem.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNotificationDialog(false)}>Cancelar</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendNotification}
          >
            Enviar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Criar Departamento */}
      <Dialog open={openDepartmentDialog} onClose={() => setOpenDepartmentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Criar Departamento</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome do Departamento"
                value={departmentForm.name}
                onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                multiline
                rows={2}
                value={departmentForm.description}
                onChange={(e) => setDepartmentForm({...departmentForm, description: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Departamento Pai</InputLabel>
                <Select
                  value={departmentForm.parent_id}
                  onChange={(e) => setDepartmentForm({...departmentForm, parent_id: e.target.value})}
                >
                  <MenuItem value="">Nenhum (Departamento Raiz)</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDepartmentDialog(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateDepartment}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para criar Super Admin */}
      <CreateSuperAdmin
        open={openSuperAdminDialog}
        onClose={() => setOpenSuperAdminDialog(false)}
        onSuccess={() => {
          setOpenSuperAdminDialog(false);
          loadData(); // Recarregar dados após criação
        }}
      />
    </Container>
  );
};

export default AdminPanel;
