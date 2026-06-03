I found the immediate app-wide failure in the dev-server logs:

```text
Error: Conflicting configuration paths were found for the following routes: "/", "/".
Conflicting files:
 /src/routes/_authenticated/route.tsx
 /src/routes/index.tsx
```

This route-generation crash explains the blank/runtime error across all role homepages because the client entry fails to load after login.

Plan:

1. Fix the authenticated layout route conflict
   - Replace the folder `src/routes/_authenticated/route.tsx` layout with the TanStack-safe pathless layout file shape.
   - Keep the same auth gate, loading screen, `AppShell`, and `<Outlet />` behavior.
   - Do not manually edit `src/routeTree.gen.ts`; let the router plugin regenerate it.

2. Harden role homepage loading for all roles
   - Update the dashboard switch to wait for `useMe()` loading, not just `data`.
   - Add a safe fallback if a user has no role/profile yet instead of rendering blank.
   - Ensure `coach`, `expert`, `admin`, and `super_admin` dashboard branches all render from the same stable `me` object.

3. Remove duplicate auth data fetching inside the shell where possible
   - Pass the already-loaded `me` from the authenticated layout into `AppShell` to avoid multiple `useMe()` calls racing during role resolution.
   - This reduces blank flashes and inconsistent state after login/sign-out.

4. Verify once for the shared failure path
   - Restart/check the dev server logs to confirm the route conflict is gone.
   - Confirm the `/dashboard` route can load without the dynamic client-entry runtime error, which covers every role homepage because they share the same authenticated layout and dashboard switch.