-- Repara schema interno do Supabase Storage (erro "database schema is invalid or incompatible").
-- Projeto: ojpgobftvomqxyvrqxma
-- Rode no SQL Editor DEPOIS de criar o bucket site-assets pela UI (Storage → New bucket).
--
-- 1) Diagnóstico (rode primeiro e veja o resultado)
SELECT id, name, executed_at FROM storage.migrations ORDER BY id;

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'storage' AND table_name = 'objects'
ORDER BY ordinal_position;

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'storage' AND table_name = 'prefixes'
) AS prefixes_table_exists;

-- 2) Reparo — migrações críticas do Storage v3 (0016–0035)
-- 0016
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS version text DEFAULT NULL;

-- 0017
ALTER TABLE storage.objects DROP CONSTRAINT IF EXISTS objects_owner_fkey;

-- 0018
ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS owner_id text DEFAULT NULL;
ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS owner_id text DEFAULT NULL;
ALTER TABLE storage.buckets DROP CONSTRAINT IF EXISTS buckets_owner_fkey;

-- 0008 (coluna public em buckets, se faltar)
ALTER TABLE storage.buckets ADD COLUMN IF NOT EXISTS public boolean DEFAULT false;

-- 0026 (prefixes + triggers) — só se prefixes não existir
DO $repair$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'storage' AND table_name = 'prefixes'
  ) THEN
    ALTER TABLE storage.objects ADD COLUMN IF NOT EXISTS level INT NULL;

    CREATE OR REPLACE FUNCTION storage.get_level(name text)
    RETURNS int LANGUAGE SQL IMMUTABLE STRICT AS $func$
      SELECT array_length(string_to_array(name, '/'), 1);
    $func$;

    CREATE TABLE storage.prefixes (
      bucket_id text,
      name text COLLATE "C" NOT NULL,
      level int GENERATED ALWAYS AS (storage.get_level(name)) STORED,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      CONSTRAINT prefixes_bucketId_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id),
      PRIMARY KEY (bucket_id, level, name)
    );

    ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

    CREATE OR REPLACE FUNCTION storage.get_prefix(name text)
    RETURNS text LANGUAGE SQL IMMUTABLE STRICT AS $func$
      SELECT CASE WHEN strpos(name, '/') > 0 THEN
        regexp_replace(name, '[\/]{1}[^\/]+\/?$', '')
      ELSE '' END;
    $func$;

    CREATE OR REPLACE FUNCTION storage.get_prefixes(name text)
    RETURNS text[] LANGUAGE plpgsql IMMUTABLE STRICT AS $func$
    DECLARE parts text[]; prefixes text[]; prefix text; i int;
    BEGIN
      parts := string_to_array(name, '/');
      prefixes := '{}';
      FOR i IN 1..array_length(parts, 1) - 1 LOOP
        prefix := array_to_string(parts[1:i], '/');
        prefixes := array_append(prefixes, prefix);
      END LOOP;
      RETURN prefixes;
    END;
    $func$;

    CREATE OR REPLACE FUNCTION storage.add_prefixes(_bucket_id text, _name text)
    RETURNS void SECURITY DEFINER LANGUAGE plpgsql AS $func$
    DECLARE prefixes text[];
    BEGIN
      prefixes := storage.get_prefixes(_name);
      IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes), _bucket_id ON CONFLICT DO NOTHING;
      END IF;
    END;
    $func$;

    CREATE OR REPLACE FUNCTION storage.delete_prefix(_bucket_id text, _name text)
    RETURNS boolean SECURITY DEFINER LANGUAGE plpgsql AS $func$
    BEGIN
      IF EXISTS(
        SELECT 1 FROM storage.prefixes
        WHERE bucket_id = _bucket_id AND level = storage.get_level(_name) + 1
          AND name COLLATE "C" LIKE _name || '/%' LIMIT 1
      ) OR EXISTS(
        SELECT 1 FROM storage.objects
        WHERE bucket_id = _bucket_id AND storage.get_level(name) = storage.get_level(_name) + 1
          AND name COLLATE "C" LIKE _name || '/%' LIMIT 1
      ) THEN
        RETURN false;
      ELSE
        DELETE FROM storage.prefixes
        WHERE bucket_id = _bucket_id AND level = storage.get_level(_name) AND name = _name;
        RETURN true;
      END IF;
    END;
    $func$;

    CREATE OR REPLACE FUNCTION storage.prefixes_insert_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $func$
    BEGIN
      PERFORM storage.add_prefixes(NEW.bucket_id, NEW.name);
      RETURN NEW;
    END;
    $func$;

    CREATE OR REPLACE FUNCTION storage.objects_insert_prefix_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $func$
    BEGIN
      PERFORM storage.add_prefixes(NEW.bucket_id, NEW.name);
      NEW.level := storage.get_level(NEW.name);
      RETURN NEW;
    END;
    $func$;

    CREATE OR REPLACE FUNCTION storage.delete_prefix_hierarchy_trigger()
    RETURNS trigger LANGUAGE plpgsql AS $func$
    DECLARE prefix text;
    BEGIN
      prefix := storage.get_prefix(OLD.name);
      IF coalesce(prefix, '') != '' THEN
        PERFORM storage.delete_prefix(OLD.bucket_id, prefix);
      END IF;
      RETURN OLD;
    END;
    $func$;

    DROP TRIGGER IF EXISTS prefixes_delete_hierarchy ON storage.prefixes;
    CREATE TRIGGER prefixes_delete_hierarchy
      AFTER DELETE ON storage.prefixes
      FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

    DROP TRIGGER IF EXISTS objects_insert_create_prefix ON storage.objects;
    CREATE TRIGGER objects_insert_create_prefix
      BEFORE INSERT ON storage.objects
      FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

    DROP TRIGGER IF EXISTS objects_update_create_prefix ON storage.objects;
    CREATE TRIGGER objects_update_create_prefix
      BEFORE UPDATE ON storage.objects
      FOR EACH ROW WHEN (NEW.name IS DISTINCT FROM OLD.name)
      EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

    DROP TRIGGER IF EXISTS objects_delete_delete_prefix ON storage.objects;
    CREATE TRIGGER objects_delete_delete_prefix
      AFTER DELETE ON storage.objects
      FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

    GRANT ALL ON TABLE storage.prefixes TO authenticated, anon, service_role;
  END IF;
END;
$repair$;

-- 0035
DROP TRIGGER IF EXISTS prefixes_create_hierarchy ON storage.prefixes;
CREATE TRIGGER prefixes_create_hierarchy
  BEFORE INSERT ON storage.prefixes
  FOR EACH ROW WHEN (pg_trigger_depth() < 1)
  EXECUTE FUNCTION storage.prefixes_insert_trigger();

-- 3) Confirmação
SELECT id, name FROM storage.migrations ORDER BY id;
SELECT id, name, public FROM storage.buckets WHERE id = 'site-assets';
