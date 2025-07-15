from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Sala, Reserva, PerfilUsuario

class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class PerfilUsuarioSerializer(serializers.ModelSerializer):
    usuario = UsuarioSerializer(read_only=True)
    
    class Meta:
        model = PerfilUsuario
        fields = '__all__'

class SalaSerializer(serializers.ModelSerializer):
    reservas_ativas = serializers.SerializerMethodField()
    
    class Meta:
        model = Sala
        fields = '__all__'
    
    def get_reservas_ativas(self, obj):
        from datetime import datetime
        reservas = obj.reservas.filter(
            status__in=['agendada', 'em_andamento'],
            data_fim__gte=datetime.now()
        ).count()
        return reservas

class ReservaSerializer(serializers.ModelSerializer):
    sala_nome = serializers.CharField(source='sala.nome', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.get_full_name', read_only=True)
    
    class Meta:
        model = Reserva
        fields = '__all__'
        read_only_fields = ['usuario', 'criado_em', 'atualizado_em']
    
    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)

class ReservaCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reserva
        fields = ['sala', 'titulo', 'descricao', 'data_inicio', 'data_fim', 'participantes']
    
    def create(self, validated_data):
        validated_data['usuario'] = self.context['request'].user
        return super().create(validated_data)
