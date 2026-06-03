# Aplicar migrações no Supabase (ojpgobftvomqxyvrqxma)

Se `bootstrap_admin.sql` falha com **profiles não existe** ou **PARE AQUI**, o banco ainda está **vazio**. Rode isto **antes** do bootstrap.

## Opção 0 — Um único SQL no Editor (mais fácil se o terminal falhar)

1. Abra o arquivo **`docs/full_schema_apply.sql`** (todas as 30 migrações juntas).
2. Copie **tudo** (Ctrl+A).
3. Supabase → **SQL Editor** → New query → cole → **Run**.
4. Aguarde terminar (pode levar ~1 minuto). Se der erro em `update_demo_roles` / `ON CONFLICT (user_id)`, rode **`docs/fix_update_demo_roles.sql`** e continue.
5. Confirme com o SQL de verificação abaixo → depois rode `bootstrap_admin.sql`.

## Opção 1 — Terminal (recomendado)

No **PowerShell** (não no SQL Editor):

```powershell
cd "c:\Users\guilh\guatá viagens\guata-journey-weaver\guata-journey-weaver"
npx supabase login
npx supabase link --project-ref ojpgobftvomqxyvrqxma
npx supabase db push
```

Senha do banco: [Dashboard](https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma) → **Settings → Database → Database password**.

## Opção 2 — GitHub no Supabase

1. Dashboard do projeto → **Database** → **Migrations**
2. Se houver **Connect GitHub** / integração com o repo `guata-journey-weaver`, ative e deixe aplicar `supabase/migrations/`

## Opção 3 — SQL Editor (manual)

Abra cada arquivo em `supabase/migrations/` **na ordem do nome** (do `20260126...` ao `20260601130000...`), copie todo o conteúdo, cole no SQL Editor e **Run** — um arquivo por vez (~30).

## Conferir

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'user_roles', 'cms_pages', 'travel_requests');
```

**4 linhas** → pode rodar `docs/bootstrap_admin.sql`.
