

# Plano: 3 Correções Identificadas

## 1. Depoimentos — "Compartilhe sua Experiência" sem upload de foto

**Situação atual**: A seção `TestimonialsSection` é 100% estática — são 3 depoimentos hardcoded com fotos do Unsplash. Não existe nenhuma funcionalidade para clientes reais enviarem depoimentos com foto.

**O que precisa ser feito**:
- Criar tabela `testimonials` no banco (nome, texto, foto, viagem, rating, status aprovação)
- Criar formulário para o cliente enviar depoimento com upload de foto (usar o bucket `site-assets` ou criar um novo `testimonials`)
- Admin aprova/rejeita depoimentos antes de aparecerem no site
- `TestimonialsSection` passa a buscar os depoimentos aprovados do banco (com fallback para os hardcoded se não houver nenhum)

### Migração SQL
```sql
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_location text,
  client_photo_url text,
  rating integer DEFAULT 5,
  text text NOT NULL,
  trip_name text,
  status text DEFAULT 'pending', -- pending, approved, rejected
  client_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Qualquer um pode ver os aprovados
CREATE POLICY "Anyone can view approved testimonials" ON testimonials
  FOR SELECT TO anon, authenticated USING (status = 'approved');

-- Clientes autenticados podem enviar
CREATE POLICY "Authenticated users can submit testimonials" ON testimonials
  FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());

-- Staff gerencia todos
CREATE POLICY "Staff can manage testimonials" ON testimonials
  FOR ALL TO authenticated USING (is_staff(auth.uid()));
```

### Arquivos a criar/editar
- **`src/components/home/TestimonialsSection.tsx`** — buscar do banco, formulário modal "Compartilhe sua Experiência" com upload de foto
- **`src/pages/admin/AdminDepoimentos.tsx`** (novo) — listar depoimentos pendentes, aprovar/rejeitar
- **AdminSidebar** — adicionar link para gerenciar depoimentos
- **App.tsx** — adicionar rota `/admin/depoimentos`

---

## 2. Agência — O que precisa para funcionar (checklist completo)

Revisando todo o fluxo, identifiquei o que **já funciona** e o que **falta**:

| Etapa | Status | Detalhes |
|-------|--------|---------|
| Formulário "Seja Parceiro" | OK | Salva com `is_active = false`, RLS já permite anon |
| Admin vê pendentes | OK | Aba "Pendentes" em `/admin/parceiros` |
| Admin aprova + cria login | OK | Edge Function `invite-partner` cria user, role, vínculo |
| Parceiro acessa portal | OK | ProtectedPartnerRoute + get_user_agency |
| Parceiro vê demandas atribuídas | OK | RLS filtra por `assigned_agency_id` |
| Parceiro cria proposta | OK | payment_enabled começa OFF |
| Toggle de pagamento | OK | Switch no formulário do parceiro |
| Código de acesso no roteiro | OK | Campo + tela de bloqueio no RoteiroPublico |
| Pagamento via Stripe | OK | create-checkout valida payment_enabled |
| Webhook cria commission_payment | OK | Criado automaticamente com status pending |
| Admin registra repasse | OK | Botão no financeiro |
| Parceiro vê financeiro | OK | Dashboard com breakdown |

**O que falta para a agência funcionar de verdade**:

1. **AdminParceiros não mostra dados novos**: A interface de detalhes da agência não exibe `responsible_name`, `website`, `specialties`, `regions`, `description` — campos que agora existem no banco. O admin não vê esses dados ao avaliar uma agência pendente.

2. **Parceiro não recebe notificação de nova demanda**: Quando o admin atribui uma demanda, o parceiro só descobre se acessar o portal. Sem email/notificação.

**Correção a implementar agora** (item 1 — é bloqueante para o fluxo):
- **`src/pages/admin/AdminParceiros.tsx`** — atualizar a interface `PartnerAgency` e o dialog de detalhes para mostrar os novos campos (responsável, site, especialidades, regiões, descrição)

---

## 3. Planejador de Roteiro — "Sumiu o planejamento manual"

**Situação atual**: O `ItineraryPlanner` TEM funcionalidades manuais:
- Botão "Adicionar Dia" (abaixo da timeline)
- Botão "Adicionar" (em cada dia, para criar atividade manual)
- Botão de editar (lápis) em cada atividade
- Reordenar atividades (setas cima/baixo)

**O problema**: Quando o roteiro está vazio, o estado vazio (card tracejado) só mostra "Gerar Roteiro com IA" como texto principal. O botão "Adicionar Dia" fica **acima** do card vazio e é pouco visível. Parece que só existe a opção de IA.

**Correção**:
- No card de estado vazio, adicionar um botão "Adicionar Dia Manualmente" ao lado do texto sobre IA
- Tornar mais claro que existem duas opções: IA ou manual

### Arquivo a editar
- **`src/components/itinerary/ItineraryPlanner.tsx`** — melhorar o empty state (linhas 416-426) para incluir botão manual visível

---

## Resumo de Arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL (tabela testimonials) | Criar |
| `TestimonialsSection.tsx` | Editar — buscar do banco + formulário de envio |
| `AdminDepoimentos.tsx` | Criar — gestão de depoimentos |
| `AdminSidebar.tsx` | Editar — link depoimentos |
| `App.tsx` | Editar — rota depoimentos |
| `AdminParceiros.tsx` | Editar — mostrar campos novos no detalhe |
| `ItineraryPlanner.tsx` | Editar — melhorar empty state |

