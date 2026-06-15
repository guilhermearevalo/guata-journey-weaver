/**
 * Repara Storage Guatá: remove buckets criados via SQL e recria pela API.
 *
 * Uso:
 *   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
 *   node scripts/repair-storage.mjs
 */

const PROJECT_REF = 'ojpgobftvomqxyvrqxma';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const MGMT = `https://api.supabase.com/v1/projects/${PROJECT_REF}`;

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error('Defina SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)');
  process.exit(1);
}

const mgmtHeaders = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function dbQuery(sql, readOnly = false) {
  const res = await fetch(`${MGMT}/database/query${readOnly ? '/read-only' : ''}`, {
    method: 'POST',
    headers: mgmtHeaders,
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

async function getServiceRoleKey() {
  const res = await fetch(`${MGMT}/api-keys?reveal=true`, { headers: mgmtHeaders });
  if (!res.ok) throw new Error(`api-keys failed (${res.status}): ${await res.text()}`);
  const keys = await res.json();
  const secret = keys.find((k) => k.type === 'secret' || k.name === 'service_role');
  if (secret?.api_key) return secret.api_key;
  const legacy = keys.find((k) => k.type === 'legacy' && k.name === 'service_role');
  if (legacy?.api_key) return legacy.api_key;
  throw new Error('Não foi possível obter service_role key. Ative em Settings → API.');
}

async function storageRequest(serviceKey, method, path, body) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, text: text ? JSON.parse(text) : null };
}

async function main() {
  console.log('=== Diagnóstico Storage ===');
  const migrations = await dbQuery(
    'SELECT id, name, executed_at FROM storage.migrations ORDER BY id',
    true
  );
  console.log('Migrations:', JSON.stringify(migrations, null, 2));

  const columns = await dbQuery(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'storage' AND table_name = 'objects'
     ORDER BY ordinal_position`,
    true
  );
  console.log('objects columns:', columns?.map((r) => r.column_name).join(', '));

  const buckets = await dbQuery('SELECT id, name, public, created_at FROM storage.buckets ORDER BY created_at', true);
  console.log('Buckets atuais:', JSON.stringify(buckets, null, 2));

  console.log('\n=== Removendo buckets criados via SQL ===');
  await dbQuery(`DELETE FROM storage.objects WHERE bucket_id IN ('site-assets', 'testimonials')`);
  await dbQuery(`DELETE FROM storage.buckets WHERE id IN ('site-assets', 'testimonials')`);
  console.log('Buckets SQL removidos.');

  const serviceKey = await getServiceRoleKey();
  console.log('\n=== Recriando site-assets via Storage API ===');

  await storageRequest(serviceKey, 'DELETE', '/bucket/site-assets').catch(() => {});
  let create = await storageRequest(serviceKey, 'POST', '/bucket', {
    id: 'site-assets',
    name: 'site-assets',
    public: true,
  });
  if (create.status === 409) {
    console.log('Bucket site-assets já existe via API.');
  } else if (create.status >= 400) {
    throw new Error(`Criar bucket falhou (${create.status}): ${JSON.stringify(create.text)}`);
  } else {
    console.log('Bucket site-assets criado:', create.text);
  }

  console.log('\n=== Políticas RLS site-assets ===');
  await dbQuery(`
    DROP POLICY IF EXISTS "Anyone can view site assets" ON storage.objects;
    CREATE POLICY "Anyone can view site assets"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'site-assets');

    DROP POLICY IF EXISTS "Staff can upload site assets" ON storage.objects;
    CREATE POLICY "Staff can upload site assets"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'site-assets' AND is_staff(auth.uid()));

    DROP POLICY IF EXISTS "Staff can update site assets" ON storage.objects;
    CREATE POLICY "Staff can update site assets"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'site-assets' AND is_staff(auth.uid()));

    DROP POLICY IF EXISTS "Staff can delete site assets" ON storage.objects;
    CREATE POLICY "Staff can delete site assets"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'site-assets' AND is_staff(auth.uid()));
  `);

  console.log('\n=== Teste de upload (service role) ===');
  const blob = new Blob(['repair-test'], { type: 'text/plain' });
  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/site-assets/repair-test-${Date.now()}.txt`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'text/plain',
      'x-upsert': 'true',
    },
    body: blob,
  });
  const uploadBody = await uploadRes.text();
  console.log('Upload test:', uploadRes.status, uploadBody.slice(0, 300));

  if (uploadRes.status >= 400) {
    throw new Error('Upload ainda falhou — verifique storage.migrations no diagnóstico acima.');
  }

  console.log('\n✅ Storage reparado. Reative VITE_STORAGE_UPLOADS=true na Vercel e teste no admin.');
}

main().catch((err) => {
  console.error('\n❌', err.message);
  process.exit(1);
});
