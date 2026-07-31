import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ClipboardCheck, Bell, User as UserIcon, ClipboardList,
  Users, Shield, FileText, UserCog,
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
        { title: "My Audits", url: "/my-audits", icon: ClipboardCheck },
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
        { title: "Audit", url: "/assigned-audits", icon: ClipboardList },
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
        { title: "Experts", url: "/admin/experts", icon: UserCog },
      ],
    },
    {
      label: "Insights",
      items: [
        { title: "Reports", url: "/admin/reports", icon: FileText },
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
        { title: "Roles & Permissions", url: "/admin/roles", icon: Shield },
        { title: "Coach Assignment", url: "/admin/coach-assignment", icon: UserCog },
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
