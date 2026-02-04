
# Plano: Área do Cliente (Fase 4)

## Objetivo
Criar a área autenticada do cliente onde ele pode acompanhar suas viagens, trocar mensagens com consultores e gerenciar seu perfil.

---

## Estrutura de Páginas

```
src/pages/cliente/
├── ClienteLayout.tsx      (Layout com header/sidebar)
├── ClienteDashboard.tsx   (Visão geral das viagens)
├── ClienteViagens.tsx     (Lista de solicitações/viagens)
├── ClienteViagem.tsx      (Detalhe de uma viagem)
├── ClienteMensagens.tsx   (Chat com consultor)
└── ClientePerfil.tsx      (Edição de dados pessoais)
```

---

## Componentes Auxiliares

```
src/components/cliente/
├── ClienteSidebar.tsx           (Menu lateral)
├── ProtectedClienteRoute.tsx    (Proteção de rotas)
└── MessageBubble.tsx            (Componente de mensagem)
```

---

## Rotas a Implementar

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/minha-conta` | ClienteDashboard | Dashboard com resumo |
| `/minha-conta/viagens` | ClienteViagens | Lista de viagens |
| `/minha-conta/viagem/:id` | ClienteViagem | Detalhe + propostas |
| `/minha-conta/mensagens` | ClienteMensagens | Todas as conversas |
| `/minha-conta/perfil` | ClientePerfil | Editar perfil |

---

## Funcionalidades por Página

### ClienteDashboard
- Cards de resumo (viagens ativas, propostas pendentes)
- Última atividade/mensagens
- Ações rápidas (nova solicitação, ver mensagens)

### ClienteViagens
- Lista de travel_requests do usuário logado
- Filtro por status
- Link para detalhes

### ClienteViagem (detalhe)
- Informações da solicitação
- Propostas recebidas (da tabela proposals)
- Status atual
- Botão para aprovar proposta

### ClienteMensagens
- Lista de conversas por viagem
- Envio de novas mensagens
- Marcação de lidas

### ClientePerfil
- Edição de nome, telefone, avatar
- Preferências de viagem

---

## Ajustes Necessários

### 1. Atualizar App.tsx
Adicionar rotas `/minha-conta/*` com o novo layout.

### 2. Atualizar Login.tsx
Redirecionar clientes para `/minha-conta` após login (já está quase correto).

### 3. Atualizar PublicHeader.tsx
O link para `/minha-conta` já existe mas precisa funcionar.

### 4. Habilitar Realtime para Messages (opcional)
Para notificações em tempo real.

---

## Detalhes Técnicos

### Proteção de Rotas
O componente ProtectedClienteRoute verificará:
- Se o usuário está logado
- Se o usuário tem role 'client' (ou qualquer role autenticado)

### Queries Principais
- `travel_requests` com `client_id = auth.uid()`
- `proposals` vinculadas às requests do cliente
- `messages` enviadas ou recebidas pelo cliente
- `profiles` para dados do usuário

### RLS já configurado
- Clientes podem ver próprios requests
- Clientes podem ver propostas das suas requests
- Clientes podem ver/enviar mensagens

---

## Ordem de Implementação

1. **ClienteLayout** + **ClienteSidebar** + **ProtectedClienteRoute**
2. **ClienteDashboard** (página inicial)
3. **ClienteViagens** (lista de viagens)
4. **ClienteViagem** (detalhe com propostas)
5. **ClienteMensagens** (sistema de mensagens)
6. **ClientePerfil** (edição de perfil)
7. Atualizar **App.tsx** com as rotas
8. Testar fluxo completo

---

## Resultado Esperado

Após a implementação, o cliente poderá:
- Fazer login e ser redirecionado para `/minha-conta`
- Ver resumo das suas viagens e propostas
- Acompanhar o status de cada solicitação
- Trocar mensagens com o consultor designado
- Editar seu perfil e preferências

