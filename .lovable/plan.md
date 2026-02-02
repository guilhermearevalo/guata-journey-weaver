
# Plano de Correção - Problemas Encontrados na Plataforma Guatá

## Diagnóstico Completo

Após análise detalhada do código e banco de dados, identifiquei os seguintes problemas:

---

## PROBLEMA 1: Páginas Institucionais Não Encontradas

**Páginas afetadas:** Sobre, FAQ, Termos, Privacidade, Contato

**Causa:** A tabela `cms_pages` está vazia. O SQL de inserção de conteúdo existe na migration, mas os dados não foram populados neste ambiente.

**Solução:** Executar INSERT para popular a tabela `cms_pages` com as 5 páginas institucionais (status = 'published').

---

## PROBLEMA 2: Login Redireciona para Tela Inicial

**Causa Identificada:** No arquivo `Login.tsx`, após login bem-sucedido:
- Linha 55: `navigate('/')` - sempre redireciona para home
- Linha 105: `navigate(account.redirectTo)` - usa redirect do demo account

O problema é que o login normal (formulário) sempre vai para `/` independente do role do usuário.

**Comportamento Esperado:**
| Role | Destino após login |
|------|-------------------|
| admin, consultant, manager | `/admin` |
| partner | `/partner` (portal do parceiro) |
| client | `/minha-conta` ou `/` |

**Solução:** Modificar `Login.tsx` para:
1. Após login, consultar o role do usuário
2. Redirecionar baseado no role

---

## PROBLEMA 3: Tabelas de Dados Vazias

**Tabelas afetadas:**
- `user_roles` - vazia (users criados sem roles)
- `profiles` - vazia (users criados sem perfis)

**Causa:** Quando você fez remix do projeto, os usuários demo foram criados no projeto original. No novo projeto, a função `update_demo_roles` tenta atualizar roles de usuários que não existem.

**Solução:** Verificar se os triggers estão funcionando e inserir dados de seed.

---

## PROBLEMA 4: Warning de Ref no Console

**Erro:** "Function components cannot be given refs" no `PublicHeader`

**Causa:** O `DropdownMenu` do Radix UI está recebendo uma ref inválida.

**Solução:** Verificar componentes que usam `asChild` e garantir que o filho suporta forwarded refs.

---

## Plano de Implementação

### ETAPA 1: Popular Banco de Dados

Executar SQL para inserir:
1. Conteúdo CMS (5 páginas institucionais)
2. Dados de exemplo já existentes (experiências, agências, etc.)

```sql
-- Inserir páginas CMS se não existirem
INSERT INTO public.cms_pages (slug, title, content, status) 
VALUES 
  ('sobre', 'Sobre a Guatá', {...}, 'published'),
  ('faq', 'Perguntas Frequentes', {...}, 'published'),
  ('termos', 'Termos de Uso', {...}, 'published'),
  ('privacidade', 'Política de Privacidade', {...}, 'published'),
  ('contato', 'Contato', {...}, 'published')
ON CONFLICT (slug) DO NOTHING;
```

### ETAPA 2: Corrigir Fluxo de Login

Modificar `src/pages/Login.tsx`:

```typescript
// Após login bem-sucedido, buscar role e redirecionar
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  const { error } = await signIn(email, password);

  if (error) {
    toast({ title: 'Erro ao entrar', variant: 'destructive' });
  } else {
    // Buscar role do usuário
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', supabase.auth.getUser()?.data.user?.id)
      .maybeSingle();
    
    const role = roleData?.role || 'client';
    const isStaff = ['admin', 'consultant', 'manager'].includes(role);
    
    // Redirecionar baseado no role
    if (isStaff) {
      navigate('/admin');
    } else if (role === 'partner') {
      navigate('/partner'); // ou criar área do parceiro
    } else {
      navigate('/');
    }
    
    toast({ title: 'Bem-vindo!' });
  }
  setLoading(false);
};
```

### ETAPA 3: Melhorar Tratamento de Erros CMS

Modificar as páginas CMS para exibir conteúdo padrão quando o banco estiver vazio, em vez de "Não encontrado".

**Arquivos a modificar:**
- `src/pages/Sobre.tsx`
- `src/pages/FAQ.tsx`
- `src/pages/Termos.tsx`
- `src/pages/Privacidade.tsx`
- `src/pages/Contato.tsx`

Lógica: Se não houver dados no CMS, exibir conteúdo estático hardcoded.

### ETAPA 4: Corrigir Warning de Console

Modificar `src/components/layout/PublicHeader.tsx`:
- Remover ref inválido do DropdownMenu
- Verificar uso de `asChild` com componentes corretos

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/Login.tsx` | Implementar redirecionamento por role |
| `src/pages/Sobre.tsx` | Adicionar fallback para conteúdo estático |
| `src/pages/FAQ.tsx` | Adicionar fallback para conteúdo estático |
| `src/pages/Termos.tsx` | Adicionar fallback para conteúdo estático |
| `src/pages/Privacidade.tsx` | Adicionar fallback para conteúdo estático |
| `src/pages/Contato.tsx` | Adicionar fallback para conteúdo estático |
| `src/components/layout/PublicHeader.tsx` | Corrigir warning de ref |
| **SQL** | Popular `cms_pages` com conteúdo |

---

## Ordem de Execução

1. **SQL:** Inserir conteúdo CMS no banco (resolve páginas "não encontradas")
2. **Login.tsx:** Implementar redirecionamento inteligente por role
3. **Páginas CMS:** Adicionar fallback de conteúdo estático
4. **PublicHeader:** Corrigir warning de ref

---

## Resultado Esperado

Após as correções:
- Páginas Sobre, FAQ, Termos, Privacidade e Contato funcionarão corretamente
- Login como Admin/Consultor redirecionará para `/admin`
- Login como Parceiro redirecionará para área específica
- Login como Cliente ficará na home ou área do cliente
- Console limpo de warnings
