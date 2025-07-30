# chat/utils.py
import json
import requests
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from pywebpush import webpush, WebPushException
from .models import PushSubscription, EmailTemplate, EmailLog
import logging

logger = logging.getLogger(__name__)

def send_push_notification(user, title, body, data=None):
    """
    Enviar push notification para um usuário
    """
    if not hasattr(settings, 'VAPID_PRIVATE_KEY') or not settings.VAPID_PRIVATE_KEY:
        logger.warning("VAPID_PRIVATE_KEY não configurado, push notifications desabilitadas")
        return False
    
    # Buscar todas as inscrições ativas do usuário
    subscriptions = PushSubscription.objects.filter(user=user, is_active=True)
    
    success_count = 0
    
    for subscription in subscriptions:
        try:
            # Preparar dados da notificação
            notification_data = {
                'title': title,
                'body': body,
                'icon': '/logo192.png',
                'badge': '/logo192.png',
                'data': data or {},
                'requireInteraction': data.get('priority') == 'high' if data else False,
                'tag': data.get('tag', 'general') if data else 'general'
            }
            
            # Configurar push subscription
            subscription_info = {
                'endpoint': subscription.endpoint,
                'keys': {
                    'p256dh': subscription.p256dh,
                    'auth': subscription.auth
                }
            }
            
            # Enviar push notification
            webpush(
                subscription_info=subscription_info,
                data=json.dumps(notification_data),
                vapid_private_key=settings.VAPID_PRIVATE_KEY,
                vapid_claims={
                    'sub': f'mailto:{settings.VAPID_EMAIL or "admin@salafacil.com"}'
                }
            )
            
            success_count += 1
            logger.info(f"Push notification enviada para {user.username}")
            
        except WebPushException as e:
            logger.error(f"Erro ao enviar push notification para {user.username}: {e}")
            
            # Se a subscription está inválida, desativá-la
            if e.response and e.response.status_code in [410, 413, 429]:
                subscription.is_active = False
                subscription.save()
        
        except Exception as e:
            logger.error(f"Erro inesperado ao enviar push notification: {e}")
    
    return success_count > 0

def send_email_notification(user, template_type, context_data):
    """
    Enviar notificação por email usando templates
    """
    try:
        # Buscar template ativo
        template = EmailTemplate.objects.filter(
            template_type=template_type,
            is_active=True
        ).first()
        
        if not template:
            logger.warning(f"Template de email '{template_type}' não encontrado")
            return False
        
        # Adicionar dados base ao contexto
        context_data.update({
            'user_name': user.get_full_name() or user.username,
            'user_email': user.email,
            'base_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
            'logo_url': getattr(settings, 'LOGO_URL', None)
        })
        
        # Renderizar conteúdo do email
        html_content = render_template_string(template.html_content, context_data)
        subject = render_template_string(template.subject, context_data)
        
        # Criar versão texto se não existir
        text_content = template.text_content
        if not text_content:
            text_content = strip_tags(html_content)
        else:
            text_content = render_template_string(text_content, context_data)
        
        # Criar log do email
        email_log = EmailLog.objects.create(
            recipient=user,
            template=template,
            subject=subject,
            data_used=context_data,
            status='pending'
        )
        
        try:
            # Enviar email
            send_mail(
                subject=subject,
                message=text_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                html_message=html_content,
                fail_silently=False
            )
            
            # Atualizar log como enviado
            email_log.status = 'sent'
            email_log.sent_at = timezone.now()
            email_log.save()
            
            logger.info(f"Email '{template_type}' enviado para {user.email}")
            return True
            
        except Exception as e:
            # Atualizar log como falhou
            email_log.status = 'failed'
            email_log.error_message = str(e)
            email_log.save()
            
            logger.error(f"Erro ao enviar email para {user.email}: {e}")
            return False
            
    except Exception as e:
        logger.error(f"Erro inesperado ao processar email: {e}")
        return False

def render_template_string(template_string, context):
    """
    Renderizar string de template com contexto
    """
    from django.template import Template, Context
    
    template = Template(template_string)
    return template.render(Context(context))

