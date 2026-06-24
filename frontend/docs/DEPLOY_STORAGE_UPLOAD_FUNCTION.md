# Deploy das Edge Functions de Storage

Contorno para upload/leitura quando o Storage direto falha (`schema is invalid`).

## Deploy

```powershell
cd "c:\Users\guilh\guatá viagens\guata-journey-weaver\guata-journey-weaver"
npx supabase login
npx supabase link --project-ref ojpgobftvomqxyvrqxma
npx supabase functions deploy storage-upload
npx supabase functions deploy storage-sign-url
```

- **storage-upload** — upload autenticado (admin)
- **storage-sign-url** — exibir imagens no site quando URL pública retorna 400

## Testar

1. Admin → Configurações → upload logo (salva automaticamente)
2. `/sobre` → logo visível
3. Admin → Demandas → ver contador "N demandas" e coluna Pendente
