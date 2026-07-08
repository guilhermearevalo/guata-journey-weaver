import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Save, Loader2, MapPin, Users, Calendar, Route, Share2, Check, Lock, MessageCircle, ChevronRight, ChevronLeft, ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import {
  buildShareUrl, buildProposalWhatsAppMessage, copyShareLink, openWhatsAppShare, ensureShareToken,
} from '@/lib/share-proposal';
import { fetchProposalByRequest } from '@/lib/fetchProposals';
import { markSentOnShare, markInOperationOnPaid } from '@/lib/travelRequestStatus';
import { getServiceTypeDisplay, isSimpleWorkflow } from '@/lib/serviceType';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ProposalWizardLayout, type ProposalWizardStep } from '@/components/admin/ProposalWizardLayout';

export default function AdminProposta() {
  const { id: requestId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<ProposalWizardStep>(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [agencyId, setAgencyId] = useState<string>('none');
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [manualPaymentLink, setManualPaymentLink] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareEnabled, setShareEnabled] = useState(true);

  const { data: request, isLoading: requestLoading } = useQuery({
    queryKey: ['travel-request', requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select('*')
        .eq('id', requestId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!requestId,
  });

  const { data: agencies } = useQuery({
    queryKey: ['agencies-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('partner_agencies').select('id, name').eq('is_active', true).order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: existingProposal, isLoading: proposalLoading } = useQuery({
    queryKey: ['admin-proposal', requestId],
    queryFn: () => fetchProposalByRequest(requestId!),
    enabled: !!requestId,
  });

  useEffect(() => {
    if (existingProposal) {
      setTitle(existingProposal.title || '');
      setDescription(existingProposal.description || '');
      setTotalPrice(existingProposal.total_price?.toString() || '');
      setInclusions(existingProposal.inclusions?.join('\n') || '');
      setPaymentStatus(existingProposal.payment_status || 'pending');
      setAgencyId(existingProposal.agency_id || 'none');
      setPaymentEnabled((existingProposal as { payment_enabled?: boolean }).payment_enabled || false);
      setAccessCode((existingProposal as { access_code?: string }).access_code || '');
      const pl = existingProposal.payment_links as Record<string, string | null> | null;
      setManualPaymentLink(pl?.manual_link || '');
      setShareEnabled((existingProposal as { share_enabled?: boolean }).share_enabled !== false);
    }
  }, [existingProposal]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existingPaymentLinks = (existingProposal?.payment_links as Record<string, unknown>) || {};
      const payload = {
        request_id: requestId!,
        title,
        description,
        total_price: totalPrice ? parseFloat(totalPrice) : null,
        inclusions: inclusions.split('\n').filter(Boolean),
        payment_status: paymentStatus,
        payment_enabled: paymentEnabled,
        access_code: accessCode.trim() || null,
        share_enabled: shareEnabled,
        payment_links: { ...existingPaymentLinks, manual_link: manualPaymentLink.trim() || null },
        created_by: user?.id,
        agency_id: agencyId === 'none' ? null : agencyId,
      };

      const current = existingProposal ?? (await fetchProposalByRequest(requestId!));
      const wasPaid = current?.payment_status === 'paid';

      if (current) {
        const { error } = await supabase.from('proposals').update(payload).eq('id', current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('proposals').insert(payload);
        if (error) throw error;
      }

      if (paymentStatus === 'paid' && !wasPaid && request) {
        await markInOperationOnPaid(requestId!, request);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-proposal', requestId] });
      queryClient.invalidateQueries({ queryKey: ['proposal-exists', requestId] });
      queryClient.invalidateQueries({ queryKey: ['proposal-request-ids'] });
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
      queryClient.invalidateQueries({ queryKey: ['travel-request', requestId] });
      toast({ title: 'Proposta salva com sucesso!' });
    },
    onError: () => {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    },
  });

  const travelDates = request?.travel_dates as { start?: string; end?: string } | null;
  const consultancy = isSimpleWorkflow(request);
  const willMoveToOperation =
    !consultancy &&
    paymentStatus === 'paid' &&
    existingProposal?.payment_status !== 'paid' &&
    request &&
    !['in_operation', 'completed'].includes(request.status);

  const proposalRef = existingProposal
    ? `#${existingProposal.id.slice(0, 8).toUpperCase()}`
    : requestId
      ? `#${requestId.slice(0, 8).toUpperCase()}`
      : '#NOVA';

  const markProposalSentIfNeeded = async () => {
    if (!requestId || !request) return;
    await markSentOnShare(requestId, request);
    queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
    queryClient.invalidateQueries({ queryKey: ['travel-request', requestId] });
  };

  const handleShareProposal = async () => {
    if (!existingProposal) return;
    setShareLoading(true);
    try {
      const token = await ensureShareToken(
        existingProposal.id,
        existingProposal.share_token as string | null,
        async (newToken) => {
          const { error } = await supabase.from('proposals').update({ share_token: newToken }).eq('id', existingProposal.id);
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ['admin-proposal', requestId] });
        },
      );
      const url = buildShareUrl('proposta', token);
      await markProposalSentIfNeeded();
      await copyShareLink(url);
      setShareCopied(true);
      toast({ title: 'Link copiado!', description: 'Envie por WhatsApp, email ou redes sociais.' });
      setTimeout(() => setShareCopied(false), 3000);
    } catch {
      toast({ title: 'Erro ao gerar link', variant: 'destructive' });
    } finally {
      setShareLoading(false);
    }
  };

  const handleShareProposalWhatsApp = async () => {
    if (!existingProposal || !request) return;
    setShareLoading(true);
    try {
      const token = await ensureShareToken(
        existingProposal.id,
        existingProposal.share_token as string | null,
        async (newToken) => {
          const { error } = await supabase.from('proposals').update({ share_token: newToken }).eq('id', existingProposal.id);
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ['admin-proposal', requestId] });
        },
      );
      const url = buildShareUrl('proposta', token);
      await markProposalSentIfNeeded();
      openWhatsAppShare(buildProposalWhatsAppMessage({
        clientName: request.client_name,
        destination: request.destination,
        url,
      }));
    } catch {
      toast({ title: 'Erro ao compartilhar', variant: 'destructive' });
    } finally {
      setShareLoading(false);
    }
  };

  const stepTitles: Record<ProposalWizardStep, { title: string; subtitle: string }> = {
    1: {
      title: 'Dados do Cliente',
      subtitle: 'Revise as informações da demanda e defina a agência responsável.',
    },
    2: {
      title: 'Roteiro e Destino',
      subtitle: 'Descreva o pacote e planeje o roteiro com IA em uma tela dedicada.',
    },
    3: {
      title: 'Valores e Prazos',
      subtitle: 'Configure preço, pagamento e compartilhe a proposta com o cliente.',
    },
  };

  if (requestLoading || proposalLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const footer = (
    <>
      <div className="flex gap-2">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep((s) => (s - 1) as ProposalWizardStep)}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate('/admin/demandas')}>
          Voltar às demandas
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {step < 3 ? (
          <Button onClick={() => setStep((s) => (s + 1) as ProposalWizardStep)}>
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !title}>
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {existingProposal ? 'Salvar Alterações' : 'Criar Proposta'}
            </Button>
            {existingProposal && (
              <>
                <Button variant="outline" onClick={handleShareProposal} disabled={shareLoading}>
                  {shareCopied ? <Check className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                  {shareCopied ? 'Link Copiado!' : 'Copiar link'}
                </Button>
                <Button variant="outline" onClick={handleShareProposalWhatsApp} disabled={shareLoading}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <ProposalWizardLayout
      step={step}
      proposalRef={proposalRef}
      title={stepTitles[step].title}
      subtitle={stepTitles[step].subtitle}
      onBack={() => navigate('/admin/demandas')}
      onStepChange={setStep}
      footer={footer}
    >
      {step === 1 && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-semibold">{request?.client_name}</h3>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Badge variant={consultancy ? 'secondary' : 'outline'}>
                {getServiceTypeDisplay(request)}
              </Badge>
              {request?.destination && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {request.destination}
                </span>
              )}
              {request?.travelers_count && (
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {request.travelers_count} viajante(s)
                </span>
              )}
              {travelDates?.start && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(travelDates.start), 'dd/MM/yyyy', { locale: ptBR })}
                  {travelDates.end && ` — ${format(new Date(travelDates.end), 'dd/MM/yyyy', { locale: ptBR })}`}
                </span>
              )}
            </div>
            {request?.budget_range && (
              <p className="mt-3 text-sm text-muted-foreground">Orçamento informado: {request.budget_range}</p>
            )}
            {request?.preferences && (
              <p className="mt-2 text-sm text-muted-foreground">{request.preferences}</p>
            )}
            {request?.special_requests && (
              <p className="mt-2 text-sm italic text-muted-foreground">&ldquo;{request.special_requests}&rdquo;</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Agência Responsável</Label>
            <Select value={agencyId} onValueChange={setAgencyId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Guatá (operação própria)</SelectItem>
                {agencies?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-2">
            <Label>Título da proposta *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Pacote Fernando de Noronha 5 dias"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Descreva os detalhes da proposta..."
            />
            <p className="text-xs text-muted-foreground">
              Usada na proposta pública e enviada à IA ao gerar o roteiro.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Inclusões (uma por linha)</Label>
            <Textarea
              value={inclusions}
              onChange={(e) => setInclusions(e.target.value)}
              rows={4}
              placeholder={'Hospedagem 4 noites\nTransfer aeroporto\nPasseio de barco'}
            />
          </div>

          <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="font-semibold flex items-center gap-2">
                  <Route className="h-5 w-5 text-primary" />
                  Planejamento do roteiro
                </h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Salve a proposta antes de abrir o planejador. O roteiro usa título, descrição e inclusões acima.
                </p>
              </div>
              {existingProposal ? (
                <Button asChild>
                  <Link to={`/admin/demandas/${requestId}/roteiro`}>
                    Abrir planejador
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button
                  disabled={!title || saveMutation.isPending}
                  onClick={() => saveMutation.mutate(undefined, {
                    onSuccess: () => navigate(`/admin/demandas/${requestId}/roteiro`),
                  })}
                >
                  {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Salvar e abrir roteiro
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="space-y-2">
            <Label>Valor Total (R$)</Label>
            <Input
              type="number"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>Link público ativo</Label>
              <p className="text-xs text-muted-foreground">
                Desligue para impedir acesso ao link compartilhado.
              </p>
            </div>
            <Switch checked={shareEnabled} onCheckedChange={setShareEnabled} />
          </div>

          {consultancy ? (
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Consultoria / Roteiro:</strong> pagamento costuma ser por PIX/WhatsApp fora do sistema.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>Exibir link de pagamento</Label>
                  <p className="text-xs text-muted-foreground">
                    O cliente verá o link de pagamento na proposta pública.
                  </p>
                </div>
                <Switch checked={paymentEnabled} onCheckedChange={setPaymentEnabled} />
              </div>

              <div className="space-y-2">
                <Label>Link de pagamento (PIX, PagSeguro, etc.)</Label>
                <Input
                  value={manualPaymentLink}
                  onChange={(e) => setManualPaymentLink(e.target.value)}
                  placeholder="https://pag.ae/exemplo ou link PIX"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Código de Acesso ao Roteiro
            </Label>
            <Input
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="Ex: NORONHA2026 (vazio = acesso livre)"
              maxLength={20}
            />
          </div>

          <div className="space-y-2">
            <Label>Status do Pagamento</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger className="w-full sm:w-[280px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente — ainda não recebeu</SelectItem>
                <SelectItem value="partial">Parcial — sinal/entrada recebida</SelectItem>
                <SelectItem value="paid">Pago — valor confirmado no caixa</SelectItem>
              </SelectContent>
            </Select>
            {willMoveToOperation && (
              <Alert>
                <AlertDescription className="text-sm">
                  Ao salvar, a demanda será movida para <strong>Em Operação</strong>.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      )}
    </ProposalWizardLayout>
  );
}
