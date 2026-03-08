

# Explicação Completa do Fluxo de Agências + Gargalos Identificados

## Como funciona o sistema de agências HOJE (passo a passo com exemplos)

### ETAPA 1: Cadastro da Agência

**Exemplo**: A agência "Sol Viagens" acessa `/seja-parceiro` e preenche o formulário com nome, CNPJ, email, telefone, especialidades e regiões de atuação.

**O que acontece no sistema**:
- Insere um registro na tabela `partner_agencies` com `is_active = false`
- A agência fica **pendente de aprovação** — aparece na aba "Pendentes" em `/admin/parceiros`

---

### ETAPA 2: Admin Aprova a Agência

**Exemplo**: O admin acessa `/admin/parceiros`, vê "Sol Viagens" na aba Pendentes, clica em "Aprovar e Criar Login".

**O que acontece no sistema**:
1. Admin preenche nome do responsável + email
2. A Edge Function `invite-partner` é chamada:
   - Cria um usuário no Auth com senha temporária
   - Muda o role de `client` para `partner`
   - Vincula o usuário à agência na tabela `partner_users`
   - Ativa a agência (`is_active = true`)
3. Admin vê a senha temporária e envia ao parceiro manualmente

---

### ETAPA 3: Cliente Solicita Viagem

**Exemplo**: Maria acessa `/viagem-personalizada` e preenche: "Quero ir para Noronha, 2 pessoas, orçamento R$10.000, em julho".

**O que acontece**: Cria um registro em `travel_requests` com status `pending`. Aparece no Kanban do admin em `/admin/demandas`.

---

### ETAPA 4: Admin Atribui Demanda à Agência

**Exemplo**: Admin arrasta a demanda da Maria para "Em Análise" e atribui à "Sol Viagens" (campo `assigned_agency_id`).

**O que acontece**: O parceiro da Sol Viagens agora vê a demanda em `/partner/demandas`.

---

### ETAPA 5: Parceiro Cria Proposta

**Exemplo**: O parceiro clica em "Criar Proposta" para a demanda da Maria.

**O que preenche**:
- Título: "Noronha Exclusivo - 5 dias"
- Descrição, valor (R$8.500), inclusões
- **Pagamento habilitado**: OFF (para a Maria revisar primeiro)
- **Código de acesso**: "NORONHA2026" (para proteger o roteiro)

**O que acontece**: Cria registro em `proposals` com `payment_enabled = false`. O status da demanda muda para `proposal_sent`.

---

### ETAPA 6: Compartilhar com o Cliente

**Exemplo**: Admin (ou parceiro via admin) gera o link público da proposta (ex: `/proposta/abc-123-token`) e envia para Maria por WhatsApp.

**Maria abre o link e vê**: Título, destino, datas, valor (R$8.500), inclusões, link para o roteiro. **Sem botão de pagamento** (porque `payment_enabled = false`).

Se Maria acessar o roteiro (`/roteiro/abc-123-token`), precisa digitar "NORONHA2026" para ver os detalhes.

---

### ETAPA 7: Ativar Pagamento

**Exemplo**: Maria aprovou tudo. O parceiro liga o Switch "Habilitar Pagamento" e salva.

**Agora Maria vê**: O botão "Pagar Online (Cartão ou PIX)" aparece na proposta pública. Ela clica, é redirecionada ao Stripe Checkout, paga R$8.500.

---

### ETAPA 8: Webhook Confirma Pagamento

O Stripe envia webhook para `stripe-webhook`. O sistema atualiza `payment_status = 'paid'` na proposta.

---

### ETAPA 9: Admin Registra Repasse

**Exemplo**: Admin acessa `/admin/financeiro`, vê a proposta "Noronha Exclusivo" com:

| Campo | Valor |
|-------|-------|
| Bruto | R$ 8.500 |
| Taxa Stripe (~3.49% + R$0.39) | ~R$ 297 |
| Comissão Guatá (10%) | R$ 850 |
| A repassar ao parceiro | R$ 7.353 |

Admin faz PIX de R$7.353 para Sol Viagens, clica "Registrar Repasse", confirma.

---

### ETAPA 10: Parceiro Confere

O parceiro acessa `/partner/financeiro` e vê:
- Total Vendido: R$ 8.500
- Recebido: R$ 7.353
- Status: **Pago**

---

## GARGALOS E PROBLEMAS ENCONTRADOS

### 1. SejaParceiro.tsx não consegue inserir (RLS bloqueando)
A página `/seja-parceiro` faz `supabase.from('partner_agencies').insert(...)` como **usuário anônimo**, mas a tabela `partner_agencies` **não tem política de INSERT para anon**. Só admin pode inserir. O formulário **vai falhar silenciosamente** ou dar erro.

**Correção necessária**: Adicionar uma política RLS que permita inserção anônima com `is_active = false`.

