# chat/serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Conversation, Message, Notification, NotificationSettings,
    PushSubscription, EmailTemplate
)

class UserSerializer(serializers.ModelSerializer):
    """Serializer para usuários"""
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'is_staff']
    
    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

class MessageSerializer(serializers.ModelSerializer):
    """Serializer para mensagens"""
    sender = UserSerializer(read_only=True)
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'content', 'message_type',
            'file_url', 'timestamp', 'is_read'
        ]
    
    def get_is_read(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.is_read_by(request.user)
        return False

class ConversationSerializer(serializers.ModelSerializer):
    """Serializer para conversas"""
    participants = UserSerializer(many=True, read_only=True)
    last_message = MessageSerializer(read_only=True)
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'name', 'is_group', 'created_at',
            'updated_at', 'last_message', 'unread_count'
        ]
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_unread_count(request.user)
        return 0

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer para notificações"""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'message', 'notification_type', 'priority',
            'data', 'is_read', 'was_shown', 'created_at', 'read_at'
        ]

class NotificationSettingsSerializer(serializers.ModelSerializer):
    """Serializer para configurações de notificação"""
    
    class Meta:
        model = NotificationSettings
        fields = [
            'chat_push_enabled', 'chat_email_enabled', 'chat_sound_enabled',
            'meeting_reminder_enabled', 'meeting_reminder_minutes',
            'meeting_email_enabled', 'meeting_push_enabled',
            'reservation_email_enabled', 'reservation_push_enabled',
            'daily_digest_enabled', 'daily_digest_time'
        ]

class PushSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer para inscrições de push"""
    
    class Meta:
        model = PushSubscription
        fields = ['endpoint', 'p256dh', 'auth', 'is_active']

class EmailTemplateSerializer(serializers.ModelSerializer):
    """Serializer para templates de email"""
    
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'template_type', 'subject', 'html_content',
            'text_content', 'available_variables', 'is_active'
        ]
