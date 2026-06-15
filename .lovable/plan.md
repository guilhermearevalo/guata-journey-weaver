## Diagnóstico

Investiguei os dois problemas direto no backend e no código.

### 1. Erros de upload de arquivos/imagens
O app está com uploads **desligados de propósito** por uma configuração antiga (`VITE_STORAGE_UPLOADS=false`). Isso foi um contorno da época em que o armazenamento do projeto anterior estava quebrado. Testei o armazenamento atual (Lovable Cloud): os buckets `site-assets`, `testimonials` e `travel-documents` existem e funcionam — usuários logados (admin/staff) têm permissão de envio. Ou seja, dá para reativar os uploads de verdade agora.

### 2. Demandas que somem / aparecem vazias / não aparecem
As telas de demandas (Admin Kanban, Parceiro e Cliente) carregam os dados sem esperar a sessão de login estar totalmente pronta e sem se atualizarem sozinhas. Resultado: às vezes a consulta roda "sem usuário" e o banco devolve vazio (regras de segurança bloqueiam), e quando você cria/move uma demanda a tela nem sempre reflete na hora. No Admin há ainda um detalhe: quando se chega pela tela com um filtro de status na URL, só uma coluna aparece — dando a impressão de que as outras demandas "sumiram".

## O que vou fazer

### Uploads
- Reativar os uploads de arquivos/imagens (deixar o armazenamento ligado por padrão, ignorando a flag antiga).
- Manter o campo de URL como alternativa, mas voltar a exibir os botões de envio de arquivo no Admin (configurações, viagens realizadas, CMS), roteiro (atividades, dossiê, documentos) e depoimentos.
- Validar enviando um arquivo de teste de verdade após a mudança.

### Demandas
- **Admin (Kanban):** só carregar as demandas depois que o login estiver pronto; recarregar sempre ao abrir a tela; e adicionar atualização em tempo real para que demandas novas e mudanças de coluna apareçam na hora, sem precisar recarregar a página.
- **Tornar o filtro de status visível e removível** no Kanban, para que não pareça que demandas sumiram quando só está filtrado.
- **Parceiro e Cliente:** mesma proteção — esperar o login pronto antes de consultar e recarregar ao abrir, para não aparecer lista vazia indevidamente.
- Garantir que a "Nova Demanda" manual apareça imediatamente no quadro após criada.

## Detalhes técnicos
- `src/lib/storageUploads.ts`: `isStorageUploadEnabled` passa a ser `true` por padrão (só desliga se a env for explicitamente `false`, que removerei do `.env`/`.env.example`).
- `src/components/admin/KanbanBoard.tsx`: importar `useAuth`; `useQuery(['travel_requests', user?.id])` com `enabled: !!user`, `refetchOnMount: 'always'`; adicionar canal `supabase.channel().on('postgres_changes', ... travel_requests)` para invalidar a query; exibir badge "Filtrando por status — limpar" quando `?status=` estiver presente.
- `src/pages/partner/PartnerDemandas.tsx` e telas de demandas do cliente (`src/pages/cliente/ClienteViagens.tsx`): adicionar `refetchOnMount: 'always'` e confirmar gating por `!!user`/`agencyId`.
- Para o tempo real funcionar, criar migração adicionando `travel_requests` (e `proposals`) à publicação `supabase_realtime` com `REPLICA IDENTITY FULL`.
- Sem mudanças nas regras de acesso (RLS) — elas já estão corretas; o problema é momento de carga e atualização da UI.

## Validação
- Upload: enviar um arquivo de teste e confirmar a URL pública/preview.
- Demandas: criar uma demanda manual e confirmar que aparece sem recarregar; mover entre colunas e confirmar persistência; conferir Parceiro e Cliente.
