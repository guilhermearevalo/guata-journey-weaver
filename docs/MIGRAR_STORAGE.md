# Migrar / configurar Storage — projeto Guatá

**Projeto:** `ojpgobftvomqxyvrqxma`  
**Origem Lovable Cloud (referência):** `xddzshslltdxstqpwvzr`

Guia para buckets, RLS, cópia de arquivos e reparo do schema interno.

---

## Pré-requisito: schema interno do Storage

Se upload retorna **400 — "database schema is invalid or incompatible"**, o projeto precisa de reparo em `storage.migrations` **antes** de buckets/arquivos funcionarem.

1. Rode `docs/repair_storage_diagnostic.sql`  
2. Abra ticket: `docs/SUPABASE_STORAGE_SUPPORT_TICKET.md`  
3. **Opcional:** Dashboard → Project Settings → tente **Pause project** → **Restore** (pode forçar re-run de migrações internas — sem garantia; Support é mais confiável)

Enquanto aguarda: use **URL** no admin para imagens.

---

## Passo 1 — Criar buckets no destino (UI)

https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/storage/buckets

| Bucket | Público? | Uso |
|--------|----------|-----|
| `site-assets` | Sim | Logo, hero, Cadastur, CMS |
| `testimonials` | Sim | Fotos de depoimentos |
| `travel-documents` | Não | PDFs / documentos de viagem |

**New bucket** → nome exato → marque Public se aplicável → Create.

> Não use `INSERT INTO storage.buckets` no SQL Editor para projetos novos.

---

## Passo 2 — Políticas RLS

No SQL Editor, execute:

- **`docs/ensure_site_assets_storage.sql`** — bucket `site-assets`

Políticas de `testimonials` e `travel-documents` já estão nas migrações do repo (`CREATE POLICY ... ON storage.objects`). Se faltarem, reaplique a partir das migrações correspondentes ou do `docs/full_schema_apply.sql` (blocos `CREATE POLICY` apenas).

---

## Passo 3 — Copiar objetos (Lovable → Guatá)

Use a **Storage API** (não SQL). Script auxiliar:

```powershell
# Requer service_role do projeto DESTINO (Settings → API)
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."
node scripts/repair-storage.mjs
```

Para migração completa Lovable → Guatá, copie arquivos bucket a bucket com script dedicado (listar origem com service_role Lovable, upload no destino). O `repair-storage.mjs` recria `site-assets` e testa upload no **destino**.

---

## Passo 4 — Verificar

1. `docs/repair_storage_diagnostic.sql` — confira `storage.migrations` e colunas de `storage.objects`  
2. `node scripts/test-storage-upload.mjs` — deve retornar **Upload OK**  
3. Admin → Configurações → enviar imagem de teste  

---

## Passo 5 — App em produção

- Vercel: `VITE_SUPABASE_URL` = `https://ojpgobftvomqxyvrqxma.supabase.co`  
- **Não** apontar produção para `xddzshslltdxstqpwvzr`  
- Upload habilitado por padrão (`src/lib/storageUploads.ts`); URL manual continua como fallback  

---

## Referências

| Arquivo | Uso |
|---------|-----|
| `docs/STORAGE_FAQ_LOVABLE.md` | Perguntas Lovable × dedicado |
| `docs/SUPABASE_STORAGE_SUPPORT_TICKET.md` | Ticket Support |
| `docs/O_QUE_FAZER_AGORA.md` | Checklist imediato |
| `docs/ALINHAMENTO_LOVABLE_STORAGE.md` | Resumo do alinhamento |
