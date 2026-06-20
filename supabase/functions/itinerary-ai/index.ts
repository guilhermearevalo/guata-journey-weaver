import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODELS = [
  Deno.env.get("GEMINI_MODEL"),
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
].filter(Boolean) as string[];

function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseGeminiError(text: string): string {
  try {
    const parsed = JSON.parse(text);
    return parsed?.error?.message ?? text.slice(0, 300);
  } catch {
    return text.slice(0, 300);
  }
}

async function callGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
): Promise<{ days: unknown[] }> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`[${model}] ${response.status}: ${parseGeminiError(text)}`);
  }

  const data = JSON.parse(text);
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error(`[${model}] resposta vazia da IA`);
  }

  const itinerary = JSON.parse(rawText);
  if (!Array.isArray(itinerary?.days)) {
    throw new Error(`[${model}] JSON sem campo days`);
  }

  return itinerary;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, days, preferences, existing_activities, day_number } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY")?.trim();
    if (!apiKey) {
      return jsonError("GEMINI_API_KEY não configurada nos secrets da Edge Function.");
    }

    if (!apiKey.startsWith("AIza")) {
      return jsonError(
        "Chave inválida para Gemini API. Crie uma chave em https://aistudio.google.com/apikey (formato AIza...). Chaves AQ... não funcionam neste endpoint.",
        400,
      );
    }

    const dayCount = Math.min(Math.max(1, Number(days) || 3), 21);

    const systemPrompt = `Você é um planejador de roteiros de viagem no Brasil e no mundo.
Responda APENAS com JSON válido: {"days":[{"day":1,"activities":[...]}]}
Cada atividade: name, description, category (gastronomia|cultura|aventura|natureza|compras|transporte|hospedagem), estimated_cost (número BRL), time_slot (manhã|tarde|noite).`;

    const userPrompt = day_number
      ? `Sugira 3-4 atividades para o Dia ${day_number} em ${destination}.
Preferências: ${preferences || "nenhuma"}.
Já planejado: ${JSON.stringify(existing_activities || [])}.
Retorne só o dia ${day_number}.`
      : `Roteiro de ${dayCount} dia(s) para ${destination}.
Preferências: ${preferences || "nenhuma"}.
3-5 atividades por dia (manhã, tarde, noite).
Já existente: ${JSON.stringify(existing_activities || [])}.`;

    const uniqueModels = [...new Set(MODELS)];
    let lastError = "Nenhum modelo Gemini respondeu.";

    for (const model of uniqueModels) {
      try {
        const itinerary = await callGemini(apiKey, model, systemPrompt, userPrompt);
        return new Response(JSON.stringify(itinerary), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        console.error("Gemini attempt failed:", lastError);
      }
    }

    return jsonError(`Erro Gemini: ${lastError}`);
  } catch (e) {
    console.error("itinerary-ai error:", e);
    return jsonError(e instanceof Error ? e.message : "Unknown error");
  }
});
