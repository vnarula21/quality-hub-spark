import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const DEMO_CREDENTIALS = [
  { role: "super_admin", label: "Super Admin", email: "superadmin@qip.test", password: "Admin123!", fullName: "Sam Super-Admin" },
  { role: "admin", label: "Quality Manager", email: "manager@qip.test", password: "Admin123!", fullName: "Morgan Manager" },
  { role: "expert", label: "Auditor (Expert)", email: "auditor@qip.test", password: "Admin123!", fullName: "Avery Auditor" },
  { role: "coach", label: "Coach", email: "coach@qip.test", password: "Admin123!", fullName: "Casey Coach" },
] as const;

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
      // already a super admin exists; only allow if caller already has it
      await ensureSuperAdmin(supabase, userId);
    }
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "super_admin" }, { onConflict: "user_id,role" });
    // Remove default coach role for the founder
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId).eq("role", "coach");
    return { ok: true };
  });

export const resetAndSeed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as any;
    await ensureSuperAdmin(supabase, userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return runFullSeed(supabaseAdmin, userId);
  });

export async function runBootstrapSeed() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "super_admin");
  if ((count ?? 0) > 0) {
    const err: any = new Error("A Super Admin already exists. Sign in instead.");
    err.status = 403;
    throw err;
  }
  return runFullSeed(supabaseAdmin, null);
}

async function deleteUsersByEmailDomains(admin: any, domains: string[]) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error || !data?.users?.length) break;
    for (const u of data.users) {
      const email = (u.email ?? "").toLowerCase();
      if (email && domains.some((d) => email.endsWith(d))) {
        await admin.auth.admin.deleteUser(u.id);
      }
    }
    if (data.users.length < 200) break;
    page++;
  }
}

