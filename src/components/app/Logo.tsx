import { Activity } from "lucide-react";

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-elegant)]">
        <Activity className="h-5 w-5" strokeWidth={2.5} />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-bold tracking-tight">QIP</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Quality Intelligence</div>
        </div>
      )}
    </div>
  );
}
