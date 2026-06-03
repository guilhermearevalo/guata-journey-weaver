# Caminho A — Self-hosting com Supabase externo

## Contexto importante (ler primeiro)

Dentro do editor Lovable, o backend é **fixo** no projeto gerenciado (`xddzshslltdxstqpwvzr`). Os arquivos `.env` e `src/integrations/supabase/client.ts` são **gerados automaticamente** e qualquer edição manual é sobrescrita. Por isso, para usar o seu Supabase próprio (`ojpgobftvomqxyvrqxma`) é necessário **exportar o código e hospedar fora do Lovable** (Vercel, Netlify, etc.). O preview dentro do Lovable continuará usando o backend gerenciado — isso é esperado.

O que este plano faz: deixar o **código pronto** para rodar contra o Supabase externo quando hospedado por você, sem quebrar o preview do Lovable, e te entregar um passo-a-passo claro do que precisa ser feito manualmente no dashboard do Supabase e na hospedagem.

## O que será feito no código (dentro do Lovable)

1. **Documentação de deploy atualizada** (`docs/LOVABLE_SUPABASE_SETUP.md`)
   - Passo-a-passo de export → configurar env → deploy em Vercel/Netlify.
   - Lista das variáveis necessárias e onde colá-las.
   - Ordem de aplicação das migrações no projeto externo.

2. **Conferência das migrações** em `supabase/migrations/`
   - Garantir que existe a migração do bucket `site-assets` (público) e que a ordem dos arquivos recria todo o schema (`cms_pages`, `travel_requests`, `user_roles`, etc.).
   - Se faltar algo (ex.: bucket), criar a migração correspondente para você aplicar no projeto externo.

3. **Script/SQL de bootstrap de admin** (arquivo em `docs/` ou `supabase/`)
   - SQL pronto para criar o role admin de `guilhermearevalo27@gmail.com` no projeto externo, mantendo o fluxo de Login de Demonstração (`update_demo_roles`) intacto.

> Observação: não vou editar `.env` nem `client.ts` (são auto-gerados). O `client.ts` já lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` do ambiente, então na sua hospedagem basta definir essas variáveis apontando para o projeto externo.

## O que você fará manualmente (fora do Lovable)

```text
1. Exportar o código
   - GitHub: conectar projeto (menu + → GitHub) e clonar o repo
   - ou Code Editor → Download codebase

2. No Supabase externo (ojpgobftvomqxyvrqxma)
   - Aplicar TODAS as migrações de supabase/migrations/ (db push)
   - Confirmar tabelas: cms_pages, travel_requests, user_roles
   - Confirmar bucket site-assets (público)
   - Authentication → Add user: guilhermearevalo27@gmail.com (Auto Confirm)
   - Rodar o SQL de admin (entregue no passo 3 acima)

3. Na hospedagem (Vercel/Netlify)
   - Definir variáveis:
     VITE_SUPABASE_URL=https://ojpgobftvomqxyvrqxma.supabase.co
     VITE_SUPABASE_PROJECT_ID=ojpgobftvomqxyvrqxma
     VITE_SUPABASE_PUBLISHABLE_KEY=<anon key do dashboard>
     VITE_SITE_URL=https://www.agenciaguata.com
     VITE_ONER_STORE_URL=...
   - Deploy / redeploy
```

## Detalhes técnicos

- `client.ts` usa `import.meta.env.VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` — portanto a troca de backend acontece 100% por variáveis de ambiente na hospedagem, sem alterar código.
- Edge functions (`supabase/functions/itinerary-ai`) precisam ser deployadas no projeto externo via `supabase functions deploy`, e os secrets (`LOVABLE_API_KEY`, `STRIPE_SECRET_KEY`, etc.) reconfigurados lá.
- O Login de Demonstração depende da função `update_demo_roles` e das contas `*@guata.test` — incluído nas migrações, então continuará funcionando no projeto externo após o push.

## Entregáveis

- `docs/LOVABLE_SUPABASE_SETUP.md` revisado com o fluxo de self-hosting completo.
- SQL de criação do admin `guilhermearevalo27@gmail.com`.
- Verificação/criação de migração faltante (ex.: bucket `site-assets`) se necessário.
