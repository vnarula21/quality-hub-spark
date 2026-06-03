import type { ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Moon, Sun } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppSidebar } from "./AppSidebar";
import { useMe } from "@/lib/qip/auth";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_LABEL } from "@/lib/qip/types";
import { useEffect, useState } from "react";

function useDark() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("qip-theme");
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  return {
    dark,
    toggle: () => {
      const next = !dark;
      setDark(next);
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("qip-theme", next ? "dark" : "light");
    },
  };
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const nav = useNavigate();
  const { dark, toggle } = useDark();
  if (!me) return null;
  const initials = (me.profile?.full_name || me.user.email || "U").slice(0, 2).toUpperCase();

  const signOut = async () => {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar role={me.primaryRole} name={me.profile?.full_name || me.user.email || "User"} />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="hidden text-xs text-muted-foreground sm:block">
                <span className="font-medium text-foreground">Quality Intelligence Platform</span>
                <span className="mx-2 text-border">/</span>
                <span>{ROLE_LABEL[me.primaryRole]}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Notifications" onClick={() => nav({ to: "/notifications" })}>
                <Bell className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full bg-primary/10 text-primary font-semibold">
                    {initials}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel className="font-normal">
                    <div className="text-sm font-semibold">{me.profile?.full_name}</div>
                    <div className="text-xs text-muted-foreground">{me.user.email}</div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => nav({ to: "/profile" })}>Profile</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
