from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from datetime import datetime, timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Sala, Reserva, PerfilUsuario
from .serializers import (
    SalaSerializer, ReservaSerializer, ReservaCreateSerializer, 
    UsuarioSerializer, PerfilUsuarioSerializer
)
# Importar modelos de notificação
from chat.models import Notification

class AuthView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        identifier = request.data.get('email') or request.data.get('username')
        password = request.data.get('password')

        if not identifier or not password:
            return Response({
                'error': 'Email/Username e password são obrigatórios'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Tenta autenticar por username
        user = authenticate(username=identifier, password=password)

        # Se falhar, tenta autenticar por email
        if not user:
            try:
                # Pega apenas o primeiro usuário com esse email (para lidar com duplicatas)
                user_obj = User.objects.filter(email__iexact=identifier).first()
                if user_obj:
                    user = authenticate(username=user_obj.username, password=password)
            except Exception:
                user = None

        if user:
            refresh = RefreshToken.for_user(user)
            perfil, created = PerfilUsuario.objects.get_or_create(usuario=user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': user.is_staff,
                }
            })
        else:
            return Response({
                'error': 'Credenciais inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        user = request.user
        perfil, created = PerfilUsuario.objects.get_or_create(usuario=user)
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_staff': user.is_staff,
            'perfil': PerfilUsuarioSerializer(perfil).data
        })

