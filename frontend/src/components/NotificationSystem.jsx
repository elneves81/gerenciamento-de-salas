import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  Snackbar,
  Alert,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Button,
  Divider,
  Card,
  CardContent,
  Chip
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Close,
  Info,
  Warning,
  Error,
  CheckCircle,
  Schedule,
  Event,
  Cancel
} from '@mui/icons-material';

// Context para notificações
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

// Provider de Notificações
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [snackbars, setSnackbars] = useState([]);

  // Adicionar notificação
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Se for alta prioridade, mostrar snackbar também
    if (notification.priority === 'high') {
      showSnackbar({
        message: notification.title,
        severity: notification.type || 'info',
        duration: 6000
      });
    }

    // Notificação do navegador (se permitido)
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  };

  // Mostrar snackbar
  const showSnackbar = (snackbar) => {
    const newSnackbar = {
      id: Date.now() + Math.random(),
      open: true,
      duration: 4000,
      ...snackbar
    };
    setSnackbars(prev => [...prev, newSnackbar]);
  };

  // Marcar como lida
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  // Remover notificação
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Fechar snackbar
  const closeSnackbar = (id) => {
    setSnackbars(prev =>
      prev.map(snack =>
        snack.id === id ? { ...snack, open: false } : snack
      )
    );
    setTimeout(() => {
      setSnackbars(prev => prev.filter(snack => snack.id !== id));
    }, 500);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      showSnackbar,
      markAsRead,
      markAllAsRead,
      removeNotification
    }}>
      {children}
      
      {/* Snackbars */}
      {snackbars.map(snackbar => (
        <Snackbar
          key={snackbar.id}
          open={snackbar.open}
          autoHideDuration={snackbar.duration}
          onClose={() => closeSnackbar(snackbar.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            severity={snackbar.severity}
            onClose={() => closeSnackbar(snackbar.id)}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

// Componente do Centro de Notificações
export const NotificationCenter = () => {
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Solicitar permissão para notificações
    if (!permissionRequested && Notification.permission === 'default') {
      Notification.requestPermission();
      setPermissionRequested(true);
    }
  }, [permissionRequested]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle sx={{ color: '#10B981' }} />;
      case 'warning': return <Warning sx={{ color: '#F59E0B' }} />;
      case 'error': return <Error sx={{ color: '#EF4444' }} />;
      case 'reservation': return <Event sx={{ color: '#3B82F6' }} />;
      case 'reminder': return <Schedule sx={{ color: '#8B5CF6' }} />;
      default: return <Info sx={{ color: '#6B7280' }} />;
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return time.toLocaleDateString('pt-BR');
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{
          color: 'white',
          '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
        }}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 500,
            width: 400,
            mt: 1.5
          }
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Notificações
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                sx={{ textTransform: 'none' }}
              >
                Marcar todas como lidas
              </Button>
            )}
          </Box>
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              Nenhuma notificação
            </Typography>
          </MenuItem>
        ) : (
          <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
            {notifications.slice(0, 10).map((notification) => (
              <ListItem
                key={notification.id}
                sx={{
                  backgroundColor: notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                  borderLeft: notification.read ? 'none' : '3px solid #3B82F6',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                }}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: 'transparent' }}>
                    {getNotificationIcon(notification.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.read ? 'normal' : 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(notification.timestamp)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: '0.8rem', mt: 0.5 }}
                      >
                        {notification.message}
                      </Typography>
                      {notification.priority === 'high' && (
                        <Chip
                          label="Alta Prioridade"
                          size="small"
                          color="error"
                          sx={{ mt: 1, fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  }
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(notification.id);
                  }}
                  sx={{ ml: 1 }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </ListItem>
            ))}
          </List>
        )}

        {notifications.length > 10 && (
          <>
            <Divider />
            <MenuItem onClick={handleClose}>
              <Typography variant="body2" color="primary" sx={{ textAlign: 'center', width: '100%' }}>
                Ver todas as notificações
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

// Hook para usar notificações automáticas
export const useAutoNotifications = (reservas = []) => {
  const { addNotification } = useNotifications();

  useEffect(() => {
    // Verificar reservas próximas (15 minutos antes)
    const checkUpcomingReservations = () => {
      const now = new Date();
      const in15Minutes = new Date(now.getTime() + 15 * 60 * 1000);

      reservas.forEach(reserva => {
        if (reserva.data_inicio && reserva.status === 'agendada') {
          const startTime = new Date(reserva.data_inicio);
          
          if (startTime > now && startTime <= in15Minutes) {
            addNotification({
              title: '🔔 Reserva se aproxima!',
              message: `Sua reserva "${reserva.titulo}" começará em 15 minutos na ${reserva.sala_nome}`,
              type: 'reminder',
              priority: 'high',
              data: { reservaId: reserva.id }
            });
          }
        }
      });
    };

    // Verificar a cada minuto
    const interval = setInterval(checkUpcomingReservations, 60000);
    
    // Verificar imediatamente
    checkUpcomingReservations();

    return () => clearInterval(interval);
  }, [reservas, addNotification]);

  // Função para notificar eventos específicos
  const notifyReservationEvent = (type, reserva) => {
    const notifications = {
      created: {
        title: '✅ Reserva criada com sucesso!',
        message: `Reserva "${reserva.titulo}" foi agendada para ${reserva.data_inicio}`,
        type: 'success'
      },
      cancelled: {
        title: '❌ Reserva cancelada',
        message: `A reserva "${reserva.titulo}" foi cancelada`,
        type: 'warning'
      },
      started: {
        title: '🚀 Reserva iniciada',
        message: `Sua reserva "${reserva.titulo}" está em andamento`,
        type: 'info'
      },
      completed: {
        title: '🎉 Reserva concluída',
        message: `Reserva "${reserva.titulo}" foi finalizada com sucesso`,
        type: 'success'
      }
    };

    if (notifications[type]) {
      addNotification({
        ...notifications[type],
        data: { reservaId: reserva.id }
      });
    }
  };

  return { notifyReservationEvent };
};

export default NotificationCenter;
