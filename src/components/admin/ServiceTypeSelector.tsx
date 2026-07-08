import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SERVICE_TYPE_DESCRIPTIONS,
  SERVICE_TYPE_LABELS,
  type ServiceType,
} from '@/lib/serviceType';
import { Briefcase, Map, Package } from 'lucide-react';

const OPTIONS: { value: ServiceType; icon: typeof Map }[] = [
  { value: 'consultancy', icon: Map },
  { value: 'full_package', icon: Package },
  { value: 'other', icon: Briefcase },
];

interface ServiceTypeSelectorProps {
  value: ServiceType;
  note?: string;
  onTypeChange: (type: ServiceType) => void;
  onNoteChange?: (note: string) => void;
  onNoteBlur?: () => void;
  disabled?: boolean;
}

export function ServiceTypeSelector({
  value,
  note = '',
  onTypeChange,
  onNoteChange,
  onNoteBlur,
  disabled,
}: ServiceTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map(({ value: optionValue, icon: Icon }) => {
          const selected = value === optionValue;
          return (
            <button
              key={optionValue}
              type="button"
              disabled={disabled}
              onClick={() => onTypeChange(optionValue)}
              className={cn(
                'rounded-lg border p-3 text-left transition-colors',
                'hover:border-primary/50 hover:bg-muted/40',
                selected ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-card',
                disabled && 'pointer-events-none opacity-60',
              )}
            >
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium leading-tight">{SERVICE_TYPE_LABELS[optionValue]}</p>
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {SERVICE_TYPE_DESCRIPTIONS[optionValue]}
              </p>
            </button>
          );
        })}
      </div>

      {value === 'other' && (
        <div className="space-y-1.5">
          <Label htmlFor="service-type-note" className="text-xs text-muted-foreground">
            Descreva o serviço
          </Label>
          <Input
            id="service-type-note"
            value={note}
            disabled={disabled}
            placeholder="Ex.: Só passagem SP–Bonito, seguro viagem, transfer..."
            onChange={(e) => onNoteChange?.(e.target.value)}
            onBlur={() => onNoteBlur?.()}
          />
        </div>
      )}
    </div>
  );
}
