/**
 * Teste seguro de upload — NÃO apaga nem recria buckets.
 *
 * PowerShell:
 *   $env:SUPABASE_SERVICE_ROLE_KEY = "sua_chave_real_aqui"
 *   node scripts/test-storage-upload-safe.mjs
 *
 * CMD:
 *   set SUPABASE_SERVICE_ROLE_KEY=sua_chave_real_aqui
 *   node scripts/test-storage-upload-safe.mjs
 */

const PROJECT_REF = 'ojpgobftvomqxyvrqxma';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!serviceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida.');
  console.error('');
  console.error('PowerShell:');
  console.error('  $env:SUPABASE_SERVICE_ROLE_KEY = "cole_a_secret_key_aqui"');
  console.error('  node scripts/test-storage-upload-safe.mjs');
  console.error('');
  console.error('CMD (Prompt de Comando):');
  console.error('  set SUPABASE_SERVICE_ROLE_KEY=cole_a_secret_key_aqui');
  console.error('  node scripts/test-storage-upload-safe.mjs');
  console.error('');
  console.error('Chave: Dashboard → Settings → API → secret (service_role)');
  console.error(`https://supabase.com/dashboard/project/${PROJECT_REF}/settings/api`);
  process.exit(1);
}

if (serviceKey.includes('...') || serviceKey === 'sb_secret_') {
  console.error('❌ Cole a chave REAL do dashboard — não use o placeholder "sb_secret_..."');
  process.exit(1);
}

const fileName = `repair-test-${Date.now()}.txt`;

const res = await fetch(`${SUPABASE_URL}/storage/v1/object/site-assets/${fileName}`, {
  method: 'POST',
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'text/plain',
    'x-upsert': 'true',
  },
  body: 'hello-guata-test',
});

const body = await res.text();
console.log('Status:', res.status);
console.log('Body:', body);

if (res.status < 400) {
  console.log('\n✅ Upload OK — Storage funcionando. Teste no admin (logo/hero).');
  process.exit(0);
}

console.log('\n❌ Upload falhou.');
if (body.includes('schema is invalid') || body.includes('schema is out of sync')) {
  console.error('Schema interno do Storage ainda quebrado → criar projeto Supabase novo.');
}
process.exit(1);
