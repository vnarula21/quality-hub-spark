import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CreateUserInput = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["super_admin", "admin", "expert", "coach"]),
  phone: z.string().optional().nullable(),
  assigned_expert_id: z.string().uuid().optional().nullable(),
});

function generateTempPassword() {
  // Not shown to anyone but the creator, one time - just needs to satisfy
  // Supabase's default password policy.
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let out = "";
  for (let i = 0; i < 14; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateUserInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Only super_admin can create users.
    const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (roleRows ?? []).map((r) => r.role);
    if (!roles.includes("super_admin")) {
      throw new Error("Only Super Admin can create users.");
    }

    const tempPassword = generateTempPassword();
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message ?? "Could not create the user.");
    }
    const newUserId = created.user.id;

    // The handle_new_user trigger already created a profiles row and a
    // default 'coach' user_roles row. Set the role the admin actually chose.
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({ user_id: newUserId, role: data.role });
    if (roleErr) throw new Error(roleErr.message);

    if (data.phone) {
      await supabaseAdmin.from("profiles").update({ phone: data.phone }).eq("id", newUserId);
    }

    // Coaches/experts need a matching row in their respective tables for the
    // rest of the app (dashboards, coach-assignment, audits) to work at all.
    if (data.role === "coach") {
      const { error } = await supabaseAdmin
        .from("coaches")
        .insert({ profile_id: newUserId, assigned_expert_id: data.assigned_expert_id ?? null });
      if (error) throw new Error(`User created, but failed to create coach record: ${error.message}`);
    } else if (data.role === "expert") {
      const { error } = await supabaseAdmin.from("experts").insert({ profile_id: newUserId });
      if (error) throw new Error(`User created, but failed to create expert record: ${error.message}`);
    }

    return { id: newUserId, email: data.email, temp_password: tempPassword };
  });
