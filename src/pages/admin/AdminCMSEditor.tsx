import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCmsPage, CmsPageContent } from '@/hooks/useCmsPage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminCMSEditor = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: page, isLoading } = useCmsPage(slug || '');

  const [title, setTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published' | 'hidden'>('draft');
  const [content, setContent] = useState<CmsPageContent>({});
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast({ title: 'Selecione um arquivo PDF', variant: 'destructive' });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 15MB.', variant: 'destructive' });
      return;
    }
    setUploadingPdf(true);
    try {
      const fileName = `${slug}-${Date.now()}.pdf`;
      const { error } = await supabase.storage.from('site-assets').upload(fileName, file, { upsert: true, contentType: 'application/pdf' });
      if (error) throw error;
      const { data } = supabase.storage.from('site-assets').getPublicUrl(fileName);
      setContent((prev) => ({ ...prev, pdf_url: data.publicUrl }));
      toast({ title: 'PDF enviado!', description: 'Lembre-se de salvar a página.' });
    } catch {
      toast({ title: 'Erro no upload do PDF', variant: 'destructive' });
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setMetaDescription(page.meta_description || '');
      setStatus(page.status);
      setContent(page.content);
    }
  }, [page]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('cms_pages')
        .update({
          title,
          meta_description: metaDescription,
          status,
          content: JSON.parse(JSON.stringify(content)),
          updated_at: new Date().toISOString(),
        })
        .eq('slug', slug);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms-page', slug] });
      queryClient.invalidateQueries({ queryKey: ['cms-pages'] });
      toast({
        title: 'Página atualizada',
        description: 'As alterações foram salvas com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
      console.error('Error updating page:', error);
    },
  });

  const handleHeroChange = (field: 'title' | 'subtitle', value: string) => {
    setContent((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        title: prev.hero?.title || '',
        [field]: value,
      },
    }));
  };

  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    setContent((prev) => {
      const sections = [...(prev.sections || [])];
      sections[index] = { ...sections[index], [field]: value };
      return { ...prev, sections };
    });
  };

  const addSection = () => {
    setContent((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), { title: 'Nova Seção', content: '' }],
    }));
  };

  const removeSection = (index: number) => {
    setContent((prev) => ({
      ...prev,
      sections: (prev.sections || []).filter((_, i) => i !== index),
    }));
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    setContent((prev) => {
      const items = [...(prev.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, items };
    });
  };

  const addFaqItem = () => {
    setContent((prev) => ({
      ...prev,
      items: [...(prev.items || []), { question: 'Nova pergunta', answer: '' }],
    }));
  };

  const removeFaqItem = (index: number) => {
    setContent((prev) => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  const handleInfoChange = (field: keyof NonNullable<CmsPageContent['info']>, value: string) => {
    setContent((prev) => ({
      ...prev,
      info: {
        ...prev.info,
        [field]: value,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Página não encontrada</p>
        <Button asChild className="mt-4">
          <Link to="/admin/cms">Voltar</Link>
        </Button>
      </div>
    );
  }

  const isFaqPage = slug === 'faq';
  const isContactPage = slug === 'contato';
  const isTextPage = ['sobre', 'termos', 'privacidade'].includes(slug || '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/admin/cms">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold">Editar: {page.title}</h1>
            <p className="text-sm text-muted-foreground">/{slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/${slug}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Link>
          </Button>
          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Página</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Página</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meta">Descrição SEO</Label>
            <Input
              id="meta"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="Descrição para motores de busca"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Publicada</SelectItem>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="hidden">Oculta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Seção Hero (Cabeçalho)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Título Principal</Label>
            <Input
              value={content.hero?.title || ''}
              onChange={(e) => handleHeroChange('title', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Input
              value={content.hero?.subtitle || ''}
              onChange={(e) => handleHeroChange('subtitle', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* FAQ Items */}
      {isFaqPage && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Perguntas e Respostas</CardTitle>
            <Button onClick={addFaqItem} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.items?.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label>Pergunta</Label>
                      <Input
                        value={item.question}
                        onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Resposta</Label>
                      <Textarea
                        value={item.answer}
                        onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeFaqItem(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Text Sections */}
      {isTextPage && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Seções de Conteúdo</CardTitle>
            <Button onClick={addSection} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Adicionar Seção
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {content.sections?.map((section, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label>Título da Seção</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Conteúdo</Label>
                      <Textarea
                        value={section.content}
                        onChange={(e) => handleSectionChange(index, 'content', e.target.value)}
                        rows={5}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSection(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contact Info + Location (salvos em site_settings, refletem no rodapé) */}
      {isContactPage && (
        <>
          <ContactInfoSettingsCard />
          <AgencyLocationSettingsCard />
        </>
      )}
    </div>
  );
};

export default AdminCMSEditor;

/* ── Contato (site_settings.contact_info) ── */
function ContactInfoSettingsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const { data: config } = useQuery({
    queryKey: ['site-setting', 'contact_info'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'contact_info').maybeSingle();
      const defaults = {
        address: 'Mato Grosso do Sul, Brasil',
        phone: '(67) 99999-9999',
        whatsapp: '5567999999999',
        email: 'contato@guata.travel',
        hours: 'Segunda a Sexta: 9h às 18h',
        instagram: '',
        facebook: '',
        youtube: '',
      };
      return { ...defaults, ...((data?.value as Partial<typeof defaults>) || {}) };
    },
  });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (config) setForm(config); }, [config]);
  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('site_settings').upsert({ key: 'contact_info', value: form, updated_at: new Date().toISOString() });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['site-setting', 'contact_info'] });
      toast({ title: 'Contato atualizado', description: 'O rodapé e a página Contato foram atualizados.' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally { setSaving(false); }
  };
  if (!form) return null;
  const fields: { key: string; label: string; placeholder?: string }[] = [
    { key: 'address', label: 'Endereço', placeholder: 'Av. Afonso Pena, 1234 - Campo Grande, MS' },
    { key: 'phone', label: 'Telefone (exibido)', placeholder: '(67) 99999-9999' },
    { key: 'whatsapp', label: 'WhatsApp (com DDI, só números)', placeholder: '5567999999999' },
    { key: 'email', label: 'E-mail', placeholder: 'contato@guata.travel' },
    { key: 'hours', label: 'Horário de atendimento', placeholder: 'Segunda a Sexta: 9h às 18h' },
    { key: 'instagram', label: 'Instagram (URL)', placeholder: 'https://instagram.com/guata' },
    { key: 'facebook', label: 'Facebook (URL)', placeholder: 'https://facebook.com/guata' },
    { key: 'youtube', label: 'YouTube (URL)', placeholder: 'https://youtube.com/@guata' },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações de contato</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key} className="space-y-2">
              <Label>{f.label}</Label>
              <Input value={form[f.key] || ''} placeholder={f.placeholder} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando…' : 'Salvar contato'}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Localização da agência (site_settings.agency_location) ── */
function AgencyLocationSettingsCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const { data: config } = useQuery({
    queryKey: ['site-setting', 'agency_location'],
    queryFn: async () => {
      const { data } = await supabase.from('site_settings').select('value').eq('key', 'agency_location').maybeSingle();
      const defaults = { address: 'Campo Grande, MS - Brasil', latitude: '-20.4697', longitude: '-54.6201', zoom: '14' };
      return { ...defaults, ...((data?.value as Partial<typeof defaults>) || {}) };
    },
  });
  const [form, setForm] = useState<any>(null);
  useEffect(() => { if (config) setForm(config); }, [config]);
  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('site_settings').upsert({ key: 'agency_location', value: form, updated_at: new Date().toISOString() });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['site-setting', 'agency_location'] });
      toast({ title: 'Localização atualizada' });
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } finally { setSaving(false); }
  };
  if (!form) return null;
  const previewUrl = `https://www.google.com/maps?q=${form.latitude},${form.longitude}&z=${form.zoom || 14}&output=embed`;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Localização no mapa</CardTitle>
        <p className="text-sm text-muted-foreground">Pegue as coordenadas no Google Maps (clique direito → "O que há aqui?").</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Endereço completo</Label>
          <Input value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2"><Label>Latitude</Label><Input value={form.latitude || ''} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></div>
          <div className="space-y-2"><Label>Longitude</Label><Input value={form.longitude || ''} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div>
          <div className="space-y-2"><Label>Zoom (1-20)</Label><Input value={form.zoom || ''} onChange={(e) => setForm({ ...form, zoom: e.target.value })} /></div>
        </div>
        <div className="aspect-video overflow-hidden rounded-lg border">
          <iframe src={previewUrl} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Pré-visualização do mapa" />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando…' : 'Salvar localização'}
        </Button>
      </CardContent>
    </Card>
  );
}

