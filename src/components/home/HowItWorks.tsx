import { MessageSquare, FileCheck, CreditCard, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const steps = [
  {
    icon: MessageSquare,
    number: '01',
    title: 'Conte sua viagem',
    description: 'Diga para onde você quer ir, quando, com quantas pessoas e qual o seu estilo. Em minutos.',
  },
  {
    icon: FileCheck,
    number: '02',
    title: 'Receba a proposta',
    description: 'Nossa equipe (e parceiros locais credenciados) montam um roteiro sob medida com preço fechado.',
  },
  {
    icon: CreditCard,
    number: '03',
    title: 'Aprove e pague',
    description: 'Revisão, ajustes e pagamento seguro pela plataforma. Tudo registrado em um lugar só.',
  },
  {
    icon: Plane,
    number: '04',
    title: 'Viaje com suporte',
    description: 'Vouchers, ingressos e roteiro digital. Atendimento humano via WhatsApp do começo ao fim.',
  },
];

export function HowItWorks() {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background py-20 lg:py-28">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-secondary/5 blur-3xl" />

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <span className="inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            Como funciona
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold leading-tight md:text-5xl">
            Da ideia à viagem,<br className="hidden md:block" /> em 4 passos simples
          </h2>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Receptivo nascido em Mato Grosso do Sul, organizamos viagens para todo o Brasil e o mundo — com curadoria, parceiros locais e atendimento humano.
          </p>
        </div>

        {/* Steps grid */}
        <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Connector line on lg */}
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" />

          {steps.map((step, i) => (
            <div
              key={step.number}
              className="group relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
            >
              {/* Number badge */}
              <div className="absolute -top-4 left-6 rounded-full bg-primary px-3 py-1 text-xs font-bold tracking-widest text-primary-foreground shadow-md">
                PASSO {step.number}
              </div>

              <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary transition-transform group-hover:scale-110">
                <step.icon className="h-7 w-7" />
              </div>

              <h3 className="mt-5 font-display text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>

              {/* Arrow between cards */}
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
            Começar minha viagem
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/experiencias')}>
            Ver experiências prontas
          </Button>
        </div>
      </div>
    </section>
  );
}
