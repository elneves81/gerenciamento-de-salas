import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  TextField, 
  Button, 
  Typography, 
  Tab, 
  Tabs, 
  Divider,
  Alert,
  IconButton,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Google as GoogleIcon, 
  Visibility, 
  VisibilityOff,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const AuthPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nome: '',
    telefone: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { login, register, loginWithGoogle } = useAuth();

  // Carregar Google Identity Services
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!googleClientId) {
      console.warn('Google Client ID não configurado. Login com Google desabilitado.');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback
        });
      }
    };

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handleGoogleCallback = async (response) => {
    try {
      setLoading(true);
      setError('');
      await loginWithGoogle(response.credential);
    } catch (error) {
      setError('Erro ao fazer login com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (window.google && import.meta.env.VITE_GOOGLE_CLIENT_ID) {
        // Google Sign-In real se configurado
        window.google.accounts.id.prompt();
      } else {
        // Demo Google Login - simular token para desenvolvimento
        console.log('🚀 Demo Google Login - Simulando autenticação...');
        const mockCredential = 'mock_google_credential_' + Date.now();
        await loginWithGoogle(mockCredential);
      }
    } catch (error) {
      setError('Erro ao fazer login com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Usuário/Email e senha são obrigatórios');
      return false;
    }

    if (tabValue === 1) { // Registro
      if (!formData.nome) {
        setError('Nome é obrigatório');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Senhas não coincidem');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Senha deve ter pelo menos 6 caracteres');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (tabValue === 0) {
        // Login
        await login(formData.email, formData.password);
      } else {
        // Registro
        await register({
          email: formData.email,
          password: formData.password,
          nome: formData.nome,
          telefone: formData.telefone
        });
        setSuccess('Conta criada com sucesso! Você já pode fazer login.');
        setTabValue(0);
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      }
    } catch (error) {
      if (tabValue === 0) {
        setError('Usuário/Email ou senha incorretos. Tente: admin/admin123');
      } else {
        setError(error.response?.data?.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 3 }}>
            SalaFácil
          </Typography>

          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            centered
            sx={{ mb: 3 }}
          >
            <Tab label="Entrar" />
            <Tab label="Criar Conta" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {tabValue === 1 && (
              <TextField
                fullWidth
                label="Nome Completo"
                value={formData.nome}
                onChange={handleInputChange('nome')}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />
            )}

            <TextField
              fullWidth
              label="Usuário ou Email"
              type="text"
              value={formData.email}
              onChange={handleInputChange('email')}
              margin="normal"
              placeholder="admin ou seu@email.com"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />

            {tabValue === 1 && (
              <TextField
                fullWidth
                label="Telefone (opcional)"
                value={formData.telefone}
                onChange={handleInputChange('telefone')}
                margin="normal"
                disabled={loading}
              />
            )}

            <TextField
              fullWidth
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange('password')}
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />

            {tabValue === 1 && (
              <TextField
                fullWidth
                label="Confirmar Senha"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={loading}
              />
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (
                tabValue === 0 ? 'Entrar' : 'Criar Conta'
              )}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              ou
            </Typography>
          </Divider>

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={handleGoogleLogin}
            disabled={loading || !import.meta.env.VITE_GOOGLE_CLIENT_ID}
            sx={{ py: 1.5 }}
          >
            {!import.meta.env.VITE_GOOGLE_CLIENT_ID ? 
              'Google OAuth não configurado' : 
              (tabValue === 0 ? 'Entrar com Google' : 'Registrar com Google')
            }
          </Button>

          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            {tabValue === 0 ? (
              <>
                Não tem uma conta?{' '}
                <Button 
                  variant="text" 
                  onClick={() => setTabValue(1)}
                  disabled={loading}
                >
                  Criar conta
                </Button>
              </>
            ) : (
              <>
                Já tem uma conta?{' '}
                <Button 
                  variant="text" 
                  onClick={() => setTabValue(0)}
                  disabled={loading}
                >
                  Fazer login
                </Button>
              </>
            )}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthPage;
