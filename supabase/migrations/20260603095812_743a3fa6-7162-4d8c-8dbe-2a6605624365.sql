
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'expert', 'coach');
CREATE TYPE public.user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE public.audit_status AS ENUM ('scheduled', 'in_progress', 'pending_review', 'published', 'challenged', 'closed');
CREATE TYPE public.rag_status AS ENUM ('red', 'amber', 'green');
CREATE TYPE public.challenge_status AS ENUM ('open', 'under_review', 'resolved', 'rejected');
CREATE TYPE public.objection_status AS ENUM ('open', 'under_review', 'accepted', 'rejected');

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  employee_code TEXT UNIQUE,
  team_id UUID,
  status public.user_status NOT NULL DEFAULT 'active',
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deactivated_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- USER ROLES
-- =========================================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- has_role helper
-- =========================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- =========================================================
-- TEAMS / PROCESSES / FRAMEWORKS
-- =========================================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_team_fk FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE TABLE public.processes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.processes TO authenticated;
GRANT ALL ON public.processes TO service_role;
ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_max_score INT NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_frameworks TO authenticated;
GRANT ALL ON public.audit_frameworks TO service_role;
ALTER TABLE public.audit_frameworks ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- COACHES & EXPERTS
-- =========================================================
CREATE TABLE public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  hire_date DATE,
  specialization TEXT,
  current_rating NUMERIC(3,2) DEFAULT 0,
  current_quality_score NUMERIC(5,2) DEFAULT 0,
  current_rag public.rag_status DEFAULT 'amber',
  current_rank INT,
  cpi NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coaches TO authenticated;
GRANT ALL ON public.coaches TO service_role;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  specialization TEXT,
  hire_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.experts TO authenticated;
GRANT ALL ON public.experts TO service_role;
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- AUDITS
-- =========================================================
CREATE TABLE public.audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  expert_id UUID REFERENCES public.experts(id) ON DELETE SET NULL,
  framework_id UUID REFERENCES public.audit_frameworks(id) ON DELETE SET NULL,
  process_id UUID REFERENCES public.processes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status public.audit_status NOT NULL DEFAULT 'scheduled',
  rag public.rag_status,
  total_score NUMERIC(6,2) DEFAULT 0,
  max_score NUMERIC(6,2) DEFAULT 100,
  scheduled_at TIMESTAMPTZ,
  conducted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  accepted_by_coach BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audits_coach ON public.audits(coach_id);
CREATE INDEX idx_audits_expert ON public.audits(expert_id);
CREATE INDEX idx_audits_status ON public.audits(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audits TO authenticated;
GRANT ALL ON public.audits TO service_role;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  criterion TEXT NOT NULL,
  score NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(6,2) NOT NULL DEFAULT 10,
  weight NUMERIC(5,2) DEFAULT 1,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_scores_audit ON public.audit_scores(audit_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_scores TO authenticated;
GRANT ALL ON public.audit_scores TO service_role;
ALTER TABLE public.audit_scores ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_feedback_audit ON public.audit_feedback(audit_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_feedback TO authenticated;
GRANT ALL ON public.audit_feedback TO service_role;
ALTER TABLE public.audit_feedback ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  from_status public.audit_status,
  to_status public.audit_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_status_history_audit ON public.audit_status_history(audit_id);
GRANT SELECT, INSERT ON public.audit_status_history TO authenticated;
GRANT ALL ON public.audit_status_history TO service_role;
ALTER TABLE public.audit_status_history ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES auth.users(id),
  status public.challenge_status NOT NULL DEFAULT 'open',
  reason TEXT NOT NULL,
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.challenges TO authenticated;
GRANT ALL ON public.challenges TO service_role;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.coach_objections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status public.objection_status NOT NULL DEFAULT 'open',
  response TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_objections TO authenticated;
GRANT ALL ON public.coach_objections TO service_role;
ALTER TABLE public.coach_objections ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PERFORMANCE & RECOGNITION
-- =========================================================
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  rating NUMERIC(3,2) NOT NULL,
  source TEXT DEFAULT 'member',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ratings_coach ON public.ratings(coach_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  content TEXT NOT NULL,
  rating NUMERIC(3,2),
  given_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_testimonials_coach ON public.testimonials(coach_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.success_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  outcomes TEXT,
  achieved_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_success_stories_coach ON public.success_stories(coach_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.success_stories TO authenticated;
GRANT ALL ON public.success_stories TO service_role;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.rag_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  rag public.rag_status NOT NULL,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coach_id, month)
);
CREATE INDEX idx_rag_reports_coach ON public.rag_reports(coach_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rag_reports TO authenticated;
GRANT ALL ON public.rag_reports TO service_role;
ALTER TABLE public.rag_reports ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_achievements_coach ON public.achievements(coach_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- TRIGGERS — updated_at + audit history
-- =========================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'profiles','teams','processes','audit_frameworks','coaches','experts',
    'audits','audit_scores','audit_feedback','challenges','coach_objections'])
  LOOP
    EXECUTE format('CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.log_audit_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_status_history(audit_id, from_status, to_status, changed_by)
    VALUES (NEW.id, NULL, NEW.status, NEW.created_by);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.audit_status_history(audit_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_audit_status_log
AFTER INSERT OR UPDATE OF status ON public.audits
FOR EACH ROW EXECUTE FUNCTION public.log_audit_status_change();

-- =========================================================
-- Handle new user signup
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1))
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'coach');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- profiles
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_self" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_super_admin_all" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- user_roles
CREATE POLICY "user_roles_select_self_or_admin" ON public.user_roles
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
  );
CREATE POLICY "user_roles_super_admin_manage" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- teams / processes / frameworks: read all auth, manage super_admin
CREATE POLICY "teams_select_auth" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "teams_super_admin" ON public.teams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "processes_select_auth" ON public.processes FOR SELECT TO authenticated USING (true);
CREATE POLICY "processes_super_admin" ON public.processes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "frameworks_select_auth" ON public.audit_frameworks FOR SELECT TO authenticated USING (true);
CREATE POLICY "frameworks_super_admin" ON public.audit_frameworks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

-- coaches / experts: readable to all auth (needed for leaderboards), manage by admin/super_admin
CREATE POLICY "coaches_select_auth" ON public.coaches FOR SELECT TO authenticated USING (true);
CREATE POLICY "coaches_admin_manage" ON public.coaches FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "experts_select_auth" ON public.experts FOR SELECT TO authenticated USING (true);
CREATE POLICY "experts_admin_manage" ON public.experts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- audits
CREATE POLICY "audits_select_visibility" ON public.audits FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'super_admin')
  OR EXISTS (SELECT 1 FROM public.experts e WHERE e.id = audits.expert_id AND e.profile_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = audits.coach_id AND c.profile_id = auth.uid())
);
CREATE POLICY "audits_admin_manage" ON public.audits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "audits_expert_update_assigned" ON public.audits FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.experts e WHERE e.id = audits.expert_id AND e.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.experts e WHERE e.id = audits.expert_id AND e.profile_id = auth.uid()));
CREATE POLICY "audits_coach_accept" ON public.audits FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = audits.coach_id AND c.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = audits.coach_id AND c.profile_id = auth.uid()));

