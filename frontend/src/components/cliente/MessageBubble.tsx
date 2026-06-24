import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MessageBubbleProps {
  content: string;
  createdAt: string;
  isOwn: boolean;
  senderName?: string;
}

export function MessageBubble({ content, createdAt, isOwn, senderName }: MessageBubbleProps) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted rounded-bl-sm'
        )}
      >
        {!isOwn && senderName && (
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            {senderName}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        <p
          className={cn(
            'mt-1 text-xs',
            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
          )}
        >
          {format(new Date(createdAt), "HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
