import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Fade,
  Slide,
  Avatar,
  Chip,
  Grid,
  Alert
} from '@mui/material';
import {
  Celebration as CelebrationIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  CalendarMonth as CalendarIcon,
  MeetingRoom as RoomIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import CreateSuperAdmin from './CreateSuperAdmin';

const WelcomePage = ({ onContinue }) => {
  const { user } = useAuth();
  const [showContent, setShowContent] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [adminStatus, setAdminStatus] = useState(null);
  const [showCreateSuperAdmin, setShowCreateSuperAdmin] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    setShowContent(true);
    checkAdminStatus();
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const welcomePhrases = [
    {
      title: "Bem-vindo ao SalaFácil! 🎉",
      subtitle: "Onde cada reunião encontra seu lugar perfeito",
      description: "Gerencie salas, agende reuniões e colabore de forma inteligente"
    },
    {
      title: "Transforme sua produtividade! ⚡",
      subtitle: "Otimize tempo, maximize resultados",
      description: "Agenda inteligente, notificações em tempo real e muito mais"
    },
    {
      title: "Seja o maestro das suas reuniões! 🎼",
      subtitle: "Coordene, organize e brilhe",
      description: "Ferramentas poderosas para uma gestão sem complicações"
    }
  ];

  const adminFeatures = [
    { icon: <AdminIcon />, title: "Painel Administrativo", desc: "Controle total do sistema" },
    { icon: <PersonIcon />, title: "Gestão de Usuários", desc: "Criar, editar e organizar" },
    { icon: <NotificationIcon />, title: "Notificações Push", desc: "Comunicação instantânea" }
  ];

  const userFeatures = [
    { icon: <CalendarIcon />, title: "Agenda Pessoal", desc: "Suas reuniões organizadas" },
    { icon: <RoomIcon />, title: "Reserva de Salas", desc: "Encontre e reserve facilmente" },
    { icon: <NotificationIcon />, title: "Lembretes", desc: "Nunca perca um compromisso" }
  ];

  const features = isAdmin ? adminFeatures : userFeatures;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Animation */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle at 20% 80%, white 2px, transparent 2px), radial-gradient(circle at 80% 20%, white 2px, transparent 2px)',
          backgroundSize: '100px 100px',
          animation: 'float 20s ease-in-out infinite'
        }}
      />

      <Container maxWidth="lg">
        <Fade in={showContent} timeout={1000}>
          <Box textAlign="center">
            {/* Header com foto do usuário */}
            <Slide direction="down" in={showContent} timeout={800}>
              <Box mb={4}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    margin: '0 auto 20px',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    fontSize: '2.5rem'
                  }}
                >
                  {user?.nome?.charAt(0).toUpperCase() || <PersonIcon />}
                </Avatar>
                
                <Typography variant="h3" color="white" fontWeight="bold" gutterBottom>
                  Olá, {user?.nome?.split(' ')[0] || 'Usuário'}! 👋
                </Typography>
                
                <Chip
                  icon={isAdmin ? <AdminIcon /> : <PersonIcon />}
                  label={isAdmin ? 'Administrador' : 'Usuário'}
                  color={isAdmin ? 'warning' : 'info'}
                  sx={{ 
                    fontSize: '1rem', 
                    py: 2, 
                    px: 1,
                    bgcolor: isAdmin ? '#ff9800' : '#2196f3',
                    color: 'white'
                  }}
                />
              </Box>
            </Slide>

            {/* Alerta para criar Super Admin se necessário */}
            {console.log('🎯 Admin Status atual:', adminStatus)}
            {/* TEMP: Forçar exibição do botão para teste */}
            {(adminStatus?.needsSetup || true) && (
              <Slide direction="down" in={showContent} timeout={600}>
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 4, 
                    bgcolor: 'rgba(255,193,7,0.1)', 
                    border: '1px solid rgba(255,193,7,0.3)',
                    '& .MuiAlert-message': { color: 'white' }
                  }}
                  action={
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SecurityIcon />}
                      onClick={() => setShowCreateSuperAdmin(true)}
                      sx={{
                        bgcolor: '#ff9800',
                        '&:hover': { bgcolor: '#f57c00' }
                      }}
                    >
                      Configurar Sistema
                    </Button>
                  }
                >
                  <Typography variant="body2" fontWeight="bold">
                    ⚠️ Sistema não configurado! É necessário criar um Super Administrador para gerenciar o sistema.
                  </Typography>
                </Alert>
              </Slide>
            )}

            {/* Frase motivacional rotativa */}
            <Box mb={6} sx={{ height: 150 }}>
              {welcomePhrases.map((phrase, index) => (
                <Fade
                  key={index}
                  in={currentSlide === index}
                  timeout={800}
                  style={{
                    position: currentSlide === index ? 'relative' : 'absolute',
                    width: '100%'
                  }}
                >
                  <Box>
                    <Typography 
                      variant="h4" 
                      color="white" 
                      fontWeight="bold" 
                      gutterBottom
                      sx={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}
                    >
                      {phrase.title}
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color="rgba(255,255,255,0.9)" 
                      gutterBottom
                      sx={{ fontStyle: 'italic' }}
                    >
                      {phrase.subtitle}
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="rgba(255,255,255,0.8)"
                    >
                      {phrase.description}
                    </Typography>
                  </Box>
                </Fade>
              ))}
            </Box>

            {/* Cards de funcionalidades */}
            <Slide direction="up" in={showContent} timeout={1200}>
              <Grid container spacing={3} mb={6}>
                {features.map((feature, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-10px)',
                          bgcolor: 'rgba(255,255,255,0.25)'
                        }
                      }}
                    >
                      <CardContent sx={{ textAlign: 'center', py: 3 }}>
                        <Avatar
                          sx={{
                            bgcolor: isAdmin ? '#ff9800' : '#2196f3',
                            width: 60,
                            height: 60,
                            margin: '0 auto 16px'
                          }}
                        >
                          {feature.icon}
                        </Avatar>
                        <Typography variant="h6" color="white" fontWeight="bold" gutterBottom>
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.8)">
                          {feature.desc}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Slide>

            {/* Botão de continuar */}
            <Slide direction="up" in={showContent} timeout={1500}>
              <Button
                variant="contained"
                size="large"
                onClick={onContinue}
                startIcon={<CelebrationIcon />}
                sx={{
                  bgcolor: 'white',
                  color: '#667eea',
                  py: 2,
                  px: 4,
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  borderRadius: 5,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                    transform: 'scale(1.05)'
                  }
                }}
              >
                {isAdmin ? 'Acessar Painel Admin' : 'Começar a Usar'}
              </Button>
            </Slide>
          </Box>
        </Fade>
      </Container>

      {/* Dialog para criar Super Admin */}
      <CreateSuperAdmin
        open={showCreateSuperAdmin}
        onClose={() => setShowCreateSuperAdmin(false)}
        onSuccess={handleSuperAdminSuccess}
      />

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
      `}</style>
    </Box>
  );
};

export default WelcomePage;
