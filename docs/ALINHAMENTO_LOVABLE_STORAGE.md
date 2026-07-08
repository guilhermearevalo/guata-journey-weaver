# Alinhamento Lovable × Guatá — Storage

Resposta do Lovable (resumo) e plano acordado.

---

## Escopo — quem acessa o quê

| Ambiente | Projeto | Quem conserta Storage |
|----------|---------|------------------------|
| Lovable Cloud | `xddzshslltdxstqpwvzr` | Lovable (funciona hoje) |
| Produção Guatá | `ojpgobftvomqxyvrqxma` | **Só você** (dashboard + Supabase Support) |

O Lovable **não tem acesso** ao Supabase dedicado de produção.

---

## Causa real do erro (esclarecimento Lovable)

**Erro:** `The database schema is invalid or incompatible` (HTTP 400)

**Causa:** migrações internas do Storage (`storage.migrations`) **incompletas** no projeto `ojpgobftvomqxyvrqxma`. A tabela `storage.objects` fica sem colunas/triggers que o `storage-api` atual espera.

**Não é causado por:** `INSERT INTO storage.buckets` nas migrações do app (inserir a linha do bucket é suportado).

**Reparo:** reinicializar/atualizar Storage via **Supabase Support** (tabelas `storage.*` = `supabase_storage_admin`).

---

## Plano final

### Você (Guatá / ojpgobftvomqxyvrqxma)

1. Rodar `docs/repair_storage_diagnostic.sql`  
2. Abrir ticket: `docs/SUPABASE_STORAGE_SUPPORT_TICKET.md`  
3. Usar URL no admin enquanto aguarda  
4. Após correção: `ensure_site_assets_storage.sql` + teste upload  

### Lovable (xddzshslltdxstqpwvzr)

- Nada a fazer no projeto de produção Guatá.  
- Preview Lovable continua no backend Cloud deles, se ainda usar.

### Este repositório (guata-journey-weaver)

- App aponta só para `ojpgobftvomqxyvrqxma` em produção (Vercel).  
- Código de upload Supabase permanece; volta a funcionar quando o backend for reparado.  
- Não migrar para Cloudinary — decisão do cliente: **manter Supabase**.

---

## Resposta sugerida ao Lovable

> Entendido. Confirmo que o escopo de reparo é só no meu projeto Supabase `ojpgobftvomqxyvrqxma` via Support. Obrigado pelo esclarecimento de que o INSERT em storage.buckets não é a causa — vou abrir ticket pedindo conclusão das migrações internas em storage.migrations. O app em produção já usa apenas o projeto dedicado; o Lovable Cloud fica só para preview se necessário.
