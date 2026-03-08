
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

**Lacuna:** Após aprovar a agência, o admin precisa **manualmente criar um usuário** para a agência e vinculá-lo na tabela `partner_users` (user_id + agency_id). Não existe formulário automático para isso no painel atual.

---

## 3. Portal do Parceiro (`/partner/`)

### Dashboard (`/partner`)
- Nome da agência como boas-vindas
- Cards: Total de demandas, Aguardando proposta, Propostas enviadas, Concluídas
- Lista das 5 demandas mais recentes

### Demandas (`/partner/demandas`)
- Lista de `travel_requests` onde `assigned_agency_id` = agência do parceiro
- Cards com: nome do cliente, destino, viajantes, datas, orçamento, status
- Botão "Criar Proposta" ou "Ver Proposta"
- Dialog com contato completo do cliente (email + telefone clicáveis)

### Criar/Editar Proposta (`/partner/proposta/:requestId`)
- Formulário: título, descrição, preço total, inclusões
- Links de pagamento: PIX e Cartão (manuais)
- Status de pagamento (pendente/parcial/pago)
- Resumo da demanda no painel lateral
- Ao criar proposta, status muda para `proposal_sent`

### Experiências (`/partner/experiencias`)
- Lista read-only de experiências onde `operator_agency_id` = agência do parceiro

### Roteiro (`/partner/proposta/:id/roteiro`)
- Planejador de roteiro compartilhado (`ItineraryPlanner`)

### Ajuda (`/partner/ajuda`)
- Página de suporte/FAQ

---

## 4. Atribuição de Demandas (Admin → Parceiro)

No Kanban do admin (`/admin/demandas`):
- Admin atribui demanda a uma agência via `assigned_agency_id`
- Kanban tem filtros por agência e status de pagamento

---

## 5. Fluxo de Pagamento (Híbrido)

### Via Stripe (automático):
- Proposta pública (`/proposta/:token`), botão "Pagar Online"
- Edge function `create-checkout` → Stripe Checkout Session
- Webhook `stripe-webhook` atualiza `payment_status` para `paid`

### Via Links Manuais (fallback):
- Parceiro/consultor cola links de PIX/Cartão na proposta
- Atualização manual do `payment_status`

---

## 6. Relatórios e Comissões

- `/admin/relatorio-agencias`: vendas, receita, comissões por agência
- `/admin/financeiro`: resumo de pagamentos pendentes/parciais/pagos

---

## 7. Segurança (RLS)

- Parceiro só vê `travel_requests` com `assigned_agency_id` = sua agência
- Parceiro só gerencia `proposals` com `agency_id` = sua agência
- Funções `get_user_agency()` e `has_role()` são `SECURITY DEFINER`

---

## Lacunas / Pontos de Melhoria

1. **Criação de usuário parceiro**: Sem fluxo automatizado pós-aprovação
2. **Parceiro não pode editar status de demandas**
3. **Sem notificações** quando nova demanda é atribuída
4. **Sem chat** parceiro↔cliente na plataforma
5. **Experiências read-only** para parceiros
