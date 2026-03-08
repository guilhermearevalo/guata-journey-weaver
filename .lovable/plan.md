

# Plano: Contato do cliente visível para parceiros + Stripe com fallback manual

## Parte 1 — Mostrar contato do cliente para parceiros

Atualmente o dialog de detalhes em `PartnerDemandas.tsx` mostra "Contato intermediado pela Guatá" e oculta email/telefone. Vamos mudar para exibir os dados de contato completos.

### Arquivo: `src/pages/partner/PartnerDemandas.tsx`
- Adicionar `client_email` e `client_phone` na interface `TravelRequest`
- No dialog de detalhes, substituir "Contato intermediado pela Guatá" por email e telefone reais do cliente
- Adicionar ícones de email e telefone clicáveis (mailto: e tel:)

Nenhuma mudança no banco necessária — a RLS já permite que parceiros vejam as requests atribuídas (`Partners can view assigned requests`), e a query já faz `select('*')` que inclui email e telefone.

---

## Parte 2 — Integração Stripe + fallback manual

A abordagem será: **Stripe como método principal** (checkout hospedado) com **fallback para links externos** (transferência, PIX manual, etc).

### Passo 1: Habilitar Stripe
- Usar a ferramenta nativa do Lovable para ativar Stripe (vai pedir sua chave secreta do Stripe)
- Isso cria a infraestrutura de edge functions e webhooks automaticamente

### Passo 2: Criar checkout na proposta
- Na proposta aprovada, adicionar botão "Pagar com Cartão/PIX" que cria uma Stripe Checkout Session
- Edge function `create-checkout` recebe `proposal_id`, cria sessão com o `total_price`
- Cliente é redirecionado para o checkout do Stripe e volta à plataforma

### Passo 3: Webhook para atualização automática
- Edge function `stripe-webhook` escuta eventos `checkout.session.completed`
- Atualiza automaticamente `proposals.payment_status` para `paid`
- Elimina necessidade de atualização manual para pagamentos via Stripe

### Passo 4: Manter fallback manual
- Os campos `payment_links` (PIX/cartão externo) continuam existindo na proposta
- Consultor ainda pode inserir links manuais e atualizar status manualmente
- No frontend da proposta: seção "Pagar online" (Stripe) + seção "Outras formas de pagamento" (links manuais)

### Benefícios
- Status atualizado automaticamente via webhook (sem erro humano)
- Relatórios financeiros confiáveis (pagamentos Stripe são rastreáveis)
- Cliente não sai da experiência (checkout integrado)
- Fallback para casos especiais (transferência bancária, etc)

### Ordem de implementação
1. Mostrar contato do cliente para parceiros (rápido)
2. Habilitar Stripe (precisa da sua chave)
3. Criar edge functions de checkout + webhook
4. Atualizar UI da proposta pública com opções de pagamento

