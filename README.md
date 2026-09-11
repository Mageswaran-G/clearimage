# ClearImage

ClearImage is a free image inspection and cleanup web app. A user uploads a
photo, sees what's inside it (metadata, provenance), and can clean it up
before exporting it back out.

## Workflow

```
Landing → Upload → Inspect / Analysis → Provenance → Cleanup → Export
```

Each step after Upload operates on one image, identified by an `id` in the
URL:

| Route              | Step               |
| ------------------ | ------------------ |
| `/`                | Landing            |
| `/upload`          | Upload             |
| `/inspect/[id]`    | Inspect / Analysis |
| `/provenance/[id]` | Provenance         |
| `/cleanup/[id]`    | Cleanup            |
| `/export/[id]`     | Export / Download  |

## Tech stack

- **Next.js** (App Router) + **TypeScript** — frontend and backend in one project
- **Tailwind CSS v4** — styling, configured with the approved design tokens
- **Sharp** — image processing (added when upload/analysis is implemented)
- **Vitest** + **React Testing Library** — unit/component tests
- **Playwright** — end-to-end browser tests (desktop + mobile viewports)
- **ESLint** + **Prettier** — linting and formatting
- No database in this version. No authentication in this version.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command                | What it does                             |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the dev server                     |
| `npm run build`        | Production build                         |
| `npm run start`        | Run the production build                 |
| `npm run lint`         | Lint the codebase                        |
| `npm run typecheck`    | Check TypeScript types (no build output) |
| `npm run format`       | Format the codebase with Prettier        |
| `npm run format:check` | Check formatting without writing changes |
| `npm run test`         | Run unit/component tests once            |
| `npm run test:watch`   | Run unit/component tests in watch mode   |
| `npm run test:e2e`     | Run Playwright end-to-end tests          |

## Project structure

```
src/
  app/                    Routes (App Router)
    page.tsx              Landing
    upload/                Upload
    inspect/[id]/          Inspect / Analysis
    provenance/[id]/       Provenance
    cleanup/[id]/          Cleanup
    export/[id]/           Export / Download
  components/
    layout/                Header, page container
    ui/                    Buttons, labels, indicators, image frame, etc.
  lib/
    design-tokens.ts       Approved colors/fonts as typed JS constants
    workflow.ts             The five-step workflow, in order
e2e/                       Playwright tests
```

## Design system

Colors and fonts are approved and defined in one place:

- CSS variables + Tailwind theme: `src/app/globals.css`
- JS/TS constants (for canvas, charts, etc.): `src/lib/design-tokens.ts`

Do not change these values without design approval. See
`src/lib/design-tokens.ts` for the full palette and font roles:

- `font-sans` (Public Sans) — body text
- `font-display` (Manrope) — headings, logo
- `font-mono` (IBM Plex Mono) — technical/metadata labels

## Status

This is the **Phase 0 project foundation**: routing, design tokens, shared
components, and tooling only. Upload, analysis, provenance detection, and
cleanup are not implemented yet — later phases build on this foundation one
at a time.
