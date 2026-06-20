/**
 * Simula upload do admin (publishable/anon + login), igual ao browser.
 *
 * CMD:
 *   set SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   (ou anon eyJ...)
 *   set ADMIN_EMAIL=guilhermearevalo27@gmail.com
 *   set ADMIN_PASSWORD=sua_senha
 *   node scripts/test-storage-upload-as-admin.mjs
 *
 * PowerShell:
 *   $env:SUPABASE_PUBLISHABLE_KEY = "..."
 *   $env:ADMIN_EMAIL = "guilhermearevalo27@gmail.com"
 *   $env:ADMIN_PASSWORD = "..."
 *   node scripts/test-storage-upload-as-admin.mjs
 */

const PROJECT_REF = 'ojpgobftvomqxyvrqxma';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;

const apiKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()
  || process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
const email = process.env.ADMIN_EMAIL?.trim();
const password = process.env.ADMIN_PASSWORD?.trim();

if (!apiKey) {
  console.error('❌ Defina SUPABASE_PUBLISHABLE_KEY (a mesma do .env — anon ou sb_publishable_)');
  process.exit(1);
}
if (!email || !password) {
  console.error('❌ Defina ADMIN_EMAIL e ADMIN_PASSWORD');
  process.exit(1);
}

console.log('API key prefix:', apiKey.slice(0, 20) + '...');

const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: apiKey, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const loginBody = await loginRes.text();
if (!loginRes.ok) {
  console.error('❌ Login falhou:', loginRes.status, loginBody);
  process.exit(1);
}

const { access_token: accessToken } = JSON.parse(loginBody);
console.log('✅ Login OK');

const fileName = `admin-test-${Date.now()}.txt`;
const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/site-assets/${fileName}`, {
  method: 'POST',
  headers: {
    apikey: apiKey,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'text/plain',
    'x-upsert': 'true',
  },
  body: 'hello-admin-test',
});

const uploadBody = await uploadRes.text();
console.log('Upload Status:', uploadRes.status);
console.log('Upload Body:', uploadBody);

if (uploadRes.status < 400) {
  console.log('\n✅ Upload como admin OK — o problema pode ser sessão antiga no browser. Limpe localStorage e faça login de novo.');
  process.exit(0);
}

console.log('\n❌ Upload como admin falhou.');
if (uploadBody.includes('schema is invalid')) {
  console.error('\n→ Se o teste com service_role passou mas este falhou:');
  console.error('  1. Troque VITE_SUPABASE_PUBLISHABLE_KEY no .env pela chave **anon legacy** (eyJ...)');
  console.error('     Dashboard → API Keys → aba "Legacy anon, service_role" → anon public → Copy');
  console.error('  2. Pare o dev server (Ctrl+C) e rode npm run dev de novo');
  console.error('  3. No browser: F12 → Application → Local Storage → Clear → login de novo');
}
process.exit(1);