class SalaViewSet(viewsets.ModelViewSet):
    queryset = Sala.objects.all()
    serializer_class = SalaSerializer
    permission_classes = [permissions.AllowAny]  # Temporário para debug
    
    def get_queryset(self):
        # Para listagem/gerenciamento, mostrar todas as salas
        # Para busca de disponibilidade, filtrar apenas ativas
        if self.action in ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy']:
            return Sala.objects.all()
        return Sala.objects.filter(ativa=True)
    
    def create(self, request, *args, **kwargs):
        """Criar sala e enviar notificação"""
        response = super().create(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_201_CREATED:
            sala = Sala.objects.get(id=response.data['id'])
            self._create_notification(
                request.user,
                f"Sala '{sala.nome}' criada com sucesso",
                f"A sala {sala.nome} (Capacidade: {sala.capacidade}) foi criada com sucesso.",
                'system',
                'medium'
            )
        
        return response
    
    def update(self, request, *args, **kwargs):
        """Atualizar sala e enviar notificação"""
        sala_anterior = self.get_object()
        nome_anterior = sala_anterior.nome
        
        response = super().update(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_200_OK:
            sala_atualizada = self.get_object()
            self._create_notification(
                request.user,
                f"Sala '{sala_atualizada.nome}' atualizada",
                f"A sala {nome_anterior} foi atualizada com sucesso.",
                'system',
                'medium'
            )
        
        return response
    
    def destroy(self, request, *args, **kwargs):
        """Excluir sala e enviar notificação"""
        sala = self.get_object()
        nome_sala = sala.nome
        
        response = super().destroy(request, *args, **kwargs)
        
        if response.status_code == status.HTTP_204_NO_CONTENT:
            self._create_notification(
                request.user,
                f"Sala '{nome_sala}' excluída",
                f"A sala {nome_sala} foi excluída com sucesso do sistema.",
                'warning',
                'medium'
            )
        
        return response
    
    def _create_notification(self, user, title, message, notification_type, priority):
        """Método auxiliar para criar notificações"""
        try:
            # Se não há usuário autenticado, criar notificação para o admin (ID 1)
            if not user or not user.is_authenticated:
                admin_user = User.objects.filter(is_superuser=True).first()
                if admin_user:
                    user = admin_user
                else:
                    print("Nenhum usuário admin encontrado para notificação")
                    return
            
            Notification.objects.create(
                recipient=user,
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority
            )
            print(f"✅ Notificação criada: {title} para {user.username}")
        except Exception as e:
            print(f"❌ Erro ao criar notificação: {e}")
    
    @action(detail=True, methods=['get'])
    def agenda(self, request, pk=None):
        """Retorna a agenda de uma sala específica"""
        sala = self.get_object()
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        
        if not data_inicio:
            data_inicio = datetime.now()
        if not data_fim:
            data_fim = datetime.now() + timedelta(days=7)
        
        reservas = Reserva.objects.filter(
            sala=sala,
            data_inicio__gte=data_inicio,
            data_fim__lte=data_fim,
            status__in=['agendada', 'em_andamento']
        )
        
        serializer = ReservaSerializer(reservas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def disponiveis(self, request):
        """Retorna salas disponíveis em um horário específico"""
        data_inicio = request.query_params.get('data_inicio')
        data_fim = request.query_params.get('data_fim')
        capacidade_min = request.query_params.get('capacidade_min', 1)
        
        if not data_inicio or not data_fim:
            return Response({'error': 'data_inicio e data_fim são obrigatórios'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Salas com conflito no horário
        salas_ocupadas = Reserva.objects.filter(
            data_inicio__lt=data_fim,
            data_fim__gt=data_inicio,
            status__in=['agendada', 'em_andamento']
        ).values_list('sala_id', flat=True)
        
        # Salas disponíveis
        salas_disponiveis = Sala.objects.filter(
            ativa=True,
            capacidade__gte=capacidade_min
        ).exclude(id__in=salas_ocupadas)
        
        serializer = SalaSerializer(salas_disponiveis, many=True)
        return Response(serializer.data)

class ReservaViewSet(viewsets.ModelViewSet):
    serializer_class = ReservaSerializer
    permission_classes = [permissions.AllowAny]  # Temporário para debug
    
    def get_queryset(self):
        user = self.request.user
        queryset = Reserva.objects.all()
        
        # Filtros
        sala_id = self.request.query_params.get('sala')
        data_inicio = self.request.query_params.get('data_inicio')
        data_fim = self.request.query_params.get('data_fim')
        minhas_reservas = self.request.query_params.get('minhas')
        
        if sala_id:
            queryset = queryset.filter(sala_id=sala_id)
        
        if data_inicio:
            queryset = queryset.filter(data_inicio__gte=data_inicio)
        
        if data_fim:
            queryset = queryset.filter(data_fim__lte=data_fim)
        
        if minhas_reservas == 'true':
            queryset = queryset.filter(usuario=user)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReservaCreateSerializer
        return ReservaSerializer
    
    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancela uma reserva"""
        reserva = self.get_object()
        
        # Verificar se o usuário pode cancelar
        if reserva.usuario != request.user and not request.user.is_staff:
            return Response({'error': 'Sem permissão para cancelar esta reserva'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        reserva.status = 'cancelada'
        reserva.save()
        
        serializer = ReservaSerializer(reserva)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Retorna dados para o dashboard"""
        user = request.user
        hoje = datetime.now().date()
        
        # Estatísticas
        minhas_reservas_hoje = Reserva.objects.filter(
            usuario=user,
            data_inicio__date=hoje,
            status__in=['agendada', 'em_andamento']
        ).count()
        
        total_salas = Sala.objects.filter(ativa=True).count()
        
        salas_ocupadas_agora = Reserva.objects.filter(
            data_inicio__lte=datetime.now(),
            data_fim__gte=datetime.now(),
            status='em_andamento'
        ).count()
        
        proximas_reservas = Reserva.objects.filter(
            usuario=user,
            data_inicio__gte=datetime.now(),
            status='agendada'
        ).order_by('data_inicio')[:5]
        
        return Response({
            'minhas_reservas_hoje': minhas_reservas_hoje,
            'total_salas': total_salas,
            'salas_ocupadas_agora': salas_ocupadas_agora,
            'salas_disponiveis_agora': total_salas - salas_ocupadas_agora,
            'proximas_reservas': ReservaSerializer(proximas_reservas, many=True).data
        })

class UsuarioViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.IsAuthenticated]
