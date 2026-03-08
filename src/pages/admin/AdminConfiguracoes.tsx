import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Image as ImageIcon, Trash2, Film, X, LayoutDashboard } from 'lucide-react';
import type { HomepageSections } from '@/hooks/useHomepageSections';

interface Slide {
  type: 'image' | 'video';
  url: string;
}

const AdminConfiguracoes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);

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

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('site-assets')
        .getPublicUrl(fileName);

      const newSlide: Slide = { type: isVideo ? 'video' : 'image', url: urlData.publicUrl };
      const newSlides = [...slides, newSlide];
      await saveSlides(newSlides);
      toast({ title: 'Mídia adicionada!', description: `${isVideo ? 'Vídeo' : 'Imagem'} adicionado(a) ao carrossel.` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro no upload', description: 'Não foi possível enviar o arquivo.', variant: 'destructive' });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Configurações gerais da plataforma</p>
      </div>

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
          <p className="text-xs text-muted-foreground">
            Imagens: JPG, PNG, WEBP (recomendado 1920×1080). Vídeos: MP4, WEBM (máx. 30MB).
          </p>
        </CardContent>
      </Card>
      <HomepageSectionsCard />
    </div>
  );
};

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

export default AdminConfiguracoes;
