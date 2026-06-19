import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PublicItineraryView from '@/components/itinerary/PublicItineraryView';
import { TravelDocument } from '@/components/itinerary/TravelDocumentsVault';
import { type ItineraryDay } from '@/lib/itinerary';
import Seo from '@/components/seo/Seo';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function RoteiroPublico() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [codeInput, setCodeInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [codeError, setCodeError] = useState(false);

  const { data: proposal, isLoading, error } = useQuery({
    queryKey: ['public-itinerary', token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_itinerary', { _token: token! });
      if (error) throw error;
      if (!data) return null;
      const result = data as Record<string, unknown>;
      result._has_access_code = !!result.has_access_code;
      if (result.agency_id) {
        const { data: branding } = await supabase
          .from('partner_agency_branding' as never)
          .select('name, logo_url, cover_image_url, contact_phone')
          .eq('id', result.agency_id as string)
          .maybeSingle();
        result.agency_branding = branding;
      }
      return result;
    },
    enabled: !!token,
  });

  const needsCode = !!(proposal as Record<string, unknown> | undefined)?._has_access_code && !isUnlocked;

  const { data: travelDocuments = [] } = useQuery({
    queryKey: ['public-travel-documents', token, isUnlocked],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_public_travel_documents' as never, {
        _token: token!,
        _code: codeInput.trim() || null,
      });
      if (error) throw error;
      return (data ?? []) as unknown as TravelDocument[];
    },
    enabled: !!token && !!proposal?.id && !needsCode,
  });

  const handleCodeSubmit = async () => {
    const { data, error: rpcError } = await supabase.rpc('verify_proposal_access_code', {
      _token: token!,
      _code: codeInput.trim(),
    });
    if (!rpcError && data === true) {
      setIsUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
    }
  };

  const openDocument = async (doc: TravelDocument) => {
    if (!doc.file_path && doc.file_url) {
      window.open(doc.file_url, '_blank');
      return;
    }
    if (!doc.file_path) return;
    const { data, error: urlError } = await supabase.storage
      .from('travel-documents')
      .createSignedUrl(doc.file_path, 60 * 10);
    if (urlError || !data?.signedUrl) {
      toast({ title: 'Não foi possível abrir o arquivo', variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!proposal || error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-bold">Roteiro não encontrado</h1>
          <p className="text-muted-foreground">Este link pode estar expirado ou inválido.</p>
        </div>
      </div>
    );
  }

  if ((proposal as Record<string, unknown>).share_enabled === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2 px-4">
          <h1 className="font-display text-2xl font-bold">Roteiro indisponível</h1>
          <p className="text-muted-foreground">Este roteiro não está mais disponível para visualização.</p>
        </div>
      </div>
    );
  }

  if (needsCode) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Card className="w-full max-w-sm mx-4 animate-scale-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-display">Roteiro Protegido</CardTitle>
            <p className="text-sm text-muted-foreground">Insira o código de acesso fornecido pela agência.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={codeInput}
              onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(false); }}
              placeholder="Código de acesso"
              onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
              className={codeError ? 'border-destructive' : ''}
            />
            {codeError && <p className="text-xs text-destructive">Código incorreto. Tente novamente.</p>}
            <Button className="w-full" onClick={handleCodeSubmit} disabled={!codeInput.trim()}>
              Acessar Roteiro
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const request = (proposal.request ?? null) as {
    destination: string;
    travel_dates: { start?: string; end?: string } | null;
    travelers_count: number;
    client_name?: string;
  } | null;

  const itinerary: ItineraryDay[] = Array.isArray(proposal.itinerary)
    ? (proposal.itinerary as unknown as ItineraryDay[])
    : [];

  const agency = proposal.agency_branding as {
    name?: string;
    logo_url?: string | null;
    cover_image_url?: string | null;
    contact_phone?: string | null;
  } | null;

  const dossier = proposal.dossier as unknown;
  const coverForSeo =
    (dossier as { cover_image?: string })?.cover_image ||
    agency?.cover_image_url ||
    undefined;

  const seoTitle = request?.client_name
    ? `Roteiro — ${request.client_name}`
    : `Roteiro — ${request?.destination || proposal.title}`;

  return (
    <>
      <Seo
        title={seoTitle}
        description={`Roteiro personalizado${request?.destination ? ` para ${request.destination}` : ''}. Voos, hospedagens e experiências dia a dia.`}
        path={`/roteiro/${token}`}
        image={coverForSeo}
        rawTitle
        noindex
      />
      <PublicItineraryView
        title={proposal.title as string}
        request={request}
        itinerary={itinerary}
        dossierRaw={dossier}
        travelDocuments={travelDocuments}
        agency={agency}
        onOpenDocument={openDocument}
      />
    </>
  );
}
