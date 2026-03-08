
-- 1. RLS para cadastro de parceiro (anon + authenticated)
CREATE POLICY "Anyone can apply as partner"
ON public.partner_agencies FOR INSERT
TO anon, authenticated
WITH CHECK (is_active = false);

-- 2. Novas colunas para dados completos do formulário
ALTER TABLE public.partner_agencies
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS responsible_name text,
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS regions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS description text;
