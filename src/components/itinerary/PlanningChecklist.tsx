import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  ListChecks, Plus, Trash2, LayoutTemplate, CalendarDays, StickyNote, Loader2, ChevronDown, Save,
} from 'lucide-react';

interface PlanningTask {
  id: string;
  proposal_id: string;
  title: string;
  note: string | null;
  due_date: string | null;
  is_done: boolean;
  position: number;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  description: string | null;
}

interface TemplateItem {
  id: string;
  template_id: string;
  title: string;
  position: number;
}

export default function PlanningChecklist({ proposalId }: { proposalId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState('');
  const [editingNoteFor, setEditingNoteFor] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [templatesOpen, setTemplatesOpen] = useState(false);

  const tasksKey = ['planning-tasks', proposalId];

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: tasksKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('planning_tasks')
        .select('id, proposal_id, title, note, due_date, is_done, position')
        .eq('proposal_id', proposalId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as PlanningTask[];
    },
    enabled: !!proposalId,
  });

  const doneCount = tasks.filter((t) => t.is_done).length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  const addTask = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from('planning_tasks').insert({
        proposal_id: proposalId,
        title,
        position: tasks.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewTitle('');
      queryClient.invalidateQueries({ queryKey: tasksKey });
    },
    onError: (e: unknown) => toast({ title: 'Erro ao adicionar', description: (e as Error).message, variant: 'destructive' }),
  });

  const updateTask = useMutation({
    mutationFn: async (patch: Partial<PlanningTask> & { id: string }) => {
      const { id, ...fields } = patch;
      const payload: Record<string, unknown> = { ...fields };
      if ('is_done' in fields) payload.done_at = fields.is_done ? new Date().toISOString() : null;
      const { error } = await supabase.from('planning_tasks').update(payload).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
    onError: (e: unknown) => toast({ title: 'Erro ao atualizar', description: (e as Error).message, variant: 'destructive' }),
  });

  const removeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('planning_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksKey }),
  });

  const applyTemplate = useMutation({
    mutationFn: async (templateId: string) => {
      const { data: items, error } = await supabase
        .from('checklist_template_items')
        .select('title, position')
        .eq('template_id', templateId)
        .order('position', { ascending: true });
      if (error) throw error;
      if (!items?.length) return 0;
      const base = tasks.length;
      const rows = items.map((it, i) => ({ proposal_id: proposalId, title: it.title, position: base + i }));
      const { error: insErr } = await supabase.from('planning_tasks').insert(rows);
      if (insErr) throw insErr;
      return items.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: tasksKey });
      toast({ title: 'Modelo aplicado', description: `${count} item(ns) adicionado(s).` });
    },
    onError: (e: unknown) => toast({ title: 'Erro ao aplicar modelo', description: (e as Error).message, variant: 'destructive' }),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_templates')
        .select('id, name, description')
        .order('name', { ascending: true });
      if (error) throw error;
      return data as ChecklistTemplate[];
    },
  });

  const overdue = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return tasks.filter((t) => !t.is_done && t.due_date && t.due_date < today).length;
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" /> Checklist de planejamento
            </CardTitle>
            <CardDescription>
              Suas tarefas internas para organizar esta viagem (não visível ao cliente).
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <LayoutTemplate className="mr-2 h-4 w-4" /> Aplicar modelo <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Modelos</DropdownMenuLabel>
                {templates.length === 0 && (
                  <DropdownMenuItem disabled>Nenhum modelo criado</DropdownMenuItem>
                )}
                {templates.map((tpl) => (
                  <DropdownMenuItem key={tpl.id} onClick={() => applyTemplate.mutate(tpl.id)}>
                    {tpl.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTemplatesOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Gerenciar modelos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {doneCount}/{tasks.length} concluído(s)
                {overdue > 0 && (
                  <Badge variant="destructive" className="ml-2">{overdue} atrasada(s)</Badge>
                )}
              </span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (newTitle.trim()) addTask.mutate(newTitle.trim());
          }}
        >
          <Input
            placeholder="Adicionar tarefa (ex.: Reservar hotel, confirmar transfer...)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button type="submit" disabled={!newTitle.trim() || addTask.isPending}>
            {addTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </form>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma tarefa ainda. Digite acima ou aplique um modelo pronto.
          </p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-lg border p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.is_done}
                    onCheckedChange={(v) => updateTask.mutate({ id: task.id, is_done: !!v })}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={task.is_done ? 'line-through text-muted-foreground' : ''}>{task.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <input
                          type="date"
                          value={task.due_date ?? ''}
                          onChange={(e) => updateTask.mutate({ id: task.id, due_date: e.target.value || null })}
                          className="bg-transparent outline-none"
                        />
                      </label>
                      {task.note && editingNoteFor !== task.id && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <StickyNote className="h-3.5 w-3.5" /> {task.note}
                        </span>
                      )}
                    </div>
                    {editingNoteFor === task.id ? (
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Observação..."
                          className="h-8"
                        />
                        <Button
                          size="sm"
                          className="h-8"
                          onClick={() => {
                            updateTask.mutate({ id: task.id, note: noteDraft || null });
                            setEditingNoteFor(null);
                          }}
                        >
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        className="mt-1 text-xs text-primary hover:underline"
                        onClick={() => { setEditingNoteFor(task.id); setNoteDraft(task.note ?? ''); }}
                      >
                        {task.note ? 'Editar observação' : 'Adicionar observação'}
                      </button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTask.mutate(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <TemplateManagerDialog open={templatesOpen} onOpenChange={setTemplatesOpen} />
    </Card>
  );
}

function TemplateManagerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newName, setNewName] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');

  const { data: templates = [] } = useQuery({
    queryKey: ['checklist-templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('checklist_templates').select('id, name, description').order('name');
      if (error) throw error;
      return data as ChecklistTemplate[];
    },
    enabled: open,
  });

  const { data: items = [] } = useQuery({
    queryKey: ['checklist-template-items', selectedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_template_items')
        .select('id, template_id, title, position')
        .eq('template_id', selectedId!)
        .order('position');
      if (error) throw error;
      return data as TemplateItem[];
    },
    enabled: !!selectedId,
  });

  const createTemplate = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase.from('checklist_templates').insert({ name }).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      setNewName('');
      setSelectedId(id);
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
    },
    onError: (e: unknown) => toast({ title: 'Erro', description: (e as Error).message, variant: 'destructive' }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checklist_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
    },
  });

  const addItem = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from('checklist_template_items').insert({
        template_id: selectedId!, title, position: items.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewItem('');
      queryClient.invalidateQueries({ queryKey: ['checklist-template-items', selectedId] });
    },
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('checklist_template_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-template-items', selectedId] }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modelos de checklist</DialogTitle>
          <DialogDescription>Crie listas padrão reutilizáveis para aplicar em qualquer viagem.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <form
              className="flex gap-2"
              onSubmit={(e) => { e.preventDefault(); if (newName.trim()) createTemplate.mutate(newName.trim()); }}
            >
              <Input placeholder="Novo modelo (ex.: Viagem internacional)" value={newName} onChange={(e) => setNewName(e.target.value)} />
              <Button type="submit" disabled={!newName.trim()}><Plus className="h-4 w-4" /></Button>
            </form>
            <ul className="space-y-1">
              {templates.map((tpl) => (
                <li key={tpl.id}>
                  <button
                    className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm ${selectedId === tpl.id ? 'bg-muted' : 'hover:bg-muted/60'}`}
                    onClick={() => setSelectedId(tpl.id)}
                  >
                    <span>{tpl.name}</span>
                    <Trash2
                      className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteTemplate.mutate(tpl.id); }}
                    />
                  </button>
                </li>
              ))}
              {templates.length === 0 && <li className="text-sm text-muted-foreground px-1">Nenhum modelo ainda.</li>}
            </ul>
          </div>

          <div className="space-y-3">
            {selectedId ? (
              <>
                <p className="text-sm font-medium">Itens do modelo</p>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => { e.preventDefault(); if (newItem.trim()) addItem.mutate(newItem.trim()); }}
                >
                  <Input placeholder="Item padrão (ex.: Emitir passagens)" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
                  <Button type="submit" disabled={!newItem.trim()}><Plus className="h-4 w-4" /></Button>
                </form>
                <ul className="space-y-1">
                  {items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-sm">
                      <span>{it.title}</span>
                      <Trash2 className="h-3.5 w-3.5 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeItem.mutate(it.id)} />
                    </li>
                  ))}
                  {items.length === 0 && <li className="text-sm text-muted-foreground px-1">Sem itens ainda.</li>}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Selecione um modelo para editar seus itens.</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
