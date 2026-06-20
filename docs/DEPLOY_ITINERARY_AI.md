# Deploy da Edge Function `itinerary-ai`

Gera roteiros com IA (Google Gemini) no planejador: Admin → Demanda → Planejar Roteiro → **Gerar Roteiro com IA**.

Sem deploy, o console mostra erro de **CORS** em `/functions/v1/itinerary-ai`.

## Pré-requisitos

1. Rodar no SQL Editor: **`docs/fix_rls_helpers.sql`** (e os fixes anteriores, se ainda não rodou).
2. Criar uma API key no [Google AI Studio](https://aistudio.google.com/apikey) — deve começar com **`AIza`**.

> **Atenção:** chaves **`AQ...`** (Google Cloud Console) **não funcionam**. Use só AI Studio.

## Deploy

```powershell
cd "c:\Users\guilh\guatá viagens\guata-journey-weaver\guata-journey-weaver"
npx supabase login
npx supabase link --project-ref ojpgobftvomqxyvrqxma
npx supabase secrets set GEMINI_API_KEY=sua_chave_gemini_aqui
npx supabase functions deploy itinerary-ai
```

Ou no Dashboard: **Project Settings → Edge Functions → Secrets** → `GEMINI_API_KEY`.

### Modelo (opcional)

Por padrão tenta: `gemini-2.5-flash` → `gemini-2.5-flash-lite` → `gemini-2.5-pro`.

Remova `GEMINI_MODEL` se apontar para modelos antigos (`gemini-2.0-*`, `gemini-1.5-*`).

## Testar

1. Admin → Demandas → demanda com proposta → **Planejar Roteiro**
2. **Gerar Roteiro com IA**
3. Toast “Roteiro gerado!” com sugestões por dia
4. Se falhar com “GEMINI_API_KEY is not configured”, configure o secret
5. Se falhar com CORS, redeploy: `npx supabase functions deploy itinerary-ai`

## Limite de dias

O app limita a geração a **21 dias**.
