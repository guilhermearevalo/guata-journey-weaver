## Objetivo

Fazer o **envio automático de PDF voltar a funcionar** como caminho principal no editor de CMS (Termos / Política de Serviços), removendo a dependência da URL manual. A URL pública continua existindo, mas só como conveniência opcional — não mais como obrigatória.

## Diagnóstico

Verifiquei o backend ativo:

- Bucket `site-assets` existe e é **público**, sem limite de tamanho nem restrição de mime.
- As políticas de storage estão corretas: `Staff can upload site assets` usa `is_staff(auth.uid())` para INSERT, e há SELECT público.
- As funções `is_staff` / `has_role` mantêm permissão de `EXECUTE` para o papel `authenticated`.

Conclusão: o storage está saudável. O erro "schema out of sync" (503) que motivou o fallback foi **transitório** (ou veio de testes contra o projeto externo vazio), não um defeito real de schema. O problema atual é só de UX: ao receber esse erro uma vez, o botão de upload fica **permanentemente desabilitado** (`pdfUploadUnavailable`), forçando o uso da URL manual.

## Mudanças (somente frontend)

Em `src/pages/admin/AdminCMSEditor.tsx`:

1. **Não desabilitar o upload de forma permanente.** Remover o estado `pdfUploadUnavailable` que trava o botão. Em caso de erro de schema/503, mostrar mensagem amigável pedindo para **tentar novamente em instantes** (e oferecer a URL manual como alternativa), mas manter o botão ativo para nova tentativa.

2. **Retry automático leve** no `handlePdfUpload`: ao detectar erro de schema/503, tentar o upload mais 1–2 vezes com pequeno atraso antes de exibir o erro, cobrindo a janela de indisponibilidade transitória.

3. **Reposicionar a URL manual como opcional.** Manter o campo "Ou cole a URL pública do PDF", mas com texto deixando claro que o envio automático é o padrão e a URL é só para casos excepcionais.

4. **Mensagens de erro mais precisas** mantendo os casos já tratados (RLS/403 → login como admin/consultor; Bucket not found → bucket não configurado).

## Verificação

- Build limpa.
- Conferir no preview, logado como admin, que o botão "Enviar PDF" permanece habilitado e o upload grava em `site-assets/legal/...` e preenche `pdf_url` automaticamente.
- Confirmar que, mesmo após um erro simulado, o botão continua clicável (não trava).

Nenhuma migração de banco é necessária — o storage já está correto.