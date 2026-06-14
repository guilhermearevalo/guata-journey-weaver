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

### 2. Hospedagem de produção (`agenciaguata.com`)

O site **fora do Lovable** (Vercel, Netlify, etc.) precisa das **mesmas** variáveis no painel de Environment Variables, depois **redeploy**.

> Se o domínio ainda estiver no deploy **Lovable Cloud**, ele continuará usando `xddzshslltdxstqpwvzr`. Nesse caso é preciso hospedar o código exportado (Caminho A do `LOVABLE_SUPABASE_SETUP.md`).

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
