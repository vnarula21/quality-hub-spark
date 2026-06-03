import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, TrendingUp, ClipboardCheck, Star, MessageSquare, Trophy,
  Bell, User as UserIcon, ClipboardList, History, BarChart3, Users, Shield,
  KeyRound, Workflow, Layers, Settings, Sparkles, LineChart, FileText,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "./Logo";
import type { AppRole } from "@/lib/qip/types";
import { ROLE_LABEL } from "@/lib/qip/types";
import { cn } from "@/lib/utils";

type Item = { title: string; url: string; icon: any };

const NAV: Record<AppRole, { label: string; items: Item[] }[]> = {
  coach: [
    {
      label: "Workspace",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "My Performance", url: "/my-performance", icon: TrendingUp },
        { title: "My Audits", url: "/my-audits", icon: ClipboardCheck },
        { title: "My Ratings", url: "/my-ratings", icon: Star },
        { title: "My Testimonials", url: "/my-testimonials", icon: MessageSquare },
        { title: "My Success Stories", url: "/my-success-stories", icon: Sparkles },
        { title: "Achievements", url: "/achievements", icon: Trophy },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "Notifications", url: "/notifications", icon: Bell },
        { title: "Profile", url: "/profile", icon: UserIcon },
      ],
    },
  ],
  expert: [
    {
      label: "Audits",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Assigned Audits", url: "/assigned-audits", icon: ClipboardList },
        { title: "Audit History", url: "/audit-history", icon: History },
        { title: "Reports", url: "/reports", icon: BarChart3 },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "Notifications", url: "/notifications", icon: Bell },
        { title: "Profile", url: "/profile", icon: UserIcon },
      ],
    },
  ],
  admin: [
    {
      label: "Operations",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Audits", url: "/admin/audits", icon: ClipboardCheck },
        { title: "Challenges", url: "/admin/challenges", icon: Shield },
        { title: "Coaches", url: "/admin/coaches", icon: Users },
        { title: "Experts", url: "/admin/experts", icon: Users },
      ],
    },
    {
      label: "Insights",
      items: [
        { title: "Reports", url: "/admin/reports", icon: FileText },
        { title: "Analytics", url: "/admin/analytics", icon: LineChart },
      ],
    },
    {
      label: "Account",
      items: [
        { title: "Notifications", url: "/notifications", icon: Bell },
        { title: "Profile", url: "/profile", icon: UserIcon },
      ],
    },
  ],
  super_admin: [
    {
      label: "Platform",
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
        { title: "Users", url: "/admin/users", icon: Users },
        { title: "Roles", url: "/admin/roles", icon: Shield },
        { title: "Permissions", url: "/admin/permissions", icon: KeyRound },
      ],
    },
    {
      label: "Quality Setup",
      items: [
        { title: "Processes", url: "/admin/processes", icon: Workflow },
        { title: "Frameworks", url: "/admin/frameworks", icon: Layers },
      ],
    },
    {
      label: "Insights & Settings",
      items: [
        { title: "Reports", url: "/admin/reports", icon: FileText },
        { title: "System Settings", url: "/admin/settings", icon: Settings },
        { title: "Notifications", url: "/notifications", icon: Bell },
        { title: "Profile", url: "/profile", icon: UserIcon },
      ],
    },
  ],
};

export function AppSidebar({ role, name }: { role: AppRole; name: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const groups = NAV[role];

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <Logo collapsed={collapsed} />
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            {!collapsed && <SidebarGroupLabel>{g.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
                        <Link to={item.url as never} className={cn("flex items-center gap-3", active && "bg-sidebar-accent text-sidebar-primary font-medium")}>
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t">
        {!collapsed ? (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{ROLE_LABEL[role]}</div>
            </div>
          </div>
        ) : (
          <div className="grid h-8 w-8 place-items-center mx-auto rounded-full bg-primary/10 text-primary text-xs font-semibold">
            {name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
