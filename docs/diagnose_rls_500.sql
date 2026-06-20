-- Diagnóstico de erros 500 em proposals / travel_requests / travel_documents
-- Rode no SQL Editor (como postgres)

-- 1) Funções essenciais existem?
SELECT proname, pg_get_function_identity_arguments(oid) AS args
FROM pg_proc
WHERE proname IN (
  'is_staff',
  'is_request_client',
  'has_shared_proposal_for_request',
  'proposal_is_shared',
  'staff_get_proposal_by_request',
  'staff_update_proposal_itinerary',
  'staff_list_travel_documents'
)
ORDER BY proname;

-- 2) Você é staff?
SELECT u.email, public.is_staff(u.id) AS is_staff
FROM auth.users u
WHERE u.email = 'guilhermearevalo27@gmail.com';

-- 3) Propostas duplicadas por demanda?
SELECT request_id, COUNT(*) AS qtd, array_agg(id ORDER BY created_at DESC) AS proposal_ids
FROM public.proposals
GROUP BY request_id
HAVING COUNT(*) > 1
ORDER BY qtd DESC;

-- 4) Propostas de uma demanda específica (troque o UUID se quiser)
SELECT id, request_id, title, created_at
FROM public.proposals
WHERE request_id = 'b0602509-477e-495f-bf43-56bc4bf2a776'
ORDER BY created_at DESC;

-- 5) Coluna dossier existe?
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'proposals'
  AND column_name IN ('itinerary', 'dossier');
