import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminPageLoader({ message = 'Carregando...' }: { message?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Skeleton className="h-2 w-48" />
    </div>
  );
}
