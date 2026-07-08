# Storage — perguntas frequentes (Lovable × Guatá)

Respostas alinhadas ao plano de migração Lovable Cloud → Supabase dedicado.

---

## 1. As migrações deveriam usar `INSERT INTO storage.buckets`?

**Não como padrão.** Buckets devem ser criados via **Storage API** ou **Dashboard UI**.

O `INSERT` em si é **inofensivo** e **não é a causa** do erro `schema is invalid or incompatible`. Mesmo assim, removemos dos arquivos de migração para que projetos novos sigam o fluxo correto (API/UI + RLS via SQL).

---

## 2. Procedimento oficial de migração de Storage Lovable → dedicado?

1. No projeto **destino** (`ojpgobftvomqxyvrqxma`): criar buckets pela **UI/API** (não transportar schema interno por SQL).
2. Aplicar políticas RLS com `docs/ensure_site_assets_storage.sql` (e equivalentes).
3. Copiar **objetos** (arquivos) via **Storage API** — ver `docs/MIGRAR_STORAGE.md` e `scripts/repair-storage.mjs`.
4. Reparar `storage.migrations` no destino se upload falhar — **Supabase Support** ou restart/upgrade do projeto.

---

## 3. Abrir ticket no Supabase Support?

**Sim.** Reparo de `storage.migrations` / colunas de `storage.objects` no `ojpgobftvomqxyvrqxma` só o **Support** (ou restart/upgrade no dashboard) resolve.

O **Lovable não tem acesso** ao projeto dedicado de produção.

Modelo de ticket: **`docs/SUPABASE_STORAGE_SUPPORT_TICKET.md`**

---

## 4. Outros projetos tiveram isso?

Sim — é um sintoma **conhecido** quando o `storage-api` roda **à frente** do schema interno aplicado.

A causa raiz é **`storage.migrations` desatualizado/incompleto** no projeto dedicado, não o código do app.

---

## Escopo dos projetos

| Projeto | Ref | Quem altera Storage |
|---------|-----|---------------------|
| Lovable Cloud | `xddzshslltdxstqpwvzr` | Lovable |
| Produção Guatá | `ojpgobftvomqxyvrqxma` | **Você** (dashboard + Support) |
