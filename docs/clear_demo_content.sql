-- Remove conteúdo de demonstração do site (experiências e depoimentos).
-- Projeto: ojpgobftvomqxyvrqxma
-- Dashboard: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma
-- Rode no SQL Editor (Dashboard → SQL → New query).
--
-- IMPORTANTE: rode primeiro só os SELECTs para ver o que será apagado.

-- 1) Ver o que existe hoje
SELECT id, title, destination, is_published, is_featured, created_at
FROM experiences
ORDER BY created_at DESC;

SELECT id, client_name, trip_name, status, created_at
FROM testimonials
ORDER BY created_at DESC;

-- 2) Apagar TODOS os depoimentos (inclui pendentes e aprovados)
DELETE FROM testimonials;

-- 3) Apagar TODAS as experiências
-- (viagens em travel_requests ficam com experience_id = NULL)
DELETE FROM experiences;

-- 4) Confirmar que ficou vazio
SELECT COUNT(*) AS experiences_restantes FROM experiences;
SELECT COUNT(*) AS testimonials_restantes FROM testimonials;
