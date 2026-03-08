

# Como Funciona o Sistema de Agências Parceiras — Visão Completa

## 1. Captação — Página "Seja Parceiro" (`/seja-parceiro`)

Página pública onde agências interessadas preenchem um formulário com:
- Nome da agência, CNPJ, responsável, email, telefone, website
- Especialidades (aventura, praia, cultural, ecoturismo, luxo, internacional)
- Regiões de atuação (Nordeste, Sudeste, Sul, Norte, Centro-Oeste, Internacional)
- Descrição da agência

Ao enviar, o cadastro é salvo na tabela `partner_agencies` com `is_active = false` (pendente de aprovação).

---

## 2. Aprovação pelo Admin (`/admin/parceiros`)

O admin vê a lista de agências em duas abas: **Ativos** e **Pendentes**.

Pode:
- Ver detalhes da agência (CNPJ, comissão, contato, endereço)
- **Aprovar** (muda `is_active` para `true`)
- **Desativar** uma agência já ativa

**O que falta aqui (lacuna):** Após aprovar a agência, o admin precisa **manualmente criar um usuário** para a agência e vinculá-lo na tabela `partner_users` (user_id + agency_id). Não existe formulário automático para isso no painel atual.

---

## 3. Portal do Parceiro (`/partner/`)

Após login, o parceiro acessa um painel exclusivo com:

### Dashboard (`/partner`)
- Nome da agência como boas-vindas
- Cards: Total de demandas, Aguardando proposta, Propostas enviadas, Concluídas
- Lista das 5 demandas mais recentes

### Demandas (`/partner/demandas`)
- Lista de todas as `travel_requests` onde `assigned_agency_id` = agência do parceiro
- Cards com: nome do cliente, destino, viajantes, datas, orçamento, status
- Botão "Criar Proposta" ou "Ver Proposta" (se já existir)
- Dialog de detalhes com **contato completo do cliente** (email + telefone clicáveis)

### Criar/Editar Proposta (`/partner/proposta/:requestId`)
- Formulário com: título, descrição, preço total, inclusões (uma por linha)
- Links de pagamento: PIX e Cartão (campos manuais)
- Status de pagamento (pendente/parcial/pago) — editável apenas em proposta existente
- Resumo da demanda no painel lateral (destino, viajantes, datas, orçamento, pedidos especiais)
- Ao criar proposta, o status da demanda muda automaticamente para `proposal_sent`

### Experiências (`/partner/experiencias`)
- Lista read-only de experiências onde `operator_agency_id` = agência do parceiro
- O parceiro **não pode criar/editar** experiências — isso é feito pelo admin

### Roteiro (`/partner/proposta/:id/roteiro`)
- Planejador de roteiro (componente compartilhado `ItineraryPlanner`)
- Disponível após proposta aprovada

### Ajuda (`/partner/ajuda`)
- Página de suporte/FAQ para parceiros

---

## 4. Atribuição de Demandas (Admin → Parceiro)

No Kanban do admin (`/admin/demandas`):
- O admin atribui uma demanda a uma agência via campo `assigned_agency_id`
- A partir desse momento, a demanda aparece no portal do parceiro
- O Kanban tem filtros por agência e por status de pagamento

---

## 5. Fluxo de Pagamento (Híbrido)

### Via Stripe (automático):
- Na proposta pública (`/proposta/:token`), botão "Pagar Online"
- Cria sessão Stripe via edge function `create-checkout`
- Webhook `stripe-webhook` atualiza `payment_status` automaticamente para `paid`

### Via Links Manuais (fallback):
- Parceiro ou consultor cola links de PIX/Cartão na proposta
- Cliente clica no link externo para pagar
- Consultor/parceiro atualiza manualmente o `payment_status`

---

## 6. Relatórios e Comissões

### Relatório por Agência (`/admin/relatorio-agencias`)
- Total de demandas por agência
- Receita total (soma de `total_price` das propostas)
- Comissão calculada (receita x `commission_rate` da agência)
- Filtro por período (30 dias, 90 dias, 12 meses, todos)

### Dashboard Financeiro (`/admin/financeiro`)
- Resumo geral de pagamentos pendentes, parciais e pagos

---

## 7. Segurança (RLS)

- Parceiro só vê `travel_requests` com `assigned_agency_id` = sua agência
- Parceiro só gerencia `proposals` com `agency_id` = sua agência
- Parceiro só vê sua própria `partner_agencies`
- Funções `get_user_agency()` e `has_role()` são `SECURITY DEFINER` para evitar recursão

---

## Lacunas / Pontos de Melhoria Identificados

1. **Criação de usuário parceiro**: Após aprovar agência, não há fluxo automatizado para criar o login e vincular à agência. Hoje é manual.
2. **Parceiro não pode editar demandas**: Não pode mudar status (ex: marcar "em operação" ou "concluído"). Só o admin/consultor faz isso.
3. **Sem notificações**: Parceiro não recebe alerta quando uma nova demanda é atribuída.
4. **Sem chat**: Parceiro vê contato do cliente mas não há mensageria integrada entre parceiro e cliente na plataforma.
5. **Experiências read-only**: Parceiro não pode cadastrar suas próprias experiências.

