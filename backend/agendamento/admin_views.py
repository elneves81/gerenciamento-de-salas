"""
Views/APIs para o Sistema Administrativo
"""
from rest_framework import status, viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Q, Count
from django.utils import timezone
from django.db import transaction
from datetime import datetime, timedelta
import logging

from .admin_models import UserProfile, Department, AdminLog, PushNotification
from .admin_serializers import (
    UserProfileSerializer, DepartmentSerializer, AdminLogSerializer,
    PushNotificationSerializer, UserStatsSerializer, UserHierarchySerializer
)

logger = logging.getLogger(__name__)

class IsAdminPermission(permissions.BasePermission):
    """Permissão personalizada para administradores"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        try:
            user_profile = request.user.admin_profile
            return user_profile.is_admin()
        except UserProfile.DoesNotExist:
            return False

class IsSuperAdminPermission(permissions.BasePermission):
    """Permissão personalizada para super administradores"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        try:
            user_profile = request.user.admin_profile
            return user_profile.is_superadmin()
        except UserProfile.DoesNotExist:
            return False

def log_admin_action(user, action, target_user=None, details="", ip_address=None):
    """Função helper para log de ações administrativas"""
    try:
        AdminLog.objects.create(
            admin=user,
            action=action,
            target_user=target_user,
            details=details,
            ip_address=ip_address
        )
    except Exception as e:
        logger.error(f"Erro ao criar log administrativo: {e}")

