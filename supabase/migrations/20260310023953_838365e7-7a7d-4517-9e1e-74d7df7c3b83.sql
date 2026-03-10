
CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_location text,
  client_photo_url text,
  rating integer DEFAULT 5,
  text text NOT NULL,
  trip_name text,
  status text DEFAULT 'pending',
  client_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved testimonials" ON public.testimonials
  FOR SELECT TO anon, authenticated USING (status = 'approved');

CREATE POLICY "Authenticated users can submit testimonials" ON public.testimonials
  FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid());

CREATE POLICY "Staff can manage testimonials" ON public.testimonials
  FOR ALL TO authenticated USING (is_staff(auth.uid()));

-- Storage bucket for testimonial photos
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonials', 'testimonials', true);

CREATE POLICY "Anyone can view testimonial photos" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'testimonials');

CREATE POLICY "Authenticated users can upload testimonial photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "Staff can delete testimonial photos" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'testimonials' AND is_staff(auth.uid()));
