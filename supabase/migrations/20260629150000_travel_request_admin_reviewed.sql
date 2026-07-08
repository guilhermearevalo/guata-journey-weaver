-- Demandas: rastrear quando o admin viu uma solicitação pendente (badge no menu, como parceiros).
ALTER TABLE public.travel_requests
  ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_travel_requests_unreviewed_pending
  ON public.travel_requests (created_at DESC)
  WHERE status = 'pending' AND admin_reviewed_at IS NULL;

COMMENT ON COLUMN public.travel_requests.admin_reviewed_at IS
  'Quando o staff abriu/visualizou a demanda pendente; limpa badge de novas demandas.';
