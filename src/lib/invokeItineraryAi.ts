import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { ItineraryDay } from '@/lib/itinerary';

export type ItineraryAiBody = {
  destination: string;
  days: number;
  preferences: string;
  existing_activities: unknown;
  day_number?: number;
};

export type ItineraryAiResult = { days: ItineraryDay[] };

async function readFunctionError(error: unknown, data: unknown): Promise<string> {
  if (data && typeof data === 'object' && 'error' in data && typeof (data as { error: unknown }).error === 'string') {
    return (data as { error: string }).error;
  }

  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
        return body.error;
      }
    } catch {
      // ignore parse failure
    }
  }

  if (error instanceof Error) return error.message;
  return 'Erro ao chamar itinerary-ai.';
}

export async function invokeItineraryAi(body: ItineraryAiBody): Promise<ItineraryAiResult> {
  const { data, error } = await supabase.functions.invoke('itinerary-ai', { body });

  if (error || (data && typeof data === 'object' && 'error' in data)) {
    throw new Error(await readFunctionError(error, data));
  }

  if (!data || typeof data !== 'object' || !('days' in data)) {
    throw new Error('Resposta inválida da IA.');
  }

  return data as ItineraryAiResult;
}
