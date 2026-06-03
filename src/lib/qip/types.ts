export type AppRole = "super_admin" | "admin" | "expert" | "coach";

export const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Quality Manager",
  expert: "Auditor",
  coach: "Coach",
};

export function highestRole(roles: AppRole[]): AppRole {
  const order: AppRole[] = ["super_admin", "admin", "expert", "coach"];
  return order.find((r) => roles.includes(r)) ?? "coach";
}
