# Sistema de Agendamento de Salas - Frontend

Este projeto é o frontend do sistema de agendamento de salas de reunião, desenvolvido em React + Vite e estilizado com Tailwind CSS.

## 📦 Tecnologias Utilizadas
- React 18
- Vite
- Tailwind CSS v4
- React Router DOM
- Axios
- Lucide React (ícones)

## 🚀 Como executar

1. **Instale as dependências:**
   ```bash
   cd frontend
   npm install
   ```
2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
3. **Acesse no navegador:**
   - http://localhost:5173 (ou porta informada no terminal)

## 🗂️ Estrutura de Pastas
```
frontend/
├── src/
│   ├── components/      # Componentes reutilizáveis
│   ├── contexts/        # Contextos globais (ex: autenticação)
│   ├── pages/           # Páginas principais (Login, Dashboard, Salas, Reservas)
│   ├── services/        # Configuração de API (Axios)
│   ├── index.css        # Estilos globais (Tailwind)
│   └── App.jsx          # Componente principal
├── tailwind.config.js   # Configuração do Tailwind
├── postcss.config.cjs   # Configuração do PostCSS
├── package.json         # Dependências e scripts
└── README.md            # Documentação
```

## 🔑 Autenticação
- Utiliza JWT (JSON Web Token) integrado ao backend Django.
- Tela de login profissional e responsiva.
- Contexto de autenticação para proteger rotas e gerenciar sessão do usuário.

## 🖥️ Funcionalidades
- **Login:** Autenticação via API do backend
- **Dashboard:** Visualização da agenda de reservas
- **CRUD de Salas:** Listar, criar, editar e excluir salas
- **CRUD de Reservas:** Listar, criar, editar e excluir reservas
- **Prevenção de conflitos:** Validação de horários no backend
- **Sistema de permissões:** Usuários com diferentes níveis de acesso
- **Interface responsiva:** Layout adaptado para desktop e mobile

## 🎨 Customização Visual
- Utiliza Tailwind CSS para estilização rápida e moderna
- Ícones do Lucide React para melhor experiência visual
- Layout centralizado e compacto

## 📝 Observações
- Para autenticar, utilize as credenciais do superusuário criado no backend Django
- O backend deve estar rodando em http://localhost:8000
- Caso queira alterar configurações do Tailwind, edite o arquivo `tailwind.config.js`

## 🔗 Exemplos de Uso da API

### Autenticação (Login)
```js
// POST http://localhost:8000/api/auth/login/
fetch('http://localhost:8000/api/auth/login/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'sua_senha' })
})
  .then(res => res.json())
  .then(data => {
    // data.access, data.refresh
  });
```

### Listar Salas
```js
// GET http://localhost:8000/api/salas/
fetch('http://localhost:8000/api/salas/', {
  headers: { 'Authorization': 'Bearer <access_token>' }
})
  .then(res => res.json())
  .then(salas => {
    // salas: Array de objetos { id, nome, capacidade, recursos, ... }
  });
```

### Criar Reserva
```js
// POST http://localhost:8000/api/reservas/
fetch('http://localhost:8000/api/reservas/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <access_token>'
  },
  body: JSON.stringify({
    sala: 1,
    usuario: 1,
    data_inicio: '2025-07-15T09:00:00',
    data_fim: '2025-07-15T10:00:00',
    titulo: 'Reunião de Projeto',
    descricao: 'Discussão de roadmap'
  })
})
  .then(res => res.json())
  .then(reserva => {
    // reserva criada
  });
```

### Estrutura das Respostas
- **Sala:** `{ id, nome, capacidade, recursos, disponibilidade }`
- **Reserva:** `{ id, sala, usuario, data_inicio, data_fim, titulo, descricao }`
- **Usuário:** `{ id, nome, email, departamento, permissoes }`

## ⚡ Integração Backend
- O backend deve estar rodando em `http://localhost:8000`
- Todas as rotas protegidas exigem o header `Authorization: Bearer <access_token>`
- Para criar reservas, garanta que não haja conflito de horário (validação feita no backend)

---

Desenvolvido para o sistema de agendamento de salas de reunião corporativo.
