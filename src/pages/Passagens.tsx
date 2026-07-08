import { Seo } from '@/components/seo/Seo';
import { Link } from 'react-router-dom';
import { ExternalLink, Maximize2, Plane, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ONER_STORE_URL, ROTEIRO_SOB_MEDIDA_LABEL } from '@/lib/onerTravel';

export default function Passagens() {
  return (
    <div className="py-10 lg:py-14">
      <Seo
        path="/passagens"
        title="Passagens aéreas"
        description="Encontre e reserve passagens aéreas com a Guatá Viagens. Tarifas pesquisadas em tempo real e suporte da nossa equipe para a sua viagem."
      />
      <div className="container mx-auto space-y-8 px-4 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <Plane className="h-4 w-4" />
            Passagens, hotéis e pacotes
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Sua próxima viagem começa aqui
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Compare voos, hotéis e pacotes com condições especiais — em poucos cliques, do Pantanal
            ao mundo.
          </p>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Navegue pela loja completa sem sair do site da Guatá. Prefere um roteiro sob medida?{' '}
            <Link to="/viagem-personalizada" className="font-medium text-primary hover:underline">
              Fale conosco
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="mt-8 w-full space-y-3 px-2 sm:px-4 lg:px-6">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50 px-4 py-2.5 text-center text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
          <Maximize2 className="hidden h-4 w-4 shrink-0 sm:inline" />
          <span>Calendário cortado no computador?</span>
          <a
            href={ONER_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir busca em tela cheia
          </a>
        </div>

        <div className="rounded-xl border bg-background shadow-sm">
          <iframe
            title="Guatá Viagens — busca de passagens e hotéis"
            src={ONER_STORE_URL}
            className="h-[min(900px,85vh)] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allow="payment *; fullscreen"
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          A loja não carregou?{' '}
          <a
            href={ONER_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir em nova aba
          </a>
        </p>
      </div>

      <div className="container mx-auto mt-8 px-4 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border bg-muted/40 p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            Sonhando com uma viagem diferente? Nossa equipe cria roteiros exclusivos, com
            curadoria e atendimento de verdade.
          </p>
          <Button variant="outline" asChild>
            <Link to="/viagem-personalizada">
              <Sparkles className="mr-2 h-4 w-4" />
              Quero um {ROTEIRO_SOB_MEDIDA_LABEL.toLowerCase()}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
