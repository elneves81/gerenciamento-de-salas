# chat/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.db.models import Q, Count, Max
from django.utils import timezone
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import json
from .models import (
    Conversation, Message, Notification, NotificationSettings,
    PushSubscription, EmailTemplate, EmailLog
)
from .serializers import (
    ConversationSerializer, MessageSerializer, NotificationSerializer,
    NotificationSettingsSerializer, UserSerializer
)
from .utils import send_push_notification, send_email_notification

class ConversationViewSet(viewsets.ModelViewSet):
    """ViewSet para conversas do chat"""
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna apenas conversas do usuário logado"""
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related('participants', 'messages').annotate(
            last_message_time=Max('messages__timestamp'),
            unread_count=Count('messages', filter=Q(
                messages__read_by=None
            ) | ~Q(messages__read_by=self.request.user))
        ).order_by('-last_message_time')
    
    def create(self, request):
        """Criar nova conversa"""
        participants_ids = request.data.get('participants', [])
        is_group = request.data.get('is_group', False)
        name = request.data.get('name', '')
        
        # Verificar se já existe conversa entre esses participantes (se não for grupo)
        if not is_group and len(participants_ids) == 2:
            existing_conv = Conversation.objects.filter(
                participants__in=participants_ids,
                is_group=False
            ).annotate(
                participant_count=Count('participants')
            ).filter(participant_count=2).first()
            
            if existing_conv:
                serializer = self.get_serializer(existing_conv)
                return Response(serializer.data)
        
        # Criar nova conversa
        conversation = Conversation.objects.create(
            name=name if is_group else None,
            is_group=is_group
        )
        
        # Adicionar participantes
        conversation.participants.set(participants_ids)
        
        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Marcar conversa como lida"""
        conversation = self.get_object()
        
        # Marcar todas as mensagens como lidas
        conversation.messages.exclude(
            read_by=request.user
        ).update(read_by=request.user)
        
        return Response({'status': 'success'})
    
    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        """Listar mensagens de uma conversa"""
        conversation = self.get_object()
        messages = conversation.messages.all()[:50]  # Últimas 50 mensagens
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet para mensagens do chat"""
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna apenas mensagens de conversas do usuário"""
        return Message.objects.filter(
            conversation__participants=self.request.user
        ).select_related('sender', 'conversation')
    
    def create(self, request):
        """Enviar nova mensagem"""
        conversation_id = request.data.get('conversation')
        content = request.data.get('content')
        message_type = request.data.get('message_type', 'text')
        
        try:
            conversation = Conversation.objects.get(
                id=conversation_id,
                participants=request.user
            )
        except Conversation.DoesNotExist:
            return Response(
                {'error': 'Conversa não encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Criar mensagem
        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            message_type=message_type
        )
        
        # Marcar como lida pelo remetente
        message.mark_as_read(request.user)
        
        # Atualizar timestamp da conversa
        conversation.updated_at = timezone.now()
        conversation.save()
        
        # Enviar notificações para outros participantes
        self._send_chat_notifications(message)
        
        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def _send_chat_notifications(self, message):
        """Enviar notificações de chat para participantes"""
        participants = message.conversation.participants.exclude(
            id=message.sender.id
        )
        
        for participant in participants:
            # Verificar configurações de notificação
            settings_obj, created = NotificationSettings.objects.get_or_create(
                user=participant
            )
            
            # Criar notificação no sistema
            notification = Notification.objects.create(
                recipient=participant,
                title=f'Nova mensagem de {message.sender.get_full_name()}',
                message=message.content[:100] + ('...' if len(message.content) > 100 else ''),
                notification_type='chat',
                data={
                    'conversation_id': message.conversation.id,
                    'message_id': message.id,
                    'sender_id': message.sender.id
                }
            )
            
            # Enviar push notification
            if settings_obj.chat_push_enabled:
                send_push_notification(
                    participant,
                    notification.title,
                    notification.message,
                    data={
                        'type': 'chat',
                        'conversation_id': str(message.conversation.id),
                        'message_id': str(message.id)
                    }
                )
            
            # Enviar email
            if settings_obj.chat_email_enabled:
                send_email_notification(
                    participant,
                    'chat_notification',
                    {
                        'recipient_name': participant.get_full_name(),
                        'sender_name': message.sender.get_full_name(),
                        'sender_role': 'admin' if message.sender.is_staff else 'user',
                        'message': message.content,
                        'conversation_name': str(message.conversation),
                        'is_group': message.conversation.is_group,
                        'chat_url': f"{settings.FRONTEND_URL}/chat?conversation={message.conversation.id}"
                    }
                )

class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet para notificações"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna apenas notificações do usuário logado"""
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Marcar notificações como lidas"""
        notification_ids = request.data.get('notification_ids', [])
        
        notifications = Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user
        )
        
        for notification in notifications:
            notification.mark_as_read()
        
        return Response({'status': 'success'})
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Marcar todas as notificações como lidas"""
        Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True, read_at=timezone.now())
        
        return Response({'status': 'success'})
    
    @action(detail=False, methods=['post'])
    def mark_shown(self, request):
        """Marcar notificações como mostradas (para controlar toasts)"""
        notification_ids = request.data.get('notification_ids', [])
        
        Notification.objects.filter(
            id__in=notification_ids,
            recipient=request.user
        ).update(was_shown=True)
        
        return Response({'status': 'success'})
    
    @action(detail=False, methods=['post'])
    def meeting_reminder(self, request):
        """Criar lembrete de reunião"""
        reserva_id = request.data.get('reserva_id')
        minutes_before = request.data.get('minutes_before', 15)
        
        # Aqui você pode implementar a lógica para criar lembretes
        # baseado na reserva específica
        
        return Response({'status': 'reminder_created'})
    
    @action(detail=False, methods=['post'])
    def chat(self, request):
        """Notificação de chat (usado pelo sistema)"""
        conversation_id = request.data.get('conversation_id')
        message = request.data.get('message')
        
        # Lógica já implementada no MessageViewSet
        return Response({'status': 'notification_sent'})
    
    @action(detail=False, methods=['post'])
    def reservation(self, request):
        """Notificação de reserva"""
        reserva_id = request.data.get('reserva_id')
        notification_type = request.data.get('notification_type')
        
        # Implementar lógica de notificação de reservas
        return Response({'status': 'notification_sent'})

class NotificationSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet para configurações de notificação"""
    serializer_class = NotificationSettingsSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return NotificationSettings.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Retorna ou cria configurações do usuário"""
        settings_obj, created = NotificationSettings.objects.get_or_create(
            user=self.request.user
        )
        return settings_obj

class PushSubscriptionViewSet(viewsets.ViewSet):
    """ViewSet para inscrições de push notifications"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        """Criar inscrição de push notification"""
        subscription_data = json.loads(request.data.get('subscription'))
        
        PushSubscription.objects.update_or_create(
            user=request.user,
            endpoint=subscription_data['endpoint'],
            defaults={
                'p256dh': subscription_data['keys']['p256dh'],
                'auth': subscription_data['keys']['auth'],
                'is_active': True
            }
        )
        
        return Response({'status': 'subscribed'})
    
    @action(detail=False, methods=['post'])
    def unsubscribe(self, request):
        """Remover inscrição de push notification"""
        endpoint = request.data.get('endpoint')
        
        PushSubscription.objects.filter(
            user=request.user,
            endpoint=endpoint
        ).update(is_active=False)
        
        return Response({'status': 'unsubscribed'})

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para listar usuários (para chat)"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Retorna todos os usuários ativos"""
        return User.objects.filter(is_active=True).order_by('first_name', 'last_name')
