import { supabase } from '@/integrations/supabase/client';
import { isStorageUploadEnabled, storageUploadDisabledMessage } from '@/lib/storageUploads';

const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const SUPABASE_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();

export type StorageUploadOptions = {
  upsert?: boolean;
  contentType?: string;
};

export function isStorageSchemaError(message?: string, statusCode?: string): boolean {
  const m = message ?? '';
  return (
    m.includes('database schema is invalid') ||
    m.includes('schema is out of sync') ||
    statusCode === '503'
  );
}

async function uploadViaEdgeFunction(
  bucket: string,
  path: string,
  file: File | Blob,
  options: StorageUploadOptions,
  fileName?: string,
): Promise<{ path: string; publicUrl: string }> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    throw new Error('Sessão expirada. Faça login novamente para enviar arquivos.');
  }

  const formData = new FormData();
  formData.append('bucket', bucket);
  formData.append('path', path);
  formData.append('upsert', String(options.upsert ?? true));
  if (options.contentType) formData.append('contentType', options.contentType);
  formData.append('file', file, fileName ?? (file instanceof File ? file.name : 'upload'));

  const res = await fetch(`${SUPABASE_URL}/functions/v1/storage-upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      apikey: SUPABASE_KEY,
    },
    body: formData,
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    path?: string;
    publicUrl?: string;
  };

  if (!res.ok) {
    throw new Error(body.error ?? `Upload falhou (${res.status})`);
  }

  const finalPath = body.path ?? path;
  const publicUrl =
    body.publicUrl ?? supabase.storage.from(bucket).getPublicUrl(finalPath).data.publicUrl;

  return { path: finalPath, publicUrl };
}

/** Upload com fallback automático via Edge Function quando o Storage direto falha (schema invalid). */
export async function uploadStorageFile(
  bucket: string,
  path: string,
  file: File | Blob,
  options: StorageUploadOptions = {},
): Promise<{ path: string; publicUrl: string }> {
  if (!isStorageUploadEnabled) {
    throw new Error(storageUploadDisabledMessage);
  }

  const uploadOptions = {
    upsert: options.upsert ?? true,
    contentType: options.contentType ?? (file instanceof File ? file.type || undefined : undefined),
  };

  const { error: directError } = await supabase.storage.from(bucket).upload(path, file, uploadOptions);

  if (!directError) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  }

  const supa = directError as { message?: string; statusCode?: string };
  if (!isStorageSchemaError(supa.message, supa.statusCode)) {
    throw directError;
  }

  return uploadViaEdgeFunction(
    bucket,
    path,
    file,
    uploadOptions,
    file instanceof File ? file.name : undefined,
  );
}
