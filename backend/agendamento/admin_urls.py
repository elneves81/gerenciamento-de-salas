"""
URLs para o Sistema Administrativo
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    UserProfileViewSet, DepartmentViewSet, PushNotificationViewSet,
    AdminLogViewSet, AdminStatsView, CreateSuperAdminView
)
from .database_setup_views import (
    DatabaseSetupView, SyncUserToUsuariosView, CheckAdminStatusView
)

# Router para ViewSets
admin_router = DefaultRouter()
admin_router.register(r'users', UserProfileViewSet, basename='admin-users')
admin_router.register(r'departments', DepartmentViewSet, basename='admin-departments')
admin_router.register(r'notifications', PushNotificationViewSet, basename='admin-notifications')
admin_router.register(r'logs', AdminLogViewSet, basename='admin-logs')

urlpatterns = [
    # APIs do sistema administrativo
    path('admin/', include(admin_router.urls)),
    
    # APIs específicas
    path('admin/stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('admin/create-super-admin/', CreateSuperAdminView.as_view(), name='create-super-admin'),
    
    # APIs de configuração do banco
    path('database/setup/', DatabaseSetupView.as_view(), name='database-setup'),
    path('database/sync-user/', SyncUserToUsuariosView.as_view(), name='sync-user'),
    path('database/check-admin/', CheckAdminStatusView.as_view(), name='check-admin'),
]