async function runFullSeed(supabaseAdmin: any, callerUserId: string | null) {
  // Wipe domain data
  const tables = [
    "audit_status_history", "audit_scores", "audit_feedback", "challenges",
    "coach_objections", "audits", "ratings", "testimonials", "success_stories",
    "rag_reports", "achievements", "notifications", "coaches", "experts",
    "audit_frameworks", "processes", "teams",
  ] as const;
  for (const t of tables) {
    await supabaseAdmin.from(t).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  // Remove existing demo auth users for clean reset
  await deleteUsersByEmailDomains(supabaseAdmin, ["@qip.test", "@qip.demo"]);

  const { data: teams } = await supabaseAdmin.from("teams").insert([
    { name: "Diabetes Care", description: "Diabetes coaching team" },
    { name: "Cardio Wellness", description: "Cardiac rehab + lifestyle" },
    { name: "Mental Wellness", description: "Behavioral health coaches" },
  ]).select();

  const { data: processes } = await supabaseAdmin.from("processes").insert([
    { name: "Member Onboarding", description: "First 30-day journey" },
    { name: "Coach Call Quality", description: "1:1 coaching conversations" },
    { name: "Care Plan Review", description: "Quarterly care plan reviews" },
  ]).select();

  const { data: frameworks } = await supabaseAdmin.from("audit_frameworks").insert([
    { name: "Standard Call Audit v3", description: "Default voice audit", process_id: processes?.[1].id, total_max_score: 100 },
    { name: "Onboarding Quality v2", description: "Onboarding workflow", process_id: processes?.[0].id, total_max_score: 100 },
  ]).select();

  // Named demo accounts with known passwords
  const namedAccounts: Record<string, { id: string }> = {};
  for (const acc of DEMO_CREDENTIALS) {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: { full_name: acc.fullName },
    });
    if (error || !created?.user) {
      throw new Error(`Failed to create ${acc.email}: ${error?.message ?? "unknown"}`);
    }
    const uid = created.user.id;
    await supabaseAdmin.from("profiles").update({ full_name: acc.fullName }).eq("id", uid);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: acc.role });
    namedAccounts[acc.role] = { id: uid };
  }

  const createdBy = callerUserId ?? namedAccounts.super_admin.id;

  // Stub coach/expert auth users so we can FK profiles. These cannot log in.
  const mockCoaches: Array<[string, string, string]> = [
    ["Aanya Sharma", "aanya.sharma@qip.demo", "EMP-C001"],
    ["Rohan Mehta", "rohan.mehta@qip.demo", "EMP-C002"],
    ["Sara Iqbal", "sara.iqbal@qip.demo", "EMP-C003"],
    ["Vikram Patel", "vikram.patel@qip.demo", "EMP-C004"],
    ["Priya Nair", "priya.nair@qip.demo", "EMP-C005"],
    ["Daniel Park", "daniel.park@qip.demo", "EMP-C006"],
    ["Mei Chen", "mei.chen@qip.demo", "EMP-C007"],
  ];
  const mockExperts: Array<[string, string, string]> = [
    ["Dr. Anil Verma", "anil.verma@qip.demo", "EMP-E001"],
    ["Dr. Rachel Stone", "rachel.stone@qip.demo", "EMP-E002"],
  ];

  // Always include the named demo coach + expert as real coach/expert rows.
  await supabaseAdmin.from("profiles").update({ employee_code: "EMP-C000", team_id: teams?.[0].id }).eq("id", namedAccounts.coach.id);
  await supabaseAdmin.from("profiles").update({ employee_code: "EMP-E000" }).eq("id", namedAccounts.expert.id);
  const coachProfiles: Array<{ id: string; name: string }> = [{ id: namedAccounts.coach.id, name: "Casey Coach" }];
  const expertProfiles: Array<{ id: string; name: string }> = [{ id: namedAccounts.expert.id, name: "Avery Auditor" }];

  for (let i = 0; i < mockCoaches.length; i++) {
    const [name, email, code] = mockCoaches[i];
    const { data: au, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: crypto.randomUUID(), email_confirm: true, user_metadata: { full_name: name },
    });
    if (error || !au?.user) continue;
    await supabaseAdmin.from("profiles")
      .update({ full_name: name, employee_code: code, team_id: teams?.[i % teams.length].id })
      .eq("id", au.user.id);
    coachProfiles.push({ id: au.user.id, name });
  }

  for (let i = 0; i < mockExperts.length; i++) {
    const [name, email, code] = mockExperts[i];
    const { data: au, error } = await supabaseAdmin.auth.admin.createUser({
      email, password: crypto.randomUUID(), email_confirm: true, user_metadata: { full_name: name },
    });
    if (error || !au?.user) continue;
    await supabaseAdmin.from("profiles").update({ full_name: name, employee_code: code }).eq("id", au.user.id);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", au.user.id);
    await supabaseAdmin.from("user_roles").insert({ user_id: au.user.id, role: "expert" });
    expertProfiles.push({ id: au.user.id, name });
  }

  const ragOrder = ["green", "green", "amber", "green", "amber", "red", "green", "amber"] as const;
  const coachInserts = coachProfiles.map((c, i) => ({
    profile_id: c.id,
    team_id: teams?.[i % teams.length].id,
    hire_date: new Date(Date.now() - (300 + i * 60) * 86400000).toISOString().slice(0, 10),
    specialization: ["Diabetes", "Cardiac", "Mental Wellness"][i % 3],
    current_rating: Number((3.6 + Math.random() * 1.3).toFixed(2)),
    current_quality_score: Number((72 + Math.random() * 23).toFixed(2)),
    current_rag: ragOrder[i % ragOrder.length],
    current_rank: i + 1,
    cpi: Number((68 + Math.random() * 28).toFixed(2)),
  }));
  const { data: coaches } = await supabaseAdmin.from("coaches").insert(coachInserts).select();

  const expertInserts = expertProfiles.map((e) => ({
    profile_id: e.id, specialization: "Quality Audit", hire_date: "2023-01-15",
  }));
  const { data: experts } = await supabaseAdmin.from("experts").insert(expertInserts).select();

  if (!coaches || !experts) {
    return { ok: true, warning: "partial seed", credentials: DEMO_CREDENTIALS.map((c) => ({ label: c.label, role: c.role, email: c.email, password: c.password })) };
  }

  const ratingRows: any[] = [];
  const ragRows: any[] = [];
  for (const c of coaches) {
    for (let m = 5; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      const month = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
      ratingRows.push({ coach_id: c.id, month, rating: Number((3.4 + Math.random() * 1.5).toFixed(2)) });
      const score = Number((65 + Math.random() * 30).toFixed(2));
      ragRows.push({ coach_id: c.id, month, score, rag: score >= 85 ? "green" : score >= 72 ? "amber" : "red" });
    }
  }
  await supabaseAdmin.from("ratings").insert(ratingRows);
  await supabaseAdmin.from("rag_reports").insert(ragRows);

  const testimonials = coaches.flatMap((c: any, i: number) => [
    { coach_id: c.id, member_name: ["Maya R.", "John D.", "Aisha K."][i % 3], content: "Helped me build a routine I actually stick to. Massive shift in my energy.", rating: 5 },
    { coach_id: c.id, member_name: ["Tomas P.", "Linda B."][i % 2], content: "Compassionate and detail-oriented. My HbA1c dropped 1.4 points in 90 days.", rating: 4.5 },
  ]);
  await supabaseAdmin.from("testimonials").insert(testimonials);

  const stories = coaches.slice(0, 5).map((c: any, i: number) => ({
    coach_id: c.id,
    member_name: ["Maya R.", "John D.", "Aisha K.", "Tomas P.", "Linda B."][i],
    title: ["Reversed pre-diabetes", "Lost 12kg sustainably", "Off BP meds", "Sleep transformation", "Anxiety in remission"][i],
    description: "Sustained behavior change over 6 months with weekly coaching cadence.",
    outcomes: "Clinical markers normalized; member self-reported quality of life +35%.",
  }));
  await supabaseAdmin.from("success_stories").insert(stories);

  const achievements = coaches.slice(0, 6).map((c: any, i: number) => ({
    coach_id: c.id,
    badge_code: ["top-rated", "consistency", "rising-star", "member-favorite", "audit-ace", "century"][i],
    title: ["Top Rated", "Consistency Champ", "Rising Star", "Member Favorite", "Audit Ace", "100 Sessions"][i],
    description: "Earned for sustained performance over the last quarter.",
    icon: ["star", "shield", "rocket", "heart", "award", "medal"][i],
  }));
  await supabaseAdmin.from("achievements").insert(achievements);

  const auditInserts: any[] = [];
  for (const c of coaches) {
    for (let i = 0; i < 3; i++) {
      const status = (["published", "pending_review", "scheduled"] as const)[i];
      const score = Number((68 + Math.random() * 28).toFixed(2));
      auditInserts.push({
        coach_id: c.id,
        expert_id: experts[Math.floor(Math.random() * experts.length)].id,
        framework_id: frameworks?.[0].id,
        process_id: processes?.[1].id,
        title: `Q${4 - i} Call Audit — ${c.id.slice(0, 4)}`,
        status,
        total_score: status === "scheduled" ? 0 : score,
        max_score: 100,
        rag: score >= 85 ? "green" : score >= 72 ? "amber" : "red",
        scheduled_at: new Date(Date.now() - i * 7 * 86400000).toISOString(),
        conducted_at: status !== "scheduled" ? new Date(Date.now() - i * 6 * 86400000).toISOString() : null,
        published_at: status === "published" ? new Date(Date.now() - i * 5 * 86400000).toISOString() : null,
        created_by: createdBy,
      });
    }
  }
  const { data: audits } = await supabaseAdmin.from("audits").insert(auditInserts).select();

  if (audits && audits.length > 4) {
    await supabaseAdmin.from("challenges").insert([{
      audit_id: audits[0].id, raised_by: createdBy, status: "open",
      reason: "Scoring on empathy criterion looks under-weighted.",
    }]);
    await supabaseAdmin.from("coach_objections").insert([{
      audit_id: audits[1].id, coach_id: audits[1].coach_id, status: "open",
      content: "Member context was missing in the audit, I'd like a re-review.",
    }]);
  }

  await supabaseAdmin.from("notifications").insert(
    Object.values(namedAccounts).map((a) => ({
      user_id: a.id, type: "success", title: "Welcome to QIP",
      body: "Demo environment is ready. Explore your role-based dashboard.",
    }))
  );

  return {
    ok: true,
    coaches: coaches.length,
    experts: experts.length,
    credentials: DEMO_CREDENTIALS.map((c) => ({ label: c.label, role: c.role, email: c.email, password: c.password })),
  };
}

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
