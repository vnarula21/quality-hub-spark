import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { RagBadge } from "@/components/app/RagBadge";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, MessageSquare, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { transcribeUpload, transcribeUrl } from "@/lib/qip/transcribe.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assigned-audits")({ component: AssignedAudits });

function AssignedAudits() {
  return (
    <div className="space-y-6">
      <PageHeader title="Audit" description="Run a call or chat audit." />
      <Tabs defaultValue="call" className="w-full">
        <TabsList>
          <TabsTrigger value="call"><Phone className="mr-2 h-4 w-4" />Call</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
        </TabsList>
        <TabsContent value="call" className="mt-4">
          <CallAuditPanel />
        </TabsContent>
        <TabsContent value="chat" className="mt-4">
          <ChatAuditPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CallAuditPanel() {
  const runUpload = useServerFn(transcribeUpload);
  const runUrl = useServerFn(transcribeUrl);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ text: string; language?: string; duration?: number } | null>(null);

  async function handleTranscribe() {
    if (!file && !url.trim()) {
      toast.error("Provide a source URL or upload an audio file");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      let res;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        if (language) fd.append("language", language);
        res = await runUpload({ data: fd });
      } else {
        res = await runUrl({ data: { url: url.trim(), language: language || undefined } });
      }
      setResult(res);
      toast.success("Transcription complete");
    } catch (e: any) {
      toast.error(e?.message ?? "Transcription failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-card p-5 space-y-5">
      <div>
        <div className="text-sm font-semibold">Call audit</div>
        <div className="text-xs text-muted-foreground">Upload a call recording or paste a public link, then transcribe.</div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="audio-url">Source link</Label>
          <Input id="audio-url" placeholder="https://…/recording.mp3" value={url} onChange={(e) => setUrl(e.target.value)} disabled={!!file} />
          <p className="text-[11px] text-muted-foreground">Publicly accessible audio URL (wav, mp3, m4a, flac, ogg). Max 25 MB.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="audio-file">Upload file</Label>
          <Input id="audio-file" type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={!!url.trim()} />
          {file && <p className="text-[11px] text-muted-foreground">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="lang">Language (optional)</Label>
          <Input id="lang" className="w-36" placeholder="auto" value={language} onChange={(e) => setLanguage(e.target.value)} />
        </div>
        <Button onClick={handleTranscribe} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Transcribing…</> : <><Upload className="mr-2 h-4 w-4" />Transcribe</>}
        </Button>
      </div>
      {result && (
        <div className="rounded-lg border bg-secondary/30 p-4">
          <div className="mb-2 text-xs text-muted-foreground">
            Detected: {result.language ?? "—"}{result.duration ? ` • ${result.duration.toFixed(1)}s` : ""}
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{result.text}</div>
        </div>
      )}
    </div>
  );
}

function ChatAuditPanel() {
  const { data: me } = useMe();
  const expertId = me?.expertId;
  const { data } = useQuery({
    queryKey: ["assigned", expertId],
    enabled: !!expertId,
    queryFn: async () => {
      const { data } = await supabase
        .from("audits")
        .select("*,coaches!audits_coach_id_fkey(profiles!coaches_profile_id_fkey(full_name))")
        .eq("expert_id", expertId!)
        .neq("status", "published")
        .order("scheduled_at", { ascending: true });
      return data ?? [];
    },
  });
  return <AuditTable rows={data ?? []} />;
}

export function AuditTable({ rows }: { rows: any[] }) {
  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Coach</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">RAG</th>
            <th className="px-4 py-3 text-left">Score</th>
            <th className="px-4 py-3 text-left">Scheduled</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((a: any) => (
            <tr key={a.id} className="hover:bg-secondary/40">
              <td className="px-4 py-3 font-medium">{a.title}</td>
              <td className="px-4 py-3">{a.coaches?.profiles?.full_name ?? "—"}</td>
              <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{a.status.replace(/_/g, " ")}</Badge></td>
              <td className="px-4 py-3"><RagBadge rag={a.rag} /></td>
              <td className="px-4 py-3">{Number(a.total_score ?? 0).toFixed(0)}/{a.max_score}</td>
              <td className="px-4 py-3 text-muted-foreground">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>No audits.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
