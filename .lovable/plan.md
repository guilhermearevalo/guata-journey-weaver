

# Plano de Correção Completa - Problemas de Login e Funcionalidades

## Diagnóstico Final

Após investigação profunda do banco de dados e código, identifiquei a causa raiz de todos os problemas:

---

## PROBLEMA PRINCIPAL: Trigger de Criação de Usuário Não Existe

**Causa:** A migração inclui a criação do trigger `on_auth_user_created`, mas o trigger **NÃO FOI CRIADO** no banco de dados. Isso acontece porque em projetos remix/clonados, triggers em tabelas do schema `auth` frequentemente não são migrados corretamente.

**Evidência:**
- Função `handle_new_user()` **existe** no banco
- Trigger `on_auth_user_created` **NÃO existe** no banco
- Tabelas `user_roles` e `profiles` estão **vazias**
- Usuários demo existem: `admin@guata.test`, `consultor@guata.test`, `parceiro@guata.test`

**Consequência em cascata:**
1. Quando demo login cria usuário, o trigger não dispara
2. `profiles` e `user_roles` ficam vazios
3. `update_demo_roles()` tenta UPDATE em registros que não existem
4. Login não consegue identificar o role
5. Redirecionamento sempre vai para `/` (fallback para client)

---

## SOLUÇÃO COMPLETA

### ETAPA 1: Recriar o Trigger no Banco de Dados

Executar SQL para criar o trigger que está faltando:

```sql
-- Dropar se existir (para evitar erro)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar o trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### ETAPA 2: Popular Dados dos Usuários Existentes

Como os usuários demo já existem mas não têm profiles/roles, precisamos inserir manualmente:

```sql
-- Inserir profiles para usuários existentes
INSERT INTO public.profiles (user_id, full_name, email)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    email
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- Inserir roles default (client) para usuários existentes
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'client'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;

-- Atualizar roles dos usuários demo
UPDATE public.user_roles 
SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@guata.test');

UPDATE public.user_roles 
SET role = 'consultant' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultor@guata.test');

UPDATE public.user_roles 
SET role = 'partner' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parceiro@guata.test');
```

### ETAPA 3: Corrigir Warning de Ref no Console

O warning "Function components cannot be given refs" está ocorrendo porque o `CmsPageSkeleton` é retornado diretamente em componentes que podem receber refs do React Router.

**Arquivo:** `src/components/cms/CmsPageSkeleton.tsx`

**Correção:** Envolver o componente com `forwardRef`:

```typescript
import { forwardRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const CmsPageSkeleton = forwardRef<HTMLDivElement>((props, ref) => {
  return (
    <div ref={ref} className="min-h-screen bg-background">
      {/* ... resto do componente ... */}
    </div>
  );
});

CmsPageSkeleton.displayName = 'CmsPageSkeleton';

export default CmsPageSkeleton;
```

### ETAPA 4: Melhorar Fluxo de Demo Login

O fluxo atual de demo login depende do trigger funcionar E do `update_demo_roles()` fazer UPDATE. Como agora o trigger vai funcionar, o fluxo será:

1. Demo login clica -> signUp cria usuário
2. Trigger `on_auth_user_created` dispara automaticamente
3. Profile e role 'client' são criados
4. `update_demo_roles()` atualiza para o role correto

Mas para evitar problemas futuros, vamos melhorar o `update_demo_roles()` para fazer UPSERT:

```sql
CREATE OR REPLACE FUNCTION public.update_demo_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Garantir que profiles existem
    INSERT INTO public.profiles (user_id, full_name, email)
    SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email
    FROM auth.users
    WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id) DO NOTHING;

    -- Garantir que roles existem com UPSERT
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'client' FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Atualizar roles específicos
    UPDATE public.user_roles SET role = 'admin' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@guata.test');

    UPDATE public.user_roles SET role = 'consultant' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultor@guata.test');

    UPDATE public.user_roles SET role = 'partner' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parceiro@guata.test');
END;
$$;
```

---

## Resumo das Alterações

### Banco de Dados (SQL)

| Ação | Descrição |
|------|-----------|
| CREATE TRIGGER | Criar `on_auth_user_created` no `auth.users` |
| INSERT profiles | Popular profiles para usuários existentes |
| INSERT user_roles | Popular roles para usuários existentes |
| UPDATE roles | Definir roles corretos para demo accounts |
| REPLACE FUNCTION | Melhorar `update_demo_roles()` com UPSERT |

### Código

| Arquivo | Alteração |
|---------|-----------|
| `src/components/cms/CmsPageSkeleton.tsx` | Adicionar `forwardRef` para eliminar warning |

---

## Ordem de Execução

1. **Executar SQL** - Criar trigger + popular dados existentes
2. **Atualizar CmsPageSkeleton** - Corrigir warning de ref
3. **Testar logins** - Verificar redirecionamento correto

---

## Resultado Esperado

Após as correções:

| Cenário | Comportamento |
|---------|---------------|
| Login Admin | Redireciona para `/admin` |
| Login Consultor | Redireciona para `/admin` |
| Login Parceiro | Redireciona para `/` (área parceiro futura) |
| Login Cliente | Redireciona para `/` |
| Novo cadastro | Cria profile + role automaticamente |
| Páginas CMS | Funcionam sem warnings |
| Console | Limpo de warnings de ref |

---

## Seção Técnica - SQL Completo

```sql
-- 1. Criar trigger que está faltando
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Popular profiles para usuários existentes
INSERT INTO public.profiles (user_id, full_name, email)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
    email
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;

-- 3. Inserir roles para usuários existentes
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'client'
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;

-- 4. Atualizar roles demo
UPDATE public.user_roles SET role = 'admin' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@guata.test');

UPDATE public.user_roles SET role = 'consultant' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultor@guata.test');

UPDATE public.user_roles SET role = 'partner' 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parceiro@guata.test');

-- 5. Melhorar função update_demo_roles com UPSERT
CREATE OR REPLACE FUNCTION public.update_demo_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Garantir profiles
    INSERT INTO public.profiles (user_id, full_name, email)
    SELECT id, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)), email
    FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id) DO NOTHING;

    -- Garantir roles com valores default
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'client' FROM auth.users WHERE email LIKE '%@guata.test'
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Atualizar para roles corretos
    UPDATE public.user_roles SET role = 'admin' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@guata.test');
    
    UPDATE public.user_roles SET role = 'consultant' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'consultor@guata.test');
    
    UPDATE public.user_roles SET role = 'partner' 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'parceiro@guata.test');
END;
$$;
```

