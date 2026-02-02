import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tables, Enums } from '@/integrations/supabase/types';
import { Loader2 } from 'lucide-react';

const experienceSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  destination: z.string().min(2, 'Destino é obrigatório'),
  short_description: z.string().optional(),
  description: z.string().optional(),
  experience_type: z.enum(['package', 'excursion', 'custom', 'thematic']),
  price: z.coerce.number().min(0, 'Preço deve ser positivo').optional(),
  duration_days: z.coerce.number().min(1, 'Duração mínima de 1 dia').optional(),
  max_participants: z.coerce.number().min(1, 'Mínimo 1 participante').optional(),
  cover_image: z.string().url('URL inválida').optional().or(z.literal('')),
  is_published: z.boolean(),
  is_featured: z.boolean(),
  inclusions: z.string().optional(),
  exclusions: z.string().optional(),
});

type ExperienceFormData = z.infer<typeof experienceSchema>;

interface ExperienceFormProps {
  experience?: Tables<'experiences'> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Tables<'experiences'>>) => Promise<void>;
  isSubmitting: boolean;
}

const experienceTypeLabels: Record<Enums<'experience_type'>, string> = {
  package: 'Pacote',
  excursion: 'Excursão',
  custom: 'Personalizado',
  thematic: 'Temático',
};

export function ExperienceForm({ experience, open, onOpenChange, onSubmit, isSubmitting }: ExperienceFormProps) {
  const form = useForm<ExperienceFormData>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: '',
      destination: '',
      short_description: '',
      description: '',
      experience_type: 'package',
      price: undefined,
      duration_days: undefined,
      max_participants: undefined,
      cover_image: '',
      is_published: false,
      is_featured: false,
      inclusions: '',
      exclusions: '',
    },
  });

  useEffect(() => {
    if (experience) {
      form.reset({
        title: experience.title,
        destination: experience.destination,
        short_description: experience.short_description || '',
        description: experience.description || '',
        experience_type: experience.experience_type,
        price: experience.price || undefined,
        duration_days: experience.duration_days || undefined,
        max_participants: experience.max_participants || undefined,
        cover_image: experience.cover_image || '',
        is_published: experience.is_published || false,
        is_featured: experience.is_featured || false,
        inclusions: experience.inclusions?.join('\n') || '',
        exclusions: experience.exclusions?.join('\n') || '',
      });
    } else {
      form.reset({
        title: '',
        destination: '',
        short_description: '',
        description: '',
        experience_type: 'package',
        price: undefined,
        duration_days: undefined,
        max_participants: undefined,
        cover_image: '',
        is_published: false,
        is_featured: false,
        inclusions: '',
        exclusions: '',
      });
    }
  }, [experience, form]);

  const handleSubmit = async (data: ExperienceFormData) => {
    await onSubmit({
      title: data.title,
      destination: data.destination,
      short_description: data.short_description || null,
      description: data.description || null,
      experience_type: data.experience_type,
      price: data.price || null,
      duration_days: data.duration_days || null,
      max_participants: data.max_participants || null,
      cover_image: data.cover_image || null,
      is_published: data.is_published,
      is_featured: data.is_featured,
      inclusions: data.inclusions?.split('\n').filter(Boolean) || null,
      exclusions: data.exclusions?.split('\n').filter(Boolean) || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {experience ? 'Editar Experiência' : 'Nova Experiência'}
          </DialogTitle>
          <DialogDescription>
            {experience ? 'Atualize os dados da experiência.' : 'Preencha os dados para criar uma nova experiência.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Fernando de Noronha Completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino *</FormLabel>
                    <FormControl>
                      <Input placeholder="Fernando de Noronha, PE" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="short_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Curta</FormLabel>
                  <FormControl>
                    <Input placeholder="Uma breve descrição para listagens" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Completa</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição detalhada da experiência..." rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="experience_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(experienceTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="4500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (dias)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="max_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Máx. Participantes</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cover_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem de Capa</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="inclusions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inclusões</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Uma por linha:&#10;Hospedagem&#10;Café da manhã&#10;Transfer" rows={4} {...field} />
                    </FormControl>
                    <FormDescription>Uma inclusão por linha</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="exclusions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Exclusões</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Uma por linha:&#10;Passagem aérea&#10;Alimentação" rows={4} {...field} />
                    </FormControl>
                    <FormDescription>Uma exclusão por linha</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-6">
              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Publicado</FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_featured"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Destaque</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {experience ? 'Salvar Alterações' : 'Criar Experiência'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
