# Self-hosting do Guatá com Supabase próprio

Este guia explica como rodar o app **fora do Lovable**, apontando para o seu
projeto Supabase próprio.

- **Project ref:** `ojpgobftvomqxyvrqxma`
- **URL:** `https://ojpgobftvomqxyvrqxma.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma

> ⚠️ Importante: dentro do editor Lovable o backend é **fixo** no projeto
> gerenciado. O `.env` e o `src/integrations/supabase/client.ts` são gerados
> automaticamente e qualquer edição manual é sobrescrita. Por isso, para usar o
> Supabase próprio é necessário **exportar o código e hospedar você mesmo**
> (Vercel, Netlify, etc.). O preview dentro do Lovable continua usando o backend
> gerenciado — isso é esperado.
>
> Boa notícia: o `client.ts` já lê as variáveis `VITE_SUPABASE_URL` e
> `VITE_SUPABASE_PUBLISHABLE_KEY` do ambiente. Então a troca de backend é
> **100% por variáveis de ambiente** na sua hospedagem — não precisa alterar código.

---

## 1. Exportar o código

Escolha uma opção:

- **GitHub** (recomendado): menu **+ → GitHub → Connect project**, depois
  `git clone` do repositório.
- **Download direto**: Code Editor → **Download codebase** (rodapé da árvore de arquivos).

## 2. Configurar o Supabase externo (`ojpgobftvomqxyvrqxma`)

### 2.1 Aplicar as migrações

Com a [Supabase CLI](https://supabase.com/docs/guides/cli) instalada, na raiz do projeto:

```bash
supabase link --project-ref ojpgobftvomqxyvrqxma
supabase db push
```

Isso aplica **todos** os arquivos de `supabase/migrations/` na ordem do nome.

### 2.2 Verificar o banco

No SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('cms_pages', 'travel_requests', 'user_roles');
```

Deve retornar 3 linhas.

### 2.3 Verificar o Storage

Confirme o bucket **`site-assets`** (público). Ele é criado pela migração
`20260601130000_ensure_site_assets_bucket.sql`.

### 2.4 Criar o usuário admin

1. **Authentication → Users → Add user**
   - E-mail: `guilhermearevalo27@gmail.com`
   - Marque **Auto Confirm User** e defina uma senha.
2. No **SQL Editor**, rode o script [`docs/bootstrap_admin.sql`](./bootstrap_admin.sql).
   Ele cria o profile, define o papel `admin` e mantém o **Login de Demonstração**
   funcionando.

### 2.5 Edge Functions e secrets

As edge functions (`supabase/functions/`) precisam ser deployadas no projeto externo:

```bash
supabase functions deploy itinerary-ai
```

E os secrets reconfigurados no projeto externo (Dashboard → Edge Functions → Secrets,
ou via CLI `supabase secrets set`):

```
LOVABLE_API_KEY=...
STRIPE_SECRET_KEY=...
```

> O `LOVABLE_API_KEY` é fornecido pelo Lovable Cloud. Fora do Lovable você precisará
> de uma chave própria do provedor de IA equivalente para a função `itinerary-ai`.

## 3. Configurar a hospedagem (Vercel / Netlify)

Defina as variáveis de ambiente do build:

```
VITE_SUPABASE_URL=https://ojpgobftvomqxyvrqxma.supabase.co
VITE_SUPABASE_PROJECT_ID=ojpgobftvomqxyvrqxma
VITE_SUPABASE_PUBLISHABLE_KEY=<anon public key — Settings → API>
VITE_SITE_URL=https://www.agenciaguata.com
VITE_ONER_STORE_URL=https://www.comprarviagem.com.br/guataviagenseturismo/home
```

Comando de build: `npm run build` — diretório de saída: `dist`.

Faça o deploy / redeploy.

## 4. Testes pós-deploy

- Login em `/login` com `guilhermearevalo27@gmail.com`
- Login de Demonstração (botões Admin/Consultor/Parceiro/Cliente)
- Admin → Nova Demanda
- Admin → CMS → upload de PDF/URL
- Páginas `/termos` e `/politica-servicos`

---

## Projeto antigo (não usar)

`xddzshslltdxstqpwvzr` — backend gerenciado do Lovable (usado apenas no preview do editor).
