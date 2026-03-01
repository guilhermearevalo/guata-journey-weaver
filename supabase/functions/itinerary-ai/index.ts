import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, days, preferences, existing_activities, day_number } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um planejador de roteiros de viagem especializado em turismo no Brasil e no mundo.
Retorne sugestões de atividades usando a ferramenta suggest_itinerary.
Cada atividade deve ter: name, description, category (gastronomia, cultura, aventura, natureza, compras, transporte, hospedagem), estimated_cost (número em BRL), time_slot (manhã, tarde, noite).
Seja criativo, prático e considere logística entre atividades.`;

    let userPrompt: string;
    if (day_number) {
      userPrompt = `Sugira 3-4 atividades alternativas para o Dia ${day_number} em ${destination}.
Preferências: ${preferences || 'nenhuma especificada'}.
Atividades já planejadas para esse dia: ${JSON.stringify(existing_activities || [])}.
Sugira opções DIFERENTES das já existentes.`;
    } else {
      userPrompt = `Crie um roteiro completo de ${days} dia(s) para ${destination}.
Preferências do viajante: ${preferences || 'nenhuma especificada'}.
Para cada dia, sugira 3-5 atividades distribuídas entre manhã, tarde e noite.
Considere atividades já existentes: ${JSON.stringify(existing_activities || [])}.`;
    }

    const body: Record<string, unknown> = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "suggest_itinerary",
            description: "Return structured itinerary suggestions organized by day.",
            parameters: {
              type: "object",
              properties: {
                days: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      day: { type: "number" },
                      activities: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                            category: { type: "string" },
                            estimated_cost: { type: "number" },
                            time_slot: { type: "string", enum: ["manhã", "tarde", "noite"] },
                          },
                          required: ["name", "description", "category", "estimated_cost", "time_slot"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["day", "activities"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["days"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "suggest_itinerary" } },
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas solicitações. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para IA." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro na IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const itinerary = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(itinerary), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Sem sugestões retornadas" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("itinerary-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
