import React from 'react';
import { IconButton, Badge } from '@mui/material';
import { Notifications } from '@mui/icons-material';
import { useNotifications } from '../contexts/NotificationContext';

export const NotificationCenter = () => {
  const { unreadCount, setAnchorEl } = useNotifications();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  return (
    <IconButton
      color="inherit"
      onClick={handleClick}
      aria-label="notificações"
    >
      <Badge badgeContent={unreadCount} color="error">
        <Notifications />
      </Badge>
    </IconButton>
  );
};

export default NotificationCenter;
