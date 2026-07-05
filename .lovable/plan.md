# Plano — Corrigir login da equipe, spinner do roteiro, layout e build

## 0. Corrigir o build (pré-requisito, primeira coisa no modo de construção)
O app vive em `frontend/`, mas o build roda na raiz e não acha o comando `build:dev`.
- Criar um `package.json` na raiz que delega os comandos (`dev`, `build`, `build:dev`, `preview`, `lint`, `test`) para `cd frontend && ...`.
- Se a raiz exigir `lovable.toml` (é somente-leitura hoje), usar o `package.json` raiz como fonte dos tasks.
- Validar que `build:dev` roda sem erro.

## 1. Login da equipe (criar membro + resetar senha)
Espelhar exatamente o fluxo já existente dos parceiros.
- **Backend (migração)**: criar RPC `create_staff_access(_email, _full_name, _role)` que:
  - exige `has_role(auth.uid(),'admin')`;
  - cria o usuário no auth com senha temporária, cria `profiles` e grava o papel em `user_roles` (consultant/manager/admin);
  - retorna `{ email, temporary_password }`.
  - E RPC `reset_staff_password(_user_id)` (admin-only) que gera nova senha temporária.
  - `REVOKE ... FROM PUBLIC` + `GRANT EXECUTE ... TO authenticated`.
- **Frontend (`AdminEquipe.tsx`)**:
  - Botão "Adicionar membro" (já há o ícone `UserPlus`) abrindo diálogo com nome, e-mail e função → chama `create_staff_access` e mostra e-mail + senha temporária com botão copiar (igual parceiros).
  - No menu de cada membro, item "Redefinir senha" → `reset_staff_password` mostrando a nova senha temporária.

## 2. Spinner infinito no "Criar Roteiro"
Impedir que a tela fique presa e dar feedback claro.
- Em `ItineraryPlanner.tsx`:
  - Tratar os 3 estados: carregando (com timeout de segurança), **proposta inexistente** (mostrar CTA "Criar proposta para esta demanda" em vez de spinner) e **erro** (mensagem + botão "Tentar novamente").
  - Usar `isLoading`/`isError`/`data === null` do React Query em vez de só `isLoading`, e adicionar `retry` com backoff curto para não travar.
- Garantir que a RPC `staff_get_proposal_by_request` (e o fallback REST) existam/estejam aplicadas no backend ativo; se faltar, o fallback já cobre, mas vamos confirmar para não pendurar a chamada.

## 3. Redesign do layout (começando por "Criar Proposta")
Como você disse que "tudo está muito feio", vamos definir uma direção visual e aplicar de forma consistente.
- Passo A: escolher juntos a direção visual (paleta, tipografia e densidade/layout) — mantendo a identidade Guatá (Teal `#0B5D5D` / Brown `#4A2C2A`, Playfair + Inter).
- Passo B: aplicar na tela **Criar Proposta** (`AdminProposta.tsx`) como piloto: hierarquia de campos, espaçamento, cards, botões e responsividade.
- Passo C: propagar o mesmo padrão para as demais telas admin (Demandas, Equipe, Roteiro) de forma incremental.
- Sem alterar regras de negócio — só apresentação.

## Ordem de execução
1. Build (bloqueante) → 2. Login da equipe → 3. Spinner do roteiro → 4. Redesign (com sua escolha de direção visual).

## Observação
Os itens 1 e 2 exigem migração de banco (aprovação separada) e escrita de arquivos, que só acontecem após você aprovar este plano e mudarmos para o modo de construção.
