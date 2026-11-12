import { useState } from 'react';
import { Seo } from '@/components/seo/Seo';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Calendar, Users, DollarSign, Heart, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { z } from 'zod';

const travelStyles = [
  { id: 'adventure', label: 'Aventura' },
  { id: 'relax', label: 'Relaxamento' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'gastronomy', label: 'Gastronomia' },
  { id: 'nature', label: 'Natureza' },
  { id: 'beach', label: 'Praia' },
  { id: 'romantic', label: 'Romântica' },
  { id: 'family', label: 'Em Família' },
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** O calendário do navegador pode devolver 12027-01-01. Só aceita ano de 4 dígitos. */
function acceptTripDateInput(value: string): string | null {
  if (!value) return '';
  const year = value.split('-')[0] ?? '';
  if (!/^\d{4}$/.test(year) || !ISO_DATE.test(value)) return null;
  return value;
}

/** Aceita só AAAA-MM-DD com ano de 4 dígitos. Rejeita 12027-01-01. */
function parseTripDate(value: string): Date | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function travelRequestSchema(messages: { invalid: string; range: string; order: string }) {
  const optionalTripDate = z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || parseTripDate(value) !== null, messages.invalid);

  return z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome completo.').max(120, 'Nome muito longo.'),
    email: z.string().trim().email('Informe um e-mail válido.').max(255, 'E-mail muito longo.'),
    phone: z.string().trim().max(30, 'Telefone muito longo.').optional().or(z.literal('')),
    destination: z.string().trim().min(2, 'Informe o destino desejado.').max(160, 'Destino muito longo.'),
    departureDate: optionalTripDate,
    returnDate: optionalTripDate,
    travelers: z.string().min(1),
    budget: z.string().trim().max(80, 'Orçamento muito longo.').optional().or(z.literal('')),
    styles: z.array(z.string()).max(8),
    specialRequests: z.string().trim().max(2000, 'Observações muito longas.').optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    const today = startOfDay(new Date());
    const latest = new Date(today.getFullYear() + 3, today.getMonth(), today.getDate());
    const departure = data.departureDate ? parseTripDate(data.departureDate) : null;
    const returning = data.returnDate ? parseTripDate(data.returnDate) : null;

    for (const [field, date] of [
      ['departureDate', departure],
      ['returnDate', returning],
    ] as const) {
      if (!date) continue;
      if (date < today || date > latest) {
        ctx.addIssue({
          code: 'custom',
          path: [field],
          message: messages.range,
        });
      }
    }

    if (departure && returning && returning < departure) {
      ctx.addIssue({
        code: 'custom',
        path: ['returnDate'],
        message: messages.order,
      });
    }
  });
}

