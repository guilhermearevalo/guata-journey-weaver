import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const testimonials = [
  {
    id: 1,
    name: 'Mariana Costa',
    location: 'São Paulo, SP',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    rating: 5,
    text: 'A equipe da Guatá transformou nossa lua de mel em algo inesquecível. O atendimento personalizado fez toda a diferença. Cada detalhe foi pensado para nós.',
    trip: 'Lua de Mel em Maldivas',
  },
  {
    id: 2,
    name: 'Ricardo Almeida',
    location: 'Rio de Janeiro, RJ',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5,
    text: 'Fiz uma excursão para o Jalapão e voltei apaixonado. O roteiro foi perfeito, os guias incríveis e a organização impecável. Já estou planejando a próxima!',
    trip: 'Excursão Jalapão',
  },
  {
    id: 3,
    name: 'Fernanda Souza',
    location: 'Belo Horizonte, MG',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    rating: 5,
    text: 'Viajo com a família e precisava de algo que agradasse a todos. A Guatá montou um roteiro que superou nossas expectativas. As crianças amaram!',
    trip: 'Férias em Família - Nordeste',
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            O Que Nossos Viajantes Dizem
          </h2>
          <p className="mt-2 text-muted-foreground">
            Histórias reais de quem viveu experiências inesquecíveis conosco
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <Quote className="absolute right-4 top-4 h-10 w-10 text-muted/20" />
                
                <div className="mb-4 flex items-center gap-1">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                </div>
                
                <p className="mb-6 text-muted-foreground">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                    <AvatarFallback>
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 rounded-lg bg-muted px-3 py-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {testimonial.trip}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
