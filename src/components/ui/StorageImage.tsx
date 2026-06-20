import { useEffect, useState } from 'react';
import { resolveStorageDisplayUrl } from '@/lib/resolveStorageDisplayUrl';
import { parseSupabasePublicObjectUrl } from '@/lib/resolveStorageDisplayUrl';
import { cn } from '@/lib/utils';

type StorageImageProps = React.ImgHTMLAttributes<HTMLImageElement>;

/** Imagem do Storage — usa URL pública; se falhar (400), tenta URL assinada. */
export function StorageImage({ src, alt, className, onError, ...props }: StorageImageProps) {
  const [displaySrc, setDisplaySrc] = useState(src ?? '');
  const [triedSigned, setTriedSigned] = useState(false);

  useEffect(() => {
    setDisplaySrc(src ?? '');
    setTriedSigned(false);
  }, [src]);

  const handleError: React.ReactEventHandler<HTMLImageElement> = (event) => {
    onError?.(event);
    if (!src || triedSigned || !parseSupabasePublicObjectUrl(src)) return;

    setTriedSigned(true);
    void resolveStorageDisplayUrl(src).then((signed) => {
      if (signed && signed !== src) setDisplaySrc(signed);
    });
  };

  if (!displaySrc) return null;

  return (
    <img
      {...props}
      src={displaySrc}
      alt={alt}
      className={cn(className)}
      onError={handleError}
    />
  );
}
