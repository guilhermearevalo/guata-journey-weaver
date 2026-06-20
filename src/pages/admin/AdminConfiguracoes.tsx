import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { uploadStorageFile, isStorageSchemaError } from '@/lib/uploadStorageFile';
import { StorageImage } from '@/components/ui/StorageImage';
import { Upload, Loader2, Image as ImageIcon, Trash2, Film, X, LayoutDashboard, MessageCircle, Save, ShieldCheck } from 'lucide-react';
import type { HomepageSections } from '@/hooks/useHomepageSections';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import { useAuth } from '@/lib/auth';

interface Slide {
  type: 'image' | 'video';
  url: string;
}

const AdminConfiguracoes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [heroUrlInput, setHeroUrlInput] = useState('');

  const { data: heroSetting } = useQuery({
    queryKey: ['site-setting', 'hero_image_url'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('key', 'hero_image_url')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!heroSetting?.value) return;
    const val = heroSetting.value as unknown;
    // Support new format { slides: [...] } and legacy string format
    if (typeof val === 'object' && val !== null && 'slides' in val) {
      setSlides((val as { slides: Slide[] }).slides || []);
    } else {
      // Legacy: single URL string (possibly with extra quotes)
      const url = typeof val === 'string' ? val.replace(/^"|"$/g, '') : '';
      if (url) setSlides([{ type: 'image', url }]);
    }
  }, [heroSetting]);

  const saveSlides = async (newSlides: Slide[]) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'hero_image_url',
        value: { slides: newSlides } as unknown as import('@/integrations/supabase/types').Json,
        updated_at: new Date().toISOString(),
      });
    if (error) throw error;
    setSlides(newSlides);
    queryClient.invalidateQueries({ queryKey: ['site-setting', 'hero_image_url'] });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isImage && !isVideo) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem ou vídeo.', variant: 'destructive' });
      return;
    }

    if (isVideo && file.size > 30 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Vídeos devem ter no máximo 30MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${ext}`;

      const { publicUrl } = await uploadStorageFile('site-assets', fileName, file, { upsert: true });

      const newSlide: Slide = { type: isVideo ? 'video' : 'image', url: publicUrl };
      const newSlides = [...slides, newSlide];
      await saveSlides(newSlides);
      toast({ title: 'Mídia adicionada!', description: `${isVideo ? 'Vídeo' : 'Imagem'} adicionado(a) ao carrossel.` });
    } catch (err) {
      const supa = err as { message?: string; statusCode?: string };
      let message = supa.message || 'Não foi possível enviar o arquivo.';
      if (message.includes('row-level security') || supa.statusCode === '403') {
        message = 'Sem permissão. Faça login como admin e rode docs/ensure_site_assets_storage.sql no Supabase.';
      } else if (message.includes('Bucket not found')) {
        message = 'Bucket site-assets não existe. Crie em Storage → New bucket (público).';
      } else if (isStorageSchemaError(message, supa.statusCode)) {
        message =
          'Upload via servidor indisponível. Confirme que a Edge Function storage-upload está deployada — ou use URL abaixo temporariamente.';
      }
      console.error('Erro no upload hero:', err);
      toast({ title: 'Erro no upload', description: message, variant: 'destructive' });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeSlide = async (index: number) => {
    const newSlides = slides.filter((_, i) => i !== index);
    await saveSlides(newSlides);
    toast({ title: 'Mídia removida' });
  };

  const resetToDefault = async () => {
    const defaultUrl = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop';
    await saveSlides([{ type: 'image', url: defaultUrl }]);
    toast({ title: 'Imagem restaurada', description: 'A imagem padrão foi restaurada.' });
  };

  const addHeroSlideFromUrl = async () => {
    const url = heroUrlInput.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      toast({ title: 'URL inválida', description: 'Use um link https:// completo.', variant: 'destructive' });
      return;
    }
    const isVideo = /\.(mp4|webm)(\?|$)/i.test(url);
    const newSlides = [...slides, { type: isVideo ? 'video' as const : 'image' as const, url }];
    await saveSlides(newSlides);
    setHeroUrlInput('');
    toast({ title: 'Mídia adicionada por URL!' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configurações gerais da plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Segurança da conta
          </CardTitle>
          <CardDescription>
            Altere sua senha de administrador ({user?.email})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm email={user?.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Carrossel do Hero (Página Inicial)
          </CardTitle>
          <CardDescription>
            Adicione imagens e vídeos de fundo para a seção principal. Vídeos serão exibidos em loop, sem som.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Slides preview */}
          {slides.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {slides.map((slide, i) => (
                <div key={i} className="group relative overflow-hidden rounded-lg border">
                  {slide.type === 'video' ? (
                    <video
                      src={slide.url}
                      className="h-36 w-full object-cover"
                      muted
                      loop
                      playsInline
                      onMouseEnter={(e) => e.currentTarget.play()}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                  ) : (
                    <img src={slide.url} alt={`Slide ${i + 1}`} className="h-36 w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 to-background/20" />
                  <div className="absolute top-2 left-2">
                    <span className="rounded bg-background/80 px-2 py-0.5 text-xs font-medium backdrop-blur-sm">
                      {slide.type === 'video' ? <Film className="inline h-3 w-3 mr-1" /> : <ImageIcon className="inline h-3 w-3 mr-1" />}
                      {i + 1}
                    </span>
                  </div>
                  <button
                    onClick={() => removeSlide(i)}
                    className="absolute top-2 right-2 rounded-full bg-destructive/80 p-1 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Label
              htmlFor="hero-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Enviando...' : 'Adicionar Imagem ou Vídeo'}
            </Label>
            <Input
              id="hero-upload"
              type="file"
              accept="image/*,video/mp4,video/webm"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button variant="outline" size="sm" onClick={resetToDefault}>
              <Trash2 className="mr-2 h-4 w-4" />
              Restaurar Padrão
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="URL alternativa (se o upload falhar): https://..."
              value={heroUrlInput}
              onChange={(e) => setHeroUrlInput(e.target.value)}
              className="flex-1"
            />
            <Button type="button" variant="secondary" onClick={addHeroSlideFromUrl} disabled={!heroUrlInput.trim()}>
              Adicionar por URL
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Envie pelo botão acima (recomendado). URL é só alternativa se o Storage falhar.
          </p>
        </CardContent>
      </Card>
      <WhatsAppConfigCard />
      <HomepageSectionsCard />
      <CadasturConfigCard />
    </div>
  );
};

/* Cards de contato e localização foram movidos para o CMS (Admin → Conteúdo → Contato) */

/* ── WhatsApp Config Card ── */
function WhatsAppConfigCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['site-setting', 'whatsapp_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'whatsapp_config')
        .maybeSingle();
      if (error) throw error;
      const defaults = { enabled: false, number: '', message: 'Olá! Gostaria de mais informações sobre os pacotes de viagem.' };
      if (!data?.value) return defaults;
      return { ...defaults, ...(data.value as unknown as Partial<typeof defaults>) };
    },
  });

  const [enabled, setEnabled] = useState(false);
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (config) {
      setEnabled(config.enabled);
      setNumber(config.number);
      setMessage(config.message);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'whatsapp_config',
          value: { enabled, number, message } as unknown as import('@/integrations/supabase/types').Json,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['site-setting', 'whatsapp_config'] });
      toast({ title: 'WhatsApp atualizado!' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </CardTitle>
        <CardDescription>
          Configure o botão flutuante do WhatsApp que aparece em todas as páginas públicas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Botão ativo</p>
            <p className="text-sm text-muted-foreground">Exibir o botão do WhatsApp no site</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp-number">Número do WhatsApp (com DDI)</Label>
          <Input
            id="whatsapp-number"
            placeholder="5511999999999"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Formato: 55 + DDD + número (ex: 5511999999999)</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="whatsapp-message">Mensagem padrão</Label>
          <Input
            id="whatsapp-message"
            placeholder="Olá! Gostaria de mais informações..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Homepage Sections Toggle Card ── */
function HomepageSectionsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ['site-setting', 'homepage_sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'homepage_sections')
        .maybeSingle();
      if (error) throw error;
      const defaults: HomepageSections = { featured_experiences: true, custom_travel_cta: true, testimonials: true };
      if (!data?.value) return defaults;
      return { ...defaults, ...(data.value as unknown as Partial<HomepageSections>) };
    },
  });

  const toggle = async (key: keyof HomepageSections) => {
    if (!sections) return;
    const updated = { ...sections, [key]: !sections[key] };
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        key: 'homepage_sections',
        value: updated as unknown as import('@/integrations/supabase/types').Json,
        updated_at: new Date().toISOString(),
      });
    if (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['site-setting', 'homepage_sections'] });
    toast({ title: 'Seção atualizada!' });
  };

  const items: { key: keyof HomepageSections; label: string; description: string }[] = [
    { key: 'featured_experiences', label: 'Experiências em Destaque', description: 'Seção e link "Experiências" no menu' },
    { key: 'custom_travel_cta', label: 'Sua Viagem dos Sonhos', description: 'Seção e link "Viagem Personalizada" no menu' },
    { key: 'testimonials', label: 'O que Nossos Viajantes Dizem', description: 'Seção de depoimentos na página inicial' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5" />
          Seções da Página Inicial
        </CardTitle>
        <CardDescription>
          Ative ou desative seções da home e links correspondentes no menu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <p className="font-medium">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <Switch
              checked={sections?.[item.key] ?? true}
              onCheckedChange={() => toggle(item.key)}
              disabled={isLoading}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ── Cadastur Config Card ── */
function CadasturConfigCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['site-setting', 'cadastur_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'cadastur_config')
        .maybeSingle();
      if (error) throw error;
      const defaults = {
        number: '64.677.632/0001-77',
        validity: '27/01/2026 a 27/01/2028',
        description: 'O Cadastur é o sistema de cadastro de pessoas físicas e jurídicas que atuam no setor de turismo. É administrado pelo Ministério do Turismo e garante que a empresa atende às exigências legais para operar como agência de turismo.',
        certificate_image_url: '',
        agency_logo_url: '',
      };
      if (!data?.value) return defaults;
      return { ...defaults, ...(data.value as unknown as Partial<typeof defaults>) };
    },
  });

  const [number, setNumber] = useState('');
  const [validity, setValidity] = useState('');
  const [description, setDescription] = useState('');
  const [certificateImageUrl, setCertificateImageUrl] = useState('');
  const [agencyLogoUrl, setAgencyLogoUrl] = useState('');

  type CadasturValue = {
    number: string;
    validity: string;
    description: string;
    certificate_image_url: string;
    agency_logo_url: string;
  };

  const saveCadastur = async (value: CadasturValue, successMessage = 'Cadastur atualizado!') => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: 'cadastur_config',
          value: value as unknown as import('@/integrations/supabase/types').Json,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['site-setting', 'cadastur_config'] });
      toast({ title: successMessage });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não foi possível salvar no banco.';
      toast({ title: 'Erro ao salvar', description: message, variant: 'destructive' });
      throw err;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (config) {
      setNumber(config.number);
      setValidity(config.validity);
      setDescription(config.description);
      setCertificateImageUrl(config.certificate_image_url);
      setAgencyLogoUrl(config.agency_logo_url);
    }
  }, [config]);

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setLoading: (v: boolean) => void,
    prefix: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      toast({ title: 'Sessão expirada', description: 'Faça login novamente para enviar arquivos.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${prefix}-${Date.now()}.${ext}`;
      const { publicUrl } = await uploadStorageFile('site-assets', fileName, file, {
        upsert: true,
        contentType: file.type || undefined,
      });

      const isLogo = prefix.startsWith('agency-logo');
      if (isLogo) setAgencyLogoUrl(publicUrl);
      else setCertificateImageUrl(publicUrl);

      await saveCadastur(
        {
          number,
          validity,
          description,
          certificate_image_url: isLogo ? certificateImageUrl : publicUrl,
          agency_logo_url: isLogo ? publicUrl : agencyLogoUrl,
        },
        isLogo ? 'Logo enviada e salva!' : 'Certificado enviado e salvo!',
      );
    } catch (err) {
      const supa = err as { message?: string; statusCode?: string };
      let message = supa.message || 'Erro desconhecido.';
      if (message.includes('row-level security') || supa.statusCode === '403') {
        message = 'Sem permissão. Confirme que seu usuário tem papel admin no Supabase.';
      } else if (message.includes('Bucket not found')) {
        message = 'Bucket site-assets não existe. Crie em Storage → New bucket (público).';
      } else if (isStorageSchemaError(message, supa.statusCode)) {
        message =
          'Upload via servidor indisponível. Deploy: npx supabase functions deploy storage-upload — ou cole a URL da imagem abaixo.';
      }
      console.error('Erro no upload Cadastur:', err);
      toast({ title: 'Erro no upload', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    await saveCadastur({
      number,
      validity,
      description,
      certificate_image_url: certificateImageUrl,
      agency_logo_url: agencyLogoUrl,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Cadastur / Credenciais
        </CardTitle>
        <CardDescription>
          Configure os dados do Cadastur exibidos na página "Sobre" e no rodapé do site.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cadastur-number">Número do Cadastur</Label>
            <Input
              id="cadastur-number"
              placeholder="64.677.632/0001-77"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cadastur-validity">Validade</Label>
            <Input
              id="cadastur-validity"
              placeholder="27/01/2026 a 27/01/2028"
              value={validity}
              onChange={(e) => setValidity(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cadastur-description">Descrição</Label>
          <textarea
            id="cadastur-description"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        {/* Certificate Image */}
        <div className="space-y-2">
          <Label>Imagem do Certificado</Label>
          <div className="flex items-center gap-4">
            {certificateImageUrl && (
              <StorageImage src={certificateImageUrl} alt="Certificado" className="h-20 w-auto rounded-md border object-contain" />
            )}
            <div>
              <Label
                htmlFor="cert-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {uploadingCert ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {certificateImageUrl ? 'Substituir' : 'Enviar Imagem'}
              </Label>
              <Input
                id="cert-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e, setUploadingCert, 'cadastur-cert')}
                disabled={uploadingCert}
              />
            </div>
          </div>
          <Input
            placeholder="URL alternativa (https://...)"
            value={certificateImageUrl}
            onChange={(e) => setCertificateImageUrl(e.target.value)}
          />
        </div>

        {/* Agency Logo */}
        <div className="space-y-2">
          <Label>Logo da Agência (página Sobre)</Label>
          <div className="flex items-center gap-4">
            {agencyLogoUrl && (
              <StorageImage src={agencyLogoUrl} alt="Logo" className="h-20 w-auto rounded-md border object-contain" />
            )}
            <div>
              <Label
                htmlFor="logo-upload"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {agencyLogoUrl ? 'Substituir' : 'Enviar Logo'}
              </Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e, setUploadingLogo, 'agency-logo')}
                disabled={uploadingLogo}
              />
            </div>
          </div>
          <Input
            placeholder="URL alternativa (https://...)"
            value={agencyLogoUrl}
            onChange={(e) => setAgencyLogoUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Upload salva automaticamente. Use &quot;Salvar Credenciais&quot; para número, validade e descrição.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Credenciais
        </Button>
      </CardContent>
    </Card>
  );
}

export default AdminConfiguracoes;
