import { createFileRoute } from "@tanstack/react-router";
import { runBootstrapSeed } from "@/lib/qip/seed.functions";

export const Route = createFileRoute("/api/public/bootstrap-demo")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await runBootstrapSeed();
          return Response.json(result);
        } catch (e: any) {
          const status = typeof e?.status === "number" ? e.status : 500;
          return Response.json({ error: e?.message ?? "Seed failed" }, { status });
        }
      },
    },
  },
});