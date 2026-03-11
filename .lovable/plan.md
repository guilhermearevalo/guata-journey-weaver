

# Relatório Completo: Como Funciona a Guatá Travel Experience

## O que é a Guatá

A Guatá é um **hub de curadoria de viagens** que conecta três atores: **viajantes** (clientes), **equipe Guatá** (admin) e **agências parceiras** (operadoras). A Guatá não opera viagens diretamente — ela capta clientes, curadoria as demandas e distribui para agências parceiras especializadas, cobrando uma comissão sobre cada venda.

---

## Fluxo Completo (Passo a Passo)

### 1. Cliente chega ao site
- Navega experiências, excursões e pacotes
- Pode pedir uma **viagem personalizada** (`/viagem-personalizada`)
- O pedido vira uma **demanda** no sistema (tabela `travel_requests`)

### 2. Admin recebe a demanda
- Aparece no **Kanban** (`/admin/demandas`) com status "Pendente"
- Admin analisa: destino, datas, orçamento, número de viajantes
- Atribui a demanda a uma **agência parceira** especializada naquele tipo de viagem

### 3. Parceiro vê a demanda
- A agência acessa o portal (`/partner`) e vê a demanda atribuída
- Vê os dados completos: nome do cliente, email, telefone, destino, datas, orçamento

### 4. Parceiro cria proposta
- Preenche: título, descrição, preço, inclusões
- **Pagamento desligado** inicialmente — para o cliente revisar antes
- Define um **código de acesso** (ex: "NORONHA2026") para proteger o roteiro

### 5. Parceiro monta o roteiro
- Usa o **planejador de roteiro** com IA ou manualmente
- Adiciona dias, atividades, horários, custos estimados
- Adiciona checklist de documentos (passaporte, visto, etc.)

### 6. Compartilha com o cliente
- Gera **link público** da proposta e do roteiro
- Cliente acessa, digita o código de acesso se necessário
- Revisa tudo sem poder pagar ainda

### 7. Cliente aprova → pagamento habilitado
- Parceiro liga o switch "Habilitar Pagamento"
- O botão "Pagar Online (Cartão ou PIX)" aparece na proposta pública
- Cliente paga via **Stripe Checkout**

### 8. Repasse financeiro
- Stripe confirma pagamento → `payment_status = 'paid'`
- Sistema cria automaticamente um registro de comissão pendente
- Admin vê no financeiro: valor bruto, taxa Stripe (~3.49%), comissão Guatá (10%), valor líquido
- Admin faz PIX ao parceiro e registra o repasse
- Parceiro vê o status atualizado no seu dashboard financeiro

---

## Como uma agência se torna parceira

1. Acessa `/seja-parceiro` → preenche formulário (nome, CNPJ, especialidades, regiões)
2. Admin vê em `/admin/parceiros` → aba "Pendentes"
3. Admin clica "Aprovar e Criar Login" → sistema gera email + senha temporária
4. Parceiro recebe credenciais e acessa `/partner`

---

## Newsletter — Proposta de Implementação

A ideia de newsletter é excelente para manter clientes engajados. Proponho:

### O que será feito
1. **Tabela `newsletter_subscribers`** — email, nome (opcional), status, data
2. **Formulário no footer** — campo de email + botão "Assinar" em todas as páginas públicas
3. **Admin gerencia assinantes** — nova página `/admin/newsletter` para ver lista, exportar CSV
4. **RLS** — qualquer um pode se inscrever, só admin vê a lista

### Migração SQL
```sql
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  status text DEFAULT 'active', -- active, unsubscribed
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode se inscrever
CREATE POLICY "Anyone can subscribe" ON newsletter_subscribers
  FOR INSERT TO anon, authenticated WITH CHECK (status = 'active');

-- Staff vê todos
CREATE POLICY "Staff can view all" ON newsletter_subscribers
  FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- Staff pode gerenciar
CREATE POLICY "Staff can manage" ON newsletter_subscribers
  FOR ALL TO authenticated USING (is_staff(auth.uid()));
```

### Arquivos a criar/editar
| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar tabela `newsletter_subscribers` |
| `src/components/layout/PublicFooter.tsx` | Adicionar formulário de newsletter acima do copyright |
| `src/pages/admin/AdminNewsletter.tsx` | Criar — lista de assinantes com busca e exportar CSV |
| `src/components/admin/AdminSidebar.tsx` | Adicionar link "Newsletter" |
| `src/App.tsx` | Adicionar rota `/admin/newsletter` |

