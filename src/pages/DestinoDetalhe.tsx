import { Link, Navigate, useParams } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, ShieldCheck, Lightbulb, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Seo } from '@/components/seo/Seo';
import { getDestination } from '@/lib/destinations';
import { useContactInfo } from '@/hooks/useContactInfo';

const DestinoDetalhe = () => {
  const { slug } = useParams();
  const d = getDestination(slug);
  const { data: contact } = useContactInfo();
  if (!d) return <Navigate to="/destinos" replace />;

  const phone = (contact as { whatsapp?: string } | null | undefined)?.whatsapp?.replace(/\D/g, '');
  const waText = encodeURIComponent(`Olá, Guatá! Quero um roteiro para ${d.name}.`);
  const waLink = phone ? `https://wa.me/${phone}?text=${waText}` : null;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'TouristDestination',
      name: d.name,
      description: d.intro,
      image: d.image,
      containedInPlace: { '@type': 'State', name: d.region },
      includesAttraction: d.highlights.map((h) => ({ '@type': 'TouristAttraction', name: h })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: d.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return (
    <article>
      <Seo title={d.seoTitle} description={d.seoDescription} path={`/destinos/${d.slug}`} image={d.image} jsonLd={jsonLd} />

      <section className="relative h-[60vh] min-h-[420px] overflow-hidden">
        <img src={d.image} alt={d.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
        <div className="container relative mx-auto flex h-full flex-col justify-end px-4 pb-12 lg:px-8">
          <p className="text-sm uppercase tracking-widest text-background/80">{d.region}</p>
          <h1 className="font-serif text-5xl font-bold text-background md:text-6xl">{d.name}</h1>
          <p className="mt-3 max-w-xl text-lg text-background/90">{d.tagline}</p>
        </div>
      </section>

      <div className="container mx-auto grid gap-12 px-4 py-16 lg:grid-cols-3 lg:px-8">
        <div className="space-y-12 lg:col-span-2">
          <p className="text-lg leading-relaxed text-foreground/90">{d.intro}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5"><Calendar className="mb-2 h-5 w-5 text-primary" /><h3 className="font-semibold">Melhor época</h3><p className="text-sm text-muted-foreground">{d.bestTime}</p></div>
            <div className="rounded-xl border bg-card p-5"><Clock className="mb-2 h-5 w-5 text-primary" /><h3 className="font-semibold">Tempo ideal</h3><p className="text-sm text-muted-foreground">{d.idealDays}</p></div>
          </div>

          <section>
            <h2 className="mb-4 font-serif text-3xl font-semibold">Imperdíveis</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {d.highlights.map((h) => (
                <li key={h} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />{h}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-6 font-serif text-3xl font-semibold">Roteiro sugerido</h2>
            <ol className="relative space-y-8 border-l-2 border-primary/30 pl-8">
              {d.itinerary.map((s) => (
                <li key={s.day} className="relative">
                  <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-background bg-primary" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">{s.day}</p>
                  <h3 className="font-serif text-xl font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground">{s.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl bg-muted p-6">
            <h2 className="mb-3 flex items-center gap-2 font-serif text-2xl font-semibold"><Lightbulb className="h-5 w-5 text-primary" />Dicas da Guatá</h2>
            <ul className="list-disc space-y-1 pl-5 text-foreground/90">{d.tips.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>

          <section>
            <h2 className="mb-4 font-serif text-3xl font-semibold">Perguntas frequentes</h2>
            <div className="space-y-4">
              {d.faq.map((f) => (
                <div key={f.q} className="rounded-xl border p-5"><h3 className="font-semibold">{f.q}</h3><p className="mt-1 text-muted-foreground">{f.a}</p></div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-4 rounded-2xl border bg-card p-6 shadow-lg">
            <h2 className="font-serif text-2xl font-semibold">Quer este roteiro do seu jeito?</h2>
            <p className="text-sm text-muted-foreground">Ajustamos datas, hospedagem e passeios ao seu orçamento. Resposta rápida.</p>
            <Button asChild className="w-full" size="lg"><Link to="/viagem-personalizada">Personalizar meu roteiro</Link></Button>
            {waLink && (
              <Button asChild variant="outline" className="w-full" size="lg">
                <a href={waLink} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" />Falar no WhatsApp</a>
              </Button>
            )}
            <p className="flex items-center gap-2 pt-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Agência certificada Cadastur</p>
          </div>
        </aside>
      </div>
    </article>
  );
};

export default DestinoDetalhe;
