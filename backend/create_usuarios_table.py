"""
Script para criar tabela usuarios no banco Neon
"""
import psycopg2
import os
from decouple import config

def create_usuarios_table():
    """Criar tabela usuarios no banco Neon"""
    
    # Tentar obter DATABASE_URL do .env
    DATABASE_URL = config('DATABASE_URL', default=None)
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL não encontrada. Verifique o arquivo .env")
        return
    
    try:
        # Conectar ao banco
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        # SQL para criar tabela usuarios
        create_table_sql = """
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
        
        cursor.execute(create_table_sql)
        conn.commit()
        
        print("✅ Tabela 'usuarios' criada com sucesso!")
        
        # Inserir super admin na tabela usuarios
        insert_super_admin_sql = """
        INSERT INTO usuarios (nome, email, role, status, created_at)
        VALUES (%s, %s, %s, %s, NOW())
        ON CONFLICT (email) DO UPDATE SET
            nome = EXCLUDED.nome,
            role = EXCLUDED.role,
            status = EXCLUDED.status;
        """
        
        cursor.execute(insert_super_admin_sql, [
            'Super Administrador',
            'superadmin@salafacil.com',
            'superadmin',
            'active'
        ])
        conn.commit()
        
        print("✅ Super admin inserido na tabela usuarios!")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    create_usuarios_table()