class AdminStatsView(APIView):
    """API para estatísticas do painel administrativo"""
    permission_classes = [IsAdminPermission]
    
    def get(self, request):
        try:
            # Estatísticas básicas
            total_users = UserProfile.objects.count()
            active_users = UserProfile.objects.filter(status='active').count()
            blocked_users = UserProfile.objects.filter(status='blocked').count()
            admin_users = UserProfile.objects.filter(role__in=['admin', 'superadmin']).count()
            total_departments = Department.objects.count()
            
            # Logins recentes (últimos 7 dias)
            week_ago = timezone.now() - timedelta(days=7)
            recent_logins = UserProfile.objects.filter(
                last_login__gte=week_ago
            ).count()
            
            stats_data = {
                'total_users': total_users,
                'active_users': active_users,
                'blocked_users': blocked_users,
                'admin_users': admin_users,
                'total_departments': total_departments,
                'recent_logins': recent_logins
            }
            
            serializer = UserStatsSerializer(stats_data)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {e}")
            return Response(
                {'error': 'Erro interno do servidor'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class UserProfileViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de usuários"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAdminPermission]
    
    def get_queryset(self):
        user_profile = self.request.user.admin_profile
        
        if user_profile.is_superadmin():
            # Super admin vê todos os usuários
            return UserProfile.objects.all().select_related('user', 'department', 'manager')
        elif user_profile.role == 'admin':
            # Admin vê usuários do mesmo departamento e subordinados
            return UserProfile.objects.filter(
                Q(department=user_profile.department) |
                Q(manager=user_profile)
            ).select_related('user', 'department', 'manager')
        else:
            return UserProfile.objects.none()
    
    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                response = super().create(request, *args, **kwargs)
                
                # Log da ação
                log_admin_action(
                    user=request.user,
                    action='create_user',
                    details=f"Usuário criado: {response.data.get('nome')} ({response.data.get('email')})",
                    ip_address=self.get_client_ip(request)
                )
                
                return response
                
        except Exception as e:
            logger.error(f"Erro ao criar usuário: {e}")
            return Response(
                {'error': 'Erro ao criar usuário'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            # Verificar permissões
            if not request.user.admin_profile.can_manage_user(instance):
                return Response(
                    {'error': 'Sem permissão para editar este usuário'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            with transaction.atomic():
                response = super().update(request, *args, **kwargs)
                
                # Log da ação
                log_admin_action(
                    user=request.user,
                    action='update_user',
                    target_user=instance.user,
                    details=f"Usuário atualizado: {instance.nome}",
                    ip_address=self.get_client_ip(request)
                )
                
                return response
                
        except Exception as e:
            logger.error(f"Erro ao atualizar usuário: {e}")
            return Response(
                {'error': 'Erro ao atualizar usuário'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            
            # Verificar permissões
            if not request.user.admin_profile.can_manage_user(instance):
                return Response(
                    {'error': 'Sem permissão para deletar este usuário'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            with transaction.atomic():
                user_name = instance.nome
                user_email = instance.user.email
                
                # Deletar usuário Django (cascade deletará o profile)
                instance.user.delete()
                
                # Log da ação
                log_admin_action(
                    user=request.user,
                    action='delete_user',
                    details=f"Usuário deletado: {user_name} ({user_email})",
                    ip_address=self.get_client_ip(request)
                )
                
                return Response(status=status.HTTP_204_NO_CONTENT)
                
        except Exception as e:
            logger.error(f"Erro ao deletar usuário: {e}")
            return Response(
                {'error': 'Erro ao deletar usuário'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'])
    def block_user(self, request, pk=None):
        """Bloquear/desbloquear usuário"""
        try:
            instance = self.get_object()
            
            # Verificar permissões
            if not request.user.admin_profile.can_manage_user(instance):
                return Response(
                    {'error': 'Sem permissão para alterar status deste usuário'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Alternar status
            if instance.status == 'blocked':
                instance.status = 'active'
                instance.blocked_at = None
                action_name = 'unblock_user'
                message = 'desbloqueado'
            else:
                instance.status = 'blocked'
                instance.blocked_at = timezone.now()
                action_name = 'block_user'
                message = 'bloqueado'
            
            instance.save()
            
            # Log da ação
            log_admin_action(
                user=request.user,
                action=action_name,
                target_user=instance.user,
                details=f"Usuário {message}: {instance.nome}",
                ip_address=self.get_client_ip(request)
            )
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Erro ao alterar status do usuário: {e}")
            return Response(
                {'error': 'Erro ao alterar status do usuário'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def hierarchy(self, request):
        """Obter hierarquia de usuários"""
        try:
            # Obter usuários sem gerente (raiz da hierarquia)
            root_users = self.get_queryset().filter(manager__isnull=True)
            serializer = UserHierarchySerializer(root_users, many=True, context={'request': request})
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Erro ao obter hierarquia: {e}")
            return Response(
                {'error': 'Erro ao obter hierarquia'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        """Obter IP do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class DepartmentViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciamento de departamentos"""
    queryset = Department.objects.all().select_related('parent', 'created_by')
    serializer_class = DepartmentSerializer
    permission_classes = [IsAdminPermission]
    
    def create(self, request, *args, **kwargs):
        try:
            # Adicionar usuário criador
            request.data['created_by'] = request.user.id
            
            with transaction.atomic():
                response = super().create(request, *args, **kwargs)
                
                # Log da ação
                log_admin_action(
                    user=request.user,
                    action='create_department',
                    details=f"Departamento criado: {response.data.get('name')}",
                    ip_address=self.get_client_ip(request)
                )
                
                return response
                
        except Exception as e:
            logger.error(f"Erro ao criar departamento: {e}")
            return Response(
                {'error': 'Erro ao criar departamento'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        """Obter IP do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class PushNotificationViewSet(viewsets.ModelViewSet):
    """ViewSet para notificações push"""
    serializer_class = PushNotificationSerializer
    permission_classes = [IsAdminPermission]
    
    def get_queryset(self):
        return PushNotification.objects.all().select_related('sender', 'recipient')
    
    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                response = super().create(request, *args, **kwargs)
                
                # Log da ação
                recipient_info = "todos os usuários" if not request.data.get('recipient') else f"usuário ID {request.data.get('recipient')}"
                log_admin_action(
                    user=request.user,
                    action='send_notification',
                    details=f"Notificação enviada para {recipient_info}: {request.data.get('title')}",
                    ip_address=self.get_client_ip(request)
                )
                
                return response
                
        except Exception as e:
            logger.error(f"Erro ao enviar notificação: {e}")
            return Response(
                {'error': 'Erro ao enviar notificação'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        """Obter IP do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class AdminLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para logs administrativos (apenas leitura)"""
    serializer_class = AdminLogSerializer
    permission_classes = [IsAdminPermission]
    
    def get_queryset(self):
        user_profile = self.request.user.admin_profile
        
        if user_profile.is_superadmin():
            # Super admin vê todos os logs
            return AdminLog.objects.all().select_related('admin', 'target_user')
        elif user_profile.role == 'admin':
            # Admin vê apenas seus próprios logs e logs relacionados aos seus usuários
            managed_users = UserProfile.objects.filter(
                Q(department=user_profile.department) |
                Q(manager=user_profile)
            ).values_list('user_id', flat=True)
            
            return AdminLog.objects.filter(
                Q(admin=self.request.user) |
                Q(target_user__id__in=managed_users)
            ).select_related('admin', 'target_user')
        else:
            return AdminLog.objects.none()

class CreateSuperAdminView(APIView):
    """API para criar super administrador"""
    permission_classes = [IsSuperAdminPermission]
    
    def post(self, request):
        try:
            email = request.data.get('email', 'superadmin@salafacil.com')
            nome = request.data.get('nome', 'Super Administrador')
            
            with transaction.atomic():
                # Criar ou obter usuário Django
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email,
                        'first_name': nome.split()[0] if nome else 'Super',
                        'last_name': ' '.join(nome.split()[1:]) if len(nome.split()) > 1 else 'Admin',
                        'is_staff': True,
                        'is_superuser': True
                    }
                )
                
                # Criar ou atualizar perfil administrativo
                profile, profile_created = UserProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        'nome': nome,
                        'role': 'superadmin',
                        'status': 'active',
                        'created_by': request.user
                    }
                )
                
                if not profile_created:
                    profile.role = 'superadmin'
                    profile.status = 'active'
                    profile.save()
                
                # Log da ação
                log_admin_action(
                    user=request.user,
                    action='create_user',
                    target_user=user,
                    details=f"Super administrador criado: {nome} ({email})",
                    ip_address=self.get_client_ip(request)
                )
                
                return Response({
                    'success': True,
                    'message': 'Super administrador criado com sucesso',
                    'user': {
                        'id': profile.id,
                        'nome': profile.nome,
                        'email': user.email,
                        'role': profile.role,
                        'status': profile.status
                    }
                })
                
        except Exception as e:
            logger.error(f"Erro ao criar super admin: {e}")
            return Response(
                {'error': 'Erro ao criar super administrador'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def get_client_ip(self, request):
        """Obter IP do cliente"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
