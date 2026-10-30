import { MessageSquare, FileCheck, CreditCard, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

export function HowItWorks() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const steps = [
    { icon: MessageSquare, number: '01', title: t('hiw1t'), description: t('hiw1d') },
    { icon: FileCheck, number: '02', title: t('hiw2t'), description: t('hiw2d') },
    { icon: CreditCard, number: '03', title: t('hiw3t'), description: t('hiw3d') },
    { icon: Plane, number: '04', title: t('hiw4t'), description: t('hiw4d') },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-muted/50 via-background to-muted/30 py-20 lg:py-28">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            {t('hiwEyebrow')}
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">{t('hiwTitle')}</h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">{t('hiwSub')}</p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" />

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="group relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
            >
              <div className="absolute -top-4 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold tracking-widest text-primary-foreground shadow-md">
                {t('hiwStep')} {step.number}
              </div>

              <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform group-hover:scale-110">
                <step.icon className="h-7 w-7" />
              </div>

              <h3 className="mt-5 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>

              {i < steps.length - 1 && (
                <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow lg:flex">
                  →
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => navigate('/viagem-personalizada')}>
            {t('hiwCtaStart')}
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/experiencias')}>
            {t('hiwCtaExperiences')}
          </Button>
        </div>
      </div>
    </section>
  );
}