-- audit_scores / feedback / history follow audit visibility
CREATE POLICY "audit_scores_select" ON public.audit_scores FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_scores.audit_id AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR EXISTS (SELECT 1 FROM public.experts e WHERE e.id = a.expert_id AND e.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = a.coach_id AND c.profile_id = auth.uid())
  ))
);
CREATE POLICY "audit_scores_admin_manage" ON public.audit_scores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "audit_scores_expert_manage" ON public.audit_scores FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.audits a JOIN public.experts e ON e.id=a.expert_id
                 WHERE a.id = audit_scores.audit_id AND e.profile_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.audits a JOIN public.experts e ON e.id=a.expert_id
                 WHERE a.id = audit_scores.audit_id AND e.profile_id = auth.uid()));

CREATE POLICY "audit_feedback_select" ON public.audit_feedback FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_feedback.audit_id AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR EXISTS (SELECT 1 FROM public.experts e WHERE e.id = a.expert_id AND e.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = a.coach_id AND c.profile_id = auth.uid())
  ))
);
CREATE POLICY "audit_feedback_insert_author" ON public.audit_feedback FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "audit_feedback_admin_manage" ON public.audit_feedback FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "audit_status_history_select" ON public.audit_status_history FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.audits a WHERE a.id = audit_status_history.audit_id AND (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
    OR EXISTS (SELECT 1 FROM public.experts e WHERE e.id = a.expert_id AND e.profile_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = a.coach_id AND c.profile_id = auth.uid())
  ))
);

-- challenges
CREATE POLICY "challenges_select_admin_or_party" ON public.challenges FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  OR raised_by = auth.uid()
);
CREATE POLICY "challenges_insert_admin_expert" ON public.challenges FOR INSERT TO authenticated
  WITH CHECK (
    raised_by = auth.uid()
    AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'expert'))
  );
CREATE POLICY "challenges_admin_manage" ON public.challenges FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- coach_objections
CREATE POLICY "objections_select" ON public.coach_objections FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
  OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = coach_objections.coach_id AND c.profile_id = auth.uid())
);
CREATE POLICY "objections_coach_insert" ON public.coach_objections FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = coach_id AND c.profile_id = auth.uid()));
CREATE POLICY "objections_admin_manage" ON public.coach_objections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- coach-scoped data (ratings, testimonials, success_stories, rag_reports, achievements)
DO $$ DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['ratings','testimonials','success_stories','rag_reports','achievements'])
  LOOP
    EXECUTE format($f$
      CREATE POLICY "%1$s_select" ON public.%1$I FOR SELECT TO authenticated USING (
        public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')
        OR EXISTS (SELECT 1 FROM public.coaches c WHERE c.id = %1$I.coach_id AND c.profile_id = auth.uid())
      );
      CREATE POLICY "%1$s_admin_manage" ON public.%1$I FOR ALL TO authenticated
        USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
        WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
    $f$, t);
  END LOOP;
END $$;

-- notifications: each user sees their own; admin sees all
CREATE POLICY "notifications_select_self" ON public.notifications FOR SELECT TO authenticated USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(),'admin')
  OR public.has_role(auth.uid(),'super_admin')
);
CREATE POLICY "notifications_update_self" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_admin_manage" ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
