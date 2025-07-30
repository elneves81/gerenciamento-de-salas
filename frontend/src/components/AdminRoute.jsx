import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { AdminPanelSettings as AdminIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
      >
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        p={3}
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <LockIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Acesso Negado
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Você precisa estar logado para acessar esta área.
          </Typography>
          <Button variant="contained" href="/login">
            Fazer Login
          </Button>
        </Paper>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="400px"
        p={3}
      >
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <AdminIcon sx={{ fontSize: 60, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Acesso Restrito
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={2}>
            Esta área é restrita para administradores.
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Usuário atual: <strong>{user.nome}</strong><br />
            Nível de acesso: <strong>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</strong>
          </Typography>
          <Button variant="contained" href="/dashboard">
            Voltar ao Dashboard
          </Button>
        </Paper>
      </Box>
    );
  }

  return children;
};

export default AdminRoute;
