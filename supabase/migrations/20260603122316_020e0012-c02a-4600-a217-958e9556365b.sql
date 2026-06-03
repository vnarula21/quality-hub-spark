
CREATE TABLE public.expert_audit_quotas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id uuid NOT NULL,
  month date NOT NULL,
  quota integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (expert_id, month)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expert_audit_quotas TO authenticated;
GRANT ALL ON public.expert_audit_quotas TO service_role;

ALTER TABLE public.expert_audit_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY quotas_admin_manage ON public.expert_audit_quotas
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY quotas_expert_select_self ON public.expert_audit_quotas
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.experts e WHERE e.id = expert_audit_quotas.expert_id AND e.profile_id = auth.uid()));

CREATE TRIGGER trg_expert_audit_quotas_updated
  BEFORE UPDATE ON public.expert_audit_quotas
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
