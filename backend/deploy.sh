#!/bin/bash

# Script de deploy para Railway/Render
echo "🚀 Iniciando deploy do backend..."

# Coletar arquivos estáticos
python manage.py collectstatic --noinput

# Aplicar migrações
python manage.py migrate

# Criar superuser se não existir
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@admin.com', 'admin123')
    print('Superuser criado: admin/admin123')
else:
    print('Superuser já existe')
"

echo "✅ Deploy do backend concluído!"