### 2. AdminProposta.tsx ainda salva `payment_links` com PIX/Cartão
No `AdminProposta.tsx` linha 101, o payload ainda inclui `payment_links: { pix: pixLink, card: cardLink }`. Os campos `pixLink` e `cardLink` estão no state (linhas 31-32) e carregam do existingProposal (linhas 87-89), mas **não há mais inputs no formulário** para editá-los. Isso é um resquício — não causa bug, mas polui o dado.

**Correção necessária**: Remover `pixLink`, `cardLink` do state e do payload de save.

### 3. Parceiro pode alterar `payment_status` manualmente
No `PartnerProposta.tsx` (linhas 297-308), o parceiro tem um Select para mudar o status de pagamento entre "Pendente", "Parcial" e "Pago". Isso é um **risco**: o parceiro pode marcar como "Pago" sem o pagamento real ter acontecido via Stripe.

**Correção necessária**: Remover o Select de `payment_status` do formulário do parceiro. Só o webhook do Stripe ou o admin devem alterar esse campo.

### 4. `create-checkout` não verifica `payment_enabled`
A Edge Function `create-checkout` não checa se `payment_enabled = true`. Alguém que saiba a URL poderia chamar a função diretamente e gerar um checkout mesmo com pagamento desabilitado.

**Correção necessária**: Adicionar validação `if (!proposal.payment_enabled) throw new Error("Payment not enabled")` na Edge Function.

### 5. Código de acesso validado apenas no frontend
O `access_code` é comparado no browser (`RoteiroPublico.tsx` linha 102). Qualquer pessoa que inspecione o código fonte da página pode ver o código no payload da query do Supabase (pois `access_code` vem no SELECT *).

**Correção necessária**: Criar uma RPC ou Edge Function que valida o código no backend e retorna o roteiro apenas se correto. Ou, no mínimo, excluir `access_code` do select público (selecionar colunas específicas em vez de `*`).

### 6. Dados do formulário "Seja Parceiro" perdidos
Campos como `responsibleName`, `website`, `specialties` e `regions` são preenchidos no formulário mas **não são salvos** na tabela `partner_agencies` (que não tem essas colunas). A `description` é salva no campo `address`, o que é incorreto.

**Correção necessária**: Adicionar colunas (`website`, `specialties`, `regions`, `responsible_name`) em `partner_agencies` ou criar tabela separada para a solicitação.

### 7. Webhook Stripe não cria `commission_payment` automaticamente
Quando o Stripe confirma pagamento, o webhook só atualiza `payment_status = 'paid'`. O registro em `commission_payments` só é criado quando o admin clica "Registrar Repasse" manualmente. Seria mais robusto criar o registro com status `pending` automaticamente no webhook.

**Correção recomendada**: No `stripe-webhook`, após marcar como `paid`, criar automaticamente um `commission_payment` com `status = 'pending'` para que o parceiro já veja o valor a receber imediatamente.

---

## Resumo das Correções Necessárias

| # | Problema | Severidade | Correção |
|---|----------|-----------|----------|
| 1 | RLS bloqueia cadastro de parceiro | **CRÍTICO** — formulário não funciona | Adicionar política INSERT anon |
| 2 | Campos PIX/Cartão residuais no Admin | Baixa | Limpar state/payload |
| 3 | Parceiro altera payment_status | **ALTO** — fraude possível | Remover Select do parceiro |
| 4 | create-checkout ignora payment_enabled | **ALTO** — bypass possível | Validar na Edge Function |
| 5 | Código de acesso exposto no frontend | Médio | Não retornar access_code no select público |
| 6 | Dados do formulário Seja Parceiro perdidos | Médio | Adicionar colunas ou tabela |
| 7 | commission_payment não criado no webhook | Médio — UX ruim | Criar automaticamente no webhook |

---

## Plano de Implementação

### Migração SQL
```sql
-- 1. RLS para cadastro de parceiro (anon)
CREATE POLICY "Anyone can apply as partner"
ON partner_agencies FOR INSERT
TO anon, authenticated
WITH CHECK (is_active = false);

-- 2. Novas colunas para dados completos do formulário
ALTER TABLE partner_agencies
  ADD COLUMN website text,
  ADD COLUMN responsible_name text,
  ADD COLUMN specialties text[] DEFAULT '{}',
  ADD COLUMN regions text[] DEFAULT '{}';
```

### Arquivos a editar
1. **`src/pages/partner/PartnerProposta.tsx`** — remover Select de `payment_status`
2. **`src/pages/admin/AdminProposta.tsx`** — remover `pixLink`/`cardLink` do state e payload
3. **`src/pages/SejaParceiro.tsx`** — salvar todos os campos do formulário nas novas colunas
4. **`src/pages/RoteiroPublico.tsx`** — selecionar colunas específicas em vez de `*`, excluindo `access_code` da resposta visível (usar campo `has_access_code` boolean derivado)
5. **`supabase/functions/create-checkout/index.ts`** — adicionar check de `payment_enabled`
6. **`supabase/functions/stripe-webhook/index.ts`** — criar `commission_payment` pendente automaticamente ao confirmar pagamento

