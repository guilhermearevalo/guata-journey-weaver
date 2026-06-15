# Corrigir upload no Storage (erro 400 / schema invalid)

Erro no console:
```
StorageApiError: The database schema is invalid or incompatible.
POST .../storage/v1/object/site-assets/... 400
```

## Causa

Os buckets `site-assets` e `testimonials` foram criados via **INSERT SQL** nas migrações do projeto. No **Storage v3**, isso deixa o bucket em estado inválido — o upload falha com erro 400 mesmo com RLS e admin corretos.

**Não é bug do app nem da Vercel.** É o bucket criado pelo SQL.

---

## ✅ Reparo (5 minutos)

### Passo 1 — SQL Editor

Abra https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new

Cole e execute **`docs/repair_storage_bucket.sql`** (remove os buckets quebrados).

### Passo 2 — Criar bucket pela UI

1. https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/storage/buckets
2. **New bucket**
3. Nome: `site-assets`
4. Marque **Public bucket**
5. Create

> **Não** crie o bucket via SQL.

### Passo 3 — Políticas RLS

No SQL Editor, execute **`docs/ensure_site_assets_storage.sql`**.

### Passo 4 — Testar

1. Admin → https://agenciaguata.com/admin/configuracoes
2. Envie uma imagem (Cadastur ou Hero)
3. Deve aparecer “Imagem enviada!” sem erro 400

---

## Reparo automático (opcional)

Com token de conta Supabase:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."   # https://supabase.com/dashboard/account/tokens
node scripts/repair-storage.mjs
```

O script remove buckets SQL, recria `site-assets` via API, aplica RLS e testa upload.

---

## Se ainda falhar após o reparo

Rode **`docs/repair_storage_diagnostic.sql`** e abra ticket no Supabase Support:

https://supabase.com/dashboard/support/new

**Assunto:** Storage schema invalid on project ojpgobftvomqxyvrqxma

Anexe o resultado do diagnóstico. Não rode `repair_storage_schema.sql` no SQL Editor (erro 42501 — tabelas são do `supabase_storage_admin`).

---

## Checklist

| Ação | Onde |
|------|------|
| `repair_storage_bucket.sql` | SQL Editor ✅ |
| Criar bucket `site-assets` | Storage UI ✅ |
| `ensure_site_assets_storage.sql` | SQL Editor ✅ |
| `repair_storage_schema.sql` | ❌ Não usar |
| Workaround URL no admin | Só se Storage indisponível |
