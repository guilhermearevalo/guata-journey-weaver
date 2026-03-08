

# Plano: Toggle de Pagamento na Proposta + Código de Acesso no Roteiro

## 3 mudanças solicitadas

### 1. Toggle "Pagamento Habilitado" na proposta

**Problema**: Hoje o botão de pagar aparece sempre na proposta pública. O parceiro quer enviar a proposta primeiro para o cliente revisar, discutir mudanças, e só depois ativar o pagamento para fechar.

**Solução**:
- Adicionar coluna `payment_enabled` (boolean, default `false`) na tabela `proposals`
- No formulário do parceiro (`PartnerProposta.tsx`): adicionar um Switch "Habilitar Pagamento" — quando desligado, o cliente vê a proposta mas sem botão de pagar
- Na proposta pública (`PropostaPublica.tsx`): só mostrar a seção de pagamento se `payment_enabled = true`
- Fluxo: Parceiro cria proposta (pagamento desligado) → Cliente revisa → Parceiro liga o pagamento → Cliente paga

### 2. Código de acesso no roteiro público

**Problema**: Hoje qualquer pessoa com o link `/roteiro/:token` acessa o roteiro. Operadoras profissionais usam código de acesso para proteger.

**Solução**:
- Adicionar coluna `access_code` (text, nullable) na tabela `proposals`
- No formulário do parceiro: campo para definir um código de acesso (ex: "NORONHA2026")
- Na página pública do roteiro (`RoteiroPublico.tsx`): se a proposta tem `access_code`, mostrar tela de input pedindo o código antes de exibir o roteiro
- O código é validado no frontend (comparação simples) — se errar, não mostra nada
- Sem código definido = acesso livre como hoje

### 3. Confirmação: repasse manual

Sim, o único passo manual é fazer o PIX/TED para o parceiro. Todo o resto (cálculo de comissão, registro, comprovante) é automático no sistema.

---

## Migração SQL

```sql
ALTER TABLE proposals 
  ADD COLUMN payment_enabled boolean DEFAULT false,
  ADD COLUMN access_code text;
```

## Arquivos a editar

1. **`src/pages/partner/PartnerProposta.tsx`**
   - Adicionar Switch para `payment_enabled`
   - Adicionar campo Input para `access_code`
   - Incluir ambos no `proposalData` ao salvar

2. **`src/pages/PropostaPublica.tsx`**
   - Condicionar seção de pagamento: só exibir se `proposal.payment_enabled === true`

3. **`src/pages/RoteiroPublico.tsx`**
   - Adicionar estado `accessCodeInput` e `isUnlocked`
   - Se `proposal.access_code` existe: mostrar tela com input + botão "Acessar"
   - Comparar código digitado com `proposal.access_code`
   - Se correto: mostrar roteiro. Se errado: mensagem de erro

4. **`src/pages/admin/AdminProposta.tsx`** (se existir o mesmo campo)
   - Replicar os mesmos controles para o admin

