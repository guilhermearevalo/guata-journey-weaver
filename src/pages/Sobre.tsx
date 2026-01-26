import { MapPin, Heart, Users, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Sobre = () => {
  const valores = [
    {
      icon: Heart,
      title: 'Paixão por Viagens',
      description: 'Transformamos sonhos em experiências únicas e memoráveis.',
    },
    {
      icon: Users,
      title: 'Atendimento Personalizado',
      description: 'Cada viajante é único e merece um roteiro feito sob medida.',
    },
    {
      icon: Award,
      title: 'Excelência',
      description: 'Parceiros selecionados e curadoria rigorosa em cada detalhe.',
    },
    {
      icon: MapPin,
      title: 'Expertise Local',
      description: 'Conhecimento profundo dos destinos brasileiros e internacionais.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl lg:text-6xl">
            Sobre a <span className="text-primary">Guatá</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Somos uma agência de curadoria turística que transforma viagens em 
            experiências extraordinárias. Nosso nome vem do Tupi-Guarani e significa 
            "caminhar", representando nossa missão de guiar você pelos melhores 
            caminhos do mundo.
          </p>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">Nossa História</h2>
              <div className="mt-6 space-y-4 text-muted-foreground">
                <p>
                  A Guatá Travel Experience nasceu da paixão por descobrir lugares 
                  incríveis e compartilhar essas experiências com outros viajantes.
                </p>
                <p>
                  Acreditamos que viajar vai muito além de visitar pontos turísticos. 
                  É sobre conectar-se com culturas, criar memórias e transformar-se 
                  através de cada jornada.
                </p>
                <p>
                  Nossa equipe de especialistas trabalha incansavelmente para 
                  encontrar experiências autênticas, hospedagens especiais e 
                  roteiros que fogem do comum.
                </p>
              </div>
            </div>
            <div className="relative">
              <div 
                className="aspect-[4/3] rounded-2xl bg-cover bg-center shadow-xl"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600)' 
                }}
              />
              <div className="absolute -bottom-6 -left-6 rounded-xl bg-primary p-6 text-white shadow-lg">
                <p className="text-3xl font-bold">5+</p>
                <p className="text-sm">Anos de experiência</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nossos Valores */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Nossos Valores</h2>
            <p className="mt-4 text-muted-foreground">
              O que nos move e define cada experiência que criamos
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {valores.map((valor) => (
              <Card key={valor.title} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <valor.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-display text-xl font-semibold">{valor.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{valor.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Pronto para sua próxima aventura?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Entre em contato e deixe-nos criar a viagem dos seus sonhos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a 
              href="/viagem-personalizada" 
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-white font-medium hover:bg-primary/90 transition-colors"
            >
              Solicitar Orçamento
            </a>
            <a 
              href="/contato" 
              className="inline-flex items-center justify-center rounded-md border border-primary px-8 py-3 text-primary font-medium hover:bg-primary/10 transition-colors"
            >
              Fale Conosco
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sobre;
