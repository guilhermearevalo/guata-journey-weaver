import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { REQUEST_STATUS_HELP, REQUEST_STATUS_LABELS, type RequestStatus } from '@/lib/requestStatusHelp';

interface StatusHelpIconProps {
  status: RequestStatus;
  className?: string;
}

export function StatusHelpIcon({ status, className }: StatusHelpIconProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={className ?? 'inline-flex shrink-0 text-muted-foreground hover:text-foreground'}
          aria-label={`O que significa ${REQUEST_STATUS_LABELS[status]}`}
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        sideOffset={6}
        collisionPadding={16}
        className="w-72 max-w-[calc(100vw-2rem)] p-3"
      >
        <p className="mb-1 text-sm font-semibold">{REQUEST_STATUS_LABELS[status]}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{REQUEST_STATUS_HELP[status]}</p>
      </PopoverContent>
    </Popover>
  );
}
