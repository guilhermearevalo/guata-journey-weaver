/**
 * Testa Storage com service_role (diagnóstico).
 *
 * Uso:
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."  # Settings → API → secret key
 *   node scripts/test-storage-upload.mjs
 */

const PROJECT_REF = 'ojpgobftvomqxyvrqxma';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!serviceKey) {
  console.error('Defina SUPABASE_SERVICE_ROLE_KEY em Settings → API → secret (service_role)');
  process.exit(1);
}

async function api(method, path, body, contentType) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1${path}`, {
    method,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(contentType ? { 'Content-Type': contentType } : {}),
      ...(body && !contentType ? { 'Content-Type': 'application/json' } : {}),
      'x-upsert': 'true',
    },
    body: body ?? undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text };
}

async function main() {
  console.log('=== List buckets ===');
  const list = await api('GET', '/bucket');
  console.log(list.status, list.body);

  console.log('\n=== Delete site-assets (se existir) ===');
  const del = await api('DELETE', '/bucket/site-assets');
  console.log(del.status, del.body);

  console.log('\n=== Create site-assets ===');
  const create = await api('POST', '/bucket', JSON.stringify({
    id: 'site-assets',
    name: 'site-assets',
    public: true,
  }));
  console.log(create.status, create.body);

  console.log('\n=== Upload test ===');
  const fileName = `repair-test-${Date.now()}.txt`;
  const upload = await api('POST', `/object/site-assets/${fileName}`, 'hello', 'text/plain');
  console.log(upload.status, upload.body);

  if (upload.status >= 400) {
    console.error('\n❌ Upload falhou mesmo com service_role → schema interno do Storage quebrado.');
    console.error('Rode docs/repair_storage_diagnostic.sql e abra ticket no Supabase Support.');
    process.exit(1);
  }

  console.log('\n✅ Upload OK com service_role. Rode docs/ensure_site_assets_storage.sql e teste no admin.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
