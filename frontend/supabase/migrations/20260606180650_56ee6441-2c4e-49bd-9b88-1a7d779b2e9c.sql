-- 1) site_settings: restrict public SELECT to a safe key allow-list
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Public can read non-sensitive site settings"
ON public.site_settings
FOR SELECT
TO anon, authenticated
USING (
  key = ANY (ARRAY[
    'contact_info',
    'agency_location',
    'cadastur_config',
    'hero_image_url',
    'whatsapp_config'
  ])
);

-- 2) partner_users: allow partners/staff to read their own membership
CREATE POLICY "Partners and staff can view own membership"
ON public.partner_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR is_staff(auth.uid()));

-- 3) storage: remove unverified public access to travel documents
DROP POLICY IF EXISTS "Public can view shared travel document files" ON storage.objects;
