import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { REQUEST_STATUS_HELP, type RequestStatus } from '@/lib/requestStatusHelp';

interface StatusHelpIconProps {
  status: RequestStatus;
  className?: string;
}

export function StatusHelpIcon({ status, className }: StatusHelpIconProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={className ?? 'inline-flex shrink-0 text-muted-foreground hover:text-foreground'}
            aria-label={`O que significa ${status}`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
          {REQUEST_STATUS_HELP[status]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
