-- Gravação de documentos de viagem + exclusão de proposta/demanda (staff).
-- Rode no SQL Editor se salvar documentos ou excluir proposta/demanda falhar.

-- ============================================================
-- Documentos de viagem
-- ============================================================

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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.travel_documents WHERE id = p_id;
END;
$$;

-- ============================================================
-- Excluir proposta (+ documentos) e resetar demanda
-- ============================================================

CREATE OR REPLACE FUNCTION public.staff_delete_proposal(p_proposal_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT request_id INTO v_request_id
  FROM public.proposals
  WHERE id = p_proposal_id;

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

-- ============================================================
-- Excluir demanda inteira (propostas, documentos, demanda)
-- ============================================================

CREATE OR REPLACE FUNCTION public.staff_delete_travel_request(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  DELETE FROM public.travel_documents
  WHERE request_id = p_id;

  DELETE FROM public.travel_documents
  WHERE proposal_id IN (SELECT id FROM public.proposals WHERE request_id = p_id);

  DELETE FROM public.proposals WHERE request_id = p_id;
  DELETE FROM public.travel_requests WHERE id = p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_insert_travel_document(uuid, uuid, text, text, text, text, text, text, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_update_travel_document(uuid, text, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_delete_travel_document(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_delete_proposal(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.staff_delete_travel_request(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.staff_insert_travel_document(uuid, uuid, text, text, text, text, text, text, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_update_travel_document(uuid, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_travel_document(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_proposal(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_travel_request(uuid) TO authenticated;
