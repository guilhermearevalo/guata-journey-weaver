# Alinhar app ao Supabase Guatá (`ojpgobftvomqxyvrqxma`)

## Projeto correto

| Campo | Valor |
|-------|--------|
| **Project ref** | `ojpgobftvomqxyvrqxma` |
| **URL** | `https://ojpgobftvomqxyvrqxma.supabase.co` |
| **Dashboard** | https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma |

## Não usar

`xddzshslltdxstqpwvzr` — backend gerenciado do Lovable Cloud (só preview Lovable).

---

## Checklist

### 1. Variáveis locais (`.env`)

Em **Settings → API** do projeto Guatá, copie a **anon public key** e preencha:

```env
VITE_SUPABASE_PROJECT_ID=ojpgobftvomqxyvrqxma
VITE_SUPABASE_URL=https://ojpgobftvomqxyvrqxma.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<sua anon key>
VITE_SITE_URL=https://www.agenciaguata.com
VITE_ONER_STORE_URL=https://www.comprarviagem.com.br/guataviagenseturismo/home
```

### 2. Hospedagem de produção (`agenciaguata.com`) — **Vercel**

O domínio está na **Vercel** (erro `404: NOT_FOUND` com ID `gru1::...` = página Vercel, não do app).

#### 2a. Rotas do React (`/experiencias`, `/sobre`, etc.)

A Vercel não usa `public/_redirects` (isso é Netlify). O arquivo `vercel.json` na raiz faz o rewrite para `index.html`. Após o push, faça **redeploy**.

#### 2b. Variáveis de ambiente na Vercel

**Project → Settings → Environment Variables** (Production):

| Variável | Valor |
|----------|--------|
| `VITE_SUPABASE_URL` | `https://ojpgobftvomqxyvrqxma.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key do dashboard Guatá |
| `VITE_SUPABASE_PROJECT_ID` | `ojpgobftvomqxyvrqxma` |
| `VITE_SITE_URL` | `https://www.agenciaguata.com` |
| `VITE_ONER_STORE_URL` | `https://www.comprarviagem.com.br/guataviagenseturismo/home` |

**Remova** variáveis antigas que apontem para `xddzshslltdxstqpwvzr`.

Os erros `401` no console (`xddzshslltdxstqpwvzr.supabase.co`) significam que o build ainda usa o Supabase **Lovable** com chave inválida. Corrija as variáveis e rode **Redeploy** (Deployments → ⋯ → Redeploy).

> Variáveis `VITE_*` são embutidas no build — mudar no painel **sem** redeploy não atualiza o site.

### 3. Migrações no banco Guatá

No terminal, na raiz do projeto:

```powershell
npx supabase login
npx supabase link --project-ref ojpgobftvomqxyvrqxma
npx supabase db push
```

Confirme no SQL Editor:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('cms_pages', 'travel_requests', 'user_roles');
```

### 4. Admin e contas demo

1. **Authentication → Users → Add user** — `guilhermearevalo27@gmail.com` (Auto Confirm)
2. SQL Editor → rode [`bootstrap_admin.sql`](./bootstrap_admin.sql)
3. SQL Editor → rode [`update_demo_passwords.sql`](./update_demo_passwords.sql) (só dev)

### 5. Testar

```powershell
npm run dev
```

- `/login` com `guilhermearevalo27@gmail.com`
- Painel demo **não** aparece em `agenciaguata.com` (só localhost)
