# Configuração Supabase (projeto Guatá)

Projeto Supabase em uso:

- **Project ref:** `ojpgobftvomqxyvrqxma`
- **URL:** `https://ojpgobftvomqxyvrqxma.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma

## O que o Lovable deve fazer

### 1. Variáveis de ambiente (obrigatório)

Em **Settings → Environment / Secrets**, definir:

```
VITE_SUPABASE_URL=https://ojpgobftvomqxyvrqxma.supabase.co
VITE_SUPABASE_PROJECT_ID=ojpgobftvomqxyvrqxma
VITE_SUPABASE_PUBLISHABLE_KEY=<anon public key do dashboard Settings → API>
VITE_SITE_URL=https://www.agenciaguata.com
VITE_ONER_STORE_URL=https://www.comprarviagem.com.br/guataviagenseturismo/home
```

Depois **redeploy** do site.

### 2. Conector Supabase

- **Settings → Connectors → Supabase**
- Conectar a organização onde está o projeto `ojpgobftvomqxyvrqxma`
- Garantir que este repositório GitHub está ligado ao mesmo projeto (migrações automáticas)

### 3. Aplicar migrações do banco

Se **Database → Migrations** no Supabase estiver vazio, aplicar todas as migrações em `supabase/migrations/` na ordem do nome do arquivo (30 arquivos), via:

- Integração GitHub → Supabase (push em `main`), ou
- `supabase db push` com project ref `ojpgobftvomqxyvrqxma`

### 4. Verificar banco

No SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('cms_pages', 'travel_requests', 'user_roles');
```

Deve retornar 3 linhas.

### 5. Usuário admin (manual no dashboard)

1. **Authentication → Users → Add user** (e-mail + senha, Auto Confirm)
2. SQL Editor:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'EMAIL_DO_ADMIN@exemplo.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

### 6. Storage

Confirmar bucket **`site-assets`** (público). Migração: `20260601130000_ensure_site_assets_bucket.sql`.

### 7. Testes pós-deploy

- Login em `/login`
- Admin → Nova Demanda
- Admin → CMS → `politica-servicos` → upload PDF ou URL
- Páginas `/termos` e `/politica-servicos`

## Projeto antigo (não usar)

`xddzshslltdxstqpwvzr` — descontinuado.
