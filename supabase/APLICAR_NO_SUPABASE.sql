-- ============================================================================
-- GUATÁ VIAGENS — Migrations pendentes (rodar no Supabase → SQL Editor)
-- ----------------------------------------------------------------------------
-- Este script é IDEMPOTENTE: pode ser executado inteiro mesmo que parte já
-- tenha sido aplicada. Cole tudo no SQL Editor e clique em "Run".
--
-- Cobre as features:
--   1) Tipo de serviço "other" + nota livre
--   2) GRANTs/RLS de staff (corrige erro 500 em proposals/travel_requests)
--   3) RPC para atualizar tipo de serviço
--   4) Notificações de demandas (admin_reviewed_at)
--   5) Login de equipe (create_staff_access / reset_staff_password)
--   6) Checklist de planejamento (planning_tasks + templates)
-- ============================================================================


-- ============================================================================
-- 1) Tipo de serviço "other" + coluna de nota
-- ============================================================================
ALTER TYPE public.service_type ADD VALUE IF NOT EXISTS 'other';

ALTER TABLE public.travel_requests
  ADD COLUMN IF NOT EXISTS service_type_note text;

COMMENT ON COLUMN public.travel_requests.service_type_note IS
  'Descrição livre quando service_type = other (ex.: só passagem, seguro viagem).';


-- ============================================================================
-- 2) GRANTs + RLS de staff (corrige 500 em SELECT via REST)
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_agency(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Staff can view all proposals" ON public.proposals;
CREATE POLICY "Staff can view all proposals"
ON public.proposals FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can view all requests" ON public.travel_requests;
CREATE POLICY "Staff can view all requests"
ON public.travel_requests FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));


