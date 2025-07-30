# chat/admin.py
from django.contrib import admin
from .models import (
    Conversation, Message, Notification, NotificationSettings,
    PushSubscription, EmailTemplate, EmailLog
)

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'is_group', 'created_at', 'participant_count']
    list_filter = ['is_group', 'created_at']
    search_fields = ['name']
    filter_horizontal = ['participants']
    
    def participant_count(self, obj):
        return obj.participants.count()
    participant_count.short_description = 'Participantes'

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'conversation', 'message_type', 'timestamp', 'content_preview']
    list_filter = ['message_type', 'timestamp']
    search_fields = ['content', 'sender__first_name', 'sender__last_name']
    raw_id_fields = ['conversation', 'sender']
    
    def content_preview(self, obj):
        return obj.content[:50] + ('...' if len(obj.content) > 50 else '')
    content_preview.short_description = 'Conteúdo'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'title', 'notification_type', 'priority', 'is_read', 'created_at']
    list_filter = ['notification_type', 'priority', 'is_read', 'created_at']
    search_fields = ['title', 'message', 'recipient__first_name', 'recipient__last_name']
    raw_id_fields = ['recipient']
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
        self.message_user(request, f'{queryset.count()} notificações marcadas como lidas.')
    mark_as_read.short_description = 'Marcar como lidas'
    
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False)
        self.message_user(request, f'{queryset.count()} notificações marcadas como não lidas.')
    mark_as_unread.short_description = 'Marcar como não lidas'

@admin.register(NotificationSettings)
class NotificationSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'chat_push_enabled', 'meeting_reminder_enabled', 'daily_digest_enabled']
    list_filter = ['chat_push_enabled', 'meeting_reminder_enabled', 'daily_digest_enabled']
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    raw_id_fields = ['user']

@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'endpoint_preview', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__first_name', 'user__last_name', 'endpoint']
    raw_id_fields = ['user']
    
    def endpoint_preview(self, obj):
        return obj.endpoint[:50] + ('...' if len(obj.endpoint) > 50 else '')
    endpoint_preview.short_description = 'Endpoint'

@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'template_type', 'is_active', 'created_at']
    list_filter = ['template_type', 'is_active', 'created_at']
    search_fields = ['name', 'subject']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('name', 'template_type', 'subject', 'is_active')
        }),
        ('Conteúdo', {
            'fields': ('html_content', 'text_content'),
            'classes': ('wide',)
        }),
        ('Configurações', {
            'fields': ('available_variables',),
            'classes': ('collapse',)
        })
    )

@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['id', 'recipient', 'subject', 'status', 'created_at', 'sent_at']
    list_filter = ['status', 'created_at', 'template__template_type']
    search_fields = ['subject', 'recipient__first_name', 'recipient__last_name', 'recipient__email']
    raw_id_fields = ['recipient', 'template']
    readonly_fields = ['created_at', 'sent_at']
    
    fieldsets = (
        ('Informações do Email', {
            'fields': ('recipient', 'template', 'subject', 'status')
        }),
        ('Dados e Timestamps', {
            'fields': ('data_used', 'error_message', 'created_at', 'sent_at'),
            'classes': ('collapse',)
        })
    )
