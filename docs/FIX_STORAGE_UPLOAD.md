# Corrigir upload no Storage (erro 400 / schema invalid)

Erro no console:
```
StorageApiError: The database schema is invalid or incompatible.
POST .../storage/v1/object/site-assets/... 400
```

## Causa

O projeto Supabase Guatá (`ojpgobftvomqxyvrqxma`) usa **Storage v3**. Criar o bucket só com `INSERT INTO storage.buckets` no SQL Editor deixa o schema **incompatível** com a API de Storage — o upload falha mesmo que a linha apareça na tabela.

## Solução (recomendada)

### Passo 1 — Criar o bucket pela interface (obrigatório)

1. Abra **Storage** no dashboard:  
   https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/storage/buckets
2. **New bucket**
3. Nome: `site-assets`
4. Marque **Public bucket**
5. Create

Repita para `testimonials` se for usar fotos em depoimentos.

### Passo 2 — Políticas RLS (SQL)

No SQL Editor, rode apenas **`docs/ensure_site_assets_storage.sql`** (parte das políticas — o script não insere bucket).

### Passo 3 — Se já criou bucket via SQL antes

Apague o bucket inválido pela UI (Storage → site-assets → Delete) e crie de novo pelo **Passo 1**.

### Passo 4 — Testar

1. Faça login como admin em https://agenciaguata.com/login  
2. Admin → Configurações → Cadastur → Enviar imagem  
3. Ctrl+Shift+R se a página estiver em cache

## Diagnóstico (opcional)

No SQL Editor:

```sql
-- Versão das migrações internas do Storage (v3 deve ter id >= 17)
SELECT * FROM storage.migrations ORDER BY id;

-- Buckets registrados
SELECT id, name, public, created_at FROM storage.buckets;
```

Se `storage.migrations` não existir ou estiver vazio, abra um ticket no Supabase ou rode `supabase db push` com CLI linkada ao projeto.

## Solução completa (CLI)

```powershell
npx supabase login
npx supabase link --project-ref ojpgobftvomqxyvrqxma
npx supabase db push
```

Depois confirme o bucket `site-assets` no dashboard (crie pela UI se ainda não existir).
