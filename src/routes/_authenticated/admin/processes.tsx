import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/processes")({ component: ProcessesPage });

function ProcessesPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const { data } = useQuery({
    queryKey: ["processes"],
    queryFn: async () => (await supabase.from("processes").select("*").order("name")).data ?? [],
  });
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("processes").insert({ name, description: desc });
    if (error) toast.error(error.message); else { setName(""); setDesc(""); qc.invalidateQueries({ queryKey: ["processes"] }); }
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Processes" description="Business processes audited by quality teams." />
      <div className="surface-card p-5">
        <form className="flex flex-wrap gap-2" onSubmit={add}>
          <Input placeholder="Process name" value={name} onChange={(e) => setName(e.target.value)} required className="max-w-xs" />
          <Input placeholder="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} className="flex-1 min-w-[200px]" />
          <Button type="submit">Add process</Button>
        </form>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((p: any) => (
          <div key={p.id} className="surface-card p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{p.name}</div>
              <Badge variant={p.is_active ? "default" : "outline"}>{p.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{p.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
