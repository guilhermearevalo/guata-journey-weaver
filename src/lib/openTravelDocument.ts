import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();

export interface TravelDocumentFile {
  id?: string;
  file_path?: string | null;
  file_url?: string | null;
}

export type OpenTravelDocumentOptions = {
  shareToken?: string;
  accessCode?: string;
};

function openBlobInNewTab(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}

async function fetchDocumentViaEdgeFunction(
  functionName: 'travel-document-open' | 'travel-document-sign',
  body: Record<string, unknown>,
  withAuth: boolean,
): Promise<Blob | null> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_KEY,
  };

  if (withAuth) {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return null;
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get('content-type') ?? '';
    if (res.ok && !contentType.includes('application/json')) {
      return res.blob();
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Opens a travel document in a new tab.
 * Uses edge functions with service-role download when signed URLs fail (Storage schema issues).
 */
export async function openTravelDocument(
  doc: TravelDocumentFile,
  options: OpenTravelDocumentOptions = {},
): Promise<string | null> {
  if (doc.file_path) {
    const { data, error } = await supabase.storage
      .from('travel-documents')
      .createSignedUrl(doc.file_path, 60 * 15);

    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      return data.signedUrl;
    }

    if (options.shareToken && doc.id) {
      const blob = await fetchDocumentViaEdgeFunction(
        'travel-document-sign',
        {
          token: options.shareToken,
          documentId: doc.id,
          code: options.accessCode?.trim() || null,
        },
        false,
      );
      if (blob) return openBlobInNewTab(blob);
    }

    if (doc.id) {
      const blob = await fetchDocumentViaEdgeFunction(
        'travel-document-open',
        { documentId: doc.id },
        true,
      );
      if (blob) return openBlobInNewTab(blob);
    }

    return null;
  }

  if (doc.file_url) {
    window.open(doc.file_url, '_blank', 'noopener,noreferrer');
    return doc.file_url;
  }

  return null;
}
