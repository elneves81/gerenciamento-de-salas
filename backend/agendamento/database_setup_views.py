"""
API para configuração inicial e sincronização com banco Neon
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.db import transaction, connection
from django.conf import settings
import psycopg2
import logging

logger = logging.getLogger(__name__)

class DatabaseSetupView(APIView):
    """API para configuração inicial do banco de dados"""
    
    def post(self, request):
        """Setup inicial do banco - criar tabelas e super admin"""
        try:
            # SQL para criar tabela usuarios se não existir
            create_usuarios_sql = """
            CREATE TABLE IF NOT EXISTS usuarios (
                id SERIAL PRIMARY KEY,
                nome VARCHAR(150) NOT NULL,
                email VARCHAR(254) UNIQUE NOT NULL,
                telefone VARCHAR(20),
                password_hash VARCHAR(128),
                role VARCHAR(20) DEFAULT 'user',
                status VARCHAR(20) DEFAULT 'active',
                department_id INTEGER,
                manager_id INTEGER,
                created_by INTEGER,
                blocked_at TIMESTAMP,
                last_login TIMESTAMP,
                google_id VARCHAR(100) UNIQUE,
                picture_url TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
            
            -- Índices
            CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
            CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
            CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
            CREATE INDEX IF NOT EXISTS idx_usuarios_google_id ON usuarios(google_id);
            
            -- Comentários
            COMMENT ON TABLE usuarios IS 'Tabela de usuários do sistema';
            COMMENT ON COLUMN usuarios.role IS 'Função: user, admin, superadmin';
            COMMENT ON COLUMN usuarios.status IS 'Status: active, blocked, inactive';
            """
            
            with connection.cursor() as cursor:
                cursor.execute(create_usuarios_sql)
            
            # Inserir super admin se não existir
            super_admin_sql = """
            INSERT INTO usuarios (nome, email, role, status, created_at)
            VALUES (%s, %s, %s, %s, NOW())
            ON CONFLICT (email) DO UPDATE SET
                nome = EXCLUDED.nome,
                role = EXCLUDED.role,
                status = EXCLUDED.status;
            """
            
            with connection.cursor() as cursor:
                cursor.execute(super_admin_sql, [
                    'Super Administrador',
                    'superadmin@salafacil.com',
                    'superadmin',
                    'active'
                ])
            
            return Response({
                'success': True,
                'message': 'Banco de dados configurado com sucesso',
                'setup_completed': True
            })
            
        except Exception as e:
            logger.error(f"Erro no setup do banco: {e}")
            return Response({
                'success': False,
                'error': str(e),
                'setup_completed': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get(self, request):
        """Verificar status do banco de dados"""
        try:
            # Verificar se tabela usuarios existe
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'usuarios'
                    );
                """)
                usuarios_table_exists = cursor.fetchone()[0]
                
                # Verificar se super admin existe
                cursor.execute("""
                    SELECT EXISTS (
                        SELECT FROM usuarios 
                        WHERE email = 'superadmin@salafacil.com' AND role = 'superadmin'
                    );
                """) if usuarios_table_exists else cursor.execute("SELECT false;")
                super_admin_exists = cursor.fetchone()[0] if usuarios_table_exists else False
                
                # Contar usuários
                cursor.execute("""
                    SELECT COUNT(*) FROM usuarios;
                """) if usuarios_table_exists else cursor.execute("SELECT 0;")
                user_count = cursor.fetchone()[0] if usuarios_table_exists else 0
            
            return Response({
                'database_ready': usuarios_table_exists,
                'super_admin_exists': super_admin_exists,
                'user_count': user_count,
                'setup_needed': not (usuarios_table_exists and super_admin_exists)
            })
            
        except Exception as e:
            logger.error(f"Erro ao verificar status do banco: {e}")
            return Response({
                'database_ready': False,
                'setup_needed': True,
                'error': str(e)
            })

class SyncUserToUsuariosView(APIView):
    """API para sincronizar usuário logado com tabela usuarios"""
    
    def post(self, request):
        """Sincronizar dados do usuário Google OAuth com tabela usuarios"""
        try:
            data = request.data
            email = data.get('email')
            nome = data.get('name', data.get('nome', ''))
            google_id = data.get('id', data.get('google_id', ''))
            picture_url = data.get('picture', data.get('picture_url', ''))
            
            if not email:
                return Response({
                    'success': False,
                    'error': 'Email é obrigatório'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Inserir ou atualizar na tabela usuarios
            sync_sql = """
            INSERT INTO usuarios (nome, email, google_id, picture_url, role, status, created_at, last_login)
            VALUES (%s, %s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET
                nome = EXCLUDED.nome,
                google_id = EXCLUDED.google_id,
                picture_url = EXCLUDED.picture_url,
                last_login = NOW()
            RETURNING id, nome, email, role, status;
            """
            
            with connection.cursor() as cursor:
                cursor.execute(sync_sql, [
                    nome,
                    email,
                    google_id,
                    picture_url,
                    'user',  # role padrão
                    'active'  # status padrão
                ])
                
                user_data = cursor.fetchone()
                
                return Response({
                    'success': True,
                    'user': {
                        'id': user_data[0],
                        'nome': user_data[1],
                        'email': user_data[2],
                        'role': user_data[3],
                        'status': user_data[4]
                    }
                })
                
        except Exception as e:
            logger.error(f"Erro ao sincronizar usuário: {e}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class CheckAdminStatusView(APIView):
    """API para verificar se usuário é administrador"""
    
    def post(self, request):
        """Verificar status administrativo do usuário"""
        try:
            email = request.data.get('email')
            
            if not email:
                return Response({
                    'is_admin': False,
                    'needs_setup': True
                })
            
            # Verificar na tabela usuarios
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT role, status FROM usuarios 
                    WHERE email = %s;
                """, [email])
                
                result = cursor.fetchone()
                
                if result:
                    role, status = result
                    is_admin = role in ['admin', 'superadmin']
                    is_active = status == 'active'
                    
                    return Response({
                        'is_admin': is_admin and is_active,
                        'role': role,
                        'status': status,
                        'needs_setup': False
                    })
                else:
                    return Response({
                        'is_admin': False,
                        'needs_setup': True
                    })
                    
        except Exception as e:
            logger.error(f"Erro ao verificar admin status: {e}")
            return Response({
                'is_admin': False,
                'needs_setup': True,
                'error': str(e)
            })
