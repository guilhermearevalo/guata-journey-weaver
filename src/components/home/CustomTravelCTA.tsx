import { useNavigate } from 'react-router-dom';
import { Compass, Sparkles, Heart, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CustomTravelCTA() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Compass,
      title: 'Roteiro Exclusivo',
      description: 'Planejamento 100% personalizado para suas preferências e estilo de viagem.',
    },
    {
      icon: Sparkles,
      title: 'Curadoria Premium',
      description: 'Experiências selecionadas e verificadas pela nossa equipe especializada.',
    },
    {
      icon: Heart,
      title: 'Atendimento Humano',
      description: 'Consultor dedicado para acompanhar cada etapa do seu planejamento.',
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Suporte 24h durante sua viagem e garantia de satisfação.',
    },
  ];

  return (
    <section className="relative overflow-hidden py-20">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop)',
        }}
      >
        <div className="absolute inset-0 bg-primary/90" />
      </div>

      <div className="container relative mx-auto px-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold text-primary-foreground md:text-4xl lg:text-5xl">
            Sua Viagem dos Sonhos,{' '}
            <span className="text-accent">Do Seu Jeito</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/80">
            Conte para nós o que você imagina e transformamos em uma experiência 
            inesquecível. Sem roteiros prontos, apenas momentos únicos.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="rounded-xl bg-primary-foreground/10 p-6 text-center backdrop-blur-sm transition-all hover:bg-primary-foreground/20"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-foreground/20">
                <benefit.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="mb-2 font-display text-lg font-semibold text-primary-foreground">
                {benefit.title}
              </h3>
              <p className="text-sm text-primary-foreground/80">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            variant="secondary"
            className="h-14 px-8 text-base"
            onClick={() => navigate('/viagem-personalizada')}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Solicitar Viagem Personalizada
          </Button>
        </div>
      </div>
    </section>
  );
}
