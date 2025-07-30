import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import api from '../services/api';

const CreateSuperAdmin = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCreateSuperAdmin = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/.netlify/functions/create-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        setTimeout(() => {
          onSuccess && onSuccess(data);
        }, 3000);
      } else {
        setError(data.message || 'Erro ao criar super admin');
      }
    } catch (err) {
      console.error('Erro:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <AdminIcon sx={{ fontSize: 48, color: '#ff9800', mb: 1 }} />
        <Typography variant="h5" fontWeight="bold" color="#333">
          Criar Super Administrador
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure o primeiro administrador do sistema
        </Typography>
      </DialogTitle>

      <DialogContent>
        {!result && !error && (
          <Box>
            <Card sx={{ mb: 3, bgcolor: 'rgba(255,152,0,0.1)', border: '1px solid #ff9800' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <SecurityIcon sx={{ color: '#ff9800', mr: 1 }} />
                  <Typography variant="h6" color="#ff9800">
                    Informações Importantes
                  </Typography>
                </Box>
                
                <Typography variant="body2" paragraph>
                  • O super administrador terá acesso completo ao sistema
                </Typography>
                <Typography variant="body2" paragraph>
                  • Email: <strong>superadmin@salafacil.com</strong>
                </Typography>
                <Typography variant="body2" paragraph>
                  • Senha temporária: <strong>admin123</strong>
                </Typography>
                <Typography variant="body2" color="error">
                  ⚠️ <strong>IMPORTANTE:</strong> Altere a senha após o primeiro login!
                </Typography>
              </CardContent>
            </Card>

            <Alert severity="info" sx={{ mb: 2 }}>
              Esta operação só pode ser executada uma vez. Se já existe um super admin, você receberá uma mensagem de erro.
            </Alert>
          </Box>
        )}

        {loading && (
          <Box textAlign="center" py={4}>
            <CircularProgress size={60} sx={{ color: '#ff9800', mb: 2 }} />
            <Typography variant="h6" color="#666">
              Criando Super Administrador...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configurando permissões e departamento
            </Typography>
          </Box>
        )}

        {result && (
          <Box textAlign="center">
            <CheckIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" color="success.main" fontWeight="bold" gutterBottom>
              Super Admin Criado com Sucesso! 🎉
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText', mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Credenciais de Acesso:
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography><strong>Email:</strong></Typography>
                  <Chip 
                    label="superadmin@salafacil.com" 
                    size="small" 
                    sx={{ bgcolor: 'white', color: 'success.main' }}
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography><strong>Senha:</strong></Typography>
                  <Chip 
                    label="admin123" 
                    size="small" 
                    sx={{ bgcolor: 'white', color: 'success.main' }}
                  />
                </Box>
              </CardContent>
            </Card>

            <Alert severity="warning" sx={{ textAlign: 'left' }}>
              <strong>Próximos passos:</strong><br/>
              1. Faça login com as credenciais acima<br/>
              2. Altere a senha imediatamente<br/>
              3. Configure outros administradores conforme necessário
            </Alert>
          </Box>
        )}

        {error && (
          <Box textAlign="center">
            <WarningIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
            <Typography variant="h5" color="error.main" fontWeight="bold" gutterBottom>
              Erro ao Criar Super Admin
            </Typography>
            
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {error}
            </Alert>

            {error.includes('já existe') && (
              <Alert severity="info" sx={{ textAlign: 'left' }}>
                <strong>Dica:</strong> Se você esqueceu as credenciais do super admin, entre em contato com o suporte técnico ou execute o script SQL diretamente no banco de dados.
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {!result && !loading && (
          <>
            <Button onClick={handleClose} color="inherit">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSuperAdmin}
              variant="contained"
              sx={{
                bgcolor: '#ff9800',
                '&:hover': { bgcolor: '#f57c00' }
              }}
              startIcon={<AdminIcon />}
            >
              Criar Super Admin
            </Button>
          </>
        )}

        {loading && (
          <Button disabled variant="contained">
            Criando...
          </Button>
        )}

        {(result || error) && (
          <Button onClick={handleClose} variant="contained" color="primary">
            Fechar
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateSuperAdmin;
