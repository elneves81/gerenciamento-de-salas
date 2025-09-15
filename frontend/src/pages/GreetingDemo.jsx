import React from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import WelcomeGreeting from '../components/WelcomeGreeting';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

/**
 * Página de demonstração do componente de saudação
 * Permite visualizar o greeting sem necessidade de autenticação
 */
const GreetingDemo = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Demo: Welcome Greeting
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
            Demonstração do componente de saudação inteligente que responde ao "OI" dos usuários
          </Typography>
        </Box>

        <WelcomeGreeting userName="Visitante" />

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            ✨ Características do Componente:
          </Typography>
          <Typography component="div" variant="body1">
            <ul>
              <li>Saudação personalizada baseada no horário do dia</li>
              <li>Mensagens motivacionais aleatórias</li>
              <li>Design atrativo com gradiente e efeitos visuais</li>
              <li>Chips informativos sobre funcionalidades principais</li>
              <li>Totalmente responsivo e acessível</li>
            </ul>
          </Typography>
        </Box>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => window.location.reload()}
            sx={{ mr: 2 }}
          >
            🔄 Recarregar (Nova mensagem)
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => window.history.back()}
          >
            ← Voltar
          </Button>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default GreetingDemo;