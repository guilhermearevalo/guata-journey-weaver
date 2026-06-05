import { useState } from 'react';
import { Seo } from '@/components/seo/Seo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  TrendingUp, 
  Shield, 
  Headphones, 
  CheckCircle, 
  ArrowRight,
  Building2,
  Globe,
  MapPin,
  Compass
} from 'lucide-react';

const SPECIALTIES = [
  { id: 'aventura', label: 'Aventura' },
  { id: 'praia', label: 'Praia e Litoral' },
  { id: 'cultural', label: 'Cultural' },
  { id: 'ecoturismo', label: 'Ecoturismo' },
  { id: 'luxo', label: 'Luxo' },
  { id: 'internacional', label: 'Internacional' },
];

const REGIONS = [
  { id: 'nordeste', label: 'Nordeste' },
  { id: 'sudeste', label: 'Sudeste' },
  { id: 'sul', label: 'Sul' },
  { id: 'norte', label: 'Norte' },
  { id: 'centro-oeste', label: 'Centro-Oeste' },
  { id: 'internacional', label: 'Internacional' },
];

const SejaParceiro = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    agencyName: '',
    cnpj: '',
    responsibleName: '',
    email: '',
    phone: '',
    website: '',
    specialties: [] as string[],
    regions: [] as string[],
    description: '',
  });

  const handleSpecialtyChange = (specialtyId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialties: checked 
        ? [...prev.specialties, specialtyId]
        : prev.specialties.filter(s => s !== specialtyId)
    }));
  };

  const handleRegionChange = (regionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      regions: checked 
        ? [...prev.regions, regionId]
        : prev.regions.filter(r => r !== regionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Insert into partner_agencies with is_active = false (pending approval)
      const { error } = await supabase.from('partner_agencies').insert({
        name: formData.agencyName,
        cnpj: formData.cnpj,
        contact_email: formData.email,
        contact_phone: formData.phone,
        responsible_name: formData.responsibleName,
        website: formData.website || null,
        specialties: formData.specialties,
        regions: formData.regions,
        description: formData.description || null,
        is_active: false,
      } as any);

      if (error) throw error;

      toast({
        title: 'Solicitação enviada!',
        description: 'Entraremos em contato em até 48 horas úteis.',
      });

      // Reset form
      setFormData({
        agencyName: '',
        cnpj: '',
        responsibleName: '',
        email: '',
        phone: '',
        website: '',
        specialties: [],
        regions: [],
        description: '',
      });
    } catch (error) {
      console.error('Error submitting partner application:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente ou entre em contato conosco.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Seo
        path="/seja-parceiro"
        title="Seja parceiro da Guatá"
        description="É agência ou operador local? Torne-se parceiro da Guatá e venda suas experiências para viajantes do Brasil e do mundo com nossa plataforma."
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/20 py-20 lg:py-28">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-4">
              Programa de Parceiros
            </Badge>
            <h1 className="font-display text-4xl font-bold tracking-tight lg:text-5xl">
              Seja um Parceiro Guatá
            </h1>
            <p className="mt-6 text-lg text-muted-foreground lg:text-xl">
              Faça parte da nossa rede e receba clientes qualificados para sua agência. 
              Sem custo de marketing, com suporte completo.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">
            Por que ser parceiro?
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Clientes Qualificados</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Receba demandas já filtradas e compatíveis com sua especialidade. 
                  Sem prospecção, só conversão.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Zero Investimento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sem mensalidades ou taxas fixas. Você só paga uma comissão 
                  quando fecha uma venda.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Painel Exclusivo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gerencie suas demandas, envie propostas e acompanhe 
                  resultados em tempo real.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Headphones className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-lg">Suporte Dedicado</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nossa equipe está sempre disponível para ajudar com 
                  dúvidas e suporte operacional.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-secondary/30 py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="mb-12 text-center font-display text-3xl font-bold">
            Como funciona?
          </h2>
          <div className="mx-auto max-w-4xl">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 h-full w-0.5 bg-primary/20 lg:left-1/2 lg:-translate-x-1/2" />
              
              {/* Steps */}
              <div className="space-y-8">
                {[
                  { icon: Building2, title: 'Você se cadastra', desc: 'Preencha o formulário com os dados da sua agência' },
                  { icon: CheckCircle, title: 'Validamos sua agência', desc: 'Nossa equipe analisa e aprova seu cadastro' },
                  { icon: MapPin, title: 'Recebe demandas', desc: 'Clientes compatíveis com seu nicho são direcionados' },
                  { icon: Compass, title: 'Envia propostas', desc: 'Elabore propostas personalizadas pelo painel' },
                  { icon: Globe, title: 'Opera e recebe', desc: 'Execute a viagem e receba sua comissão' },
                ].map((step, index) => (
                  <div key={index} className="relative flex items-start gap-6 lg:gap-12">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                      <step.icon className="h-7 w-7" />
                    </div>
                    <div className="pt-3">
                      <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                      <p className="mt-1 text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <Card className="border-2">
              <CardHeader className="text-center">
                <CardTitle className="font-display text-2xl">Cadastre sua Agência</CardTitle>
                <CardDescription>
                  Preencha os dados abaixo e nossa equipe entrará em contato em até 48 horas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Agency Info */}
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="agencyName">Nome da Agência *</Label>
                        <Input
                          id="agencyName"
                          value={formData.agencyName}
                          onChange={(e) => setFormData(prev => ({ ...prev, agencyName: e.target.value }))}
                          placeholder="Nome fantasia"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ *</Label>
                        <Input
                          id="cnpj"
                          value={formData.cnpj}
                          onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                          placeholder="00.000.000/0001-00"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="responsibleName">Nome do Responsável *</Label>
                        <Input
                          id="responsibleName"
                          value={formData.responsibleName}
                          onChange={(e) => setFormData(prev => ({ ...prev, responsibleName: e.target.value }))}
                          placeholder="Seu nome completo"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="contato@suaagencia.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone *</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(11) 99999-9999"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="www.suaagencia.com.br"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="space-y-3">
                    <Label>Especialidades</Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {SPECIALTIES.map(specialty => (
                        <div key={specialty.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`specialty-${specialty.id}`}
                            checked={formData.specialties.includes(specialty.id)}
                            onCheckedChange={(checked) => handleSpecialtyChange(specialty.id, checked as boolean)}
                          />
                          <Label htmlFor={`specialty-${specialty.id}`} className="text-sm font-normal cursor-pointer">
                            {specialty.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Regions */}
                  <div className="space-y-3">
                    <Label>Regiões de Atuação</Label>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {REGIONS.map(region => (
                        <div key={region.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`region-${region.id}`}
                            checked={formData.regions.includes(region.id)}
                            onCheckedChange={(checked) => handleRegionChange(region.id, checked as boolean)}
                          />
                          <Label htmlFor={`region-${region.id}`} className="text-sm font-normal cursor-pointer">
                            {region.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Sobre sua agência</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Conte um pouco sobre sua experiência e diferenciais..."
                      rows={4}
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SejaParceiro;
