## Objetivo

Resolver 4 pontos: (1) erro/travamento ao criar demanda, (2) erro no upload do PDF nas páginas legais, (3) cor do menu lateral do admin muito branca, (4) redesenhar Termos de Uso (referente ao site) e Política de Privacidade (referente à agência) com layout bonito.

---

## 1. Erro ao criar demanda (admin + formulário público)

**Diagnóstico já feito:** As permissões (GRANTs) e políticas de acesso (RLS) das tabelas estão corretas. Staff pode inserir, anônimo pode criar solicitação. Como o botão "fica carregando e não retorna" (em vez de mostrar erro de permissão), a causa provável é de runtime, não de banco.

**O que farei:**
- Reproduzir em execução e inspecionar console/rede para ver se a requisição falha, trava ou retorna erro silencioso.
- Garantir que o formulário de Nova Demanda (admin) e o formulário público de Viagem Personalizada sempre mostrem mensagem de erro/sucesso (nada de spinner infinito): tratar corretamente o estado de erro da mutação e adicionar log do erro real.
- Confirmar que o usuário de teste tem o papel correto (staff). Se o travamento vier de papel ausente, exibir mensagem clara em vez de travar.
- Como reforço defensivo, adicionar política explícita de INSERT com `WITH CHECK` para staff em `travel_requests` (hoje só existe a política `ALL`), evitando qualquer ambiguidade em inserções.

## 2. Upload de PDF nas páginas legais (Termos/Privacidade)

**Diagnóstico:** bucket `site-assets` é público, sem limite de tamanho; a política de upload exige staff. O erro provavelmente ocorre por papel/sessão ou por resposta de erro não exibida claramente.

**O que farei:**
- Testar o upload em execução e capturar o erro exato retornado pelo storage.
- Tornar o handler de upload mais robusto: exibir a mensagem real do erro (não um toast genérico), validar sessão/staff antes de enviar e usar caminho de arquivo seguro.
- Confirmar limite de tamanho coerente com o bucket.

## 3. Cor do menu lateral do admin

Hoje o sidebar usa fundo quase branco (`--sidebar-background` creme), ficando "lavado".

**O que farei (você decide → escolho o melhor):**
- Ajustar os tokens `--sidebar-*` em `src/index.css` para um **fundo teal escuro da marca** com texto claro e item ativo destacado (contraste forte e legível), mantendo a identidade Guatá. Item ativo com leve realce e borda lateral.
- Ajustar o `AdminSidebar.tsx` apenas no necessário para o novo contraste (estados hover/ativo) usando tokens semânticos.

## 4. Redesenho de Termos de Uso e Política de Privacidade

**Conteúdo:**
- **Termos de Uso** → referente ao **site/plataforma** (uso do site, contas, reservas, responsabilidades).
- **Política de Privacidade** → referente à **agência** (tratamento de dados pelos parceiros/agência, LGPD).
- Preencher um texto-base adequado para cada um (editável depois via CMS).

**Layout (ambos):**
- Cabeçalho com gradiente da marca, título em Playfair, subtítulo e data de atualização.
- Conteúdo em coluna central legível, com seções numeradas em cards/divisores, tipografia Inter, bom espaçamento, sumário/índice no topo opcional, ícones discretos por seção.
- Manter o modo PDF embutido já existente quando houver PDF enviado; quando não houver, exibir o layout redesenhado.

---

## Detalhes técnicos

- **Banco (migração):** política adicional `FOR INSERT ... WITH CHECK (is_staff(auth.uid()))` em `public.travel_requests` (reforço). Sem outras mudanças de schema.
- **Arquivos a alterar:**
  - `src/index.css` — tokens `--sidebar-*` (tema teal escuro).
  - `src/components/admin/AdminSidebar.tsx` — ajustes de contraste (hover/ativo).
  - `src/components/admin/NewRequestDialog.tsx` — tratamento de erro/sucesso robusto + log.
  - `src/pages/ViagemPersonalizada.tsx` — mesmo tratamento de erro no envio público (verificar).
  - `src/pages/admin/AdminCMSEditor.tsx` — upload de PDF com erro detalhado e validação de sessão.
  - `src/pages/Privacidade.tsx` e `src/pages/Termos.tsx` — novo layout + texto-base.
  - Conteúdo padrão (fallback) atualizado para Termos=site e Privacidade=agência.
- **Verificação:** testar em execução criação de demanda (admin e público), upload de PDF, e revisar visualmente sidebar e páginas legais (claro/escuro).
