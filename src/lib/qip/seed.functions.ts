import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export { DEMO_CREDENTIALS } from "./seed.shared";

async function ensureSuperAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("super_admin")) {
    throw new Error("Forbidden: super admin only");
  }
}

export const promoteSelfToSuperAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "super_admin");
    if ((count ?? 0) > 0) {
      await ensureSuperAdmin(supabase, userId);
    }
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id,role" });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "coach");
    return { ok: true };
  });

export const resetAndSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await ensureSuperAdmin(supabase, userId);
    const { runFullSeed } = await import("./seed.server");
    return runFullSeed(userId);
  });

export const wipeData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await ensureSuperAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tables = [
      "audit_status_history","audit_scores","audit_feedback","challenges","coach_objections",
      "audits","ratings","testimonials","success_stories","rag_reports","achievements",
      "notifications","coaches","experts","audit_frameworks","processes","teams"
    ] as const;
    for (const t of tables) {
      await (supabaseAdmin as any).from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    }
    return { ok: true };
  });
