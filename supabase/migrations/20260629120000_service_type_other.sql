ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'other';

ALTER TABLE public.travel_requests
  ADD COLUMN IF NOT EXISTS service_type_note text;

COMMENT ON COLUMN public.travel_requests.service_type_note IS
  'Descrição livre quando service_type = other (ex.: só passagem, seguro viagem).';
