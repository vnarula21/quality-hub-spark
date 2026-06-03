import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/experts")({ component: Page });

function monthDateStr(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), 1);
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-01`;
}

function Page() {
  const { data } = useQuery({
    queryKey: ["admin-experts"],
    queryFn: async () => (await supabase.from("experts").select("*,profiles!experts_profile_id_fkey(full_name,email,employee_code)")).data ?? [],
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Experts" description="Quality experts." />
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3 text-left">Name</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Code</th><th className="px-4 py-3 text-left">Specialization</th><th className="px-4 py-3 text-left">Hire date</th></tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((e: any) => (
              <tr key={e.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium">{e.profiles?.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.profiles?.email}</td>
                <td className="px-4 py-3">{e.profiles?.employee_code}</td>
                <td className="px-4 py-3">{e.specialization}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.hire_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <QuotaSection experts={data ?? []} />
    </div>
  );
}

function QuotaSection({ experts }: { experts: any[] }) {
  const qc = useQueryClient();
  const monthStr = monthDateStr(new Date());
  const monthLabel = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const { data: quotas } = useQuery({
    queryKey: ["expert-quotas", monthStr],
    queryFn: async () => (await supabase.from("expert_audit_quotas").select("expert_id,quota").eq("month", monthStr)).data ?? [],
  });
  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b bg-secondary/40 px-4 py-3">
        <div className="text-sm font-semibold">Audit Quotas — {monthLabel}</div>
        <div className="text-xs text-muted-foreground">Set the number of audits each expert should publish this month.</div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
          <tr><th className="px-4 py-3 text-left">Expert</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Quota</th><th className="px-4 py-3"></th></tr>
        </thead>
        <tbody className="divide-y">
          {experts.map((e: any) => {
            const current = quotas?.find((q: any) => q.expert_id === e.id)?.quota ?? 0;
            return <QuotaRow key={e.id} expert={e} monthStr={monthStr} current={Number(current)} onSaved={() => qc.invalidateQueries({ queryKey: ["expert-quotas", monthStr] })} />;
          })}
          {experts.length === 0 && <tr><td className="px-4 py-6 text-center text-xs text-muted-foreground" colSpan={4}>No experts yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function QuotaRow({ expert, monthStr, current, onSaved }: { expert: any; monthStr: string; current: number; onSaved: () => void }) {
  const [value, setValue] = useState<string>(String(current));
  const [saving, setSaving] = useState(false);
  useEffect(() => { setValue(String(current)); }, [current]);
  const dirty = Number(value) !== current;
  async function save() {
    const n = Math.max(0, Math.floor(Number(value) || 0));
    setSaving(true);
    const { error } = await supabase.from("expert_audit_quotas").upsert({ expert_id: expert.id, month: monthStr, quota: n }, { onConflict: "expert_id,month" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Quota saved");
    onSaved();
  }
  return (
    <tr className="hover:bg-secondary/40">
      <td className="px-4 py-3 font-medium">{expert.profiles?.full_name}</td>
      <td className="px-4 py-3 text-muted-foreground">{expert.profiles?.email}</td>
      <td className="px-4 py-3">
        <input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-1 text-sm" />
      </td>
      <td className="px-4 py-3 text-right">
        <button onClick={save} disabled={!dirty || saving} className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
      </td>
    </tr>
  );
}
