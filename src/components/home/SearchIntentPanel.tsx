import { ArrowRight, Bus, Plane, Sparkles, X } from 'lucide-react';
import type { SearchIntent, SearchInterpretation } from '@/lib/interpretSearchQuery';
import { cn } from '@/lib/utils';

const INTENT_CONFIG: Record<
  SearchIntent,
  { icon: typeof Plane; iconBg: string; iconColor: string; hoverBorder: string }
> = {
  passagens: {
    icon: Plane,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    hoverBorder: 'hover:border-primary/40',
  },
  experiencias: {
    icon: Bus,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-700 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-500/35',
  },
  roteiro: {
    icon: Sparkles,
    iconBg: 'bg-secondary/10',
    iconColor: 'text-secondary',
    hoverBorder: 'hover:border-secondary/35',
  },
};

interface SearchIntentPanelProps {
  interpretation: SearchInterpretation;
  onConfirm: (intent: SearchIntent) => void;
  onDismiss: () => void;
}

function IntentCard({
  option,
  onConfirm,
  emphasized = false,
}: {
  option: SearchInterpretation['primary'];
  onConfirm: (intent: SearchIntent) => void;
  emphasized?: boolean;
}) {
  const config = INTENT_CONFIG[option.intent];
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={() => onConfirm(option.intent)}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl border bg-card p-3.5 text-left transition-all duration-200',
        'hover:shadow-md hover:-translate-y-px',
        emphasized ? 'border-primary/25 shadow-sm' : 'border-border/80',
        config.hoverBorder,
      )}
    >
      <span
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
          config.iconBg,
        )}
      >
        <Icon className={cn('h-5 w-5', config.iconColor)} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{option.title}</span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {option.description}
        </span>
      </span>
      <ArrowRight
        className={cn(
          'h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary',
        )}
      />
    </button>
  );
}

export function SearchIntentPanel({ interpretation, onConfirm, onDismiss }: SearchIntentPanelProps) {
  const { query, balancedOptions, allOptions, primary, alternatives } = interpretation;

  const options = balancedOptions ? allOptions : [primary, ...alternatives];

  return (
    <div
      className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200"
      role="region"
      aria-label="O que você está buscando"
    >
      <div className="rounded-xl border border-border/60 bg-primary/[0.03] px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-foreground">
              O que você está buscando?
            </p>
            {query && (
              <p className="mt-1 text-sm text-muted-foreground">
                Você pesquisou:{' '}
                <span className="font-medium capitalize text-foreground">{query}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2.5">
        {options.map((option, index) => (
          <IntentCard
            key={option.intent}
            option={option}
            onConfirm={onConfirm}
            emphasized={!balancedOptions && index === 0}
          />
        ))}
      </div>
    </div>
  );
}