def create_meeting_reminder_notification(reserva, minutes_before=15):
    """
    Criar notificação de lembrete de reunião
    """
    from .models import Notification
    from django.utils import timezone
    from datetime import timedelta
    
    # Calcular quando enviar o lembrete
    reminder_time = reserva.data_inicio - timedelta(minutes=minutes_before)
    
    # Se já passou do horário, não criar lembrete
    if reminder_time <= timezone.now():
        return None
    
    # Criar notificação para o responsável
    notification = Notification.objects.create(
        recipient=reserva.usuario,
        title=f'Lembrete: {reserva.titulo}',
        message=f'Sua reunião começará em {minutes_before} minutos na sala {reserva.sala.nome}',
        notification_type='meeting',
        priority='high',
        data={
            'reserva_id': reserva.id,
            'sala_id': reserva.sala.id,
            'minutes_before': minutes_before,
            'meeting_url': f"/reservas/{reserva.id}"
        }
    )
    
    # Agendar envio do lembrete (você pode usar Celery para isso)
    # schedule_notification.apply_async(
    #     args=[notification.id],
    #     eta=reminder_time
    # )
    
    return notification

def create_reservation_notification(reserva, action_type):
    """
    Criar notificação de reserva
    """
    from .models import Notification
    
    action_messages = {
        'created': 'Sua reserva foi criada com sucesso',
        'updated': 'Sua reserva foi atualizada',
        'cancelled': 'Sua reserva foi cancelada',
        'approved': 'Sua reserva foi aprovada',
        'rejected': 'Sua reserva foi rejeitada'
    }
    
    action_titles = {
        'created': 'Reserva Criada',
        'updated': 'Reserva Atualizada', 
        'cancelled': 'Reserva Cancelada',
        'approved': 'Reserva Aprovada',
        'rejected': 'Reserva Rejeitada'
    }
    
    message = action_messages.get(action_type, 'Sua reserva foi processada')
    title = action_titles.get(action_type, 'Atualização de Reserva')
    
    # Determinar prioridade
    priority = 'high' if action_type in ['approved', 'rejected'] else 'medium'
    
    notification = Notification.objects.create(
        recipient=reserva.usuario,
        title=title,
        message=f'{message}: {reserva.titulo} na sala {reserva.sala.nome}',
        notification_type='reservation',
        priority=priority,
        data={
            'reserva_id': reserva.id,
            'sala_id': reserva.sala.id,
            'action_type': action_type,
            'reservation_url': f"/reservas/{reserva.id}"
        }
    )
    
    return notification

def send_daily_digest(user):
    """
    Enviar resumo diário para um usuário
    """
    from django.utils import timezone
    from datetime import datetime, timedelta
    from gerenciamento.models import Reserva  # Ajuste conforme seu modelo
    
    today = timezone.now().date()
    tomorrow = today + timedelta(days=1)
    
    # Buscar reuniões do dia seguinte
    upcoming_meetings = Reserva.objects.filter(
        usuario=user,
        data_inicio__date=tomorrow,
        status='aprovada'
    ).order_by('data_inicio')
    
    # Buscar notificações não lidas
    unread_notifications = Notification.objects.filter(
        recipient=user,
        is_read=False,
        created_at__date=today
    )
    
    # Buscar mensagens não lidas
    from .models import Message, Conversation
    unread_messages = Message.objects.filter(
        conversation__participants=user
    ).exclude(
        read_by=user
    ).filter(
        timestamp__date=today
    ).select_related('sender', 'conversation')
    
    # Preparar dados para o template
    context_data = {
        'date': tomorrow.strftime('%d/%m/%Y'),
        'upcoming_meetings': [
            {
                'title': meeting.titulo,
                'time': meeting.data_inicio.strftime('%H:%M'),
                'room': meeting.sala.nome
            }
            for meeting in upcoming_meetings
        ],
        'new_messages': [
            {
                'sender': msg.sender.get_full_name(),
                'preview': msg.content[:50] + ('...' if len(msg.content) > 50 else ''),
                'time': msg.timestamp.strftime('%H:%M')
            }
            for msg in unread_messages[:5]
        ],
        'system_notifications': [
            {
                'title': notif.title,
                'message': notif.message
            }
            for notif in unread_notifications[:5]
        ]
    }
    
    # Enviar apenas se houver conteúdo relevante
    if (context_data['upcoming_meetings'] or 
        context_data['new_messages'] or 
        context_data['system_notifications']):
        
        return send_email_notification(user, 'daily_digest', context_data)
    
    return False

def test_push_notification(user):
    """
    Enviar notificação de teste
    """
    return send_push_notification(
        user,
        '🧪 Teste de Notificação',
        'Esta é uma notificação de teste do SalaFácil!',
        {
            'type': 'test',
            'timestamp': timezone.now().isoformat()
        }
    )

# Importar timezone se necessário
from django.utils import timezone
