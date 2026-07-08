import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export type ProposalWizardStep = 1 | 2 | 3;

const STEPS: { id: ProposalWizardStep; label: string }[] = [
  { id: 1, label: 'Dados do Cliente' },
  { id: 2, label: 'Roteiro e Destino' },
  { id: 3, label: 'Valores e Prazos' },
];

interface ProposalWizardLayoutProps {
  step: ProposalWizardStep;
  proposalRef: string;
  title: string;
  subtitle: string;
  onBack: () => void;
  onStepChange?: (step: ProposalWizardStep) => void;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function ProposalWizardLayout({
  step,
  proposalRef,
  title,
  subtitle,
  onBack,
  onStepChange,
  footer,
  children,
}: ProposalWizardLayoutProps) {
  return (
    <div className="-m-6 flex min-h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col bg-[#3d322c] px-8 py-10 text-white lg:w-[300px] xl:w-[340px]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60">
          Gestão de Vendas
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold italic leading-tight">
          Criar Proposta
        </h1>

        <nav className="mt-10 space-y-6" aria-label="Etapas da proposta">
          {STEPS.map(({ id, label }) => {
            const active = step === id;
            const done = step > id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onStepChange?.(id)}
                disabled={!onStepChange}
                className={cn(
                  'flex w-full items-center gap-4 text-left transition-opacity',
                  onStepChange ? 'cursor-pointer hover:opacity-90' : 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold',
                    active && 'border-[#2a9d8f] bg-[#2a9d8f] text-white',
                    done && !active && 'border-[#2a9d8f] bg-transparent text-[#2a9d8f]',
                    !active && !done && 'border-white/40 text-white/70',
                  )}
                >
                  {String(id).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    active ? 'text-white' : 'text-white/60',
                  )}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </nav>

        <blockquote className="mt-auto hidden rounded-xl border border-white/10 bg-white/5 p-4 text-sm italic leading-relaxed text-white/80 lg:block">
          &ldquo;O luxo está na atenção aos detalhes. Cada campo preenchido aproxima seu cliente do
          sonho.&rdquo;
        </blockquote>
      </aside>

      <div className="flex flex-1 flex-col bg-background">
        <div className="flex items-start justify-between gap-4 border-b px-6 py-5 lg:px-10">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h2 className="font-display text-xl font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {proposalRef}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-10 lg:py-8">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4 lg:px-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
