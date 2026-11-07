# tab. cafe

React 19 and TanStack Start website, using Vite, TypeScript, and Tailwind CSS.
The application renders on the server and hydrates in the browser. Routes live
in `src/routes`, cafe sections in `src/components/tab`, and shared controls in
`src/components/ui`.

## Run on localhost

Install Node.js 22.12 or newer (Node.js 24 LTS recommended), including npm.
From PowerShell:

```powershell
cd "D:\Development Workspace\tab-cafe\tab-experience-portal"
npm ci
npm run dev
```

Open http://localhost:8081. Stop the server with Ctrl+C. Port 8081 must be
available; Vite reports an error instead of silently choosing another port.
To use another port, run `npm run dev -- --port 8083`.

The café landing page needs no database or credentials. The `/order` checkout
uses the separate sandbox backend on port 8080; see `backend/README.md`.
Start the backend with `npm start` from `backend/`, then open
http://localhost:8081/order to choose items, review the total and continue to
Safepay's sandbox checkout. Backend credentials stay server-side.
No Netlify CLI is needed for development.
Google Fonts and the OpenStreetMap embed require an internet connection.
For future environment values, use `.env.local` (ignored by Git). Only public
values may use the `VITE_` prefix; keep secrets in server-only modules.

## Checks and deployment

```powershell
npm run typecheck
npm run build
npm run preview
```

The existing Netlify plugin and `netlify.toml` provide the production hosting
integration. `npm run preview` serves the build locally; it requires a successful
build first. `npm run lint` runs the repository's ESLint and formatting rules.
Do not edit `src/routeTree.gen.ts` manually; the router generates it.

If PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm`.
