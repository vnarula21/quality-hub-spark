import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  delta?: string;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "destructive";
}) {
  const tones = {
    default: "from-muted/40 to-card",
    primary: "from-primary/10 to-card",
    success: "from-success/15 to-card",
    warning: "from-warning/15 to-card",
    destructive: "from-destructive/10 to-card",
  } as const;
  return (
    <div className={cn("kpi-card group bg-gradient-to-br hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]", tones[tone])}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        {Icon && (
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
      {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
    </div>
  );
}
