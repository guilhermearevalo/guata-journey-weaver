-- Mídia unificada para viagens realizadas (ordem, capa, enquadramento)

ALTER TABLE public.completed_trips
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.completed_trips.media IS
  'Lista ordenada de mídia: [{ id, type: image|video, url, is_cover?, focal_x?, focal_y? }]';

-- Migra cover_image + gallery + video_url → media
UPDATE public.completed_trips t
SET media = sub.aggregated
FROM (
  SELECT
    ct.id,
    COALESCE(
      (
        SELECT jsonb_agg(item ORDER BY sort_key)
        FROM (
          SELECT
            0 AS sort_key,
            jsonb_build_object(
              'id', gen_random_uuid()::text,
              'type', 'image',
              'url', ct.cover_image,
              'is_cover', true,
              'focal_x', 50,
              'focal_y', 50
            ) AS item
          WHERE ct.cover_image IS NOT NULL AND btrim(ct.cover_image) <> ''

          UNION ALL

          SELECT
            1 + g.ord::int AS sort_key,
            jsonb_build_object(
              'id', gen_random_uuid()::text,
              'type', 'image',
              'url', g.url,
              'is_cover', false,
              'focal_x', 50,
              'focal_y', 50
            ) AS item
          FROM unnest(COALESCE(ct.gallery, ARRAY[]::text[])) WITH ORDINALITY AS g(url, ord)
          WHERE g.url IS NOT NULL
            AND btrim(g.url) <> ''
            AND g.url IS DISTINCT FROM ct.cover_image

          UNION ALL

          SELECT
            900 AS sort_key,
            jsonb_build_object(
              'id', gen_random_uuid()::text,
              'type', 'video',
              'url', ct.video_url,
              'is_cover', false
            ) AS item
          WHERE ct.video_url IS NOT NULL AND btrim(ct.video_url) <> ''
        ) parts
      ),
      '[]'::jsonb
    ) AS aggregated
  FROM public.completed_trips ct
) sub
WHERE t.id = sub.id
  AND (t.media IS NULL OR t.media = '[]'::jsonb);