-- ============================================================================
-- 2.1) CORRIGE RECURSÃO INFINITA (42P17) entre proposals e travel_requests
-- ----------------------------------------------------------------------------
-- Sintoma: "infinite recursion detected in policy for relation proposals"
-- Causa: a policy de proposals consultava travel_requests inline, e a de
-- travel_requests consultava proposals inline -> loop infinito no RLS.
-- Solução: usar funções SECURITY DEFINER (que ignoram RLS internamente),
-- quebrando o ciclo.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_request_client(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.travel_requests tr
    WHERE tr.id = _request_id AND tr.client_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.has_shared_proposal_for_request(_request_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.request_id = _request_id
      AND p.share_token IS NOT NULL
      AND p.share_enabled = true
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_request_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_shared_proposal_for_request(uuid) TO anon, authenticated;

-- Recria as policies usando as funções (sem subconsulta inline)
DROP POLICY IF EXISTS "Clients can view proposals for their requests" ON public.proposals;
CREATE POLICY "Clients can view proposals for their requests"
ON public.proposals FOR SELECT TO authenticated
USING (public.is_request_client(request_id, auth.uid()));

DROP POLICY IF EXISTS "Anyone can view requests of shared proposals" ON public.travel_requests;
CREATE POLICY "Anyone can view requests of shared proposals"
ON public.travel_requests FOR SELECT TO anon, authenticated
USING (public.has_shared_proposal_for_request(id));


-- ============================================================================
-- 3) RPC: atualizar tipo de serviço (contorna 500 de RLS no REST)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.staff_update_travel_request_service_type(
  p_id uuid,
  p_service_type public.service_type,
  p_service_type_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.travel_requests
  SET
    service_type = p_service_type,
    service_type_note = CASE
      WHEN p_service_type = 'other' THEN NULLIF(TRIM(p_service_type_note), '')
      ELSE NULL
    END,
    updated_at = now()
  WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_update_travel_request_service_type(uuid, public.service_type, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_update_travel_request_service_type(uuid, public.service_type, text) TO authenticated;


-- ============================================================================
-- 4) Notificações de demandas: admin_reviewed_at
-- ============================================================================
ALTER TABLE public.travel_requests
  ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_travel_requests_unreviewed_pending
  ON public.travel_requests (created_at DESC)
  WHERE status = 'pending' AND admin_reviewed_at IS NULL;

COMMENT ON COLUMN public.travel_requests.admin_reviewed_at IS
  'Quando o staff abriu/visualizou a demanda pendente; limpa badge de novas demandas.';


-- ============================================================================
-- 5) Login de equipe interna
-- ----------------------------------------------------------------------------
-- create_staff_access: cria login para membro da equipe interna
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_staff_access(
  p_email TEXT,
  p_full_name TEXT,
  p_role app_role
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := lower(trim(p_email));
  v_password TEXT;
  v_encrypted_pw TEXT;
  v_chars TEXT := 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  i INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  IF p_role NOT IN ('consultant'::app_role, 'manager'::app_role, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Função inválida para equipe interna';
  END IF;

  IF v_email IS NULL OR v_email = '' OR p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'email e nome são obrigatórios';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
    RAISE EXCEPTION 'Este email já possui conta';
  END IF;

  v_password := '';
  FOR i IN 1..12 LOOP
    v_password := v_password || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  END LOOP;
  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
    v_email, v_encrypted_pw, NOW(),
    jsonb_build_object('full_name', trim(p_full_name), 'must_change_password', true),
    NOW(), NOW()
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) VALUES (
    v_user_id, v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email', v_email, NOW(), NOW(), NOW()
  );

  -- trigger handle_new_user já criou profile + user_roles(client); ajusta o papel
  UPDATE public.user_roles SET role = p_role WHERE user_id = v_user_id;

  UPDATE public.profiles
  SET must_change_password = true, full_name = trim(p_full_name)
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'email', v_email,
    'temporary_password', v_password
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- reset_staff_password: nova senha temporária para membro da equipe
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_staff_password(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  v_email TEXT;
  v_password TEXT;
  v_encrypted_pw TEXT;
  v_chars TEXT := 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$';
  i INT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = p_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  v_password := '';
  FOR i IN 1..12 LOOP
    v_password := v_password || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
  END LOOP;
  v_encrypted_pw := crypt(v_password, gen_salt('bf'));

  UPDATE auth.users
  SET encrypted_password = v_encrypted_pw, updated_at = NOW()
  WHERE id = p_user_id;

  UPDATE public.profiles
  SET must_change_password = true, updated_at = NOW()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'email', v_email,
    'temporary_password', v_password
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_staff_access(TEXT, TEXT, app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_staff_password(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_staff_access(TEXT, TEXT, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_staff_password(UUID) TO authenticated;


-- ============================================================================
-- 6) Checklist de planejamento (interno)
-- ============================================================================

-- 6.1 Templates reutilizáveis
CREATE TABLE IF NOT EXISTS public.checklist_templates (
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
DROP POLICY IF EXISTS "Staff manage checklist templates" ON public.checklist_templates;
CREATE POLICY "Staff manage checklist templates" ON public.checklist_templates
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- 6.2 Itens padrão de cada template
CREATE TABLE IF NOT EXISTS public.checklist_template_items (
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
DROP POLICY IF EXISTS "Staff manage checklist template items" ON public.checklist_template_items;
CREATE POLICY "Staff manage checklist template items" ON public.checklist_template_items
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_checklist_template_items_template ON public.checklist_template_items(template_id);

-- 6.3 Tarefas de planejamento por viagem (proposta)
CREATE TABLE IF NOT EXISTS public.planning_tasks (
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
DROP POLICY IF EXISTS "Staff manage planning tasks" ON public.planning_tasks;
CREATE POLICY "Staff manage planning tasks" ON public.planning_tasks
  FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_planning_tasks_proposal ON public.planning_tasks(proposal_id);

-- 6.4 Triggers de updated_at
DROP TRIGGER IF EXISTS update_checklist_templates_updated_at ON public.checklist_templates;
CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON public.checklist_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_checklist_template_items_updated_at ON public.checklist_template_items;
CREATE TRIGGER update_checklist_template_items_updated_at BEFORE UPDATE ON public.checklist_template_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_planning_tasks_updated_at ON public.planning_tasks;
CREATE TRIGGER update_planning_tasks_updated_at BEFORE UPDATE ON public.planning_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 7) RPCs de staff (leitura e gravação) — CORRIGE "Erro ao salvar roteiro"
-- ----------------------------------------------------------------------------
-- Toda gravação de proposta/roteiro/dossiê/documentos passa por estes RPCs.
-- Sem eles, salvar o roteiro falha com "function not found".
-- ============================================================================

-- 7.1 Helpers
CREATE OR REPLACE FUNCTION public.is_request_client(_request_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.travel_requests tr
    WHERE tr.id = _request_id AND tr.client_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.has_shared_proposal_for_request(_request_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.request_id = _request_id
      AND p.share_token IS NOT NULL
      AND COALESCE(p.share_enabled, true) = true
  );
$$;

CREATE OR REPLACE FUNCTION public.proposal_is_shared(_proposal_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.id = _proposal_id
      AND p.share_token IS NOT NULL
      AND COALESCE(p.share_enabled, true) = true
  );
$$;

-- 7.2 RPCs de leitura
CREATE OR REPLACE FUNCTION public.staff_list_travel_requests()
RETURNS SETOF public.travel_requests
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.travel_requests
  WHERE public.is_staff(auth.uid())
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.staff_get_travel_request(p_id uuid)
RETURNS SETOF public.travel_requests
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.travel_requests
  WHERE id = p_id AND public.is_staff(auth.uid())
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.staff_get_proposal_by_request(p_request_id uuid)
RETURNS SETOF public.proposals
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.proposals
  WHERE request_id = p_request_id AND public.is_staff(auth.uid())
  ORDER BY created_at DESC
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.staff_list_proposal_request_ids()
RETURNS TABLE(request_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT ON (p.request_id) p.request_id
  FROM public.proposals p
  WHERE public.is_staff(auth.uid())
  ORDER BY p.request_id, p.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.staff_list_travel_documents(p_proposal_id uuid)
RETURNS SETOF public.travel_documents
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.travel_documents
  WHERE proposal_id = p_proposal_id AND public.is_staff(auth.uid())
  ORDER BY created_at DESC;
$$;

-- 7.3 RPCs de gravação
CREATE OR REPLACE FUNCTION public.staff_update_travel_request_status(
  p_id uuid,
  p_status public.request_status
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.travel_requests
  SET status = p_status, updated_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_update_proposal_itinerary(
  p_proposal_id uuid,
  p_itinerary jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.proposals
  SET itinerary = p_itinerary, updated_at = now()
  WHERE id = p_proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_update_proposal_dossier(
  p_proposal_id uuid,
  p_dossier jsonb
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.proposals
  SET dossier = p_dossier, updated_at = now()
  WHERE id = p_proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_update_proposal_share_token(
  p_proposal_id uuid,
  p_share_token text
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.proposals
  SET share_token = p_share_token, updated_at = now()
  WHERE id = p_proposal_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_insert_travel_document(
  p_proposal_id uuid,
  p_request_id uuid,
  p_title text,
  p_category text DEFAULT 'other',
  p_document_type text DEFAULT 'vault',
  p_status text DEFAULT 'pending',
  p_file_url text DEFAULT NULL,
  p_file_path text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_visible_in_public boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  INSERT INTO public.travel_documents (
    proposal_id, request_id, title, category, document_type, status,
    file_url, file_path, notes, visible_in_public, uploaded_by
  ) VALUES (
    p_proposal_id, p_request_id, p_title, p_category, p_document_type, p_status,
    p_file_url, p_file_path, p_notes, p_visible_in_public, auth.uid()
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_update_travel_document(
  p_id uuid,
  p_status text DEFAULT NULL,
  p_visible_in_public boolean DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.travel_documents
  SET
    status = COALESCE(p_status, status),
    visible_in_public = COALESCE(p_visible_in_public, visible_in_public),
    notes = COALESCE(p_notes, notes),
    updated_at = now()
  WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_delete_travel_document(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.travel_documents WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_delete_proposal(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  SELECT request_id INTO v_request_id FROM public.proposals WHERE id = p_proposal_id;
  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'proposal not found';
  END IF;
  DELETE FROM public.travel_documents WHERE proposal_id = p_proposal_id;
  DELETE FROM public.proposals WHERE id = p_proposal_id;
  UPDATE public.travel_requests
  SET status = 'in_analysis', updated_at = now()
  WHERE id = v_request_id
    AND status NOT IN ('completed', 'cancelled');
END;
$$;

CREATE OR REPLACE FUNCTION public.staff_delete_travel_request(p_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.travel_documents WHERE request_id = p_id;
  DELETE FROM public.travel_documents
  WHERE proposal_id IN (SELECT id FROM public.proposals WHERE request_id = p_id);
  DELETE FROM public.proposals WHERE request_id = p_id;
  DELETE FROM public.travel_requests WHERE id = p_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_approve_proposal(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  SELECT request_id INTO v_request_id FROM public.proposals WHERE id = p_proposal_id;
  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'proposal not found';
  END IF;
  IF NOT public.is_request_client(v_request_id, auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  UPDATE public.proposals
  SET is_approved = true, updated_at = now()
  WHERE id = p_proposal_id;
  UPDATE public.travel_requests
  SET status = 'approved', updated_at = now()
  WHERE id = v_request_id;
END;
$$;

-- 7.4 Grants
REVOKE ALL ON FUNCTION public.staff_update_proposal_itinerary(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_proposal_dossier(uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_proposal_share_token(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.staff_list_travel_requests() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_get_travel_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_get_proposal_by_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_list_proposal_request_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_list_travel_documents(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_travel_request_status(uuid, public.request_status) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_itinerary(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_dossier(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_proposal_share_token(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_insert_travel_document(uuid, uuid, text, text, text, text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_travel_document(uuid, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_travel_document(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_proposal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_travel_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.client_approve_proposal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_request_client(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_shared_proposal_for_request(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.proposal_is_shared(uuid) TO anon, authenticated;


-- ============================================================================
-- FIM. Se aparecer erro em ALTER TYPE ... ADD VALUE 'other' dizendo que o valor
-- já existe, pode ignorar — o IF NOT EXISTS já trata. Rode o restante normalmente.
-- ============================================================================
