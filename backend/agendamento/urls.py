from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'salas', views.SalaViewSet)
router.register(r'reservas', views.ReservaViewSet, basename='reserva')
router.register(r'usuarios', views.UsuarioViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', views.AuthView.as_view(), name='auth_login'),
    path('auth/user/', views.UserProfileView.as_view(), name='user_profile'),
    
    # URLs do sistema administrativo
    path('', include('agendamento.admin_urls')),
]
