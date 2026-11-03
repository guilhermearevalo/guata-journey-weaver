import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MessageCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminLeads() {
  const queryClient = useQueryClient();
  const { data: leads = [], refetch } = useQuery({
    queryKey: ['site-leads'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_leads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Opening this page marks all leads as seen (clears the red badge).
  useEffect(() => {
    localStorage.setItem('guata-leads-seen', new Date().toISOString());
    queryClient.invalidateQueries({ queryKey: ['admin-new-leads-count'] });
  }, [leads.length, queryClient]);

  const remove = async (id: string) => {
    if (!window.confirm('Excluir este lead?')) return;
    const { data, error } = await supabase.from('site_leads').delete().eq('id', id).select('id');
    if (error || !data?.length) {
      toast.error('Não foi possível excluir (sem permissão no banco).');
      return;
    }
    queryClient.setQueryData(['site-leads'], (old: any[] = []) => old.filter((l) => l.id !== id));
    toast.success('Lead excluído');
    refetch();
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">Leads do site</h1>
      <Card>
        <CardHeader><CardTitle>{leads.length} contatos capturados</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Nome</TableHead><TableHead>WhatsApp</TableHead>
              <TableHead>Destino</TableHead><TableHead>Mensagem</TableHead><TableHead>Idioma</TableHead><TableHead>Página</TableHead><TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{format(new Date(l.created_at), 'dd/MM/yy HH:mm')}</TableCell>
                  <TableCell>{l.name}</TableCell>
                  <TableCell>{l.phone}</TableCell>
                  <TableCell>{l.destination || '—'}</TableCell>
                  <TableCell className="max-w-xs whitespace-pre-wrap text-sm">{(l as any).message || '—'}</TableCell>
                  <TableCell className="uppercase">{l.lang}</TableCell>
                  <TableCell>{l.page}</TableCell>
                  <TableCell className="flex gap-1">
                    <Button size="icon" variant="ghost" asChild>
                      <a href={`https://wa.me/${l.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /></a>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(l.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
