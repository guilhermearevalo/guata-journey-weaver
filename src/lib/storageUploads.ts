/** Supabase Storage file upload (false = use URL fields only; Storage broken on project Guatá). */
function parseStorageUploadEnabled(raw: string | undefined): boolean {
  const normalized = raw?.trim().toLowerCase();
  return normalized !== 'false' && normalized !== '0';
}

export const isStorageUploadEnabled = parseStorageUploadEnabled(
  import.meta.env.VITE_STORAGE_UPLOADS
);

export const storageUploadDisabledMessage =
  'Upload de arquivo indisponível (Storage Supabase em manutenção). Cole a URL da imagem no campo abaixo e salve.';

// #region agent log
if (typeof window !== 'undefined') {
  const raw = import.meta.env.VITE_STORAGE_UPLOADS;
  fetch('http://127.0.0.1:7449/ingest/b3289cc1-0659-4ca8-9fb9-988f3eaec03b', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0c8053' },
    body: JSON.stringify({
      sessionId: '0c8053',
      location: 'storageUploads.ts:init',
      message: 'storage upload flag evaluated',
      data: {
        raw,
        rawLength: raw?.length ?? null,
        rawCharCodes: raw ? [...raw].map((c) => c.charCodeAt(0)) : [],
        isStorageUploadEnabled,
      },
      timestamp: Date.now(),
      hypothesisId: 'H5',
      runId: 'post-fix',
    }),
  }).catch(() => {});
}
// #endregion
