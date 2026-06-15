# Rotaciona a chave pública do Supabase (anon legacy -> publishable nova).
# Requer token de conta com acesso ao projeto ojpgobftvomqxyvrqxma.
# Crie em: https://supabase.com/dashboard/account/tokens
#
# Uso:
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#   .\scripts\rotate-supabase-client-key.ps1

$ErrorActionPreference = "Stop"
$ProjectRef = "ojpgobftvomqxyvrqxma"
$KeyName = "vercel_site_$(Get-Date -Format 'yyyyMMdd')"
$BaseUrl = "https://api.supabase.com/v1/projects/$ProjectRef/api-keys"

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Error "Defina SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)"
}

$headers = @{
  Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN"
  "Content-Type" = "application/json"
}

Write-Host "Listando chaves atuais..."
$existing = Invoke-RestMethod -Uri "$BaseUrl`?reveal=true" -Headers $headers -Method Get
$existing | ForEach-Object { Write-Host " - $($_.name) [$($_.type)]" }

Write-Host "Criando publishable key '$KeyName'..."
$body = @{ type = "publishable"; name = $KeyName; description = "Site agenciaguata.com (rotacao)" } | ConvertTo-Json
$newKey = Invoke-RestMethod -Uri "$BaseUrl`?reveal=true" -Headers $headers -Method Post -Body $body
$newApiKey = $newKey.api_key
if (-not $newApiKey) { throw "Nao foi possivel obter a nova chave." }

Write-Host "Testando nova chave..."
$test = Invoke-WebRequest -Uri "https://$ProjectRef.supabase.co/rest/v1/site_settings?select=key&limit=1" `
  -Headers @{ apikey = $newApiKey; Authorization = "Bearer $newApiKey" } -UseBasicParsing
if ($test.StatusCode -ne 200) { throw "Nova chave falhou no teste (HTTP $($test.StatusCode))." }

Write-Host "Atualizando Vercel..."
foreach ($envName in @("production", "preview")) {
  Write-Output $newApiKey | vercel env add VITE_SUPABASE_PUBLISHABLE_KEY $envName --force --sensitive | Out-Null
}

Write-Host "Atualizando .env local..."
$envPath = (Resolve-Path (Join-Path $PSScriptRoot "..\.env")).Path
if (Test-Path $envPath) {
  (Get-Content $envPath -Raw) -replace 'VITE_SUPABASE_PUBLISHABLE_KEY=.*', "VITE_SUPABASE_PUBLISHABLE_KEY=$newApiKey" |
    Set-Content $envPath -NoNewline
}

Write-Host "Desativando chaves legacy (anon/service_role JWT)..."
Invoke-RestMethod -Uri "$BaseUrl/legacy`?enabled=false" -Headers $headers -Method Put | Out-Null

Write-Host "Redeploy Vercel..."
vercel deploy --prod --yes | Out-Null

Write-Host ""
Write-Host "Rotacao concluida."
Write-Host "Nova chave ($KeyName) ativa na Vercel e .env local."
Write-Host "Chaves legacy anon/service_role desativadas."
