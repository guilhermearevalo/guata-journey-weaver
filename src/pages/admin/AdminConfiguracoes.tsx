import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';

const AdminConfiguracoes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const currentHeroUrl = heroSetting?.value
    ? (typeof heroSetting.value === 'string' ? heroSetting.value : JSON.stringify(heroSetting.value))
    : null;

  useEffect(() => {
    if (currentHeroUrl) setPreviewUrl(currentHeroUrl.replace(/^"|"$/g, ''));
  }, [currentHeroUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione uma imagem.', variant: 'destructive' });
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

      const publicUrl = urlData.publicUrl;

      const { error: settingError } = await supabase
        .from('site_settings')
        .upsert({ key: 'hero_image_url', value: JSON.stringify(publicUrl), updated_at: new Date().toISOString() });

      if (settingError) throw settingError;

      setPreviewUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ['site-setting', 'hero_image_url'] });
      toast({ title: 'Imagem atualizada!', description: 'A imagem do hero foi alterada com sucesso.' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro no upload', description: 'Não foi possível enviar a imagem.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetToDefault = async () => {
    const defaultUrl = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2021&auto=format&fit=crop';
    await supabase
      .from('site_settings')
      .upsert({ key: 'hero_image_url', value: JSON.stringify(defaultUrl), updated_at: new Date().toISOString() });
    setPreviewUrl(defaultUrl);
    queryClient.invalidateQueries({ queryKey: ['site-setting', 'hero_image_url'] });
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
            Imagem do Hero (Página Inicial)
          </CardTitle>
          <CardDescription>
            Faça upload de uma nova imagem de fundo para a seção principal da página inicial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {previewUrl && (
            <div className="relative overflow-hidden rounded-lg border">
              <img
                src={previewUrl}
                alt="Hero preview"
                className="h-48 w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-secondary/60 to-background/40" />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Label
              htmlFor="hero-upload"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? 'Enviando...' : 'Fazer Upload'}
            </Label>
            <Input
              id="hero-upload"
              type="file"
              accept="image/*"
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
            Recomendado: imagem com pelo menos 1920x1080px em formato JPG ou PNG
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminConfiguracoes;
