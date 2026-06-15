# Corrigir upload no Storage (erro 400 / schema invalid)

Erro no console:
```
StorageApiError: The database schema is invalid or incompatible.
POST .../storage/v1/object/site-assets/... 400
```

## Causa

O **Storage interno** do projeto Guatá (`ojpgobftvomqxyvrqxma`) está incompleto ou incompatível (migrações internas do Storage v3 não aplicadas pela plataforma). Isso **não se corrige** com SQL comum no dashboard — as tabelas `storage.*` pertencem ao role `supabase_storage_admin`.

Se ao rodar `repair_storage_schema.sql` aparecer:
```
ERROR: 42501: must be owner of table objects
```
é **esperado**. O SQL Editor não tem permissão para alterar essas tabelas.

---

## ✅ Solução que funciona agora (sem Storage)

### Cadastur / Logo / Certificado

1. Abra https://agenciaguata.com/admin/configuracoes (Ctrl+Shift+R)
2. Em **Cadastur**, use o campo **"ou cole a URL da imagem"**
3. Exemplos de URL que já funcionam no seu site:
   - Logo: `https://www.agenciaguata.com/logo-guata.png`
   - Banner: `https://www.agenciaguata.com/og-guata.png`
4. Clique **Salvar Credenciais**

### Hero (carrossel)

Use **"Adicionar por URL"** com link `https://` de imagem ou vídeo.

---

## Reparar upload de arquivo (requer Supabase)

### Passo 1 — Diagnóstico

Rode **`docs/repair_storage_diagnostic.sql`** no SQL Editor e **copie o resultado**.

### Passo 2 — Abrir ticket no Supabase Support

https://supabase.com/dashboard/support/new

**Assunto:** Storage schema invalid on project ojpgobftvomqxyvrqxma

**Mensagem (copie e cole):**
```
Project ref: ojpgobftvomqxyvrqxma
Error on upload: "The database schema is invalid or incompatible" (HTTP 400)
Cannot repair via SQL Editor: "42501: must be owner of table objects"

Please repair / re-initialize the internal Storage schema (migrations tenant 0016+)
and ensure bucket "site-assets" works for authenticated uploads.

Diagnostic output attached below:
[cole aqui o resultado do repair_storage_diagnostic.sql]
```

### Passo 3 — Depois que o Supabase corrigir

1. Confirme bucket **site-assets** (público) em Storage → Buckets
2. Rode **`docs/ensure_site_assets_storage.sql`** (políticas RLS — esse sim funciona no SQL Editor)
3. Teste upload em Admin → Configurações

---

## Checklist rápido

| Ação | Funciona no SQL Editor? |
|------|-------------------------|
| `repair_storage_diagnostic.sql` | ✅ Sim (só leitura) |
| `ensure_site_assets_storage.sql` | ✅ Sim (políticas) |
| `repair_storage_schema.sql` | ❌ Não (42501) |
| Colar URL no admin | ✅ Sim (agora) |
| Ticket Supabase Support | ✅ Sim (reparo definitivo) |
