#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from agendamento.models import Sala

# Criar salas de exemplo
salas = [
    {
        'nome': 'Sala de Reunião A', 
        'capacidade': 12, 
        'recursos': 'Projetor, TV, Lousa, Mesa de reunião - Andar 1',
        'ativa': True
    },
    {
        'nome': 'Sala de Reunião B', 
        'capacidade': 8, 
        'recursos': 'TV, Lousa, Mesa redonda - Andar 2',
        'ativa': True  
    },
    {
        'nome': 'Auditório', 
        'capacidade': 50, 
        'recursos': 'Projetor, Sistema de som, Microfone, Palco - Térreo',
        'ativa': True
    },
    {
        'nome': 'Sala de Videoconferência', 
        'capacidade': 6, 
        'recursos': 'Sistema de videoconferência, TV 4K, Microfone - Andar 3',
        'ativa': True
    },
    {
        'nome': 'Lab de Informática', 
        'capacidade': 20, 
        'recursos': 'Computadores, Projetor, Lousa digital - Andar 2',
        'ativa': True
    },
]

print("Criando salas de exemplo...")

for sala_data in salas:
    sala, created = Sala.objects.get_or_create(
        nome=sala_data['nome'],
        defaults=sala_data
    )
    if created:
        print(f'✅ Sala criada: {sala.nome}')
    else:
        print(f'ℹ️  Sala já existe: {sala.nome}')

print(f'\n🎯 Total de salas: {Sala.objects.count()}')
print("✅ Dados de exemplo criados com sucesso!")
