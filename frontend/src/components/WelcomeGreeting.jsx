import React from 'react';
import { Box, Typography, Paper, Avatar, Chip } from '@mui/material';
import { Favorite, Schedule, LocationOn, Star } from '@mui/icons-material';

/**
 * Componente de saudação amigável para responder ao "OI" dos usuários
 * Exibe uma mensagem de boas-vindas personalizada
 */
const WelcomeGreeting = ({ userName = 'Usuário' }) => {
  const currentHour = new Date().getHours();
  
  const getGreeting = () => {
    if (currentHour < 12) {
      return 'Bom dia';
    } else if (currentHour < 18) {
      return 'Boa tarde';
    } else {
      return 'Boa noite';
    }
  };

  const getMotivationalMessage = () => {
    const messages = [
      'Que tal agendar uma nova reunião hoje?',
      'Sua produtividade começa com um bom planejamento!',
      'Organize suas reuniões e otimize seu tempo!',
      'Vamos tornar seu dia mais produtivo?',
      'Suas salas estão aguardando por você!'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -50,
          right: -50,
          width: 100,
          height: 100,
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
        }
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Avatar
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            width: 56,
            height: 56 
          }}
        >
          <Favorite sx={{ fontSize: 28, color: 'white' }} />
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
            Olá, {userName}! 👋
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            {getGreeting()}! Bem-vindo ao SalaFácil
          </Typography>
        </Box>
      </Box>

      <Typography 
        variant="body1" 
        sx={{ 
          fontSize: '1.1rem',
          mb: 2,
          opacity: 0.95
        }}
      >
        {getMotivationalMessage()}
      </Typography>

      <Box display="flex" gap={1} flexWrap="wrap">
        <Chip 
          icon={<Schedule />}
          label="Agendamento Rápido"
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            '& .MuiChip-icon': { color: 'white' }
          }}
        />
        <Chip 
          icon={<LocationOn />}
          label="Salas Disponíveis"
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            '& .MuiChip-icon': { color: 'white' }
          }}
        />
        <Chip 
          icon={<Star />}
          label="Sistema Premium"
          sx={{ 
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            '& .MuiChip-icon': { color: 'white' }
          }}
        />
      </Box>
    </Paper>
  );
};

export default WelcomeGreeting;