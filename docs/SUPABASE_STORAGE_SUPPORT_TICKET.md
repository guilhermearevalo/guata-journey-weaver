# Ticket Supabase Support — Storage quebrado (Guatá)

**Projeto:** `ojpgobftvomqxyvrqxma`  
**Dashboard:** https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma  
**Abrir ticket:** https://supabase.com/dashboard/support/new  

---

## Passo 1 — Diagnóstico

SQL Editor → execute **`repair_storage_diagnostic.sql`** → copie **todo** o resultado.

---

## Passo 2 — Ticket em inglês (recomendado)

**Subject:** Storage schema invalid — project ojpgobftvomqxyvrqxma — HTTP 400 / PostgreSQL 42P17

**Message:**

```
Project ref: ojpgobftvomqxyvrqxma
Region: [e.g. South America (São Paulo)]

Issue:
All Storage uploads fail with HTTP 400:
"The database schema is invalid or incompatible."

PostgreSQL error class: 42P17 (invalid object definition) on insert into storage.objects.

Example:
POST /storage/v1/object/site-assets/agency-logo-xxx.jpeg → 400

Context:
- Dedicated Supabase project (migrated from Lovable Cloud development setup).
- Internal Storage migrations (storage.migrations) appear incomplete or out of sync.
  storage.objects may be missing columns/triggers expected by the current storage-api.
- Bucket "site-assets" recreated via Dashboard UI (public) on 2026-06-15 — upload still fails.
- RLS policies on storage.objects for site-assets are configured (staff via is_staff()).
- App migrations INSERT INTO storage.buckets is NOT the root cause.

Cannot fix via SQL Editor (expected):
- storage.* owned by supabase_storage_admin
- ALTER storage.objects / triggers → 42501 must be owner of table objects
- DELETE FROM storage.buckets → 42501 Direct deletion not allowed

Request:
Please repair / complete internal Storage schema for this project:
- Run pending storage.migrations through current storage-api version
- Ensure storage.objects has expected columns (owner_id, version, user_metadata, level, etc.)
- Ensure prefixes table and related triggers exist if required
- Verify authenticated upload to bucket "site-assets" succeeds

Diagnostic output (attach below):
[PASTE FULL OUTPUT FROM repair_storage_diagnostic.sql]
```

---

## Passo 2b — Ticket em português (alternativa)

**Assunto:** Schema Storage inválido — projeto ojpgobftvomqxyvrqxma — HTTP 400

**Mensagem:**

```
Referência do projeto: ojpgobftvomqxyvrqxma
Região: [ex.: South America (São Paulo)]

Problema:
Todos os uploads no Storage falham com HTTP 400:
"The database schema is invalid or incompatible."

Erro PostgreSQL 42P17 ao inserir em storage.objects.

Exemplo:
POST /storage/v1/object/site-assets/agency-logo-xxx.jpeg → 400

Contexto:
- Projeto Supabase dedicado (migrado de ambiente Lovable Cloud).
- Migrações internas do Storage (storage.migrations) parecem incompletas.
  storage.objects pode estar sem colunas/triggers que o storage-api atual espera.
- Bucket site-assets recriado pela UI (público) em 2026-06-15 — erro persiste.
- Políticas RLS em storage.objects para site-assets já configuradas.

Não consigo reparar pelo SQL Editor:
- Tabelas storage.* pertencem a supabase_storage_admin (42501).

Pedido:
Reparar / concluir o schema interno do Storage neste projeto
(storage.migrations, colunas e triggers de storage.objects, tabela prefixes se necessário)
e confirmar que upload autenticado para site-assets funciona.

Diagnóstico anexo:
[COLE O RESULTADO COMPLETO DO repair_storage_diagnostic.sql]
```

---

## Passo 3 — Depois que o Supabase corrigir

1. Confirme buckets em Storage → Buckets (`site-assets`, etc.)  
2. Execute **`ensure_site_assets_storage.sql`**  
3. Teste upload em https://agenciaguata.com/admin/configuracoes  
4. Opcional: `node scripts/test-storage-upload.mjs` com service_role  

---

## Enquanto aguarda

Use **URL** no admin (ex.: `https://www.agenciaguata.com/logo-guata.png`) → **Salvar Credenciais**.

---

## Plano B

Novo projeto Supabase + migrar dados; Storage provisionado completo desde o início. Ver **`MIGRAR_STORAGE.md`**.
