import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Paper,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
  Group as GroupIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import api from '../services/api';

const UserHierarchy = () => {
  const [hierarchyData, setHierarchyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      const response = await api.get('/admin/user-hierarchy');
      
      // Organizar dados em árvore
      const organized = organizeHierarchy(response.data);
      setHierarchyData(organized);
    } catch (error) {
      console.error('Erro ao carregar hierarquia:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeHierarchy = (data) => {
    const userMap = {};
    const rootUsers = [];

    // Criar mapa de usuários
    data.forEach(user => {
      userMap[user.id] = { ...user, children: [] };
    });

    // Organizar hierarquia
    data.forEach(user => {
      if (user.manager_id && userMap[user.manager_id]) {
        userMap[user.manager_id].children.push(userMap[user.id]);
      } else {
        rootUsers.push(userMap[user.id]);
      }
    });

    return rootUsers;
  };

  const renderUserCard = (user) => (
    <Card 
      sx={{ 
        mb: 1, 
        border: '1px solid',
        borderColor: user.role === 'admin' ? 'warning.main' : 'divider',
        bgcolor: user.status === 'blocked' ? 'error.light' : 'background.paper'
      }}
    >
      <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" flex={1}>
            <Avatar 
              sx={{ 
                mr: 2, 
                bgcolor: user.role === 'admin' ? 'warning.main' : 'primary.main',
                width: 32,
                height: 32
              }}
            >
              {user.role === 'admin' ? <AdminIcon /> : <PersonIcon />}
            </Avatar>
            
            <Box flex={1}>
              <Typography variant="body1" fontWeight="bold">
                {user.nome}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
              {user.department_name && (
                <Typography variant="caption" display="block" color="text.secondary">
                  <BusinessIcon sx={{ fontSize: 12, mr: 0.5 }} />
                  {user.department_name}
                </Typography>
              )}
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={user.role === 'admin' ? 'Admin' : 'Usuário'}
              color={user.role === 'admin' ? 'warning' : 'default'}
              size="small"
            />
            
            <Chip
              label={user.status === 'active' ? 'Ativo' : 'Bloqueado'}
              color={user.status === 'active' ? 'success' : 'error'}
              size="small"
            />

            <Tooltip title="Arrastar para reorganizar">
              <IconButton size="small" sx={{ cursor: 'grab' }}>
                <DragIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {user.children && user.children.length > 0 && (
          <Box mt={1} pl={4}>
            <Typography variant="caption" color="text.secondary">
              <GroupIcon sx={{ fontSize: 12, mr: 0.5 }} />
              {user.children.length} subordinado(s)
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderUserItem = (user, level = 0) => (
    <Box key={user.id} sx={{ ml: level * 3 }}>
      <Box sx={{ mb: 2 }}>
        {renderUserCard(user)}
      </Box>
      {user.children && user.children.map(child => renderUserItem(child, level + 1))}
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Carregando hierarquia...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h5" gutterBottom>
          <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Árvore Hierárquica de Usuários
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visualize e reorganize a estrutura organizacional dos usuários
        </Typography>
      </Box>

      {/* Estatísticas rápidas */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="primary">
              {hierarchyData.length}
            </Typography>
            <Typography variant="caption">
              Gerentes/Líderes
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="warning.main">
              {hierarchyData.reduce((acc, user) => acc + countSubordinates(user), 0)}
            </Typography>
            <Typography variant="caption">
              Total de Usuários
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="success.main">
              {hierarchyData.reduce((acc, user) => acc + countActiveUsers(user), 0)}
            </Typography>
            <Typography variant="caption">
              Usuários Ativos
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6" color="info.main">
              {getMaxDepth(hierarchyData)}
            </Typography>
            <Typography variant="caption">
              Níveis Hierárquicos
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Hierarquia de usuários */}
      <Paper sx={{ p: 2 }}>
        <Box>
          {hierarchyData.map(user => renderUserItem(user))}
        </Box>

        {hierarchyData.length === 0 && (
          <Box textAlign="center" py={4}>
            <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Nenhum usuário encontrado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Crie usuários e organize a hierarquia para visualizar a estrutura
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

// Funções auxiliares
const countSubordinates = (user) => {
  let count = 1; // Contar o próprio usuário
  if (user.children) {
    user.children.forEach(child => {
      count += countSubordinates(child);
    });
  }
  return count;
};

const countActiveUsers = (user) => {
  let count = user.status === 'active' ? 1 : 0;
  if (user.children) {
    user.children.forEach(child => {
      count += countActiveUsers(child);
    });
  }
  return count;
};

const getMaxDepth = (users, currentDepth = 1) => {
  let maxDepth = currentDepth;
  users.forEach(user => {
    if (user.children && user.children.length > 0) {
      const childDepth = getMaxDepth(user.children, currentDepth + 1);
      maxDepth = Math.max(maxDepth, childDepth);
    }
  });
  return maxDepth;
};

export default UserHierarchy;
