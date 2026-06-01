import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Plane, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ONER_STORE_URL, ONER_WIDGET_SCRIPT } from '@/lib/onerTravel';
import { isOnerWidgetProductionHost } from '@/lib/site';

const WIDGET_CHECK_MS = 5000;

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
  const [showFallback, setShowFallback] = useState(!onProductionHost);
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    if (!onProductionHost) return;

    const existing = document.querySelector(`script[src="${ONER_WIDGET_SCRIPT}"]`);
    if (!existing) {
      const script = document.createElement('script');
      script.src = ONER_WIDGET_SCRIPT;
      script.type = 'text/javascript';
      script.async = true;
      document.body.appendChild(script);
    }

    const check = () => {
      const ready = widgetHasContent(widgetRef.current);
      if (ready) {
        setWidgetReady(true);
        setShowFallback(false);
      }
      return ready;
    };

    const timer = window.setTimeout(() => {
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

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [onProductionHost]);

  return (
    <div className="container mx-auto px-4 py-10 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-5xl space-y-8">
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

        <div
          ref={widgetRef}
          id="oner-widget-wrapper"
          className={widgetReady ? 'min-h-[200px]' : 'min-h-[120px]'}
        >
          <div id="wrapper">
            <befly-widget language="pt-br" new-tab="true" />
          </div>
        </div>

        {showFallback && (
          <Card className="border-dashed">
            <CardContent className="space-y-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {!onProductionHost
                  ? 'O buscador de passagens e hotéis está disponível em www.agenciaguata.com. Enquanto o site oficial estiver no ar, você já pode reservar pelo link abaixo.'
                  : 'Não foi possível carregar o buscador agora. Você pode continuar sua reserva pelo link abaixo.'}
              </p>
              <Button asChild size="lg">
                <a href={ONER_STORE_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Buscar passagens e hotéis
                </a>
              </Button>
            </CardContent>
          </Card>
        )}

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
