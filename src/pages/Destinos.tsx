import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { destinations } from '@/lib/destinations';

const Destinos = () => (
  <div className="container mx-auto px-4 py-16 lg:px-8">
    <Seo
      title="Destinos: Bonito, Pantanal e Chapada dos Guimarães"
      description="Roteiros completos para Bonito, Pantanal e Chapada dos Guimarães. Planeje com a Guatá, agência de turismo certificada Cadastur."
      path="/destinos"
    />
    <header className="mx-auto mb-12 max-w-2xl text-center">
      <p className="mb-2 text-sm font-medium uppercase tracking-widest text-primary">Destinos Guatá</p>
      <h1 className="font-serif text-4xl font-bold text-foreground md:text-5xl">Para onde você quer ir?</h1>
      <p className="mt-4 text-muted-foreground">Roteiros pensados por quem conhece o Centro-Oeste de perto.</p>
    </header>
    <div className="grid gap-8 md:grid-cols-3">
      {destinations.map((d) => (
        <Link key={d.slug} to={`/destinos/${d.slug}`} className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-lg">
          <div className="aspect-[4/3] overflow-hidden">
            <img src={d.image} alt={d.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="space-y-2 p-6">
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{d.region}</p>
            <h2 className="font-serif text-2xl font-semibold text-foreground">{d.name}</h2>
            <p className="text-sm text-muted-foreground">{d.tagline}</p>
            <span className="inline-flex items-center gap-1 pt-2 text-sm font-medium text-primary">Ver roteiro <ArrowRight className="h-4 w-4" /></span>
          </div>
        </Link>
      ))}
    </div>
  </div>
);

export default Destinos;
