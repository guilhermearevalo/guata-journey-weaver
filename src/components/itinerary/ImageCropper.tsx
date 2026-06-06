import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomIn, RotateCw, Loader2 } from 'lucide-react';

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: string;
  aspect?: number;
  onCropComplete: (croppedBlob: Blob) => void | Promise<void>;
}

async function getCroppedBlob(
  imageSrc: string,
  cropPixels: Area,
  rotation: number,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const rad = (rotation * Math.PI) / 180;
  const safeArea = Math.max(image.width, image.height) * 2;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate(rad);
  ctx.translate(-safeArea / 2, -safeArea / 2);
  ctx.drawImage(image, (safeArea - image.width) / 2, (safeArea - image.height) / 2);

  const data = ctx.getImageData(0, 0, safeArea, safeArea);
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  ctx.putImageData(
    data,
    Math.round(-(safeArea / 2 - image.width / 2) - cropPixels.x),
    Math.round(-(safeArea / 2 - image.height / 2) - cropPixels.y),
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao processar imagem'));
    }, 'image/jpeg', 0.9);
  });
}

export default function ImageCropper({ open, onOpenChange, image, aspect = 16 / 9, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(image, croppedAreaPixels, rotation);
      await onCropComplete(blob);
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cortar e enquadrar imagem</DialogTitle>
        </DialogHeader>
        <div className="relative h-72 w-full overflow-hidden rounded-lg bg-muted">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropChange}
          />
        </div>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-xs"><ZoomIn className="h-3.5 w-3.5" /> Zoom</Label>
            <Slider value={[zoom]} min={1} max={3} step={0.01} onValueChange={(v) => setZoom(v[0])} />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-xs"><RotateCw className="h-3.5 w-3.5" /> Girar</Label>
            <Slider value={[rotation]} min={0} max={360} step={1} onValueChange={(v) => setRotation(v[0])} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={processing || !croppedAreaPixels}>
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aplicar recorte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
