/**
 * Supabase Storage uploads.
 *
 * Uploads are enabled by default. They only get disabled if the env var is
 * explicitly set to "false"/"0" (legacy workaround from when the old project's
 * Storage was broken). The current Lovable Cloud project has working buckets,
 * so uploads work for authenticated staff users.
 */
function parseStorageUploadEnabled(raw: string | undefined): boolean {
  const normalized = raw?.trim().toLowerCase();
  return normalized !== 'false' && normalized !== '0';
}

export const isStorageUploadEnabled = parseStorageUploadEnabled(
  import.meta.env.VITE_STORAGE_UPLOADS
);

export const storageUploadDisabledMessage =
  'Upload de arquivo indisponível no momento. Cole a URL da imagem no campo abaixo e salve.';