export default function ViagemPersonalizada() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const todayIso = toIsoDate(startOfDay(new Date()));
  const maxIso = toIsoDate(new Date(new Date().getFullYear() + 3, new Date().getMonth(), new Date().getDate()));

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: searchParams.get('destino') || '',
    departureDate: '',
    returnDate: '',
    travelers: '2',
    budget: '',
    styles: [] as string[],
    specialRequests: '',
  });

  const handleStyleChange = (styleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      styles: checked
        ? [...prev.styles, styleId]
        : prev.styles.filter(s => s !== styleId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const parsed = travelRequestSchema({
        invalid: t('dateInvalid'),
        range: t('dateRange'),
        order: t('dateOrder'),
      }).parse(formData);
      const travelersCount = parsed.travelers === '6+' ? 6 : parseInt(parsed.travelers, 10);

      const { error } = await supabase.from('travel_requests').insert({
        client_id: user?.id || null,
        client_name: parsed.name,
        client_email: parsed.email,
        client_phone: parsed.phone || null,
        destination: parsed.destination,
        travel_dates: {
          start: parsed.departureDate || null,
          end: parsed.returnDate || null,
        },
        travelers_count: Number.isFinite(travelersCount) ? travelersCount : 1,
        budget_range: parsed.budget || null,
        preferences: {
          styles: parsed.styles,
        },
        special_requests: parsed.specialRequests || null,
        status: 'pending',
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Solicitação enviada!',
        description: 'Em breve nossa equipe entrará em contato.',
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      const message = error instanceof z.ZodError
        ? error.issues[0]?.message || 'Revise os dados informados.'
        : error instanceof Error
          ? error.message
          : 'Ocorreu um erro. Tente novamente.';
      toast({
        title: 'Erro ao enviar',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="mb-2 font-display text-2xl font-bold">Solicitação Enviada!</h2>
            <p className="mb-6 text-muted-foreground">
              Recebemos sua solicitação de viagem personalizada. Nossa equipe de consultores 
              entrará em contato em até 24 horas para dar início ao planejamento da sua experiência.
            </p>
            <Button onClick={() => navigate('/')}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12">
      <Seo
        path="/viagem-personalizada"
        title="Monte sua viagem personalizada"
        description="Conte para a Guatá o que você sonha e receba um roteiro de viagem sob medida, com curadoria e parceiros locais — no Pantanal, em Bonito, no Brasil ou no exterior."
      />
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            Viagem Personalizada
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Conte para nós sobre a viagem dos seus sonhos. Nossa equipe de consultores 
            irá criar um roteiro exclusivo para você.
          </p>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Solicitar Roteiro Personalizado</CardTitle>
            <CardDescription>
              Preencha as informações abaixo para que possamos entender melhor o que você busca.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">WhatsApp</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Destino desejado *
                </Label>
                <Input
                  id="destination"
                  placeholder="Ex: Nordeste do Brasil, Europa, ou 'Ainda não sei'"
                  value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="departureDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de ida
                  </Label>
                  <Input
                    id="departureDate"
                    type="date"
                    min={todayIso}
                    max={maxIso}
                    value={formData.departureDate}
                    onChange={(e) => {
                      const next = acceptTripDateInput(e.target.value);
                      if (next === null) return;
                      setFormData((prev) => ({ ...prev, departureDate: next }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate">Data de volta</Label>
                  <Input
                    id="returnDate"
                    type="date"
                    min={formData.departureDate || todayIso}
                    max={maxIso}
                    value={formData.returnDate}
                    onChange={(e) => {
                      const next = acceptTripDateInput(e.target.value);
                      if (next === null) return;
                      setFormData((prev) => ({ ...prev, returnDate: next }));
                    }}
                  />
                </div>
              </div>

              {/* Travelers & Budget */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="travelers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Número de viajantes
                  </Label>
                  <Select
                    value={formData.travelers}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, travelers: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 pessoa</SelectItem>
                      <SelectItem value="2">2 pessoas</SelectItem>
                      <SelectItem value="3">3 pessoas</SelectItem>
                      <SelectItem value="4">4 pessoas</SelectItem>
                      <SelectItem value="5">5 pessoas</SelectItem>
                      <SelectItem value="6+">6 ou mais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Orçamento por pessoa
                  </Label>
                  <Select
                    value={formData.budget}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="até 3mil">Até R$ 3.000</SelectItem>
                      <SelectItem value="3-5mil">R$ 3.000 - R$ 5.000</SelectItem>
                      <SelectItem value="5-10mil">R$ 5.000 - R$ 10.000</SelectItem>
                      <SelectItem value="10-20mil">R$ 10.000 - R$ 20.000</SelectItem>
                      <SelectItem value="20mil+">Acima de R$ 20.000</SelectItem>
                      <SelectItem value="flexivel">Flexível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Travel Styles */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Estilo de viagem (selecione quantos quiser)
                </Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {travelStyles.map((style) => (
                    <div key={style.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={style.id}
                        checked={formData.styles.includes(style.id)}
                        onCheckedChange={(checked) => handleStyleChange(style.id, checked as boolean)}
                      />
                      <Label htmlFor={style.id} className="text-sm font-normal cursor-pointer">
                        {style.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <Label htmlFor="specialRequests">
                  Conte mais sobre sua viagem ideal
                </Label>
                <Textarea
                  id="specialRequests"
                  placeholder="Há algo especial que você gostaria de incluir? Alguma experiência específica, restrição alimentar, necessidade especial..."
                  rows={4}
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Solicitação
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
