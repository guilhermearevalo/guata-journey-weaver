# O que fazer agora — Guatá (agenciaguata.com)

Projeto Supabase: **ojpgobftvomqxyvrqxma**  
Dashboard: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma

---

## A. Upload de imagens (Storage quebrado) — PRIORIDADE

O upload pelo admin **só volta** depois que a **Supabase** reparar o schema interno do Storage. Você não conserta isso pelo SQL Editor.

### A1. Rodar diagnóstico (2 min)

1. Abra: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new  
2. Abra o arquivo **`docs/repair_storage_diagnostic.sql`** neste repo  
3. Copie **tudo** e execute no SQL Editor  
4. Copie **todo** o resultado (várias tabelas) para um bloco de notas  

### A2. Abrir ticket no Supabase (5 min)

1. Abra: https://supabase.com/dashboard/support/new  
2. **Subject:** `Storage schema invalid — project ojpgobftvomqxyvrqxma — HTTP 400 on upload`  
3. Cole o texto em inglês de **`docs/SUPABASE_STORAGE_SUPPORT_TICKET.md`** (seção "Passo 2")  
4. No final, cole o resultado do diagnóstico (A1)  
5. Envie o ticket  

### A3. Enquanto aguarda o suporte

No admin https://agenciaguata.com/admin/configuracoes:

1. **Não** use "Enviar Logo" / "Enviar Imagem" (vai dar erro 400)  
2. Cole a **URL** da imagem, por exemplo:
   - Logo: `https://www.agenciaguata.com/logo-guata.png`
3. Clique **Salvar Credenciais**  

### A4. Depois que o Supabase disser que corrigiu

1. Storage → confirme bucket **site-assets** (público)  
2. SQL Editor → execute **`docs/ensure_site_assets_storage.sql`**  
3. Teste upload no admin (logo ou hero)  
4. (Opcional) No PowerShell, na pasta do projeto:

```powershell
cd "c:\Users\guilh\guatá viagens\guata-journey-weaver\guata-journey-weaver"
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."   # Settings → API → secret key
node scripts/test-storage-upload.mjs
```

Se aparecer **Upload OK**, está resolvido.

---

## B. Demandas em tempo real no Kanban (1 min)

Para novas demandas e mudanças de coluna aparecerem **sem recarregar** a página:

1. SQL Editor: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new  
2. Execute **`docs/enable_realtime_travel_requests.sql`**  
3. Teste: Admin → Demandas → crie ou mova uma demanda  

---

## C. Login admin

- URL: https://agenciaguata.com/login  
- Email: `guilhermearevalo27@gmail.com`  
- Senha: a que você definiu no Supabase Auth  

Se não entrar: Authentication → Users no dashboard Guatá e confirme que o usuário existe e está confirmado. Depois rode **`docs/bootstrap_admin.sql`** no SQL Editor.

---

## D. O que NÃO fazer / esclarecimentos

| Item | Realidade |
|------|-----------|
| `INSERT INTO storage.buckets` nas migrações | **Não é a causa** do erro (confirmado Lovable) |
| `DELETE FROM storage.buckets` no SQL | Erro 42501 — use UI se precisar apagar bucket |
| `repair_storage_schema.sql` no SQL Editor | Erro 42501 — só Supabase Support |
| Pedir ao Lovable reparar | Sem acesso ao projeto `ojpgobftvomqxyvrqxma` |
| Redeploy Vercel | Não altera `storage.migrations` |

---

## E. Ordem recomendada hoje

1. **A1 + A2** — diagnóstico + ticket Storage (upload definitivo)  
2. **A3** — configurar logo/certificado por URL no admin  
3. **B** — realtime no Kanban  
4. **A4** — só quando o suporte responder  

---

## E. Documentação do plano Lovable

| Arquivo | Conteúdo |
|---------|----------|
| `docs/STORAGE_FAQ_LOVABLE.md` | Respostas às 4 perguntas |
| `docs/MIGRAR_STORAGE.md` | Guia buckets, RLS, cópia de arquivos |
| `docs/SUPABASE_STORAGE_SUPPORT_TICKET.md` | Ticket PT + EN |
| `docs/ALINHAMENTO_LOVABLE_STORAGE.md` | Resumo do alinhamento |

## Links rápidos

| O quê | Link |
|-------|------|
| SQL Editor | https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new |
| Storage / Buckets | https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/storage/buckets |
| Suporte | https://supabase.com/dashboard/support/new |
| Admin site | https://agenciaguata.com/admin/configuracoes |
| API Keys (service role) | https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/settings/api |
