from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from datetime import datetime

class Sala(models.Model):
    nome = models.CharField(max_length=100, unique=True)
    capacidade = models.PositiveIntegerField()
    descricao = models.TextField(blank=True, help_text="Descrição da sala")
    recursos = models.TextField(blank=True, help_text="Ex: Projetor, TV, Lousa")
    localizacao = models.CharField(max_length=200, blank=True, help_text="Ex: 1º Andar, Ala A")
    ativa = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Sala"
        verbose_name_plural = "Salas"
        ordering = ['nome']
    
    def __str__(self):
        return f"{self.nome} (Cap: {self.capacidade})"

class Reserva(models.Model):
    STATUS_CHOICES = [
        ('agendada', 'Agendada'),
        ('em_andamento', 'Em Andamento'),
        ('concluida', 'Concluída'),
        ('cancelada', 'Cancelada'),
    ]
    
    sala = models.ForeignKey(Sala, on_delete=models.CASCADE, related_name='reservas')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reservas')
    titulo = models.CharField(max_length=200)
    descricao = models.TextField(blank=True)
    data_inicio = models.DateTimeField()
    data_fim = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='agendada')
    participantes = models.PositiveIntegerField(default=1)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Reserva"
        verbose_name_plural = "Reservas"
        ordering = ['-data_inicio']
    
    def clean(self):
        if self.data_inicio >= self.data_fim:
            raise ValidationError("Data de início deve ser anterior à data de fim.")
        
        if self.participantes > self.sala.capacidade:
            raise ValidationError(f"Número de participantes ({self.participantes}) excede a capacidade da sala ({self.sala.capacidade}).")
        
        # Verificar conflitos de horário
        conflitos = Reserva.objects.filter(
            sala=self.sala,
            status__in=['agendada', 'em_andamento']
        ).exclude(pk=self.pk)
        
        for reserva in conflitos:
            if (self.data_inicio < reserva.data_fim and self.data_fim > reserva.data_inicio):
                raise ValidationError(f"Conflito de horário com a reserva: {reserva.titulo}")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.titulo} - {self.sala.nome} ({self.data_inicio.strftime('%d/%m/%Y %H:%M')})"

class PerfilUsuario(models.Model):
    DEPARTAMENTOS = [
        ('ti', 'Tecnologia da Informação'),
        ('rh', 'Recursos Humanos'),
        ('financeiro', 'Financeiro'),
        ('vendas', 'Vendas'),
        ('marketing', 'Marketing'),
        ('operacoes', 'Operações'),
        ('juridico', 'Jurídico'),
        ('diretoria', 'Diretoria'),
    ]
    
    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name='perfil')
    departamento = models.CharField(max_length=20, choices=DEPARTAMENTOS, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    cargo = models.CharField(max_length=100, blank=True)
    pode_gerenciar_salas = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Perfil de Usuário"
        verbose_name_plural = "Perfis de Usuários"
    
    def __str__(self):
        return f"Perfil de {self.usuario.get_full_name() or self.usuario.username}"
