#!/usr/bin/env python3
"""
Script para testar conexão com Neon Database
"""
import os
import sys
import django
from pathlib import Path

# Adicionar o diretório do projeto ao path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.db import connections
from django.core.management import execute_from_command_line

def test_neon_connection():
    """Testa a conexão com o banco Neon"""
    print("🐘 Testando conexão com Neon Database...")
    
    try:
        # Testar conexão
        db_conn = connections['default']
        cursor = db_conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        
        print(f"✅ Conexão bem-sucedida!")
        print(f"📊 PostgreSQL Version: {version}")
        
        # Testar se as tabelas existem
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_type = 'BASE TABLE';
        """)
        
        tables = cursor.fetchall()
        print(f"📋 Tabelas encontradas: {len(tables)}")
        
        if len(tables) == 0:
            print("⚠️  Nenhuma tabela encontrada. Execute as migrations:")
            print("   python manage.py migrate")
        else:
            for table in tables:
                print(f"   - {table[0]}")
                
        cursor.close()
        return True
        
    except Exception as e:
        print(f"❌ Erro na conexão: {e}")
        print("\n🔧 Verifique:")
        print("1. DATABASE_URL está configurada corretamente")
        print("2. Connection string inclui ?sslmode=require")
        print("3. Neon database está ativo")
        return False

def run_migrations():
    """Executa as migrations"""
    print("\n🔄 Executando migrations...")
    try:
        execute_from_command_line(['manage.py', 'migrate'])
        print("✅ Migrations executadas com sucesso!")
        return True
    except Exception as e:
        print(f"❌ Erro nas migrations: {e}")
        return False

def create_superuser():
    """Cria o superuser admin"""
    print("\n👤 Criando superuser...")
    try:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@admin.com', 'admin123')
            print("✅ Superuser 'admin' criado com sucesso!")
            print("   Login: admin")
            print("   Senha: admin123")
        else:
            print("ℹ️  Superuser 'admin' já existe")
        return True
    except Exception as e:
        print(f"❌ Erro ao criar superuser: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Configuração Neon Database - SalaFácil\n")
    
    # Testar conexão
    if test_neon_connection():
        
        # Executar migrations
        if run_migrations():
            
            # Criar superuser
            create_superuser()
            
            print("\n🎉 Configuração concluída!")
            print("🌐 Seu app está pronto para uso!")
        
    else:
        print("\n❌ Falha na configuração. Verifique as configurações do Neon.")
        sys.exit(1)
