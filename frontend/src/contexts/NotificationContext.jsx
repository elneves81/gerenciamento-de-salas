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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  Close,
  Event,
  Chat,
  Person,
  AdminPanelSettings,
  CheckCircle,
  Info,
  Warning,
  Error
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [currentToast, setCurrentToast] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAllDialog, setShowAllDialog] = useState(false);

  // Configuração de Service Worker para Push Notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      registerServiceWorker();
    }
  }, []);

  // Polling para notificações - só inicia quando o usuário está logado
  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [user?.id]);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', registration);
      
      // Solicitar permissão para notificações
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          subscribeToNotifications(registration);
        }
      } else if (Notification.permission === 'granted') {
        subscribeToNotifications(registration);
      }
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
    }
  };

  const subscribeToNotifications = async (registration) => {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
      });

      // Enviar subscription para o backend
      await api.post('/notifications/subscribe/', {
        subscription: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Erro ao se inscrever para notificações:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const loadNotifications = async () => {
    try {
      // Debug: verificar estado do usuário
      console.log('🔍 Debug loadNotifications - user:', user);
      console.log('🔍 Debug loadNotifications - user.id:', user?.id);
      
      // Verificar se o usuário está logado
      if (!user?.id) {
        console.log('⚠️ Usuário não está logado, pulando carregamento de notificações');
        return;
      }

      console.log('📡 Carregando notificações para user_id:', user.id);
      const response = await api.get('/chat/notifications/', {
        params: { user_id: user.id }
      });
      
      console.log('✅ Resposta da API notificações:', response.data);
      
      // Garantir que sempre temos um array
      let notifs = [];
      if (Array.isArray(response.data)) {
        notifs = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        // Django REST pagination
        notifs = response.data.results;
      } else if (response.data) {
        console.warn('Resposta da API não é um array:', typeof response.data, response.data);
        notifs = [];
      }
      
      setNotifications(notifs);
      
      const unread = notifs.filter(n => !n.is_read).length;
      setUnreadCount(unread);
      
      // Mostrar toast para notificações novas
      const newNotifs = notifs.filter(n => !n.is_read && !n.was_shown);
      if (newNotifs.length > 0) {
        showNotificationToast(newNotifs[0]);
        // Marcar como mostrada
        markAsShown(newNotifs.map(n => n.id));
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const showNotificationToast = (notification) => {
    setCurrentToast(notification);
    setShowToast(true);
    
    // Mostrar notificação nativa do browser se permitido
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'high'
      });
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      await api.post('/chat/notifications/mark_read/', {
        notification_ids: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
      });
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const markAsShown = async (notificationIds) => {
    try {
      await api.post('/notifications/mark_shown/', {
        notification_ids: notificationIds
      });
    } catch (error) {
      console.error('Erro ao marcar como mostrada:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/chat/notifications/${notificationId}/`);
      await loadNotifications();
    } catch (error) {
      console.error('Erro ao deletar notificação:', error);
    }
  };

  // Funções para criar notificações específicas
  const sendMeetingReminder = async (reservaId, minutesBefore = 15) => {
    try {
      await api.post('/notifications/meeting_reminder/', {
        reserva_id: reservaId,
        minutes_before: minutesBefore
      });
    } catch (error) {
      console.error('Erro ao enviar lembrete:', error);
    }
  };

  const sendChatNotification = async (conversationId, message) => {
    try {
      await api.post('/notifications/chat/', {
        conversation_id: conversationId,
        message: message
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de chat:', error);
    }
  };

  const sendReservationNotification = async (reservaId, type) => {
    try {
      await api.post('/notifications/reservation/', {
        reserva_id: reservaId,
        notification_type: type // 'created', 'updated', 'cancelled', 'approved'
      });
    } catch (error) {
      console.error('Erro ao enviar notificação de reserva:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meeting': return <Event />;
      case 'chat': return <Chat />;
      case 'reservation': return <Event />;
      case 'system': return <Info />;
      case 'warning': return <Warning />;
      case 'error': return <Error />;
      default: return <Info />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'meeting': return 'primary';
      case 'chat': return 'info';
      case 'reservation': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const getPriorityChip = (priority) => {
    const configs = {
      high: { label: 'Alta', color: 'error' },
      medium: { label: 'Média', color: 'warning' },
      low: { label: 'Baixa', color: 'default' }
    };
    
    const config = configs[priority] || configs.low;
    return <Chip size="small" label={config.label} color={config.color} />;
  };

  const formatNotificationTime = (timestamp) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Agora';
    }
  };

  // Componente do Toast de Notificação
  const NotificationToast = () => (
    <Snackbar
      open={showToast}
      autoHideDuration={6000}
      onClose={() => setShowToast(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={() => setShowToast(false)}
        severity={currentToast?.type === 'error' ? 'error' : 'info'}
        sx={{ width: '100%' }}
        action={
          currentToast && (
            <Button 
              color="inherit" 
              size="small"
              onClick={() => {
                markAsRead(currentToast.id);
                setShowToast(false);
              }}
            >
              Marcar como Lida
            </Button>
          )
        }
      >
        <Typography variant="subtitle2" fontWeight="bold">
          {currentToast?.title}
        </Typography>
        <Typography variant="body2">
          {currentToast?.message}
        </Typography>
      </Alert>
    </Snackbar>
  );

  // Componente do Ícone de Notificações
  const NotificationIcon = () => (
    <>
      <IconButton
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsActive /> : <Notifications />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { width: 400, maxHeight: 500 }
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Notificações
            </Typography>
            <Box display="flex" gap={1}>
              {unreadCount > 0 && (
                <Button size="small" onClick={markAllAsRead}>
                  Marcar Todas
                </Button>
              )}
              <Button size="small" onClick={() => setShowAllDialog(true)}>
                Ver Todas
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Lista Resumida */}
        {notifications.length === 0 ? (
          <MenuItem>
            <ListItemText primary="Nenhuma notificação" />
          </MenuItem>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => {
                if (!notification.is_read) {
                  markAsRead(notification.id);
                }
                setAnchorEl(null);
              }}
              sx={{
                bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                borderLeft: notification.is_read ? 'none' : '4px solid',
                borderColor: 'primary.main'
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: `${getNotificationColor(notification.type)}.main` }}>
                  {getNotificationIcon(notification.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" noWrap>
                      {notification.title}
                    </Typography>
                    {notification.priority !== 'low' && getPriorityChip(notification.priority)}
                  </Box>
                }
                secondary={
                  <>
                    <Typography variant="body2" noWrap>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatNotificationTime(notification.created_at)}
                    </Typography>
                  </>
                }
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );

  // Dialog com Todas as Notificações
  const AllNotificationsDialog = () => (
    <Dialog
      open={showAllDialog}
      onClose={() => setShowAllDialog(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="between" alignItems="center">
          Todas as Notificações
          <IconButton onClick={() => setShowAllDialog(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <List>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText 
                primary="Nenhuma notificação"
                secondary="Você não tem notificações no momento"
              />
            </ListItem>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  sx={{
                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                    borderLeft: notification.is_read ? 'none' : '4px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${getNotificationColor(notification.type)}.main` }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" justify="between">
                        <Typography variant="subtitle2">
                          {notification.title}
                        </Typography>
                        <Box display="flex" gap={1} alignItems="center">
                          {notification.priority !== 'low' && getPriorityChip(notification.priority)}
                          <Typography variant="caption" color="text.secondary">
                            {formatNotificationTime(notification.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2">
                        {notification.message}
                      </Typography>
                    }
                  />
                  <Box display="flex" flexDirection="column" gap={1}>
                    {!notification.is_read && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <CheckCircle fontSize="small" />
                      </Button>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => deleteNotification(notification.id)}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </DialogContent>
      <DialogActions>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead}>
            Marcar Todas como Lidas
          </Button>
        )}
        <Button onClick={() => setShowAllDialog(false)}>
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );

  const contextValue = {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendMeetingReminder,
    sendChatNotification,
    sendReservationNotification,
    NotificationIcon,
    showNotificationToast
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationToast />
      <AllNotificationsDialog />
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;
