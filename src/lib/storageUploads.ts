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
