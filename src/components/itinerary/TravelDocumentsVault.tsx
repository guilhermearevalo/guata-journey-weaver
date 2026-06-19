import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { FileArchive, FileCheck, Upload, Download, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface TravelDocument {
  id: string;
  proposal_id: string;
  request_id: string;
  title: string;
  category: string;
  document_type: 'checklist' | 'vault';
  status: 'pending' | 'received' | 'verified' | 'sent';
  file_url?: string | null;
  file_path?: string | null;
  notes?: string | null;
  visible_in_public: boolean;
  uploaded_by?: string | null;
}

interface TravelDocumentsVaultProps {
  proposalId: string;
  requestId: string;
  documents: TravelDocument[];
  queryKey: unknown[];
  mode?: 'manage' | 'client' | 'public';
  summaryOnly?: boolean;
}

const categories = [
  { value: 'personal', label: 'Documento pessoal' },
  { value: 'voucher', label: 'Voucher' },
  { value: 'ticket', label: 'Ingresso' },
  { value: 'insurance', label: 'Seguro' },
  { value: 'reservation', label: 'Reserva' },
  { value: 'payment', label: 'Pagamento' },
  { value: 'other', label: 'Outro' },
];

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  received: 'Recebido',
  verified: 'Conferido',
  sent: 'Enviado ao cliente',
};

const typeLabels: Record<string, string> = {
  checklist: 'Checklist',
  vault: 'Cofre',
};

