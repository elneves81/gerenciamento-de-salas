"""
Modelos para o Sistema Administrativo
Integração com banco Neon PostgreSQL
"""
from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone

class Department(models.Model):
    """Modelo para departamentos/localizações organizacionais"""
    name = models.CharField(max_length=100, unique=True, verbose_name="Nome")
    description = models.TextField(blank=True, verbose_name="Descrição")
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='subdepartments',
        verbose_name="Departamento Pai"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Criado em")
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='departments_created',
        verbose_name="Criado por"
    )
    
    class Meta:
        db_table = 'departments'
        verbose_name = "Departamento"
        verbose_name_plural = "Departamentos"
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_full_path(self):
        """Retorna o caminho completo do departamento (pai > filho)"""
        if self.parent:
            return f"{self.parent.get_full_path()} > {self.name}"
        return self.name

class UserProfile(models.Model):
    """Extensão do modelo User para sistema administrativo"""
    ROLE_CHOICES = [
        ('user', 'Usuário'),
        ('admin', 'Administrador'),
        ('superadmin', 'Super Administrador'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Ativo'),
        ('blocked', 'Bloqueado'),
        ('inactive', 'Inativo'),
    ]
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='admin_profile'
    )
    nome = models.CharField(max_length=150, verbose_name="Nome Completo")
    telefone = models.CharField(max_length=20, blank=True, verbose_name="Telefone")
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='user',
        verbose_name="Função"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='active',
        verbose_name="Status"
    )
    department = models.ForeignKey(
        Department, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users',
        verbose_name="Departamento"
    )
    manager = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='subordinates',
        verbose_name="Gerente"
    )
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users_created',
        verbose_name="Criado por"
    )
    blocked_at = models.DateTimeField(null=True, blank=True, verbose_name="Bloqueado em")
    last_login = models.DateTimeField(null=True, blank=True, verbose_name="Último login")
    
    # Campos adicionais do Google OAuth
    google_id = models.CharField(max_length=100, blank=True, unique=True)
    picture_url = models.URLField(blank=True, verbose_name="Foto do perfil")
    
    class Meta:
        verbose_name = "Perfil de Usuário"
        verbose_name_plural = "Perfis de Usuários"
        ordering = ['nome']
    
    def __str__(self):
        return self.nome
    
    def is_admin(self):
        return self.role in ['admin', 'superadmin']
    
    def is_superadmin(self):
        return self.role == 'superadmin'
    
    def can_manage_user(self, target_user_profile):
        """Verifica se pode gerenciar outro usuário"""
        if self.is_superadmin():
            return True
        if self.role == 'admin':
            # Admin pode gerenciar usuários do mesmo departamento ou subordinados
            return (
                target_user_profile.department == self.department or
                target_user_profile.manager == self
            )
        return False

class AdminLog(models.Model):
    """Log de ações administrativas"""
    ACTION_CHOICES = [
        ('create_user', 'Criar Usuário'),
        ('update_user', 'Atualizar Usuário'),
        ('delete_user', 'Deletar Usuário'),
        ('block_user', 'Bloquear Usuário'),
        ('unblock_user', 'Desbloquear Usuário'),
        ('create_department', 'Criar Departamento'),
        ('update_department', 'Atualizar Departamento'),
        ('delete_department', 'Deletar Departamento'),
        ('send_notification', 'Enviar Notificação'),
        ('login', 'Login'),
        ('logout', 'Logout'),
    ]
    
    admin = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='admin_actions',
        verbose_name="Administrador"
    )
    action = models.CharField(
        max_length=50, 
        choices=ACTION_CHOICES,
        verbose_name="Ação"
    )
    target_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='admin_actions_received',
        verbose_name="Usuário Alvo"
    )
    details = models.TextField(blank=True, verbose_name="Detalhes")
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name="IP")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Data/Hora")
    
    class Meta:
        db_table = 'admin_logs'
        verbose_name = "Log Administrativo"
        verbose_name_plural = "Logs Administrativos"
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.admin.username} - {self.get_action_display()} - {self.created_at}"

class PushNotification(models.Model):
    """Notificações push personalizadas"""
    TYPE_CHOICES = [
        ('admin_message', 'Mensagem Administrativa'),
        ('system_alert', 'Alerta do Sistema'),
        ('room_reminder', 'Lembrete de Sala'),
        ('maintenance', 'Manutenção'),
    ]
    
    sender = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications_sent',
        verbose_name="Remetente"
    )
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='notifications_received',
        verbose_name="Destinatário"
    )
    title = models.CharField(max_length=200, verbose_name="Título")
    message = models.TextField(verbose_name="Mensagem")
    type = models.CharField(
        max_length=50, 
        choices=TYPE_CHOICES, 
        default='admin_message',
        verbose_name="Tipo"
    )
    sent_at = models.DateTimeField(auto_now_add=True, verbose_name="Enviado em")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Lido em")
    
    class Meta:
        db_table = 'push_notifications'
        verbose_name = "Notificação Push"
        verbose_name_plural = "Notificações Push"
        ordering = ['-sent_at']
    
    def __str__(self):
        recipient_name = self.recipient.username if self.recipient else "Todos"
        return f"{self.title} para {recipient_name}"
    
    def mark_as_read(self):
        """Marca a notificação como lida"""
        if not self.read_at:
            self.read_at = timezone.now()
            self.save()

# Signals para sincronização com tabela usuarios existente
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import connection

@receiver(post_save, sender=UserProfile)
def sync_user_to_usuarios_table(sender, instance, created, **kwargs):
    """Sincroniza UserProfile com a tabela usuarios existente"""
    try:
        with connection.cursor() as cursor:
            if created:
                # Inserir novo usuário na tabela usuarios
                cursor.execute("""
                    INSERT INTO usuarios (nome, email, telefone, role, status, department_id, manager_id, 
                                        created_by, blocked_at, last_login, google_id, picture_url, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (email) DO UPDATE SET
                        nome = EXCLUDED.nome,
                        telefone = EXCLUDED.telefone,
                        role = EXCLUDED.role,
                        status = EXCLUDED.status,
                        department_id = EXCLUDED.department_id,
                        manager_id = EXCLUDED.manager_id
                """, [
                    instance.nome,
                    instance.user.email,
                    instance.telefone,
                    instance.role,
                    instance.status,
                    instance.department_id,
                    instance.manager_id if instance.manager else None,
                    instance.created_by_id if instance.created_by else None,
                    instance.blocked_at,
                    instance.last_login,
                    instance.google_id,
                    instance.picture_url,
                    timezone.now()
                ])
            else:
                # Atualizar usuário existente
                cursor.execute("""
                    UPDATE usuarios SET
                        nome = %s,
                        telefone = %s,
                        role = %s,
                        status = %s,
                        department_id = %s,
                        manager_id = %s,
                        blocked_at = %s,
                        last_login = %s,
                        google_id = %s,
                        picture_url = %s
                    WHERE email = %s
                """, [
                    instance.nome,
                    instance.telefone,
                    instance.role,
                    instance.status,
                    instance.department_id,
                    instance.manager_id if instance.manager else None,
                    instance.blocked_at,
                    instance.last_login,
                    instance.google_id,
                    instance.picture_url,
                    instance.user.email
                ])
    except Exception as e:
        print(f"Erro ao sincronizar usuário: {e}")

@receiver(post_delete, sender=UserProfile)
def delete_user_from_usuarios_table(sender, instance, **kwargs):
    """Remove usuário da tabela usuarios quando UserProfile é deletado"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM usuarios WHERE email = %s", [instance.user.email])
    except Exception as e:
        print(f"Erro ao deletar usuário: {e}")
