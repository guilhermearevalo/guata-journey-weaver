

# Plano: Resolver lacunas do sistema de agências parceiras

## Resumo

Implementar 3 melhorias principais para eliminar processos manuais:

1. **Onboarding automatizado de parceiro** (ao aprovar agência, admin cria login direto)
2. **Parceiro pode atualizar status da demanda** (marcar "em operação" / "concluído")
3. **Parceiro pode cadastrar experiências** (com aprovação do admin antes de publicar)

---

## 1. Onboarding automatizado — Edge function `invite-partner`

### Edge function: `supabase/functions/invite-partner/index.ts`
- Recebe `{ agency_id, email, full_name }` do admin
- Usa `supabase.auth.admin.createUser()` com senha temporária gerada + `email_confirm: true`
- Insere na `user_roles` com role `partner`
- Insere na `partner_users` com `user_id` + `agency_id`
- Insere na `profiles` com `full_name` e `email`
- Retorna a senha temporária para o admin compartilhar com o parceiro

### UI: `AdminParceiros.tsx`
- Ao aprovar uma agência pendente, abrir dialog pedindo **email e nome do responsável**
- Chamar `supabase.functions.invoke('invite-partner')` com os dados
- Exibir a senha temporária para o admin copiar e enviar ao parceiro
- Fluxo: Aprovar → Preencher dados → Conta criada automaticamente

---

## 2. Parceiro atualiza status da demanda

### Migração SQL
- Criar RLS policy para partners poderem fazer UPDATE em `travel_requests` apenas nos campos `status`, restrito à sua agência e apenas para transições permitidas (`proposal_sent → in_operation → completed`)

### UI: `PartnerDemandas.tsx`
- No dialog de detalhes e nos cards, adicionar botões contextuais:
  - Se status = `proposal_sent` ou `approved`: botão "Iniciar Operação" → muda para `in_operation`
  - Se status = `in_operation`: botão "Marcar Concluído" → muda para `completed`
- Usar mutation com invalidação do cache

---

## 3. Parceiro cadastra experiências (com aprovação)

### Migração SQL
- Adicionar RLS policy para partners poderem INSERT/UPDATE em `experiences` onde `operator_agency_id = get_user_agency(auth.uid())` e `is_published = false`
- Parceiro cria experiência sempre com `is_published = false`; admin publica

### UI: `PartnerExperiencias.tsx`
- Adicionar botão "Nova Experiência" que abre formulário (reutilizar padrão do `ExperienceForm` do admin, adaptado)
- Experiências criadas pelo parceiro ficam com badge "Aguardando Aprovação"
- Parceiro pode editar apenas experiências não publicadas

---

## Detalhes Técnicos

### Config TOML
```toml
[functions.invite-partner]
verify_jwt = false
```

### RLS para update de status por parceiro
```sql
CREATE POLICY "Partners can update assigned request status"
ON public.travel_requests
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'partner') 
  AND assigned_agency_id = get_user_agency(auth.uid())
)
WITH CHECK (
  has_role(auth.uid(), 'partner') 
  AND assigned_agency_id = get_user_agency(auth.uid())
);
```

### RLS para experiências por parceiro
```sql
CREATE POLICY "Partners can insert own experiences"
ON public.experiences FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'partner') 
  AND operator_agency_id = get_user_agency(auth.uid())
  AND is_published = false
);

CREATE POLICY "Partners can update own unpublished experiences"
ON public.experiences FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'partner') 
  AND operator_agency_id = get_user_agency(auth.uid())
  AND is_published = false
)
WITH CHECK (
  has_role(auth.uid(), 'partner') 
  AND operator_agency_id = get_user_agency(auth.uid())
  AND is_published = false
);

CREATE POLICY "Partners can view own experiences"
ON public.experiences FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'partner') 
  AND operator_agency_id = get_user_agency(auth.uid())
);
```

### Ordem de implementação
1. Edge function `invite-partner` + UI no AdminParceiros
2. RLS + UI para parceiro atualizar status
3. RLS + UI para parceiro cadastrar experiências

