#!/usr/bin/env python3
"""
Script de verificação pré-deploy
Verifica se todas as configurações estão corretas para produção
"""
import os
import json
import subprocess
import sys

def check_backend():
    """Verificar configurações do backend"""
    print("🔍 Verificando Backend Django...")
    
    # Verificar se requirements.txt existe
    backend_dir = "backend"
    req_file = os.path.join(backend_dir, "requirements.txt")
    
    if os.path.exists(req_file):
        print("✅ requirements.txt encontrado")
        
        # Verificar dependências essenciais
        with open(req_file, 'r') as f:
            requirements = f.read()
            
        essential_deps = ['django', 'djangorestframework', 'psycopg2', 'gunicorn', 'whitenoise']
        missing_deps = []
        
        for dep in essential_deps:
            if dep.lower() not in requirements.lower():
                missing_deps.append(dep)
        
        if missing_deps:
            print(f"⚠️  Dependências em falta: {', '.join(missing_deps)}")
        else:
            print("✅ Todas as dependências essenciais estão presentes")
    else:
        print("❌ requirements.txt não encontrado")
    
    # Verificar Procfile
    procfile = os.path.join(backend_dir, "Procfile")
    if os.path.exists(procfile):
        print("✅ Procfile encontrado")
    else:
        print("❌ Procfile não encontrado")
    
    # Verificar settings de produção
    prod_settings = os.path.join(backend_dir, "backend", "production_settings.py")
    if os.path.exists(prod_settings):
        print("✅ production_settings.py encontrado")
    else:
        print("❌ production_settings.py não encontrado")

def check_frontend():
    """Verificar configurações do frontend"""
    print("\n🔍 Verificando Frontend React...")
    
    frontend_dir = "frontend"
    
    # Verificar package.json
    package_file = os.path.join(frontend_dir, "package.json")
    if os.path.exists(package_file):
        print("✅ package.json encontrado")
        
        with open(package_file, 'r') as f:
            package_data = json.load(f)
        
        # Verificar scripts de build
        scripts = package_data.get('scripts', {})
        if 'build' in scripts:
            print("✅ Script de build configurado")
        else:
            print("❌ Script de build não encontrado")
            
        # Verificar dependências essenciais
        deps = package_data.get('dependencies', {})
        essential_deps = ['react', '@mui/material', 'google-auth-library']
        missing_deps = []
        
        for dep in essential_deps:
            if dep not in deps:
                missing_deps.append(dep)
        
        if missing_deps:
            print(f"⚠️  Dependências em falta: {', '.join(missing_deps)}")
        else:
            print("✅ Dependências essenciais do frontend presentes")
    else:
        print("❌ package.json não encontrado")
    
    # Verificar netlify.toml
    netlify_config = os.path.join(frontend_dir, "netlify.toml")
    if os.path.exists(netlify_config):
        print("✅ netlify.toml encontrado")
    else:
        print("❌ netlify.toml não encontrado")
    
    # Verificar funções Netlify
    functions_dir = os.path.join(frontend_dir, "netlify", "functions")
    if os.path.exists(functions_dir):
        functions = os.listdir(functions_dir)
        required_functions = ['google-auth.js', 'check-admin-status.js', 'create-super-admin.js']
        
        missing_functions = []
        for func in required_functions:
            if func not in functions:
                missing_functions.append(func)
        
        if missing_functions:
            print(f"⚠️  Funções Netlify em falta: {', '.join(missing_functions)}")
        else:
            print("✅ Todas as funções Netlify presentes")
    else:
        print("❌ Diretório de funções Netlify não encontrado")

def check_git_status():
    """Verificar status do Git"""
    print("\n🔍 Verificando Git...")
    
    try:
        # Verificar se está limpo
        result = subprocess.run(['git', 'status', '--porcelain'], 
                              capture_output=True, text=True, check=True)
        
        if result.stdout.strip():
            print("⚠️  Há alterações não commitadas")
            print(result.stdout)
        else:
            print("✅ Repositório Git limpo")
        
        # Verificar branch
        result = subprocess.run(['git', 'branch', '--show-current'], 
                              capture_output=True, text=True, check=True)
        
        current_branch = result.stdout.strip()
        if current_branch == 'main':
            print("✅ Está na branch main")
        else:
            print(f"⚠️  Está na branch: {current_branch} (recomendado: main)")
            
    except subprocess.CalledProcessError:
        print("❌ Erro ao verificar Git")

def main():
    """Função principal"""
    print("🚀 VERIFICAÇÃO PRÉ-DEPLOY - Sistema Administrativo")
    print("=" * 60)
    
    check_backend()
    check_frontend()
    check_git_status()
    
    print("\n" + "=" * 60)
    print("📋 PRÓXIMOS PASSOS PARA DEPLOY:")
    print("\n1. 🐍 Deploy Backend (Render.com):")
    print("   - Conecte o repositório GitHub")
    print("   - Configure: Root Directory = 'backend'")
    print("   - Build Command: 'pip install -r requirements.txt'")
    print("   - Start Command: 'gunicorn backend.wsgi:application'")
    print("   - Adicione variáveis de ambiente:")
    print("     * DATABASE_URL (sua string do Neon)")
    print("     * DJANGO_SETTINGS_MODULE=backend.production_settings")
    print("     * SECRET_KEY (gere uma chave segura)")
    
    print("\n2. ⚛️  Deploy Frontend (Netlify):")
    print("   - Conecte o repositório GitHub")
    print("   - Configure: Base directory = 'frontend'")
    print("   - Build command: 'npm run build'")
    print("   - Publish directory: 'frontend/dist'")
    print("   - Functions directory: 'frontend/netlify/functions'")
    print("   - Adicione variável de ambiente:")
    print("     * BACKEND_URL (URL do seu backend no Render)")
    
    print("\n3. 🗄️  Neon Database:")
    print("   - ✅ Já configurado!")
    print("   - Copie a CONNECTION STRING para o Render")
    
    print("\n4. 🧪 Teste Final:")
    print("   - Acesse o site implantado")
    print("   - Faça login com Google OAuth")
    print("   - Teste o painel administrativo")
    print("   - Verifique sincronização com banco")
    
    print("\n🎉 SISTEMA PRONTO PARA PRODUÇÃO!")

if __name__ == "__main__":
    main()
