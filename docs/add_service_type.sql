-- Tipo de serviço na demanda: consultoria/roteiro vs pacote completo.
-- Demandas existentes ficam como full_package (pacote completo).

DO $$ BEGIN
  CREATE TYPE public.service_type AS ENUM ('consultancy', 'full_package');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.travel_requests
  ADD COLUMN IF NOT EXISTS service_type public.service_type NOT NULL DEFAULT 'full_package';

COMMENT ON COLUMN public.travel_requests.service_type IS
  'consultancy = só roteiro/consultoria; full_package = roteiro + reservas após aprovação';
