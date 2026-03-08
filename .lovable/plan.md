

# Plano: Atualizar Central de Ajuda (Admin + Parceiro)

As centrais de ajuda estão desatualizadas — não mencionam o controle financeiro, o toggle de pagamento, o código de acesso no roteiro, nem a centralização via Stripe. Vou atualizar ambas.

---

## AdminAjuda.tsx — Novos passos a adicionar/atualizar

**Passo 3 (Criar Proposta)** — Atualizar para incluir:
- Toggle "Habilitar Pagamento" — começa desligado para o cliente revisar primeiro
- Campo "Código de Acesso" — protege o roteiro com senha
- Sem links manuais — pagamento centralizado via Stripe

**Novo Passo 7: Controle Financeiro**
- Acessar "Financeiro" no menu lateral
- Cards: Receita total paga, Comissão Guatá, Repasses pendentes
- Filtrar por agência e status de repasse
- Ver breakdown: valor bruto, taxa Stripe, comissão, valor líquido do parceiro
- Botão "Registrar Repasse" — confirmar que fez PIX/TED ao parceiro
- Parceiro vê o status atualizado no portal dele

**Novo Passo 8: Gestão de Parceiros**
- Aprovar/desativar agências em "Parceiros"
- Configurar comissão e quem absorve taxa Stripe por agência

---

## PartnerAjuda.tsx — Novos passos a adicionar/atualizar

**Passo 2 (Criar Proposta)** — Atualizar para incluir:
- Toggle "Habilitar Pagamento" — deixe desligado enquanto o cliente revisa; ligue quando for hora de fechar
- Campo "Código de Acesso" — define senha para proteger o roteiro público
- Pagamento é via Stripe (cartão ou PIX) — sem links externos

**Novo Passo 6: Acompanhar Financeiro**
- Acessar "Financeiro" no menu lateral
- Cards: Total vendido, Recebido, A receber
- Tabela com breakdown: valor bruto, taxa Stripe, comissão Guatá, valor líquido
- Status do repasse (pendente/pago) — atualizado quando a Guatá fizer o PIX

---

## Arquivos a editar
1. `src/pages/admin/AdminAjuda.tsx` — adicionar ícones DollarSign, Building2, Lock; atualizar steps
2. `src/pages/partner/PartnerAjuda.tsx` — adicionar ícones DollarSign, Lock; atualizar steps

