// Service Worker para Push Notifications
const CACHE_NAME = 'salafacil-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições de rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Handler para Push Notifications
self.addEventListener('push', (event) => {
  console.log('Push recebido:', event);
  
  let notificationData = {
    title: 'SalaFácil',
    body: 'Nova notificação',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'general',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Ver',
        icon: '/icons/view.png'
      },
      {
        action: 'dismiss',
        title: 'Dispensar',
        icon: '/icons/dismiss.png'
      }
    ],
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: {
          ...notificationData.data,
          ...data.data
        }
      };
    } catch (error) {
      console.error('Erro ao parsear dados da notificação:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Personalizar notificação baseada no tipo
  switch (notificationData.type) {
    case 'meeting':
      notificationData.title = '📅 Lembrete de Reunião';
      notificationData.requireInteraction = true;
      notificationData.actions = [
        {
          action: 'join',
          title: 'Participar',
          icon: '/icons/join.png'
        },
        {
          action: 'snooze',
          title: 'Adiar (5min)',
          icon: '/icons/snooze.png'
        }
      ];
      break;
      
    case 'chat':
      notificationData.title = '💬 Nova Mensagem';
      notificationData.actions = [
        {
          action: 'reply',
          title: 'Responder',
          icon: '/icons/reply.png'
        },
        {
          action: 'view_chat',
          title: 'Ver Chat',
          icon: '/icons/chat.png'
        }
      ];
      break;
      
    case 'reservation':
      notificationData.title = '🏢 Reserva de Sala';
      notificationData.actions = [
        {
          action: 'view_reservation',
          title: 'Ver Detalhes',
          icon: '/icons/calendar.png'
        },
        {
          action: 'dismiss',
          title: 'Ok',
          icon: '/icons/check.png'
        }
      ];
      break;
      
    case 'system':
      notificationData.title = '⚙️ Notificação do Sistema';
      break;
      
    case 'warning':
      notificationData.title = '⚠️ Aviso Importante';
      notificationData.requireInteraction = true;
      break;
      
    case 'error':
      notificationData.title = '❌ Erro no Sistema';
      notificationData.requireInteraction = true;
      break;
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Handler para cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Notificação clicada:', event);
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};
  
  notification.close();

  let urlToOpen = data.url || '/';

  // Ações específicas baseadas no tipo de notificação
  switch (action) {
    case 'view':
      urlToOpen = data.url || '/';
      break;
      
    case 'join':
      urlToOpen = data.meeting_url || `/reservas/${data.reservation_id}`;
      break;
      
    case 'reply':
    case 'view_chat':
      urlToOpen = data.chat_url || '/chat';
      break;
      
    case 'view_reservation':
      urlToOpen = data.reservation_url || `/reservas/${data.reservation_id}`;
      break;
      
    case 'snooze':
      // Reagendar notificação para 5 minutos
      scheduleNotification(notification, 5 * 60 * 1000);
      return;
      
    case 'dismiss':
      // Apenas fechar a notificação
      return;
      
    default:
      urlToOpen = data.url || '/';
  }

  // Abrir ou focar na janela do aplicativo
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Procurar por uma janela já aberta
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            // Se encontrou uma janela, navegar para a URL e focar
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        
        // Se não encontrou janela aberta, abrir nova
        return clients.openWindow(urlToOpen);
      })
  );
});

// Handler para fechar notificações
self.addEventListener('notificationclose', (event) => {
  console.log('Notificação fechada:', event.notification);
  
  // Opcional: enviar analytics sobre notificações fechadas
  const data = event.notification.data || {};
  if (data.track_close) {
    fetch('/api/notifications/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notification_id: data.notification_id,
        action: 'closed',
        timestamp: Date.now()
      })
    }).catch(console.error);
  }
});

// Função para reagendar notificações (snooze)
function scheduleNotification(originalNotification, delayMs) {
  const data = originalNotification.data || {};
  
  setTimeout(() => {
    self.registration.showNotification(originalNotification.title, {
      body: originalNotification.body,
      icon: originalNotification.icon,
      badge: originalNotification.badge,
      tag: originalNotification.tag + '_snoozed',
      requireInteraction: originalNotification.requireInteraction,
      actions: originalNotification.actions,
      data: {
        ...data,
        snoozed: true,
        original_timestamp: data.timestamp
      }
    });
  }, delayMs);
}

// Handler para sincronização em background
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  switch (event.tag) {
    case 'background-sync-notifications':
      event.waitUntil(syncNotifications());
      break;
      
    case 'background-sync-messages':
      event.waitUntil(syncMessages());
      break;
  }
});

// Sincronizar notificações em background
async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications/sync/');
    const notifications = await response.json();
    
    // Processar notificações offline
    for (const notification of notifications) {
      if (notification.show_as_push) {
        await self.registration.showNotification(notification.title, {
          body: notification.message,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: `sync_${notification.id}`,
          data: notification.data
        });
      }
    }
  } catch (error) {
    console.error('Erro na sincronização de notificações:', error);
  }
}

// Sincronizar mensagens em background
async function syncMessages() {
  try {
    const response = await fetch('/api/chat/sync/');
    const messages = await response.json();
    
    // Mostrar notificações para mensagens não lidas
    for (const message of messages) {
      if (message.show_notification) {
        await self.registration.showNotification('💬 Nova Mensagem', {
          body: `${message.sender_name}: ${message.content}`,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: `message_${message.id}`,
          actions: [
            {
              action: 'reply',
              title: 'Responder'
            },
            {
              action: 'view_chat',
              title: 'Ver Chat'
            }
          ],
          data: {
            type: 'chat',
            message_id: message.id,
            conversation_id: message.conversation_id,
            chat_url: `/chat?conversation=${message.conversation_id}`
          }
        });
      }
    }
  } catch (error) {
    console.error('Erro na sincronização de mensagens:', error);
  }
}

// Handler para mensagens do cliente
self.addEventListener('message', (event) => {
  console.log('Mensagem recebida no SW:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.delete(CACHE_NAME).then(() => {
          event.ports[0].postMessage({ success: true });
        })
      );
      break;
  }
});

// Log de inicialização
console.log('Service Worker para SalaFácil carregado');
