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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, MessageSquare, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { transcribeUpload, transcribeUrl, saveTranscript } from "@/lib/qip/transcribe.functions";
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
  const runSave = useServerFn(saveTranscript);
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savedExpiresAt, setSavedExpiresAt] = useState<string | null>(null);
  const [lastSource, setLastSource] = useState<{ type: "url" | "upload"; url?: string; file_name?: string } | null>(null);
  const [swapSpeakers, setSwapSpeakers] = useState(false);
  const turns: Array<{ speaker: "COACH" | "PLAYER"; text: string }> = Array.isArray(result?.turns) ? result.turns : [];

  async function handleTranscribe() {
    if (!file && !url.trim()) {
      toast.error("Provide a source URL or upload an audio file");
      return;
    }
    setLoading(true);
    setResult(null);
      setSavedId(null);
      setSavedExpiresAt(null);
    try {
      let res;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        res = await runUpload({ data: fd });
          setLastSource({ type: "upload", file_name: file.name });
      } else {
        res = await runUrl({ data: { url: url.trim() } });
          setLastSource({ type: "url", url: url.trim() });
      }
      console.log("transcribe result", res);
      setResult(res);
      toast.success("Transcription complete");
    } catch (e: any) {
      console.error("transcribe error", e);
      toast.error(e?.message ?? "Transcription failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!result?.text || !lastSource) return;
    setSaving(true);
    try {
      const saved = await runSave({
        data: {
          transcript: result.text,
          language: result.language ?? null,
          duration: typeof result.duration === "number" ? result.duration : null,
          segments: result.turns ?? null,
          raw: result._raw ?? null,
          source_type: lastSource.type,
          source_url: lastSource.url ?? null,
          file_name: lastSource.file_name ?? null,
        },
      });
      setSavedId(saved.id);
      setSavedExpiresAt(saved.expires_at);
      toast.success(`Saved — expires ${new Date(saved.expires_at).toLocaleDateString()}`);
    } catch (e: any) {
      console.error("save transcript error", e);
      toast.error(e?.message ?? "Could not save transcript");
    } finally {
      setSaving(false);
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
          <Select value={language || "auto"} onValueChange={(v) => setLanguage(v === "auto" ? "" : v)}>
            <SelectTrigger id="lang" className="w-40"><SelectValue placeholder="Auto-detect" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto-detect</SelectItem>
              <SelectItem value="en">English (en)</SelectItem>
              <SelectItem value="hi">Hindi (hi)</SelectItem>
              <SelectItem value="bn">Bengali (bn)</SelectItem>
              <SelectItem value="ta">Tamil (ta)</SelectItem>
              <SelectItem value="te">Telugu (te)</SelectItem>
              <SelectItem value="mr">Marathi (mr)</SelectItem>
              <SelectItem value="gu">Gujarati (gu)</SelectItem>
              <SelectItem value="kn">Kannada (kn)</SelectItem>
              <SelectItem value="ml">Malayalam (ml)</SelectItem>
              <SelectItem value="pa">Punjabi (pa)</SelectItem>
              <SelectItem value="ur">Urdu (ur)</SelectItem>
              <SelectItem value="es">Spanish (es)</SelectItem>
              <SelectItem value="fr">French (fr)</SelectItem>
              <SelectItem value="de">German (de)</SelectItem>
              <SelectItem value="ar">Arabic (ar)</SelectItem>
              <SelectItem value="zh">Chinese (zh)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleTranscribe} disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Transcribing…</> : <><Upload className="mr-2 h-4 w-4" />Transcribe</>}
        </Button>
      </div>
      {result && (
        <div className="rounded-lg border bg-secondary/30 p-4 space-y-3">
          <div className="text-xs text-muted-foreground">
            Detected: {result.language ?? "—"}{typeof result.duration === "number" ? ` • ${result.duration.toFixed(1)}s` : ""}
          </div>
          {result.text && result.text.trim().length > 0 ? (
            turns.length >= 1 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">
                    Speaker-labeled by the transcription API. Use Swap if Coach / Player are reversed.
                  </p>
                  <Button variant="ghost" size="sm" onClick={() => setSwapSpeakers((s) => !s)}>
                    Swap Coach / Player
                  </Button>
                </div>
                <div className="space-y-2">
                  {turns.map((t, i) => {
                    const isCoachLabel = t.speaker === "COACH";
                    const isCoach = swapSpeakers ? !isCoachLabel : isCoachLabel;
                    return (
                      <div key={i} className={`flex ${isCoach ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${isCoach ? "bg-background border" : "bg-primary/10 border border-primary/20"}`}>
                          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                            {isCoach ? "Coach" : "Player"}
                          </div>
                          <div className="whitespace-pre-wrap leading-relaxed">{t.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{result.text}</div>
            )
          ) : (
            <div className="text-sm italic text-muted-foreground">Empty transcript returned by the API.</div>
          )}
          {result.text && result.text.trim().length > 0 && (
            <div className="flex items-center gap-3 pt-1">
              <Button onClick={handleSave} disabled={saving || !!savedId} size="sm">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : savedId ? "Saved" : "Save transcript"}
              </Button>
              {savedExpiresAt && (
                <span className="text-[11px] text-muted-foreground">Auto-deletes on {new Date(savedExpiresAt).toLocaleDateString()}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function _formatTimeUnused(sec: number) { return sec; }

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
