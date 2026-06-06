import { useMemo, useEffect } from 'react';
import { ShieldCheck, FileText, Download, ExternalLink } from 'lucide-react';

interface LegalSection {
  title: string;
  content: string;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle?: string;
  badge?: string;
  updatedAt?: string;
  sections: LegalSection[];
  pdfUrl?: string;
}

/**
 * Layout elegante e legível para páginas legais (Termos de Uso / Política de
 * Privacidade). Quando há PDF, ele é exibido embutido em tela cheia.
 */
const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function LegalPageLayout({
  title,
  subtitle,
  badge,
  updatedAt,
  sections,
  pdfUrl,
}: LegalPageLayoutProps) {
  const items = useMemo(
    () => sections.map((s) => ({ ...s, id: slugify(s.title) })),
    [sections],
  );

  useEffect(() => {
    if (pdfUrl) return;
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    const timer = window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [pdfUrl, items]);

  // Modo PDF: documento sempre acessível (alguns navegadores, sobretudo no
  // celular, não exibem PDF embutido — por isso oferecemos botões claros).
  if (pdfUrl) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <section className="relative overflow-hidden gradient-hero py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="container relative mx-auto px-4 text-center">
            {badge && (
              <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-background/15 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                {badge}
              </span>
            )}
            <h1 className="font-display text-3xl font-bold text-primary-foreground hero-text-shadow md:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mx-auto mt-4 max-w-2xl text-primary-foreground/90">{subtitle}</p>
            )}
          </div>
        </section>

        <section className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-3xl">
            {/* Card de acesso ao documento — funciona em qualquer dispositivo */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-8">
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-xl font-semibold text-foreground">Documento oficial em PDF</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Abra ou baixe o documento completo. Recomendado para leitura em qualquer dispositivo.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    <ExternalLink className="h-4 w-4" /> Abrir documento
                  </a>
                  <a
                    href={pdfUrl}
                    download
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-accent"
                  >
                    <Download className="h-4 w-4" /> Baixar PDF
                  </a>
                </div>
              </div>
            </div>

            {/* Visualizador embutido (complemento para desktop) */}
            <div className="mt-6 hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
              <object data={pdfUrl} type="application/pdf" className="h-[80vh] w-full">
                <iframe src={pdfUrl} title={title} className="h-[80vh] w-full" />
              </object>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="container relative mx-auto px-4 text-center">
          {badge && (
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-background/15 px-4 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              {badge}
            </span>
          )}
          <h1 className="font-display text-4xl font-bold text-primary-foreground hero-text-shadow md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/90">
              {subtitle}
            </p>
          )}
          {updatedAt && (
            <p className="mt-3 text-sm text-primary-foreground/70">
              Última atualização: {updatedAt}
            </p>
          )}
        </div>
      </section>

      {/* Conteúdo */}
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[240px_1fr]">
          {/* Índice */}
          {items.length > 1 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24 rounded-xl border bg-card p-5">
                <p className="mb-3 font-display text-sm font-semibold text-foreground">
                  Nesta página
                </p>
                <nav className="space-y-1">
                  {items.map((s, i) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      {i + 1}. {s.title.replace(/^\d+\.\s*/, '')}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}

          {/* Seções */}
          <div className="space-y-6">
            {items.map((section, index) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md md:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-display text-sm font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-semibold text-foreground md:text-2xl">
                      {section.title.replace(/^\d+\.\s*/, '')}
                    </h2>
                    <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                      {section.content}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
