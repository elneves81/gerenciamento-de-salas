import React from 'react';

// Template base para emails
export const EmailTemplate = ({ title, content, logoUrl, baseUrl }) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header img {
            max-width: 120px;
            margin-bottom: 10px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 300;
        }
        .content {
            padding: 30px 20px;
            line-height: 1.6;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #6c757d;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            margin: 15px 0;
        }
        .button:hover {
            opacity: 0.9;
        }
        .info-box {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .warning-box {
            background-color: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .success-box {
            background-color: #e8f5e8;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        .details-table th,
        .details-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        .details-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0;
                box-shadow: none;
            }
            .content {
                padding: 20px 15px;
            }
            .header {
                padding: 20px 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="SalaFácil">` : ''}
            <h1>SalaFácil</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>
                Este é um email automático do sistema SalaFácil.<br>
                <a href="${baseUrl}">Acesse o sistema</a> | 
                <a href="${baseUrl}/configuracoes">Gerenciar Notificações</a>
            </p>
        </div>
    </div>
</body>
</html>
`;

// Template para lembrete de reunião
export const MeetingReminderTemplate = (data) => {
  const {
    userName,
    meetingTitle,
    roomName,
    startTime,
    endTime,
    date,
    description,
    organizer,
    participants,
    meetingUrl,
    baseUrl
  } = data;

  const content = `
    <h2>🗓️ Lembrete de Reunião</h2>
    <p>Olá <strong>${userName}</strong>,</p>
    
    <p>Este é um lembrete de que você tem uma reunião agendada em breve:</p>
    
    <div class="info-box">
        <h3>${meetingTitle}</h3>
        <table class="details-table">
            <tr>
                <th>📅 Data:</th>
                <td>${date}</td>
            </tr>
            <tr>
                <th>⏰ Horário:</th>
                <td>${startTime} às ${endTime}</td>
            </tr>
            <tr>
                <th>🏢 Sala:</th>
                <td>${roomName}</td>
            </tr>
            <tr>
                <th>👤 Organizador:</th>
                <td>${organizer}</td>
            </tr>
            ${participants ? `
            <tr>
                <th>👥 Participantes:</th>
                <td>${participants.join(', ')}</td>
            </tr>
            ` : ''}
        </table>
        
        ${description ? `
        <h4>📝 Descrição:</h4>
        <p>${description}</p>
        ` : ''}
    </div>
    
    <div style="text-align: center;">
        <a href="${meetingUrl || baseUrl + '/reservas'}" class="button">
            Ver Detalhes da Reunião
        </a>
    </div>
    
    <p>Prepare-se para a reunião e não se esqueça de chegar no horário!</p>
  `;

  return EmailTemplate({
    title: `Lembrete: ${meetingTitle}`,
    content,
    baseUrl
  });
};

// Template para nova mensagem de chat
export const ChatNotificationTemplate = (data) => {
  const {
    recipientName,
    senderName,
    senderRole,
    message,
    conversationName,
    isGroup,
    chatUrl,
    baseUrl
  } = data;

  const content = `
    <h2>💬 Nova Mensagem no Chat</h2>
    <p>Olá <strong>${recipientName}</strong>,</p>
    
    <p>Você recebeu uma nova mensagem ${isGroup ? 'no grupo' : 'de'} <strong>${conversationName}</strong>:</p>
    
    <div class="info-box">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <div style="margin-right: 10px;">
                ${senderRole === 'admin' ? '👨‍💼' : '👤'}
            </div>
            <div>
                <strong>${senderName}</strong>
                ${senderRole === 'admin' ? '<span style="color: #2196f3;">(Administrador)</span>' : ''}
            </div>
        </div>
        
        <div style="background-color: white; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-style: italic;">"${message}"</p>
        </div>
    </div>
    
    <div style="text-align: center;">
        <a href="${chatUrl || baseUrl + '/chat'}" class="button">
            Responder Mensagem
        </a>
    </div>
    
    <p>Mantenha-se conectado com sua equipe através do chat do SalaFácil!</p>
  `;

  return EmailTemplate({
    title: `Nova mensagem de ${senderName}`,
    content,
    baseUrl
  });
};

// Template para notificação de reserva
export const ReservationNotificationTemplate = (data) => {
  const {
    userName,
    action, // 'created', 'updated', 'cancelled', 'approved', 'rejected'
    reservationTitle,
    roomName,
    startTime,
    endTime,
    date,
    organizer,
    status,
    comments,
    reservationUrl,
    baseUrl
  } = data;

  const actionTexts = {
    created: { title: '✅ Reserva Criada', message: 'Uma nova reserva foi criada', color: 'success' },
    updated: { title: '📝 Reserva Atualizada', message: 'Sua reserva foi atualizada', color: 'info' },
    cancelled: { title: '❌ Reserva Cancelada', message: 'Uma reserva foi cancelada', color: 'warning' },
    approved: { title: '✅ Reserva Aprovada', message: 'Sua reserva foi aprovada', color: 'success' },
    rejected: { title: '❌ Reserva Rejeitada', message: 'Sua reserva foi rejeitada', color: 'warning' }
  };

  const actionInfo = actionTexts[action] || actionTexts.created;

  const content = `
    <h2>${actionInfo.title}</h2>
    <p>Olá <strong>${userName}</strong>,</p>
    
    <p>${actionInfo.message} no sistema SalaFácil:</p>
    
    <div class="${actionInfo.color}-box">
        <h3>${reservationTitle}</h3>
        <table class="details-table">
            <tr>
                <th>📅 Data:</th>
                <td>${date}</td>
            </tr>
            <tr>
                <th>⏰ Horário:</th>
                <td>${startTime} às ${endTime}</td>
            </tr>
            <tr>
                <th>🏢 Sala:</th>
                <td>${roomName}</td>
            </tr>
            <tr>
                <th>👤 Responsável:</th>
                <td>${organizer}</td>
            </tr>
            <tr>
                <th>📊 Status:</th>
                <td><strong>${status}</strong></td>
            </tr>
        </table>
        
        ${comments ? `
        <h4>💭 Observações:</h4>
        <p>${comments}</p>
        ` : ''}
    </div>
    
    <div style="text-align: center;">
        <a href="${reservationUrl || baseUrl + '/reservas'}" class="button">
            Ver Detalhes da Reserva
        </a>
    </div>
    
    ${action === 'approved' ? 
      '<p>Sua reserva foi aprovada! Não se esqueça de comparecer no horário agendado.</p>' :
      action === 'rejected' ?
      '<p>Entre em contato com o administrador para mais informações sobre a rejeição.</p>' :
      '<p>Mantenha-se atualizado sobre suas reservas através do sistema.</p>'
    }
  `;

  return EmailTemplate({
    title: `${actionInfo.title}: ${reservationTitle}`,
    content,
    baseUrl
  });
};

// Template para digest diário
export const DailyDigestTemplate = (data) => {
  const {
    userName,
    date,
    upcomingMeetings,
    newMessages,
    pendingReservations,
    systemNotifications,
    baseUrl
  } = data;

  const content = `
    <h2>📊 Resumo Diário - ${date}</h2>
    <p>Olá <strong>${userName}</strong>,</p>
    
    <p>Aqui está o seu resumo diário do SalaFácil:</p>
    
    ${upcomingMeetings?.length > 0 ? `
    <div class="info-box">
        <h3>🗓️ Próximas Reuniões (${upcomingMeetings.length})</h3>
        ${upcomingMeetings.map(meeting => `
            <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e9ecef;">
                <strong>${meeting.title}</strong><br>
                <small>${meeting.time} - ${meeting.room}</small>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${newMessages?.length > 0 ? `
    <div class="info-box">
        <h3>💬 Novas Mensagens (${newMessages.length})</h3>
        ${newMessages.map(msg => `
            <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e9ecef;">
                <strong>${msg.sender}</strong>: ${msg.preview}<br>
                <small>${msg.time}</small>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${pendingReservations?.length > 0 ? `
    <div class="warning-box">
        <h3>⏳ Reservas Pendentes (${pendingReservations.length})</h3>
        ${pendingReservations.map(res => `
            <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e9ecef;">
                <strong>${res.title}</strong><br>
                <small>${res.date} ${res.time} - ${res.room}</small>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${systemNotifications?.length > 0 ? `
    <div class="info-box">
        <h3>🔔 Notificações do Sistema (${systemNotifications.length})</h3>
        ${systemNotifications.map(notif => `
            <div style="margin-bottom: 10px;">
                <strong>${notif.title}</strong><br>
                <small>${notif.message}</small>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    <div style="text-align: center;">
        <a href="${baseUrl}/dashboard" class="button">
            Acessar Dashboard
        </a>
    </div>
    
    <p>Tenha um ótimo dia!</p>
  `;

  return EmailTemplate({
    title: `Resumo Diário - ${date}`,
    content,
    baseUrl
  });
};

// Template para bem-vindo
export const WelcomeTemplate = (data) => {
  const {
    userName,
    userEmail,
    temporaryPassword,
    loginUrl,
    baseUrl
  } = data;

  const content = `
    <h2>🎉 Bem-vindo ao SalaFácil!</h2>
    <p>Olá <strong>${userName}</strong>,</p>
    
    <p>Seja bem-vindo ao sistema de gerenciamento de salas SalaFácil! Sua conta foi criada com sucesso.</p>
    
    <div class="success-box">
        <h3>📧 Informações da sua conta:</h3>
        <table class="details-table">
            <tr>
                <th>Email:</th>
                <td>${userEmail}</td>
            </tr>
            ${temporaryPassword ? `
            <tr>
                <th>Senha Temporária:</th>
                <td><code>${temporaryPassword}</code></td>
            </tr>
            ` : ''}
        </table>
    </div>
    
    <div class="info-box">
        <h3>🚀 Primeiros passos:</h3>
        <ol>
            <li>Faça login no sistema usando suas credenciais</li>
            <li>Complete seu perfil nas configurações</li>
            <li>Explore as salas disponíveis</li>
            <li>Faça sua primeira reserva</li>
            <li>Configure suas preferências de notificação</li>
        </ol>
    </div>
    
    <div style="text-align: center;">
        <a href="${loginUrl || baseUrl + '/login'}" class="button">
            Fazer Login
        </a>
    </div>
    
    ${temporaryPassword ? `
    <div class="warning-box">
        <p><strong>⚠️ Importante:</strong> Esta é uma senha temporária. Recomendamos que você a altere assim que fizer o primeiro login por questões de segurança.</p>
    </div>
    ` : ''}
    
    <p>Se você tiver alguma dúvida, não hesite em entrar em contato com nossa equipe de suporte.</p>
  `;

  return EmailTemplate({
    title: 'Bem-vindo ao SalaFácil!',
    content,
    baseUrl
  });
};

export default {
  EmailTemplate,
  MeetingReminderTemplate,
  ChatNotificationTemplate,
  ReservationNotificationTemplate,
  DailyDigestTemplate,
  WelcomeTemplate
};