export default function TravelDocumentsVault({ proposalId, requestId, documents, queryKey, mode = 'manage', summaryOnly = false }: TravelDocumentsVaultProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(mode === 'client' ? 'personal' : 'voucher');
  const [documentType, setDocumentType] = useState<'checklist' | 'vault'>('vault');
  const [notes, setNotes] = useState('');
  const [visibleInPublic, setVisibleInPublic] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const checklist = useMemo(() => documents.filter(doc => doc.document_type === 'checklist'), [documents]);
  const vault = useMemo(() => documents.filter(doc => doc.document_type === 'vault'), [documents]);
  const pendingCount = checklist.filter(doc => doc.status === 'pending').length;

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const addDocument = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Informe um título');
      let filePath: string | null = null;
      let fileUrl: string | null = null;

      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        filePath = `${user?.id || 'system'}/${proposalId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from('travel-documents').upload(filePath, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('travel-documents').getPublicUrl(filePath);
        fileUrl = data.publicUrl;
      }

      const payload = {
        proposal_id: proposalId,
        request_id: requestId,
        title: title.trim(),
        category,
        document_type: documentType,
        status: mode === 'client' ? 'pending' : file ? 'sent' : 'pending',
        file_path: filePath,
        file_url: fileUrl,
        notes: notes.trim() || null,
        visible_in_public: mode === 'client' ? false : visibleInPublic,
        uploaded_by: user?.id || null,
      } as any;

      const { error } = await supabase.from('travel_documents' as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle('');
      setNotes('');
      setFile(null);
      refresh();
      toast({ title: mode === 'client' ? 'Documento enviado para revisão!' : 'Documento adicionado!' });
    },
    onError: () => toast({ title: 'Erro ao salvar documento', variant: 'destructive' }),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('travel_documents' as any).update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: refresh,
  });

  const updateVisibility = useMutation({
    mutationFn: async ({ id, visible }: { id: string; visible: boolean }) => {
      const payload: Record<string, unknown> = { visible_in_public: visible };
      if (visible) payload.status = 'sent';
      const { error } = await supabase.from('travel_documents' as any).update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      refresh();
      toast({ title: 'Visibilidade atualizada' });
    },
    onError: () => toast({ title: 'Erro ao atualizar', variant: 'destructive' }),
  });

  const removeDocument = useMutation({
    mutationFn: async (doc: TravelDocument) => {
      if (doc.file_path) await supabase.storage.from('travel-documents').remove([doc.file_path]);
      const { error } = await supabase.from('travel_documents' as any).delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast({ title: 'Documento removido' }); },
  });

  const openDocument = async (doc: TravelDocument) => {
    if (!doc.file_path && doc.file_url) {
      window.open(doc.file_url, '_blank');
      return;
    }
    if (!doc.file_path) return;
    const { data, error } = await supabase.storage.from('travel-documents').createSignedUrl(doc.file_path, 60 * 10);
    if (error || !data?.signedUrl) {
      toast({ title: 'Não foi possível abrir o arquivo', variant: 'destructive' });
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  if (summaryOnly) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5" />Documentos da viagem</CardTitle>
          <CardDescription>{pendingCount > 0 ? `${pendingCount} pendência(s) no checklist` : 'Checklist em dia'} • {vault.length} arquivo(s) guardado(s)</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileArchive className="h-5 w-5" />Documentos da Viagem</CardTitle>
        <CardDescription>Checklist para conferência e cofre para ingressos, vouchers, reservas e documentos importantes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {mode !== 'public' && (
          <div className="rounded-lg border p-4 space-y-3 print:hidden">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={mode === 'client' ? 'Ex: Foto do passaporte' : 'Ex: Voucher do hotel'} maxLength={160} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory} disabled={mode === 'client'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {mode !== 'client' && (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={documentType} onValueChange={(value) => setDocumentType(value as 'checklist' | 'vault')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="checklist">Checklist / pendência</SelectItem><SelectItem value="vault">Cofre / arquivo</SelectItem></SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  <Checkbox checked={visibleInPublic} onCheckedChange={(checked) => setVisibleInPublic(Boolean(checked))} />
                  Enviar ao cliente (visível no link público)
                </label>
              </div>
            )}
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={1000} placeholder="Instruções, validade, código da reserva..." />
            </div>
            <Button onClick={() => addDocument.mutate()} disabled={!title.trim() || addDocument.isPending}>
              {addDocument.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Adicionar documento
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><FileCheck className="h-4 w-4" />Checklist</h3>
          {checklist.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma pendência cadastrada.</p> : checklist.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox checked={doc.status === 'verified' || doc.status === 'received'} disabled={mode !== 'manage'} onCheckedChange={(checked) => updateStatus.mutate({ id: doc.id, status: checked ? 'verified' : 'pending' })} />
              <div className="flex-1"><p className="text-sm font-medium">{doc.title}</p>{doc.notes && <p className="text-xs text-muted-foreground">{doc.notes}</p>}</div>
              <Badge variant="outline">{statusLabels[doc.status]}</Badge>
              {mode === 'manage' && <Button variant="ghost" size="icon" onClick={() => removeDocument.mutate(doc)}><Trash2 className="h-4 w-4" /></Button>}
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><FileArchive className="h-4 w-4" />Cofre da viagem</h3>
          {vault.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum arquivo guardado ainda.</p> : vault.map(doc => (
            <div key={doc.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{doc.title}</p>
                  <Badge variant="secondary">{categories.find(c => c.value === doc.category)?.label || doc.category}</Badge>
                  {doc.visible_in_public && <Badge className="bg-green-500/10 text-green-700">No link do cliente</Badge>}
                </div>
                {doc.notes && <p className="mt-1 text-xs text-muted-foreground">{doc.notes}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {mode === 'manage' && (
                  <label className="flex items-center gap-2 text-xs">
                    <Checkbox
                      checked={doc.visible_in_public}
                      onCheckedChange={(checked) => updateVisibility.mutate({ id: doc.id, visible: Boolean(checked) })}
                    />
                    Cliente vê
                  </label>
                )}
                {(doc.file_path || doc.file_url) && <Button variant="outline" size="sm" onClick={() => openDocument(doc)}><Download className="mr-2 h-4 w-4" />Abrir</Button>}
                {mode === 'manage' && <Button variant="ghost" size="icon" onClick={() => removeDocument.mutate(doc)}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
