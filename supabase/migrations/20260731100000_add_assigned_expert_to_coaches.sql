-- One coach is assigned to exactly one expert (auditor) at a time. Admins
-- manage this from the Coaches admin page; experts then only see their
-- assigned coaches in the "Audit with AI" coach picker.
ALTER TABLE public.coaches
  ADD COLUMN assigned_expert_id uuid REFERENCES public.experts(id) ON DELETE SET NULL;

CREATE INDEX idx_coaches_assigned_expert ON public.coaches(assigned_expert_id);
