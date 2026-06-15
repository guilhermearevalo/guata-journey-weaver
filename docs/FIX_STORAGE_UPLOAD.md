# Corrigir upload no Storage (erro 400 / schema invalid)

Erro no console:

```
StorageApiError: The database schema is invalid or incompatible.
POST .../storage/v1/object/site-assets/... 400
```

## Causa

Os buckets `site-assets` e `testimonials` foram criados via **INSERT SQL** nas migrações. No **Storage v3**, isso deixa o bucket inválido.

**Não é bug do app nem da Vercel.**

---

## ✅ Reparo manual (Dashboard — recomendado)

### Passo 1 — Diagnóstico (opcional)

SQL Editor: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new

Execute **`docs/repair_storage_bucket.sql`** (só SELECT — seguro).

### Passo 2 — Apagar bucket quebrado pela UI

1. https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/storage/buckets
2. Se existir `site-assets`, clique **⋯** → **Delete bucket**
3. Repita para `testimonials` se existir

> **Não** use `DELETE FROM storage.buckets` no SQL Editor — o Supabase retorna erro 42501 (*Direct deletion from storage tables is not allowed*).

### Passo 3 — Criar bucket novo pela UI

1. **New bucket**
2. Nome: `site-assets`
3. Marque **Public bucket**
4. **Create**

### Passo 4 — Políticas RLS

No SQL Editor, execute **`docs/ensure_site_assets_storage.sql`**.

### Passo 5 — Testar

Admin → https://agenciaguata.com/admin/configuracoes → envie uma imagem.

---

## Reparo automático (script)

### Teste rápido (confirma se o problema é no Supabase)

1. https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/settings/api  
2. Copie a **secret key** (`sb_secret_...` / service_role)  
3. No terminal do projeto:

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."
node scripts/test-storage-upload.mjs
```

- **Se falhar** com o mesmo erro → schema interno quebrado; só o **Supabase Support** repara. Rode `docs/repair_storage_diagnostic.sql` e abra ticket.  
- **Se passar** → rode `docs/ensure_site_assets_storage.sql` e teste no admin.

### Reparo completo

```powershell
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."
node scripts/repair-storage.mjs
# Depois: docs/ensure_site_assets_storage.sql no SQL Editor
```

---

## Se ainda falhar

Rode **`docs/repair_storage_diagnostic.sql`** e abra ticket: https://supabase.com/dashboard/support/new

Não rode `repair_storage_schema.sql` no SQL Editor (erro 42501).

---

## Checklist

| Ação | Onde |
|------|------|
| `repair_storage_bucket.sql` | SQL Editor (só leitura) ✅ |
| Apagar bucket | Storage UI ou script ✅ |
| Criar `site-assets` | Storage UI ✅ |
| `ensure_site_assets_storage.sql` | SQL Editor ✅ |
| `DELETE FROM storage.buckets` | ❌ Bloqueado pelo Supabase |
