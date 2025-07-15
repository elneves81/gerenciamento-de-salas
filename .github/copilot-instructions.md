<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instruções para o Sistema de Agendamento de Salas

Este é um projeto de sistema de agendamento de salas de reunião com:

## Stack Tecnológico
- **Backend**: Django REST Framework com PostgreSQL
- **Frontend**: React com Vite
- **Autenticação**: JWT

## Estrutura de Dados
- **Sala**: nome, capacidade, recursos, disponibilidade
- **Reserva**: sala, usuário, data/hora início, data/hora fim, título, descrição
- **Usuario**: nome, email, departamento, permissões

## Padrões de Código
- Use nomenclatura em português para modelos e variáveis de negócio
- Mantenha a estrutura REST padrão para APIs
- Componentes React devem ser funcionais com hooks
- Use TypeScript no frontend quando possível
- Implemente validações tanto no frontend quanto no backend

## Funcionalidades Principais
- CRUD completo para salas e reservas
- Prevenção de conflitos de horário
- Dashboard com visualização de agenda
- Sistema de permissões por usuário
- Interface responsiva e intuitiva
