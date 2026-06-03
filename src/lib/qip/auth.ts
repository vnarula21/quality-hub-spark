import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "./types";
import { highestRole } from "./types";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export interface MeData {
  user: User;
  profile: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
    employee_code: string | null;
    team_id: string | null;
    status: string;
  } | null;
  roles: AppRole[];
  primaryRole: AppRole;
  coachId: string | null;
  expertId: string | null;
}

export function useMe() {
  const { user, loading } = useSession();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["me", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<MeData | null> => {
      if (!user) return null;
      const [{ data: profile }, { data: rolesRows }, { data: coach }, { data: expert }] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", user.id),
          supabase.from("coaches").select("id").eq("profile_id", user.id).maybeSingle(),
          supabase.from("experts").select("id").eq("profile_id", user.id).maybeSingle(),
        ]);
      const roles = (rolesRows?.map((r) => r.role) ?? []) as AppRole[];
      return {
        user,
        profile: profile as MeData["profile"],
        roles,
        primaryRole: highestRole(roles),
        coachId: coach?.id ?? null,
        expertId: expert?.id ?? null,
      };
    },
  });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ["me"] });
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  return { ...query, loading: loading || query.isLoading };
}
