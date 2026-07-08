-- 1. Templates reutilizáveis
CREATE TABLE public.checklist_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_templates TO authenticated;
GRANT ALL ON public.checklist_templates TO service_role;
ALTER TABLE public.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage checklist templates" ON public.checklist_templates
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 2. Itens padrão de cada template
CREATE TABLE public.checklist_template_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.checklist_templates(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_template_items TO authenticated;
GRANT ALL ON public.checklist_template_items TO service_role;
ALTER TABLE public.checklist_template_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage checklist template items" ON public.checklist_template_items
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_checklist_template_items_template ON public.checklist_template_items(template_id);

-- 3. Tarefas de planejamento por viagem (proposta)
CREATE TABLE public.planning_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  note TEXT,
  due_date DATE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.planning_tasks TO authenticated;
GRANT ALL ON public.planning_tasks TO service_role;
ALTER TABLE public.planning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff manage planning tasks" ON public.planning_tasks
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX idx_planning_tasks_proposal ON public.planning_tasks(proposal_id);

-- Triggers de updated_at
CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_checklist_template_items_updated_at BEFORE UPDATE ON public.checklist_template_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_planning_tasks_updated_at BEFORE UPDATE ON public.planning_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();