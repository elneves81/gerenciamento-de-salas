# 🏢 SalaFácil - Sistema de Agendamento de Salas

<div align="center">

![SalaFácil Logo](https://img.shields.io/badge/SalaFácil-v2.0.0-blue?style=for-the-badge&logo=react)

[![Django](https://img.shields.io/badge/Django-4.2+-green?style=flat-square&logo=django)](https://djangoproject.com/)
[![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-orange?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Material UI](https://img.shields.io/badge/Material--UI-5+-purple?style=flat-square&logo=mui)](https://mui.com/)

**Sistema profissional e completo para gerenciamento de salas de reunião com interface moderna e funcionalidades avançadas.**

[🚀 Demo](#demonstração) • [📖 Documentação](#documentação) • [⚡ Instalação](#instalação-rápida) • [🛠️ Desenvolvimento](#desenvolvimento)

</div>

## 🎬 Prévia do Sistema

<div align="center">

### 📱 **Interface Principal - Dashboard Premium**
```
┌─────────────────────────────────────────────────────────────────┐
│  🏢 SalaFácil - Gestão de Salas          🔄 🔔 ⚙️ 🌓 👤      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 ESTATÍSTICAS                                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │ 12 Salas│ │ 3 Hoje  │ │ 8 Ativas│ │ 5 Próx. │              │
│  │ Total   │ │ Minhas  │ │ Em Uso  │ │ Reservas│              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
│                                                                 │
│  📅 PRÓXIMAS RESERVAS          🏢 AÇÕES RÁPIDAS               │
│  ┌─────────────────────────┐   ┌─────────────────────────┐     │
│  │ • Reunião Diretoria     │   │ ➕ Nova Reserva          │     │
│  │   Sala A - 14:00        │   │ 📅 Ver Agenda           │     │
│  │ • Workshop Tech         │   │ 🏢 Ver Salas            │     │
│  │   Lab B - 15:30         │   │ 📊 Relatórios           │     │
│  │ • Call Cliente          │   └─────────────────────────┘     │
│  │   Sala C - 16:00        │                                   │
│  └─────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 🎨 **Modo Claro vs Escuro**

| 🌞 **Modo Claro** | 🌙 **Modo Escuro** |
|:---:|:---:|
| ![Light Mode](https://img.shields.io/badge/Tema-Claro-blue?style=for-the-badge&logo=sun) | ![Dark Mode](https://img.shields.io/badge/Tema-Escuro-gray?style=for-the-badge&logo=moon) |
| Interface clean e moderna | Visual confortável para uso noturno |
| Cores vibrantes e profissionais | Redução do cansaço visual |

### 📊 **Fluxo de Trabalho**

```mermaid
flowchart LR
    A[👤 Login] --> B[📊 Dashboard]
    B --> C[🏢 Ver Salas]
    B --> D[📅 Nova Reserva]
    C --> E[✅ Disponível?]
    E -->|Sim| F[📝 Agendar]
    E -->|Não| G[⏰ Ver Horários]
    D --> H[🔍 Buscar Sala]
    H --> I[📋 Preencher Dados]
    I --> J[💾 Confirmar]
    F --> K[🔔 Notificação]
    J --> K
    K --> L[✨ Reserva Criada]
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style L fill:#e8f5e8
```

</div>

---

## 🌟 Características Principais

### 🎯 **Funcionalidades Core**
- ✅ **Gestão Completa de Salas** - Cadastro, edição e controle de capacidade
- ✅ **Agendamento Inteligente** - Sistema anti-conflito com validação em tempo real
- ✅ **Dashboard Premium** - Visualização avançada com métricas e analytics
- ✅ **Autenticação JWT** - Sistema seguro de login e controle de acesso
- ✅ **Modo Claro/Escuro** - Interface adaptável com persistência de preferências
- ✅ **Notificações em Tempo Real** - Sistema completo de alertas e lembretes
- ✅ **Relatórios Avançados** - Analytics detalhados de ocupação e uso

### 🎨 **Interface e UX**
- 🎭 **Design Material UI** - Interface moderna e responsiva
- 🌓 **Tema Dual** - Modo claro e escuro com transições suaves
- 📱 **Responsivo** - Otimizado para desktop, tablet e mobile
- ⚡ **Performance** - Carregamento rápido com lazy loading
- 🔔 **Feedback Visual** - Snackbars, tooltips e animações

### 🔧 **Tecnologias**
- **Backend**: Django REST Framework 4.2+ | PostgreSQL 15+
- **Frontend**: React 18 | Vite | Material-UI 5
- **Autenticação**: JWT (JSON Web Tokens)
- **Deploy**: Docker Ready | CI/CD Compatible
- **Qualidade**: ESLint | Prettier | Type Safety

---

## 🏗️ Arquitetura do Sistema

<div align="center">

### 🔧 **Stack Tecnológico**

<table>
<tr>
<td align="center" width="33%">

**🎨 Frontend**
<br/>
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
<br/>
<img src="https://img.shields.io/badge/Material--UI-0081CB?style=for-the-badge&logo=material-ui&logoColor=white" />
<br/>
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />

</td>
<td align="center" width="33%">

**⚙️ Backend**
<br/>
<img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" />
<br/>
<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
<br/>
<img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" />

</td>
<td align="center" width="33%">

**🚀 DevOps**
<br/>
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
<br/>
<img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" />
<br/>
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />

</td>
</tr>
</table>

### 🏗️ **Diagrama de Arquitetura**

</div>

```mermaid
graph TB
    A[React Frontend] --> B[Django REST API]
    B --> C[PostgreSQL Database]
    B --> D[JWT Authentication]
    A --> E[Material-UI Components]
    A --> F[Local Storage]
    
    subgraph "Frontend Features"
        E --> G[Dashboard Premium]
        E --> H[Dark/Light Mode]
        E --> I[Real-time Updates]
    end
    
    subgraph "Backend Features"
        B --> J[Room Management]
        B --> K[Booking System]
        B --> L[User Management]
    end
```

<div align="center">

### 🎯 **Fluxo de Dados**

```
👤 Usuário
    ↓
🎨 React Frontend (Port 5173)
    ↓ HTTP/JSON
⚙️ Django REST API (Port 8000)
    ↓ SQL
🗄️ PostgreSQL Database (Port 5432)
```

</div>

## 📁 Estrutura do Projeto

```
📦 salafacil/
├── 🔧 backend/                 # Django REST Framework API
│   ├── 🏢 salas/              # App de gerenciamento de salas
│   ├── 📅 reservas/           # App de reservas e agendamentos
│   ├── 👤 authentication/     # Sistema de autenticação
│   ├── ⚙️ config/            # Configurações do Django
│   └── 📊 requirements.txt    # Dependências Python
├── 🎨 frontend/               # React Application
│   ├── 📱 src/
│   │   ├── 🧩 components/     # Componentes reutilizáveis
│   │   ├── 📄 pages/          # Páginas da aplicação
│   │   ├── 🎯 contexts/       # Context API (Auth, Theme)
│   │   ├── 🔌 services/       # API calls e utilitários
│   │   └── 🎨 styles/         # CSS e temas
│   ├── 📦 package.json        # Dependências Node.js
│   └── ⚡ vite.config.js      # Configuração Vite
├── 🐳 docker-compose.yml      # Container orchestration
├── 📖 docs/                   # Documentação detalhada
└── 📝 README.md              # Este arquivo
```

---

## ⚡ Instalação Rápida

### 🔄 Pré-requisitos
- Python 3.9+
- Node.js 16+
- PostgreSQL 15+ (ou Docker)
- Git

### 🚀 Método 1: Instalação Local

#### 1️⃣ **Clone do Repositório**
```bash
git clone https://github.com/elneves81/gerenciamento-de-salas.git
cd gerenciamento-de-salas
```

#### 2️⃣ **Setup do Backend**
```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar banco de dados
python manage.py migrate
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

#### 3️⃣ **Setup do Frontend**
```bash
cd ../frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### 🐳 Método 2: Docker (Recomendado)

```bash
# Clone e acesse o projeto
git clone https://github.com/elneves81/gerenciamento-de-salas.git
cd gerenciamento-de-salas

# Iniciar com Docker Compose
docker-compose up -d

# Acessar logs
docker-compose logs -f
```

---

## 🎯 URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| 🎨 **Frontend** | http://localhost:5173 | Interface principal do usuário |
| 🔧 **Backend API** | http://localhost:8000 | API REST Django |
| ⚙️ **Admin Django** | http://localhost:8000/admin | Painel administrativo |
| 📖 **API Docs** | http://localhost:8000/api/docs | Documentação da API |
| 🐳 **PostgreSQL** | localhost:5432 | Banco de dados |

---

## 🎮 Demonstração

### 📱 **Interface Principal**
- Dashboard premium com métricas em tempo real
- Sistema de notificações integrado
- Modo claro/escuro com persistência
- Responsivo para todos os dispositivos

### 🏢 **Gestão de Salas**
- Cadastro completo com capacidade e recursos
- Status em tempo real (disponível/ocupada)
- Filtros e busca avançada

### 📅 **Sistema de Reservas**
- Calendário interativo
- Prevenção automática de conflitos
- Notificações de lembretes
- Relatórios de uso

---

## 🛠️ Desenvolvimento

### 📊 **Scripts Disponíveis**

#### Backend (Django)
```bash
# Desenvolvimento
python manage.py runserver --settings=config.settings.development

# Testes
python manage.py test

# Migrações
python manage.py makemigrations
python manage.py migrate

# Coleta de arquivos estáticos
python manage.py collectstatic
```

#### Frontend (React)
```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview da build
npm run preview

# Linting
npm run lint

# Formatação
npm run format
```

### 🔧 **Configuração de Ambiente**

#### Backend `.env`
```env
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://user:password@localhost:5432/salafacil
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

#### Frontend `.env`
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=SalaFácil
VITE_APP_VERSION=2.0.0
```

---

## 📊 API Endpoints

### 🔐 **Autenticação**
```http
POST /api/auth/login/          # Login
POST /api/auth/logout/         # Logout
POST /api/auth/refresh/        # Refresh token
GET  /api/auth/user/           # Dados do usuário
```

### 🏢 **Salas**
```http
GET    /api/salas/             # Listar salas
POST   /api/salas/             # Criar sala
GET    /api/salas/{id}/        # Detalhes da sala
PUT    /api/salas/{id}/        # Atualizar sala
DELETE /api/salas/{id}/        # Deletar sala
```

### 📅 **Reservas**
```http
GET    /api/reservas/          # Listar reservas
POST   /api/reservas/          # Criar reserva
GET    /api/reservas/{id}/     # Detalhes da reserva
PUT    /api/reservas/{id}/     # Atualizar reserva
DELETE /api/reservas/{id}/     # Cancelar reserva
GET    /api/reservas/dashboard/ # Dados do dashboard
```

---

## 🚀 Deploy e Produção

### 🌐 **Deploy com Docker**
```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Deploy em produção
docker-compose -f docker-compose.prod.yml up -d

# Logs de produção
docker-compose -f docker-compose.prod.yml logs -f
```

### ☁️ **Deploy em Cloud**
- **AWS**: ECS + RDS + S3
- **Google Cloud**: Cloud Run + Cloud SQL
- **Azure**: Container Instances + Database
- **Heroku**: Ready to deploy

---

## 🤝 Contribuição

### 🔄 **Workflow de Contribuição**
1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### 📋 **Padrões de Código**
- **Python**: PEP 8 + Black formatter
- **JavaScript**: ESLint + Prettier
- **Git**: Conventional Commits
- **Testes**: Coverage mínimo de 80%

---

## 📈 Roadmap

- [ ] 📱 **App Mobile** (React Native)
- [ ] 🔔 **Notificações Push** (PWA)
- [ ] 📊 **Analytics Avançados** (Chart.js)
- [ ] 🌍 **Internacionalização** (i18n)
- [ ] 🔗 **Integração Calendário** (Google Calendar)
- [ ] 🤖 **AI Recomendações** (TensorFlow)

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

<div align="center">

![ELN Soluções](https://img.shields.io/badge/Desenvolvido%20por-ELN--SOLUÇÕES-blue?style=for-the-badge&logo=github&logoColor=white)

**💼 ELN-SOLUÇÕES** | [elneves81](https://github.com/elneves81)

*Soluções tecnológicas inovadoras para empresas modernas*

[![Portfolio](https://img.shields.io/badge/Portfolio-000000?style=flat-square&logo=About.me&logoColor=white)](https://github.com/elneves81)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/elneves81)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat-square&logo=github&logoColor=white)](https://github.com/elneves81)

---

**⭐ Se este projeto foi útil, considere dar uma estrela!**

[![GitHub stars](https://img.shields.io/github/stars/elneves81/gerenciamento-de-salas?style=social)](https://github.com/elneves81/gerenciamento-de-salas/stargazers)

</div>

---

<div align="center">

## 🔥 **Desenvolvido com excelência por ELN-SOLUÇÕES**

![Footer](https://img.shields.io/badge/2025-ELN--SOLUÇÕES-blue?style=for-the-badge&logo=code&logoColor=white)

*Transformando ideias em soluções digitais inovadoras*

**🚀 Tecnologia • 💡 Inovação • ⭐ Qualidade**

</div>
