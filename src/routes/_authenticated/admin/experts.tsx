import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";

export const Route = createFileRoute("/_authenticated/admin/experts")({ component: Page });

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
    </div>
  );
}
