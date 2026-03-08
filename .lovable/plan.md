

# Plano: Controle Financeiro Completo + Eliminação de Links Manuais

## Como funciona HOJE (problemas)

1. **Pagamento Stripe** → cai na SUA conta Stripe → você precisa calcular comissão e repassar manualmente via PIX/TED
2. **Links manuais** (PIX/Cartão) → parceiro cola links externos → sem rastreio, sem confirmação automática
3. **Taxa Stripe** (~3.49% + R$0.39) → não aparece nos cálculos → pode gerar contenda sobre quem paga a taxa
4. **Parceiro não vê** seus próprios números financeiros — só o admin vê
5. **Sem registro de repasses** — não tem como provar que pagou o parceiro

---

## O que vamos implementar

### 1. Tabela `commission_payments` (registro de repasses)
Nova tabela para registrar cada repasse feito ao parceiro:
- `proposal_id`, `agency_id`, `gross_amount` (valor bruto), `stripe_fee`, `guata_commission`, `partner_amount` (valor líquido do parceiro), `status` (pending/paid), `paid_at`, `notes`
- Quando o admin marca um repasse como "pago", fica registrado com data e valor exato

### 2. Cálculo transparente com taxa Stripe
Na proposta, o sistema vai calcular e exibir:
- **Valor bruto**: R$ 5.000,00 (total_price)
- **Taxa Stripe**: ~R$ 175,00 (3.49% + R$0.39)
- **Comissão Guatá**: R$ 500,00 (10% sobre o bruto)
- **Valor a repassar**: R$ 4.325,00

Quem paga a taxa Stripe é configurável por agência (campo `stripe_fee_bearer` na tabela `partner_agencies`: `guata`, `partner` ou `split`)

### 3. Painel Financeiro do Admin melhorado (`/admin/financeiro`)
- Tabela com coluna extra: **Taxa Stripe**, **Comissão Guatá**, **A Repassar**, **Status do Repasse**
- Botão "Registrar Repasse" → abre dialog para confirmar valor e data do repasse
- Filtro por agência e por status de repasse (pendente/pago)

### 4. Dashboard Financeiro do Parceiro (NOVO: `/partner/financeiro`)
- Cards: Total vendido, Recebido, A receber
- Tabela: cada proposta paga com breakdown (valor bruto, taxa, comissão Guatá, valor líquido)
- Status do repasse (pendente/pago)
- Nova rota + item no menu lateral do parceiro

### 5. Substituir links manuais por Stripe integrado
- **Remover campos de link PIX/Cartão manual** do formulário de proposta do parceiro
- Todo pagamento passa pelo Stripe (botão "Pagar Online" na proposta pública)
- Stripe já aceita PIX + Cartão automaticamente no Checkout
- Parceiro não precisa mais gerar links externos

---

## Mudanças técnicas

### Migração SQL
```sql
-- Campo para definir quem paga taxa Stripe
ALTER TABLE partner_agencies 
  ADD COLUMN stripe_fee_bearer text DEFAULT 'guata';

-- Tabela de registro de repasses
CREATE TABLE commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id),
  agency_id uuid REFERENCES partner_agencies(id),
  gross_amount numeric NOT NULL,
  stripe_fee numeric DEFAULT 0,
  guata_commission numeric NOT NULL,
  partner_amount numeric NOT NULL,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  paid_by uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;
-- Admin gerencia tudo
-- Parceiro vê apenas os seus
```

### Arquivos a criar/editar
1. **`src/pages/partner/PartnerFinanceiro.tsx`** — novo dashboard financeiro do parceiro
2. **`src/components/partner/PartnerSidebar.tsx`** — adicionar item "Financeiro" no menu
3. **`src/pages/admin/AdminFinanceiro.tsx`** — adicionar colunas de taxa/comissão/repasse + botão de registrar repasse
4. **`src/pages/partner/PartnerProposta.tsx`** — remover campos de links manuais
5. **`src/pages/PropostaPublica.tsx`** — remover seção de links manuais (manter apenas Stripe)
6. **Rota** no App.tsx para `/partner/financeiro`

### O que NÃO muda
- O Stripe continua na sua conta — todo dinheiro cai para você
- O repasse para o parceiro continua sendo manual (PIX/TED)
- Mas agora o sistema **registra e comprova** cada repasse

---

## Resumo do fluxo final

```text
Cliente paga R$5.000 via Stripe
         ↓
Stripe desconta taxa (~R$175)
         ↓
Guatá recebe R$4.825 na conta Stripe
         ↓
Sistema calcula:
  - Comissão Guatá (10%): R$500
  - A repassar ao parceiro: R$4.325
         ↓
Admin faz PIX de R$4.325 → parceiro
         ↓
Admin registra repasse no sistema
         ↓
Parceiro vê "Recebido" no seu dashboard
```

