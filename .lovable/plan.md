## Plano de ajustes

### 1. Roteiro público (`/proposta/:token` → ver roteiro)

- **Remover** o bloco superior pesado ("Roteiro preparado por · Guatá Viagens · Roteiro de Viagem · França · 3 viajante(s) · R$ 1.335,00 · Imprimir") da página `RoteiroPublico.tsx`.
- Substituir por um header enxuto: só o destino (ex: "França"), nº de viajantes em texto pequeno e um botão discreto "Imprimir" no canto. O preço total fica só na proposta, não se repete no roteiro.
- **Visual mais vivo**: cada dia ganha um card com imagem de capa do dia (se houver), divisores sutis manhã/tarde/noite com ícones, paleta teal/marrom da marca, tipografia mais leve nos blocos de atividade. Sem mexer na estrutura de dados.

### 2. Desativar link da proposta

- Novo campo `share_enabled` (boolean, default true) em `proposals`.
- Em `AdminProposta.tsx`: switch "Link público ativo". Desligado = `RoteiroPublico` e `PropostaPublica` mostram tela "Este roteiro/proposta não está mais disponível".
- O token continua o mesmo — basta religar o switch para reativar.

### 3. Upload de imagem nas atividades do roteiro

- No `ItineraryPlanner` / `ActivityFormDialog`: além do campo URL, botão "Enviar imagem" que faz upload para `site-assets` (mesmo bucket já em uso) e preenche `image_url` automaticamente.
- URL continua como alternativa.

### 4. Página Experiências mais bonita

- `Experiencias.tsx`: hero ilustrado curto no topo, filtros em chips horizontais (não dropdowns isolados), cards maiores com hover sutil, badge de tipo (pacote/excursão/aérea/rodoviária).
- Estado vazio com ilustração + CTA "Solicitar viagem personalizada".

### 5. Página Seja Parceiro — bloco "Como funciona"

- Reformatar a seção mostrada na imagem: timeline vertical fica desalinhada (linha solta entre ícones e texto). Trocar por **grid de 5 cards** com numeração grande, ícone, título e descrição. Em mobile, vira coluna única empilhada.

### 6. Remover "Contato da agência" do Admin → mover para CMS

- O card "Contato Guatá" e "Localização" hoje vivem em `AdminConfiguracoes`. Mover essa edição para o **CMS** (`/admin/cms` → página "Contato"), dentro do mesmo editor das outras páginas. Um único lugar para mexer em conteúdo público.
- `PublicFooter` e `Contato.tsx` continuam consumindo `site_settings` (sem mudança no consumo).

### 7. Financeiro + Repasses de agências parceiras (mais importante)

Reaproveitando a tabela **`commission_payments`** que já existe (`gross_amount`, `partner_amount`, `guata_commission`, `stripe_fee`, `status`, `paid_at`, `notes`, `agency_id`, `proposal_id`).

**a) Venda registrada no site (proposta paga via Stripe ou marcada como paga):**
- Quando uma `proposal` vira `payment_status = 'paid'`, um trigger cria automaticamente uma linha em `commission_payments` com:
  - `gross_amount` = total da proposta
  - `guata_commission` = 10% (ou `agency.commission_rate`)
  - `partner_amount` = bruto − comissão − taxa Stripe (se aplicável)
  - `status = 'pending'` (aguardando repasse)

**b) Venda offline (agência fechou no WhatsApp, sem usar o site):**
- Novo botão "Registrar venda externa" disponível em:
  - **Painel Parceiro** (`/parceiro/financeiro`): a agência declara a venda.
  - **Admin Financeiro**: você também pode lançar em nome da agência.
- Formulário: cliente, destino, data, valor bruto → sistema calcula a comissão devida e cria a linha em `commission_payments` com `proposal_id = null` e um campo novo `source = 'external'`.

**c) Fechamento mensal:**
- Nova tabela `monthly_settlements` (id, agency_id, period_year, period_month, total_commission, status, due_date, paid_at, notes).
- Botão "Fechar mês" no Admin Financeiro: agrupa todas as `commission_payments` pendentes da agência X no mês Y, gera um settlement, define vencimento (ex: dia 10 do mês seguinte).
- Status: `open` → `closed` → `paid`. Anotações em texto livre por settlement.
- Tela "Relatório por Agência" mostra: vendas do mês, comissão devida, settlements em aberto, histórico de pagos.

**d) Anotações em Financeiro/Relatório:**
- Campo `notes` (texto livre) editável em cada `commission_payment` e em cada `monthly_settlement`. Botão "Adicionar nota" abre dialog.

**e) Visão do parceiro:**
- `/parceiro/financeiro`: lista das próprias vendas (site + externas), comissão devida do mês corrente, settlements fechados aguardando pagamento, histórico.

### Detalhes técnicos

```text
proposals
  + share_enabled boolean default true

commission_payments (já existe)
  + source text default 'platform'   -- 'platform' | 'external'
  + client_name text                  -- usado quando proposal_id é null
  + destination text                  -- idem
  + sale_date date                    -- idem
  + settlement_id uuid                -- FK para monthly_settlements

monthly_settlements (NOVO)
  id, agency_id, period_year int, period_month int,
  total_commission numeric, status text ('open'|'closed'|'paid'),
  due_date date, paid_at timestamptz, notes text,
  created_at, updated_at

RLS:
  - admin: ALL
  - partner: SELECT/INSERT em commission_payments onde agency_id = get_user_agency(auth.uid()) e source='external'
  - partner: SELECT em monthly_settlements onde agency_id = sua agência
```

Trigger em `proposals` (AFTER UPDATE de `payment_status` → 'paid'): gera linha em `commission_payments` se ainda não existir para aquela proposta.

### Fora do escopo

- Cobrança automatizada de comissão (boleto/Stripe para parceiro) — fica para depois.
- Webhook bidirecional com sistemas externos das agências.

### Ordem sugerida de implementação

1. Limpeza visual do roteiro público + switch desativar link + upload de imagem (rápido).
2. Redesign Experiências + Como funciona (front).
3. Mover Contato para CMS.
4. Módulo financeiro completo (migração + triggers + telas admin + tela parceiro).