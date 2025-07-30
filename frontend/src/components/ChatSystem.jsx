import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  useMediaQuery,
  Fab,
  Slide,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  ListItemSecondaryAction
} from '@mui/material';
import {
  Send,
  Chat,
  Close,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  AdminPanelSettings,
  Group,
  Person,
  Notifications,
  Search,
  ArrowBack
} from '@mui/icons-material';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ChatSystem = ({ onClose }) => {
  const { user } = useAuth();
  const isMobile = useMediaQuery('(max-width:768px)');
  const messagesEndRef = useRef(null);
  
  // Estados principais
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Estados de UI
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, admins, users, groups
  const [anchorEl, setAnchorEl] = useState(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      loadUsers();
      // Configurar polling para mensagens em tempo real
      const interval = setInterval(loadConversations, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
      // Marcar como lida
      markAsRead(activeConversation.id);
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await api.get('/chat/conversations/');
      setConversations(response.data || []);
      
      // Calcular mensagens não lidas
      const unread = response.data?.reduce((acc, conv) => acc + (conv.unread_count || 0), 0) || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setLoading(true);
      const response = await api.get(`/chat/conversations/${conversationId}/messages/`);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;

    try {
      const messageData = {
        conversation: activeConversation.id,
        content: newMessage.trim(),
        message_type: 'text'
      };

      await api.post('/chat/messages/', messageData);
      setNewMessage('');
      await loadMessages(activeConversation.id);
      await loadConversations(); // Atualizar lista de conversas
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const createConversation = async (recipientId, isGroup = false) => {
    try {
      const conversationData = {
        participants: [user.id, recipientId],
        is_group: isGroup,
        name: isGroup ? 'Nova Conversa em Grupo' : null
      };

      const response = await api.post('/chat/conversations/', conversationData);
      setActiveConversation(response.data);
      setShowNewChatDialog(false);
      await loadConversations();
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };

  const markAsRead = async (conversationId) => {
    try {
      await api.put(`/chat/conversations/${conversationId}/mark_read/`);
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const formatMessageTime = (timestamp) => {
    try {
      return formatDistanceToNow(parseISO(timestamp), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'Agora';
    }
  };

  const getConversationName = (conversation) => {
    if (conversation.is_group) return conversation.name;
    const otherParticipant = conversation.participants?.find(p => p.id !== user.id);
    return otherParticipant ? `${otherParticipant.first_name} ${otherParticipant.last_name}` : 'Conversa';
  };

  const getConversationAvatar = (conversation) => {
    if (conversation.is_group) return <Group />;
    const otherParticipant = conversation.participants?.find(p => p.id !== user.id);
    return otherParticipant?.is_staff ? <AdminPanelSettings /> : <Person />;
  };

  const filteredConversations = conversations.filter(conv => {
    const name = getConversationName(conv).toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'admins') {
      const hasAdmin = conv.participants?.some(p => p.is_staff);
      return matchesSearch && hasAdmin;
    }
    if (filterType === 'groups') return matchesSearch && conv.is_group;
    return matchesSearch;
  });

  const filteredUsers = users.filter(u => 
    u.id !== user.id && 
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Componente do FAB de Chat
  const ChatFAB = () => (
    <Fab
      color="primary"
      onClick={() => setIsOpen(true)}
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
        background: 'linear-gradient(45deg, #667eea, #764ba2)'
      }}
    >
      <Badge badgeContent={unreadCount} color="error">
        <Chat />
      </Badge>
    </Fab>
  );

  // Lista de Conversas
  const ConversationsList = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Chat
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton onClick={() => setShowNewChatDialog(true)}>
              <Person />
            </IconButton>
            <IconButton onClick={() => setIsOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </Box>
        
        {/* Busca e Filtros */}
        <TextField
          size="small"
          fullWidth
          placeholder="Buscar conversas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ mb: 2 }}
        />
        
        <FormControl size="small" fullWidth>
          <InputLabel>Filtrar por</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Filtrar por"
          >
            <MenuItem value="all">Todas</MenuItem>
            <MenuItem value="admins">Administradores</MenuItem>
            <MenuItem value="groups">Grupos</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Lista de Conversas */}
      <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
        {filteredConversations.length === 0 ? (
          <ListItem>
            <ListItemText 
              primary="Nenhuma conversa encontrada"
              secondary="Inicie uma nova conversa clicando no ícone +"
            />
          </ListItem>
        ) : (
          filteredConversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              button
              onClick={() => setActiveConversation(conversation)}
              selected={activeConversation?.id === conversation.id}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemAvatar>
                <Avatar>
                  {getConversationAvatar(conversation)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="subtitle2" noWrap>
                      {getConversationName(conversation)}
                    </Typography>
                    {conversation.participants?.some(p => p.is_staff) && (
                      <Chip size="small" label="Admin" color="primary" />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {conversation.last_message?.content || 'Nenhuma mensagem'}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Box display="flex" flexDirection="column" alignItems="end" gap={1}>
                  {conversation.last_message && (
                    <Typography variant="caption" color="text.secondary">
                      {formatMessageTime(conversation.last_message.timestamp)}
                    </Typography>
                  )}
                  {conversation.unread_count > 0 && (
                    <Badge badgeContent={conversation.unread_count} color="primary" />
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))
        )}
      </List>
    </Box>
  );

  // Área de Mensagens
  const MessagesArea = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header da Conversa */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          {isMobile && (
            <IconButton 
              edge="start" 
              onClick={() => setActiveConversation(null)}
              sx={{ mr: 1 }}
            >
              <ArrowBack />
            </IconButton>
          )}
          <Avatar sx={{ mr: 2 }}>
            {getConversationAvatar(activeConversation)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {getConversationName(activeConversation)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {activeConversation?.is_group ? 
                `${activeConversation.participants?.length} participantes` : 
                'Conversa privada'
              }
            </Typography>
          </Box>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mensagens */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <Typography>Carregando mensagens...</Typography>
          </Box>
        ) : messages.length === 0 ? (
          <Box display="flex" justifyContent="center" p={3}>
            <Typography color="text.secondary">
              Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender?.id === user.id;
            const showAvatar = index === 0 || messages[index - 1]?.sender?.id !== message.sender?.id;
            
            return (
              <Box
                key={message.id}
                display="flex"
                justifyContent={isOwn ? 'flex-end' : 'flex-start'}
                mb={1}
              >
                <Box
                  display="flex"
                  alignItems="flex-end"
                  gap={1}
                  maxWidth="70%"
                  flexDirection={isOwn ? 'row-reverse' : 'row'}
                >
                  {!isOwn && showAvatar && (
                    <Avatar sx={{ width: 32, height: 32 }}>
                      {message.sender?.is_staff ? <AdminPanelSettings /> : <Person />}
                    </Avatar>
                  )}
                  {!isOwn && !showAvatar && <Box sx={{ width: 32 }} />}
                  
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      backgroundColor: isOwn ? 'primary.main' : 'grey.100',
                      color: isOwn ? 'primary.contrastText' : 'text.primary',
                      borderRadius: 2,
                      borderBottomRightRadius: isOwn ? 1 : 2,
                      borderBottomLeftRadius: isOwn ? 2 : 1
                    }}
                  >
                    {!isOwn && showAvatar && (
                      <Typography variant="caption" fontWeight="bold" display="block">
                        {message.sender?.first_name} {message.sender?.last_name}
                        {message.sender?.is_staff && ' (Admin)'}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {message.content}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        opacity: 0.7, 
                        display: 'block', 
                        textAlign: isOwn ? 'right' : 'left',
                        mt: 0.5
                      }}
                    >
                      {formatMessageTime(message.timestamp)}
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input de Mensagem */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" gap={1} alignItems="end">
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            size="small"
          />
          <IconButton 
            color="primary" 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'grey.300' }
            }}
          >
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );

  // Dialog para Nova Conversa
  const NewChatDialog = () => (
    <Dialog 
      open={showNewChatDialog} 
      onClose={() => setShowNewChatDialog(false)}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="between">
          Nova Conversa
          <IconButton onClick={() => setShowNewChatDialog(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
          sx={{ mb: 2 }}
        />
        
        <List>
          {filteredUsers.map((u) => (
            <ListItem
              key={u.id}
              button
              onClick={() => createConversation(u.id)}
            >
              <ListItemAvatar>
                <Avatar>
                  {u.is_staff ? <AdminPanelSettings /> : <Person />}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    {u.first_name} {u.last_name}
                    {u.is_staff && (
                      <Chip size="small" label="Admin" color="primary" />
                    )}
                  </Box>
                }
                secondary={u.email}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );

  // Menu de Opções
  const OptionsMenu = () => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={() => setAnchorEl(null)}
    >
      <MenuItem onClick={() => setAnchorEl(null)}>
        Ver Perfil
      </MenuItem>
      <MenuItem onClick={() => setAnchorEl(null)}>
        Silenciar
      </MenuItem>
      <MenuItem onClick={() => setAnchorEl(null)}>
        Arquivar
      </MenuItem>
    </Menu>
  );

  return (
    <>
      {/* FAB do Chat */}
      {!isOpen && <ChatFAB />}

      {/* Dialog Principal do Chat */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile ? '100%' : '80vh',
            maxHeight: isMobile ? '100%' : '600px'
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex' }}>
          {/* Lista de Conversas */}
          {(!activeConversation || !isMobile) && (
            <Box
              sx={{
                width: isMobile ? '100%' : '300px',
                borderRight: isMobile ? 0 : 1,
                borderColor: 'divider',
                display: isMobile && activeConversation ? 'none' : 'flex',
                flexDirection: 'column'
              }}
            >
              <ConversationsList />
            </Box>
          )}

          {/* Área de Mensagens */}
          {activeConversation && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <MessagesArea />
            </Box>
          )}

          {/* Placeholder quando nenhuma conversa está selecionada */}
          {!activeConversation && !isMobile && (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary'
              }}
            >
              <Chat sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Selecione uma conversa
              </Typography>
              <Typography variant="body2">
                Escolha uma conversa para começar a enviar mensagens
              </Typography>
            </Box>
          )}
        </Box>
      </Dialog>

      {/* Dialogs e Menus */}
      <NewChatDialog />
      <OptionsMenu />
    </>
  );
};

export default ChatSystem;
