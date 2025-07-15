from django.contrib import admin
from .models import Sala, Reserva, PerfilUsuario

@admin.register(Sala)
class SalaAdmin(admin.ModelAdmin):
    list_display = ['nome', 'capacidade', 'ativa', 'criado_em']
    list_filter = ['ativa', 'capacidade']
    search_fields = ['nome', 'recursos']
    ordering = ['nome']

@admin.register(Reserva)
class ReservaAdmin(admin.ModelAdmin):
    list_display = ['titulo', 'sala', 'usuario', 'data_inicio', 'data_fim', 'status']
    list_filter = ['status', 'sala', 'data_inicio']
    search_fields = ['titulo', 'usuario__username', 'sala__nome']
    ordering = ['-data_inicio']
    readonly_fields = ['criado_em', 'atualizado_em']

@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ['usuario', 'departamento', 'cargo', 'pode_gerenciar_salas']
    list_filter = ['departamento', 'pode_gerenciar_salas']
    search_fields = ['usuario__username', 'cargo']
