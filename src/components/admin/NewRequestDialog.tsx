import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

export function NewRequestDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [destination, setDestination] = useState('');
  const [travelers, setTravelers] = useState('1');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName(''); setEmail(''); setPhone(''); setDestination('');
    setTravelers('1'); setBudget(''); setNotes('');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('travel_requests').insert({
        client_name: name,
        client_email: email,
        client_phone: phone || null,
        destination: destination || null,
        travelers_count: parseInt(travelers) || 1,
        budget_range: budget || null,
        special_requests: notes || null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel_requests'] });
      toast({ title: 'Demanda criada com sucesso!' });
      resetForm();
      setOpen(false);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Tente novamente.';
      console.error('Erro ao criar demanda:', error);
      toast({ title: 'Erro ao criar demanda', description: message, variant: 'destructive' });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" />Nova Demanda</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Demanda Manual</DialogTitle>
          <DialogDescription>Cadastre um lead que veio por fora do site (WhatsApp, Instagram, etc.)</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do cliente" />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <Label>Destino</Label>
              <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ex: Fernando de Noronha" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Viajantes</Label>
              <Input type="number" min="1" value={travelers} onChange={e => setTravelers(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Orçamento</Label>
              <Input value={budget} onChange={e => setBudget(e.target.value)} placeholder="Ex: R$ 5.000 - R$ 10.000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="De onde veio o lead, preferências, etc." />
          </div>
          <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !name || !email}>
            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Criar Demanda
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
