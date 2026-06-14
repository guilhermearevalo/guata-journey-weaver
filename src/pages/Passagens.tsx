import { useEffect, useRef, useState } from 'react';
import { Seo } from '@/components/seo/Seo';
import { Link } from 'react-router-dom';
import { ExternalLink, LayoutGrid, Loader2, Plane, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ONER_STORE_URL } from '@/lib/onerTravel';
import { isOnerWidgetProductionHost, PASSAGENS_URL } from '@/lib/site';

const WIDGET_CHECK_MS = 6000;

function widgetHasContent(wrapper: HTMLElement | null): boolean {
  const widget = wrapper?.querySelector('befly-widget');
  if (!widget) return false;
  return (
    widget.childElementCount > 0 ||
    (widget as HTMLElement).innerHTML.trim().length > 0 ||
    widget.shadowRoot != null
  );
}

export default function Passagens() {
  const widgetRef = useRef<HTMLDivElement>(null);
  const onProductionHost = isOnerWidgetProductionHost();
  const [activeTab, setActiveTab] = useState(onProductionHost ? 'busca' : 'loja');
  const [showFallback, setShowFallback] = useState(!onProductionHost);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetLoading, setWidgetLoading] = useState(onProductionHost);

  useEffect(() => {
    if (!onProductionHost) return;

    setWidgetLoading(true);
    setShowFallback(false);

    const check = () => {
      const ready = widgetHasContent(widgetRef.current);
      if (ready) {
        setWidgetReady(true);
        setWidgetLoading(false);
        setShowFallback(false);
      }
      return ready;
    };

    const timer = window.setTimeout(() => {
      setWidgetLoading(false);
      if (!check()) setShowFallback(true);
    }, WIDGET_CHECK_MS);

    const wrapper = widgetRef.current;
    const observer =
      wrapper &&
      new MutationObserver(() => {
        if (check()) observer.disconnect();
      });
    if (observer && wrapper) {
      observer.observe(wrapper, { childList: true, subtree: true, attributes: true });
    }

    const poll = window.setInterval(() => {
      if (check()) window.clearInterval(poll);
    }, 500);

    return () => {
      window.clearTimeout(timer);
      window.clearInterval(poll);
      observer?.disconnect();
    };
  }, [onProductionHost]);

  return (
    <div className="container mx-auto px-4 py-10 lg:px-8 lg:py-14">
      <Seo
        path="/passagens"
        title="Passagens aéreas"
        description="Encontre e reserve passagens aéreas com a Guatá Viagens. Tarifas pesquisadas em tempo real e suporte da nossa equipe para a sua viagem."
      />
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="space-y-3 text-center">
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
            Prefere um roteiro feito sob medida?{' '}
            <Link to="/viagem-personalizada" className="font-medium text-primary hover:underline">
              Fale conosco
            </Link>{' '}
            e montamos a viagem ideal para você.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="mx-auto grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="busca" className="gap-2">
              <Search className="h-4 w-4" />
              Busca rápida
            </TabsTrigger>
            <TabsTrigger value="loja" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Loja completa
            </TabsTrigger>
          </TabsList>

          <p className="text-center text-sm text-muted-foreground">
            {activeTab === 'busca'
              ? 'Pesquise abaixo e veja os resultados aqui no site, sem abrir outra aba.'
              : 'Navegue pela loja completa de passagens e hotéis sem sair do site da Guatá.'}
          </p>

          <TabsContent value="busca" className="mt-0 space-y-4">
            <div
              ref={widgetRef}
              id="oner-widget-wrapper"
              className={widgetReady ? 'min-h-[200px]' : 'min-h-[140px]'}
            >
              {widgetLoading && !widgetReady && (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando buscador…
                </div>
              )}
              <div id="wrapper">
                <befly-widget language="pt-br" new-tab="false" />
              </div>
            </div>

            {showFallback && (
              <Card className="border-dashed">
                <CardContent className="space-y-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {!onProductionHost ? (
                      <>
                        Esta é a versão de pré-visualização. O buscador completo está em{' '}
                        <a
                          href={PASSAGENS_URL}
                          className="font-medium text-primary hover:underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          www.agenciaguata.com/passagens
                        </a>
                        . Você também pode usar a aba &quot;Loja completa&quot; ou o link abaixo.
                      </>
                    ) : (
                      'Não foi possível carregar o buscador agora. Use a aba "Loja completa" ou o link abaixo.'
                    )}
                  </p>
                  <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                    {onProductionHost && (
                      <Button size="lg" variant="default" onClick={() => setActiveTab('loja')}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        Abrir loja completa
                      </Button>
                    )}
                    {!onProductionHost && (
                      <Button asChild size="lg" variant="default">
                        <a href={PASSAGENS_URL} target="_blank" rel="noopener noreferrer">
                          Abrir agenciaguata.com
                        </a>
                      </Button>
                    )}
                    <Button asChild size="lg" variant={onProductionHost ? 'outline' : 'outline'}>
                      <a href={ONER_STORE_URL} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir em nova aba
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="loja" className="mt-0 space-y-3">
            <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
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
                className="font-medium text-primary hover:underline"
              >
                Abrir em nova aba
              </a>
            </p>
          </TabsContent>
        </Tabs>

        <div className="rounded-xl border bg-muted/40 p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            Sonhando com uma viagem diferente? Nossa equipe cria roteiros exclusivos, com
            curadoria e atendimento de verdade.
          </p>
          <Button variant="outline" asChild>
            <Link to="/viagem-personalizada">
              <Sparkles className="mr-2 h-4 w-4" />
              Quero um roteiro personalizado
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
