import { cn } from "@/lib/utils";

export function RagBadge({ rag }: { rag: "red" | "amber" | "green" | null | undefined }) {
  if (!rag) return <span className="text-xs text-muted-foreground">—</span>;
  const map = {
    red: "bg-rag-red/15 text-rag-red border-rag-red/30",
    amber: "bg-rag-amber/15 text-rag-amber border-rag-amber/40",
    green: "bg-rag-green/15 text-rag-green border-rag-green/30",
  } as const;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide", map[rag])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", rag === "red" && "bg-rag-red", rag === "amber" && "bg-rag-amber", rag === "green" && "bg-rag-green")} />
      {rag}
    </span>
  );
}
