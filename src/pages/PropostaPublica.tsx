import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Users, CreditCard, CheckCircle, Route, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Show toast on payment result
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') {
      toast.success('Pagamento realizado com sucesso!');
    } else if (payment === 'cancelled') {
      toast.info('Pagamento cancelado.');
    }
  }, [searchParams]);

  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ['public-proposal', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposals')
        .select('*, travel_requests!inner(destination, travel_dates, travelers_count, client_name)')
        .eq('share_token', token!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });

  const request = proposal?.travel_requests as unknown as {
    destination: string;
    travel_dates: { start?: string; end?: string } | null;
    travelers_count: number;
    client_name: string;
  } | null;

  const paymentLinks = proposal?.payment_links as { stripe_session_id?: string; paid_at?: string } | null;
  const inclusions = proposal?.inclusions as string[] | null;
  const itinerary = Array.isArray(proposal?.itinerary) ? proposal.itinerary : [];

  const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return ''; }
  };

  const handleStripeCheckout = async () => {
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { share_token: token },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: unknown) {
      console.error('Checkout error:', err);
      toast.error('Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-4 w-full max-w-2xl px-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );

  if (!proposal || error) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Proposta não encontrada</h1>
        <p className="text-muted-foreground">Este link pode estar expirado ou inválido.</p>
      </div>
    </div>
  );

  const isPaid = proposal.payment_status === 'paid';
  const canPayStripe = proposal.total_price && proposal.total_price > 0 && !isPaid;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Proposta de Viagem</p>
          <h1 className="text-3xl font-bold mt-1">{proposal.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
            {request?.destination && (
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{request.destination}</span>
            )}
            {request?.travel_dates?.start && (
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(request.travel_dates.start)} — {formatDate(request.travel_dates.end)}</span>
            )}
            {request?.travelers_count && (
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{request.travelers_count} viajante(s)</span>
            )}
          </div>
        </div>

        {/* Price */}
        {proposal.total_price && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {Number(proposal.total_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              {isPaid && (
                <Badge className="bg-green-500/10 text-green-600 text-sm px-3 py-1">
                  <CheckCircle className="mr-1 h-4 w-4" />Pago
                </Badge>
              )}
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {proposal.description && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Detalhes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{proposal.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Inclusions */}
        {inclusions && inclusions.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">O que está incluso</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {inclusions.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Itinerary link */}
        {itinerary.length > 0 && (
          <Card>
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-2">
                <Route className="h-5 w-5 text-primary" />
                <span className="font-medium">Roteiro dia a dia disponível</span>
              </div>
              <Button variant="outline" asChild>
                <Link to={`/roteiro/${token}`}>Ver Roteiro Completo</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment section */}
        {!isPaid && canPayStripe && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleStripeCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecionando...</>
                  ) : (
                    <><CreditCard className="mr-2 h-4 w-4" />Pagar Online (Cartão ou PIX)</>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Pagamento seguro via Stripe. Confirmação automática.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-8 border-t">
          <p>Proposta gerada por <strong>Guata Viagens</strong></p>
        </div>
      </div>
    </div>
  );
}
