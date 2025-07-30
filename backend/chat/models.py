# chat/models.py
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Conversation(models.Model):
    """Model para conversas do chat"""
    participants = models.ManyToManyField(User, related_name='conversations')
    name = models.CharField(max_length=255, blank=True, null=True)
    is_group = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        if self.is_group:
            return self.name or f"Grupo {self.id}"
        participants = list(self.participants.all())
        if len(participants) == 2:
            return f"Conversa entre {participants[0].get_full_name()} e {participants[1].get_full_name()}"
        return f"Conversa {self.id}"
    
    @property
    def last_message(self):
        return self.messages.first()
    
    def get_unread_count(self, user):
        """Retorna o número de mensagens não lidas para um usuário"""
        return self.messages.exclude(
            read_by=user
        ).count()

class Message(models.Model):
    """Model para mensagens do chat"""
    MESSAGE_TYPES = [
        ('text', 'Texto'),
        ('image', 'Imagem'),
        ('file', 'Arquivo'),
        ('system', 'Sistema'),
    ]
    
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name='messages'
    )
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='sent_messages'
    )
    content = models.TextField()
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES, default='text')
    file_url = models.URLField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    read_by = models.ManyToManyField(User, blank=True, related_name='read_messages')
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.sender.get_full_name()}: {self.content[:50]}..."
    
    def mark_as_read(self, user):
        """Marca a mensagem como lida por um usuário"""
        self.read_by.add(user)
        
    def is_read_by(self, user):
        """Verifica se a mensagem foi lida por um usuário"""
        return self.read_by.filter(id=user.id).exists()

class NotificationSettings(models.Model):
    """Configurações de notificação do usuário"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_settings')
    
    # Notificações de Chat
    chat_push_enabled = models.BooleanField(default=True)
    chat_email_enabled = models.BooleanField(default=False)
    chat_sound_enabled = models.BooleanField(default=True)
    
    # Notificações de Reunião
    meeting_reminder_enabled = models.BooleanField(default=True)
    meeting_reminder_minutes = models.IntegerField(default=15)
    meeting_email_enabled = models.BooleanField(default=True)
    meeting_push_enabled = models.BooleanField(default=True)
    
    # Notificações de Reserva
    reservation_email_enabled = models.BooleanField(default=True)
    reservation_push_enabled = models.BooleanField(default=True)
    
    # Digest Diário
    daily_digest_enabled = models.BooleanField(default=False)
    daily_digest_time = models.TimeField(default='08:00')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Configurações de {self.user.get_full_name()}"

class Notification(models.Model):
    """Model para notificações do sistema"""
    NOTIFICATION_TYPES = [
        ('chat', 'Chat'),
        ('meeting', 'Reunião'),
        ('reservation', 'Reserva'),
        ('system', 'Sistema'),
        ('warning', 'Aviso'),
        ('error', 'Erro'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Baixa'),
        ('medium', 'Média'),
        ('high', 'Alta'),
    ]
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Dados relacionados (JSON)
    data = models.JSONField(default=dict, blank=True)
    
    # Status
    is_read = models.BooleanField(default=False)
    was_shown = models.BooleanField(default=False)  # Para controlar toasts
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.recipient.get_full_name()}"
    
    def mark_as_read(self):
        """Marca a notificação como lida"""
        self.is_read = True
        self.read_at = timezone.now()
        self.save()

class PushSubscription(models.Model):
    """Model para inscrições de push notifications"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.URLField()
    p256dh = models.TextField()
    auth = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'endpoint']
    
    def __str__(self):
        return f"Push subscription para {self.user.get_full_name()}"

class EmailTemplate(models.Model):
    """Model para templates de email"""
    TEMPLATE_TYPES = [
        ('meeting_reminder', 'Lembrete de Reunião'),
        ('chat_notification', 'Notificação de Chat'),
        ('reservation_notification', 'Notificação de Reserva'),
        ('daily_digest', 'Resumo Diário'),
        ('welcome', 'Bem-vindo'),
    ]
    
    name = models.CharField(max_length=100)
    template_type = models.CharField(max_length=30, choices=TEMPLATE_TYPES)
    subject = models.CharField(max_length=255)
    html_content = models.TextField()
    text_content = models.TextField(blank=True)
    
    # Variáveis disponíveis (JSON)
    available_variables = models.JSONField(default=list)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"

class EmailLog(models.Model):
    """Log de emails enviados"""
    recipient = models.ForeignKey(User, on_delete=models.CASCADE)
    template = models.ForeignKey(EmailTemplate, on_delete=models.CASCADE)
    subject = models.CharField(max_length=255)
    
    # Status do envio
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('sent', 'Enviado'),
        ('failed', 'Falhou'),
        ('bounced', 'Rejeitado'),
    ]
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    # Dados do email
    data_used = models.JSONField(default=dict)
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.subject} para {self.recipient.get_full_name()}"
