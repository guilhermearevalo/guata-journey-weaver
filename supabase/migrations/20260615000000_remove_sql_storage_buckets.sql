-- Buckets criados via INSERT SQL quebram upload no Storage v3.
-- NÃO delete via SQL (storage.protect_delete bloqueia).
-- Remova pela UI: Storage → Delete bucket → recrie site-assets (público).
-- Depois rode docs/ensure_site_assets_storage.sql.
-- Reparo automático: node scripts/repair-storage.mjs

SELECT 1;
