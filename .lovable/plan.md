## Export your Lovable project to use with Claude Code

Lovable projects can't be opened directly in Claude Code — but you can export the codebase to GitHub (or download it) and then work on it locally with Claude Code. Here's the path:

### Step 1 — Push your code to GitHub
In the Lovable editor:
1. Bottom-left chat input → **+** menu → **GitHub** → **Connect project**
2. Authorize the Lovable GitHub App
3. Pick the account/org → **Create Repository**

Lovable will push the full codebase and keep it in two-way sync (edits in GitHub sync back to Lovable, and vice versa).

*(Alternative if you don't want GitHub: on a paid workspace, open the Code Editor → **Download codebase** at the bottom of the file tree.)*

### Step 2 — Clone locally and open in Claude Code
```bash
git clone https://github.com/<you>/<repo>.git
cd <repo>
bun install     # or npm install
claude          # start Claude Code in this directory
```

### Step 3 — Set up environment variables locally
Lovable Cloud secrets (Supabase URL/keys, `LOVABLE_API_KEY`, `GOQII_CLIENT_SECRET`, `ASR_API_KEY`, etc.) are **not** in the repo. Create a local `.env` with:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` — copy from the Lovable-generated `.env` (visible in the code editor)
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` — same values, server-side names
- `LOVABLE_API_KEY` — **only works when the app runs on Lovable infrastructure**. For local dev with Claude Code, either:
  - keep AI/transcription features working by deploying via Lovable and testing there, **or**
  - swap the AI SDK provider to a direct Anthropic/OpenAI/Gemini key you own (I can do that swap if you want)
- `GOQII_CLIENT_SECRET`, `ASR_API_KEY` — get these from the third-party services directly

### Step 4 — Run locally
```bash
bun run dev
```
The TanStack Start dev server runs on `http://localhost:3000` (or `:8080`). Your Supabase database is the same one Lovable uses, so data/auth continues to work.

### Things to know
- **Two-way sync stays on** while GitHub is connected — pushes to `main` from Claude Code will appear in the Lovable preview automatically.
- **`LOVABLE_API_KEY` is workspace-scoped** and only authenticates from Lovable-hosted runtimes. AI Gateway calls will 401 locally unless you switch to your own provider key.
- **Auto-generated files** (`src/integrations/supabase/client.ts`, `types.ts`, `.env` Supabase entries, `src/routeTree.gen.ts`) — don't hand-edit; Lovable regenerates them on sync.
- **Database migrations**: continue running them through Lovable (they apply to the shared Supabase project), or use the Supabase CLI pointed at the same project.

### What I can do for you next (once you're back in build mode)
- Rip out `LOVABLE_API_KEY` and replace the AI SDK provider with **Anthropic Claude via your own API key**, so audits/transcription work locally without Lovable infra.
- Add a `README.md` with the local setup steps above committed to the repo.
- Add an `.env.example` listing every variable Claude Code will need.

Tell me which of those (if any) you want done inside Lovable before you export, and I'll switch to build mode and do them.