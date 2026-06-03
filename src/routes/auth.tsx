import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/qip/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — QIP" }] }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useSession();
  useEffect(() => {
    if (!loading && user) nav({ to: "/dashboard", replace: true });
  }, [user, loading, nav]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[image:var(--gradient-primary)] p-12 lg:flex lg:flex-col lg:justify-between text-primary-foreground">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-lg">QIP</div>
            <div className="text-xs opacity-80 uppercase tracking-wider">Quality Intelligence</div>
          </div>
        </div>
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            The single source of truth for coach quality.
          </h1>
          <p className="text-base opacity-90 max-w-md">
            Govern performance, recognition and audits across your healthcare coaching organization — in one enterprise platform.
          </p>
          <div className="grid grid-cols-3 gap-3 max-w-md pt-4">
            {[
              ["Audits", "Governance"],
              ["RAG", "Visibility"],
              ["CPI", "Performance"],
            ].map(([t, s]) => (
              <div key={t} className="rounded-xl bg-white/10 backdrop-blur p-3">
                <div className="text-2xl font-bold">{t}</div>
                <div className="text-[10px] uppercase tracking-wider opacity-80">{s}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs opacity-70">© {new Date().getFullYear()} QIP. Enterprise grade.</div>
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      </aside>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-bold">QIP</span>
          </div>
          <h2 className="text-2xl font-bold">Welcome back</h2>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to access your performance hub.</p>
          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin" className="mt-4">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}

function SignInForm() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) return toast.error(error.message);
        toast.success("Signed in");
        nav({ to: "/dashboard" });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@org.com" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
        </div>
        <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        setBusy(false);
        if (error) return toast.error(error.message);
        toast.success("Account created");
        nav({ to: "/dashboard" });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email2">Work email</Label>
        <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password2">Password</Label>
        <Input id="password2" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <p className="text-xs text-muted-foreground">Min 8 characters. New accounts start with the Coach role — a Super Admin can re-assign.</p>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
      </Button>
    </form>
  );
}
