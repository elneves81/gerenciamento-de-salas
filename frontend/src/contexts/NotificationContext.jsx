import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
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

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [snackbars, setSnackbars] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Função segura para garantir que dados são arrays
  const ensureArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data === null || data === undefined) return [];
    if (typeof data === 'object' && data.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  // Carregar notificações
  const loadNotifications = useCallback(async () => {
    try {
      // Simular notificações para evitar erros de API
      const mockNotifications = [
        {
          id: 1,
          title: 'Sistema Online',
          message: 'Sistema de gerenciamento está funcionando corretamente',
          type: 'success',
          read: false,
          created_at: new Date().toISOString(),
          category: 'system'
        },
        {
          id: 2,
          title: 'Bem-vindo!',
          message: 'Você fez login no sistema com sucesso',
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
          category: 'auth'
        }
      ];
      
      setNotifications(ensureArray(mockNotifications));
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      setNotifications([]); // Garantir array vazio em caso de erro
    }
  }, []);

  // Adicionar notificação
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      created_at: new Date().toISOString(),
      read: false
    };
    
    setNotifications(prev => {
      const currentNotifications = ensureArray(prev);
      return [newNotification, ...currentNotifications];
    });
  }, []);

  // Mostrar snackbar
  const showSnackbar = useCallback((message, severity = 'info', duration = 4000) => {
    const snackbar = {
      id: Date.now(),
      message,
      severity,
      duration,
      open: true
    };
    
    setSnackbars(prev => {
      const currentSnackbars = ensureArray(prev);
      return [...currentSnackbars, snackbar];
    });
  }, []);

  // Fechar snackbar
  const closeSnackbar = useCallback((id) => {
    setSnackbars(prev => {
      const currentSnackbars = ensureArray(prev);
      return currentSnackbars.filter(snackbar => snackbar.id !== id);
    });
  }, []);

  // Marcar notificação como lida
  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const currentNotifications = ensureArray(prev);
      return currentNotifications.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
    });
  }, []);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const currentNotifications = ensureArray(prev);
      return currentNotifications.map(notification => ({
        ...notification,
        read: true
      }));
    });
  }, []);

  // Deletar notificação
  const deleteNotification = useCallback((id) => {
    setNotifications(prev => {
      const currentNotifications = ensureArray(prev);
      return currentNotifications.filter(notification => notification.id !== id);
    });
  }, []);

  // Contar notificações não lidas
  const unreadCount = (notifications || []).filter(n => n && !n.read).length;

  // Carregar notificações ao montar
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Ícone baseado no tipo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle color="success" />;
      case 'error': return <Error color="error" />;
      case 'warning': return <Warning color="warning" />;
      case 'reservation': return <Event color="primary" />;
      case 'chat': return <Chat color="secondary" />;
      case 'user': return <Person color="info" />;
      case 'admin': return <AdminPanelSettings color="primary" />;
      default: return <Info color="info" />;
    }
  };

  // Renderizar menu de notificações
  const renderNotificationMenu = () => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={() => setAnchorEl(null)}
      PaperProps={{
        sx: { width: 400, maxHeight: 500 }
      }}
    >
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notificações</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </Box>
      </Box>
      
      <List sx={{ maxHeight: 300, overflow: 'auto' }}>
        {ensureArray(notifications).length === 0 ? (
          <ListItem>
            <ListItemText 
              primary="Nenhuma notificação"
              secondary="Você não tem notificações no momento"
            />
          </ListItem>
        ) : (
          ensureArray(notifications).slice(0, 10).map((notification) => (
            <ListItem
              key={notification.id}
              button
              onClick={() => {
                setSelectedNotification(notification);
                setDialogOpen(true);
                markAsRead(notification.id);
              }}
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'transparent' }}>
                  {getNotificationIcon(notification.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={notification.title}
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {notification.created_at ? 
                        new Date(notification.created_at).toLocaleString() : 
                        'Agora'
                      }
                    </Typography>
                  </Box>
                }
              />
              {!notification.read && (
                <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%' }} />
              )}
            </ListItem>
          ))
        )}
      </List>
      
      {ensureArray(notifications).length > 0 && (
        <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
          <Button fullWidth size="small" onClick={() => setAnchorEl(null)}>
            Ver todas
          </Button>
        </Box>
      )}
    </Menu>
  );

  // Renderizar snackbars
  const renderSnackbars = () => (
    <>
      {ensureArray(snackbars).map((snackbar) => (
        <Snackbar
          key={snackbar.id}
          open={snackbar.open}
          autoHideDuration={snackbar.duration}
          onClose={() => closeSnackbar(snackbar.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ bottom: snackbars.indexOf(snackbar) * 70 + 20 }}
        >
          <Alert
            severity={snackbar.severity}
            action={
              <IconButton size="small" onClick={() => closeSnackbar(snackbar.id)}>
                <Close fontSize="small" />
              </IconButton>
            }
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );

  const value = {
    notifications: ensureArray(notifications),
    unreadCount,
    addNotification,
    showSnackbar,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    anchorEl,
    setAnchorEl,
    renderNotificationMenu,
    renderSnackbars
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {renderSnackbars()}
      {renderNotificationMenu()}
      
      {/* Dialog para detalhes da notificação */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedNotification && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getNotificationIcon(selectedNotification.type)}
              {selectedNotification.title}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" paragraph>
                {selectedNotification.message}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={selectedNotification.type} 
                  size="small" 
                  color="primary" 
                />
                <Chip 
                  label={selectedNotification.category || 'Geral'} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </NotificationContext.Provider>
  );
};