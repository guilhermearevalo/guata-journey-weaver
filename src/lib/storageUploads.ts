/**
 * Supabase Storage uploads — ligado por padrão.
 * Só desativa com VITE_STORAGE_UPLOADS=false (emergência).
 * Projeto Guatá: ojpgobftvomqxyvrqxma
 */
function parseStorageUploadEnabled(raw: string | undefined): boolean {
  if (raw === undefined || raw === '') return true;
  const normalized = raw.trim().toLowerCase();
  return normalized !== 'false' && normalized !== '0';
}

export const isStorageUploadEnabled = parseStorageUploadEnabled(
  import.meta.env.VITE_STORAGE_UPLOADS
);

export const storageUploadDisabledMessage =
  'Upload de arquivo indisponível no momento. Cole a URL da imagem no campo abaixo e salve.';
