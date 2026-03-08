import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Calendar, Users, CreditCard, QrCode, CheckCircle, Route } from 'lucide-react';

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();

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

  const paymentLinks = proposal?.payment_links as { pix?: string; card?: string } | null;
  const inclusions = proposal?.inclusions as string[] | null;
  const itinerary = Array.isArray(proposal?.itinerary) ? proposal.itinerary : [];

  const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); } catch { return ''; }
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
              {proposal.payment_status === 'paid' && (
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

        {/* Payment links */}
        {(paymentLinks?.pix || paymentLinks?.card) && proposal.payment_status !== 'paid' && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Pagamento</CardTitle></CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              {paymentLinks.pix && (
                <Button className="flex-1" variant="outline" asChild>
                  <a href={paymentLinks.pix} target="_blank" rel="noopener noreferrer">
                    <QrCode className="mr-2 h-4 w-4" />Pagar com PIX
                  </a>
                </Button>
              )}
              {paymentLinks.card && (
                <Button className="flex-1" asChild>
                  <a href={paymentLinks.card} target="_blank" rel="noopener noreferrer">
                    <CreditCard className="mr-2 h-4 w-4" />Pagar com Cartão
                  </a>
                </Button>
              )}
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
