/** Supabase Storage file upload (false = use URL fields only; Storage broken on project Guatá). */
export const isStorageUploadEnabled =
  import.meta.env.VITE_STORAGE_UPLOADS !== 'false';

export const storageUploadDisabledMessage =
  'Upload de arquivo indisponível (Storage Supabase em manutenção). Cole a URL da imagem no campo abaixo e salve.';
