# Corrigir upload no Storage (erro 400 / schema invalid)

Erro no console:

```
StorageApiError: The database schema is invalid or incompatible.
POST .../storage/v1/object/site-assets/... 400
```

## Causa (confirmado — Lovable + Supabase)

As **migrações internas do Storage** (`storage.migrations`) **não rodaram por completo** no projeto dedicado `ojpgobftvomqxyvrqxma`. A tabela `storage.objects` fica sem colunas/triggers que a versão atual do `storage-api` espera → erro PostgreSQL **42P17**.

**Não é causado por** `INSERT INTO storage.buckets` nas migrações do app (isso é suportado).

**Não é bug do app nem da Vercel.** Tabelas `storage.*` pertencem a `supabase_storage_admin` — reparo só via **Supabase Support** ou ações de plataforma no dashboard.

---

## ✅ O que fazer (só você — projeto Guatá)

### 1. Diagnóstico

SQL Editor: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new

Execute **`docs/repair_storage_diagnostic.sql`** e copie todo o resultado.

### 2. Ticket Supabase Support

https://supabase.com/dashboard/support/new

Use o texto em **`docs/SUPABASE_STORAGE_SUPPORT_TICKET.md`**.

### 3. Enquanto aguarda

Admin → Configurações → cole **URL** da imagem → **Salvar Credenciais**.

### 4. Depois que corrigirem

1. Confirme bucket **site-assets** (público)  
2. Execute **`docs/ensure_site_assets_storage.sql`**  
3. Teste upload no admin  

---

## O que NÃO resolve

| Ação | Por quê |
|------|---------|
| Recriar bucket na UI | Schema interno continua incompleto |
| `repair_storage_schema.sql` no SQL Editor | 42501 — sem permissão |
| Redeploy Vercel | Não altera `storage.migrations` |
| Lovable | Sem acesso ao projeto `ojpgobftvomqxyvrqxma` |

---

## Escopo dos projetos

| Projeto | Ref | Storage |
|---------|-----|---------|
| Lovable Cloud | `xddzshslltdxstqpwvzr` | OK (Lovable gerencia) |
| Produção Guatá | `ojpgobftvomqxyvrqxma` | Quebrado — ticket Supabase |

Guia completo: **`docs/MIGRAR_STORAGE.md`** · FAQ: **`docs/STORAGE_FAQ_LOVABLE.md`**
