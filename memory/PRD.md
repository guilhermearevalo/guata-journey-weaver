# Guatá Journey Weaver — PRD

## Origem
Projeto clonado de https://github.com/guilhermearevalo/guata-journey-weaver.git em 24/01/2026.

## Stack
- Frontend: Vite + React 18 + TypeScript + Tailwind + shadcn-ui
- Auth/DB/Storage: Supabase (projeto `ojpgobftvomqxyvrqxma`)
- PDF: jsPDF + html2canvas
- Rodando em /app/frontend na porta 3000 (supervisor) com `yarn start` = `vite`

## Sessão de 24/01/2026 — implementações

### 1. PDF do roteiro interativo com Google Maps (opção B)
- Em cada atividade, link clicável "📍 Abrir no Google Maps" usando `activity.maps_url` (fallback para busca pelo nome + destino).
- Ao final, botão grande "🗺️ Ver rota completa no Google Maps" com waypoints encadeados de todas as atividades.
- Implementação: jsPDF `pdf.link()` sobre coordenadas calculadas (`px → mm`) das âncoras `[data-pdf-link]`, com clipping correto entre páginas.
- Arquivo: `src/lib/generate-itinerary-pdf.ts`

### 2. Fale Conosco real (opção A)
- Form `/contato` agora insere em `contact_messages` no Supabase (não é mais mock).
- Nova página admin `/admin/mensagens` (`AdminMensagens.tsx`) com:
  - Lista de mensagens (filtros: Todas / Não lidas / Visualizadas)
  - Stats cards (Total / Não lidas / Visualizadas)
  - Visualizar (abre dialog + marca como lida automaticamente)
  - Marcar como visualizada / não lida (toggle)
  - Excluir com confirmação
  - Responder por e-mail (mailto:)
  - WhatsApp via link no telefone
- ⚠️ **Migração SQL necessária**: rodar `frontend/supabase/migrations/20260124000000_contact_messages.sql` no SQL Editor do projeto Supabase.

### 3. Parceiros pendentes — destaque visual
- `AdminParceiros.tsx`: aba "Pendentes" abre automaticamente quando há solicitações, com badge vermelho (contador).
- Linhas pendentes destacadas com fundo amber.
- Sidebar admin: badges vermelhos em "Parceiros" (pendentes) e "Mensagens" (não lidas), com refetch a cada 30s.

### 4. Modal de detalhes da agência com scroll
- `DialogContent` agora usa `max-h-[90vh] overflow-y-auto`.

### 5. Rodapé corrigido
- Substituído "Guatá Travel Experience" por "Guatá Viagens e Turismo" em 11 arquivos (footer, header, login, cadastro, termos, política, recuperar senha, SEO, etc.).

## Pendente (backlog)

### P1 — Migração SQL no Supabase
O usuário precisa rodar **uma vez** no SQL Editor:
`/app/frontend/supabase/migrations/20260124000000_contact_messages.sql`
Sem isso, o form `/contato` falha ao salvar e `/admin/mensagens` fica vazia.

### P2 — Deploy na Vercel
Após validar local, fazer push via "Save to GitHub" do Emergent → Vercel redeploya automaticamente.
Lembrar de copiar a `VITE_SUPABASE_PUBLISHABLE_KEY` em **Project → Settings → Environment Variables** na Vercel também (Production).

### P2 — CMS para textos do Financeiro / Relatório por Agência (deferido)
Textos hardcoded em `AdminFinanceiro.tsx` e `AdminRelatorioAgencias.tsx`. Quando o usuário pedir, criar 2 entradas no CMS com schema custom.

## Notas técnicas
- Chave Supabase anon é pública por design — segurança via RLS no banco.
- `vite.config.ts` configurado com `host:0.0.0.0`, `port:3000`, `strictPort:true`, `allowedHosts:true`, HMR via `wss:443` (preview).
- Script `start` adicionado ao `package.json` para o supervisor (`yarn start` → `vite`).
