# Sistema de Agendamento de Salas de Reunião

Sistema robusto e profissional para agendamento de salas de reunião desenvolvido com Django REST Framework (backend) e React (frontend).

## Características

- **Backend**: Django REST Framework com PostgreSQL
- **Frontend**: React com Vite
- **Autenticação**: JWT
- **Funcionalidades**:
  - Cadastro e gerenciamento de salas
  - Agendamento de reuniões
  - Prevenção de conflitos de horário
  - Dashboard com visualização de agenda
  - Sistema de usuários e permissões

## Estrutura do Projeto

```
agendamento-de-salas/
├── backend/          # API Django REST Framework
├── frontend/         # Interface React
├── docs/            # Documentação
└── README.md
```

## Instalação

### Backend (Django)
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (React)
```bash
cd frontend
npm install
npm run dev
```

## URLs

- Backend API: http://localhost:8000
- Frontend: http://localhost:5173
- Admin Django: http://localhost:8000/admin

## Desenvolvimento

1. Ative o ambiente virtual do backend
2. Execute o servidor Django
3. Em outro terminal, execute o servidor React
4. Acesse o frontend em http://localhost:5173

## Funcionalidades Implementadas

- [x] Modelos de dados (Sala, Reserva, Usuario)
- [x] API REST completa
- [x] Interface React responsiva
- [x] Sistema de autenticação
- [x] Prevenção de conflitos
- [x] Dashboard administrativo

## Próximos Passos

- [ ] Testes automatizados
- [ ] Deploy em produção
- [ ] Notificações por email
- [ ] Integração com calendário
