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
  { id: 'adventure', labelKey: 'tripStyleAdventure' },
  { id: 'relax', labelKey: 'tripStyleRelax' },
  { id: 'cultural', labelKey: 'tripStyleCultural' },
  { id: 'gastronomy', labelKey: 'tripStyleGastronomy' },
  { id: 'nature', labelKey: 'tripStyleNature' },
  { id: 'beach', labelKey: 'tripStyleBeach' },
  { id: 'romantic', labelKey: 'tripStyleRomantic' },
  { id: 'family', labelKey: 'tripStyleFamily' },
] as const;

const BR_DATE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** 18092026 vira 18/09/2026. O ano para em 4 dígitos. */
function maskTripDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Aceita só DD/MM/AAAA. O ano tem exatamente 4 dígitos. */
function parseTripDate(value: string): Date | null {
  const match = BR_DATE.exec(value);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function travelRequestSchema(messages: {
  invalid: string;
  range: string;
  order: string;
  name: string;
  email: string;
  destination: string;
}) {
  const optionalTripDate = z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || parseTripDate(value) !== null, messages.invalid);

  return z
  .object({
    name: z.string().trim().min(2, messages.name).max(120, messages.name),
    email: z.string().trim().email(messages.email).max(255, messages.email),
    phone: z.string().trim().max(30).optional().or(z.literal('')),
    destination: z.string().trim().min(2, messages.destination).max(160, messages.destination),
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
        name: t('tripNameError'),
        email: t('tripEmailError'),
        destination: t('tripDestError'),
      }).parse(formData);
      const travelersCount = parsed.travelers === '6+' ? 6 : parseInt(parsed.travelers, 10);

      const { error } = await supabase.from('travel_requests').insert({
        client_id: user?.id || null,
        client_name: parsed.name,
        client_email: parsed.email,
        client_phone: parsed.phone || null,
        destination: parsed.destination,
        travel_dates: {
          start: parsed.departureDate ? toIsoDate(parseTripDate(parsed.departureDate)!) : null,
          end: parsed.returnDate ? toIsoDate(parseTripDate(parsed.returnDate)!) : null,
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
        title: t('tripToastTitle'),
        description: t('tripToastDesc'),
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      const message = error instanceof z.ZodError
        ? error.issues[0]?.message || t('tripErrorFallback')
        : error instanceof Error
          ? error.message
          : t('tripErrorGeneric');
      toast({
        title: t('tripErrorTitle'),
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
            <h2 className="mb-2 font-display text-2xl font-bold">{t('tripSentTitle')}</h2>
            <p className="mb-6 text-muted-foreground">{t('tripSentBody')}</p>
            <Button onClick={() => navigate('/')}>
              {t('tripBack')}
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
        title={t('tripSeoTitle')}
        description={t('tripSeoDesc')}
      />
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="font-display text-4xl font-bold md:text-5xl">
            {t('tripTitle')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t('tripLead')}</p>
        </div>

        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>{t('tripCardTitle')}</CardTitle>
            <CardDescription>{t('tripCardDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('tripName')}</Label>
                  <Input
                    id="name"
                    placeholder={t('tripNamePh')}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('tripEmail')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('tripEmailPh')}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('tripPhone')}</Label>
                <Input
                  id="phone"
                  placeholder={t('tripPhonePh')}
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              {/* Destination */}
              <div className="space-y-2">
                <Label htmlFor="destination" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t('tripDest')}
                </Label>
                <Input
                  id="destination"
                  placeholder={t('tripDestPh')}
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
                    {t('tripDepart')}
                  </Label>
                  <Input
                    id="departureDate"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={t('tripDatePh')}
                    maxLength={10}
                    value={formData.departureDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, departureDate: maskTripDate(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="returnDate">{t('tripReturn')}</Label>
                  <Input
                    id="returnDate"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={t('tripDatePh')}
                    maxLength={10}
                    value={formData.returnDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, returnDate: maskTripDate(e.target.value) }))}
                  />
                </div>
              </div>

              {/* Travelers & Budget */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="travelers" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {t('tripTravelers')}
                  </Label>
                  <Select
                    value={formData.travelers}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, travelers: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tripSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{t('tripPax1')}</SelectItem>
                      <SelectItem value="2">{t('tripPax2')}</SelectItem>
                      <SelectItem value="3">{t('tripPax3')}</SelectItem>
                      <SelectItem value="4">{t('tripPax4')}</SelectItem>
                      <SelectItem value="5">{t('tripPax5')}</SelectItem>
                      <SelectItem value="6+">{t('tripPax6')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t('tripBudget')}
                  </Label>
                  <Select
                    value={formData.budget}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('tripSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="até 3mil">{t('tripBudget3')}</SelectItem>
                      <SelectItem value="3-5mil">{t('tripBudget5')}</SelectItem>
                      <SelectItem value="5-10mil">{t('tripBudget10')}</SelectItem>
                      <SelectItem value="10-20mil">{t('tripBudget20')}</SelectItem>
                      <SelectItem value="20mil+">{t('tripBudget20p')}</SelectItem>
                      <SelectItem value="flexivel">{t('tripBudgetFlex')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Travel Styles */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  {t('tripStyle')}
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
                        {t(style.labelKey)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <Label htmlFor="specialRequests">
                  {t('tripNotes')}
                </Label>
                <Textarea
                  id="specialRequests"
                  placeholder={t('tripNotesPh')}
                  rows={4}
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('tripSubmit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
