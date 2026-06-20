-- Corrige erro 500 ao listar travel_requests via API autenticada (RLS/funções).
-- Rode no SQL Editor: https://supabase.com/dashboard/project/ojpgobftvomqxyvrqxma/sql/new

-- 1) Garante permissão de EXECUTE nas funções essenciais (só as que existem no projeto)
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_agency(uuid) TO authenticated, service_role;

-- 2) Reforça policy de staff (SELECT)
DROP POLICY IF EXISTS "Staff can view all requests" ON public.travel_requests;
CREATE POLICY "Staff can view all requests"
ON public.travel_requests FOR SELECT
TO authenticated
USING (public.is_staff(auth.uid()));

-- 3) RPC fallback — lista demandas para staff (SECURITY DEFINER, contorna falha de RLS)
CREATE OR REPLACE FUNCTION public.staff_list_travel_requests()
RETURNS SETOF public.travel_requests
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.travel_requests
  WHERE public.is_staff(auth.uid())
  ORDER BY created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.staff_list_travel_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_list_travel_requests() TO authenticated;

-- 4) Verificação
SELECT u.email, public.is_staff(u.id) AS is_staff
FROM auth.users u
WHERE u.email = 'guilhermearevalo27@gmail.com';

SELECT COUNT(*) AS total_demandas FROM public.travel_requests;
