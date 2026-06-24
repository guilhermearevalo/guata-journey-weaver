import { useState } from 'react';
import { Star, Quote, Camera, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { uploadStorageFile } from '@/lib/uploadStorageFile';
import { useAuth } from '@/lib/auth';

export function TestimonialsSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', location: '', text: '', trip: '', rating: 5 });
  const [photo, setPhoto] = useState<File | null>(null);

  const { data: dbTestimonials, isLoading } = useQuery({
    queryKey: ['testimonials-approved'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return null;

  const testimonials = (dbTestimonials ?? []).map(t => ({
    id: t.id,
    client_name: t.client_name,
    client_location: t.client_location || '',
    client_photo_url: t.client_photo_url || '',
    rating: t.rating || 5,
    text: t.text,
    trip_name: t.trip_name || '',
  }));

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: 'Faça login para enviar seu depoimento', variant: 'destructive' });
      return;
    }
    if (!form.name.trim() || !form.text.trim()) {
      toast({ title: 'Preencha nome e depoimento', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const ext = photo.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { publicUrl } = await uploadStorageFile('testimonials', path, photo, { upsert: true });
        photoUrl = publicUrl;
      }

      const { error } = await supabase.from('testimonials').insert({
        client_name: form.name.trim(),
        client_location: form.location.trim() || null,
        client_photo_url: photoUrl,
        rating: form.rating,
        text: form.text.trim(),
        trip_name: form.trip.trim() || null,
        client_id: user.id,
      });

      if (error) throw error;

      toast({ title: 'Depoimento enviado!', description: 'Será publicado após aprovação.' });
      setForm({ name: '', location: '', text: '', trip: '', rating: 5 });
      setPhoto(null);
      setOpen(false);
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            O Que Nossos Viajantes Dizem
          </h2>
          <p className="mt-2 text-muted-foreground">
            Histórias reais de quem viveu experiências inesquecíveis conosco
          </p>
        </div>

        {testimonials.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="relative overflow-hidden">
              <CardContent className="p-6">
                <Quote className="absolute right-4 top-4 h-10 w-10 text-muted/20" />

                <div className="mb-4 flex items-center gap-1">
                  {Array(testimonial.rating).fill(0).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>

                <p className="mb-6 text-muted-foreground">
                  "{testimonial.text}"
                </p>

                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={testimonial.client_photo_url} alt={testimonial.client_name} />
                    <AvatarFallback>
                      {testimonial.client_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{testimonial.client_name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.client_location}</p>
                  </div>
                </div>

                {testimonial.trip_name && (
                  <div className="mt-4 rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs font-medium text-muted-foreground">{testimonial.trip_name}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        ) : (
          <p className="text-center text-muted-foreground">
            Ainda não há depoimentos publicados. Seja o primeiro a compartilhar sua experiência!
          </p>
        )}

        {/* Submit testimonial button */}
        <div className="mt-10 text-center">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg" className="gap-2">
                <Camera className="h-4 w-4" />
                Compartilhe sua Experiência
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Compartilhe sua Experiência</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Seu nome *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" />
                </div>
                <div>
                  <Label>Cidade / Estado</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Ex: São Paulo, SP" />
                </div>
                <div>
                  <Label>Viagem realizada</Label>
                  <Input value={form.trip} onChange={e => setForm(f => ({ ...f, trip: e.target.value }))} placeholder="Ex: Lua de mel em Noronha" />
                </div>
                <div>
                  <Label>Avaliação</Label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}>
                        <Star className={`h-6 w-6 ${n <= form.rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Sua foto</Label>
                  <Input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <Label>Seu depoimento *</Label>
                  <Textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="Conte como foi sua experiência..." rows={4} />
                </div>
                <Button onClick={handleSubmit} disabled={submitting} className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  {submitting ? 'Enviando...' : 'Enviar Depoimento'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">Seu depoimento será publicado após aprovação.</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  );
}
