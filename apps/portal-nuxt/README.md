# portal-nuxt

A clickable client-portal sandbox built entirely from the Upmind design system. It has
no API, no authentication, and no scoped business logic: every screen is real
design-system components fed by a typed in-memory mock data layer, so the app exists to
exercise the component library and rehearse a client-portal information architecture,
not to run a live portal.

The app is a Nuxt 4 SPA (the same scaffold `apps/cart-nuxt` uses, Tailwind v4 via
`@tailwindcss/vite`). Design-system components come from the `design-system` git
submodule, not a copy in this app.

## Prerequisites

- Install workspace dependencies from the repo root: `pnpm install`.
- The `design-system` git submodule must be checked out
  (`git submodule update --init --recursive`) — the app imports components and styles
  directly from `design-system/packages/ui/src` via workspace aliases.
- `@upmind/tokens` needs its `dist/` build before first run; the `predev` script below
  handles this automatically.

## Scripts

Run from `apps/portal-nuxt` (or `pnpm -C apps/portal-nuxt <script>` from the repo root):

| Script              | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `predev`            | Builds `@upmind/tokens` (runs automatically before `dev`)       |
| `dev`               | Starts the Nuxt dev server                                      |
| `dev:hostgrid`      | Same, pinned to the `hostgrid` shape on a fixed port            |
| `build-only`        | Production build (`nuxt build`)                                 |
| `build:prod`        | Type-checks, then runs `build-only`                             |
| `type-check`        | `nuxt typecheck` — also runs the type-only conformance tests    |
| `preview`           | Preview the production build                                    |
| `test`              | Runs the vitest suite (`tests/vitest.config.ts`)                |
| `lint` / `lint:fix` | Workspace ESLint                                                |
| `format`            | Prettier, repo-wide config                                      |
| `reset`             | Removes build/cache output (`node_modules`, `.nuxt`, `.output`) |

## Routes

Every screen renders inside one shared shell (sidebar nav, header, settings dialog).
Which brand and which dataset are active is a runtime choice (settings dialog, or
`?config=`/`NUXT_PUBLIC_PORTAL_CONFIG` and localStorage) — see "Two datasets" below.

- **Dashboard** — `/`.
- **Products** — a single generic group at `/products` (catalogue, an order flow at
  `/products/order`, and a product detail page with per-area sub-routes: setup,
  billing, settings). Product routes are not individual page files: a catch-all page
  (`app/pages/[...slug].vue`) resolves any path against the active brand's configured
  product groups and custom pages (`app/portal/routes.ts`).
- **Billing** — `/billing` (dashboard), `/billing/invoices[/[id]][/print]`,
  `/billing/credit-notes[/[id]][/print]`, `/billing/orders[/[id]]`,
  `/billing/payment-methods`, `/billing/credit`, `/billing/credit-statements/[id]/print`,
  `/billing/settings`.
- **Support** — `/support`, `/support/tickets[/[id]]`, `/support/tickets/new`.
- **Account** — `/account`, `/account/profile`, `/account/security`, `/account/notes`,
  `/account/notifications`, `/account/delegates[/[id]]`,
  `/account/child-accounts[/[id]]`, `/account/logs[/emails/[id]]`, `/account/affiliate`.
- **Logged-out** — `/login`, `/register`, `/register-org`, `/forgotten-password`,
  `/reset-password`, `/verify`, `/verify-email`, `/logout`, and the two token pages
  `/preferences` and `/preferences/email/opt-ins`.
- **Custom pages and not-found** — the same catch-all resolves brand-authored custom
  pages seeded on the active dataset (with nav injection where a page opts in), and
  falls back to a not-found composition for any unmatched path.

## Provided by client-vue

Sign-in and registration, email history, contact management, payment methods and paying an
invoice, orders, and product setup already exist as `@upmind-automation/client-vue`
components over headless modules. This app does not mock them: their routes render one
"Provided by client-vue" stub row, and doors into them from other pages answer with the
same sentence. `docs/client-vue-adoption.md` lists what mounts on each route and what the
legacy portal did there that the components do not yet do.

## Two datasets

Every brand fact (which pillars show, whether support/affiliates/vault/PIN are on,
whether the client is a parent with child accounts) is data, not a hardcoded shape.
Two datasets ship: one with every gate on, one with every gate off (a support-disabled,
store-hidden, single-product persona). The settings dialog switches between them; the
choice persists in `localStorage` beside the theme.

## Mock architecture

One reactive in-memory dataset per active brand feeds everything on screen. Reads and
writes both go through typed managers shaped like the platform's own composable return
(`useContext`/`useMeta`/`useActions`/`useInternals`) — a paged-collection generic for
lists, and one manager per entity for records that mutate. Every module's `select` emit
is a verb string; a single dispatcher resolves the right manager, calls a method, and
returns a result naming what happens next (a toast, a confirmation, a form, a
destination). Modules never touch the store or a manager directly — they render props,
nothing else.

Full detail, including the verb grammar, the two-tier refusal rule, and how a page's
static config reaches live data: `apps/portal-nuxt/docs/architecture.md`.

## Forms

Multi-field writes go through one form module wrapping the design system's JSON Forms
engine, placed either inline in a page or in the shell's one dialog. Wherever a form
mirrors a capability the real platform already has a schema for, the mock uses a
stand-in module transcribed from that schema (runtime imports of the real files are not
viable — see the doc below) so a future swap changes only which module answers the
schema, not the form itself.

Full detail, including the registered-form table and the go-real seam: the sections
below and `apps/portal-nuxt/docs/forms.md`.

## Tests

- **Unit (vitest)** — one behaviour per file under `tests/`. Every test file that
  proves a mutation or a rendering rule has a colocated `<name>.must-fail.patch`: a
  diff against the production source that, applied, must flip that file's assertion
  red. Apply a patch, run the paired test, confirm it fails, then revert — this is
  how a test's claim to actually cover something is checked, blind to the
  implementation.
- **Type-tests** (`nuxt typecheck`, not run by vitest) — assert that a manager's
  layers are assignable to the real platform module's types where one exists, with a
  negative case per contract (a manager missing a required member must fail to
  compile).
- **`tests/standin-schemas.test.ts`** — imports each real headless schema file's raw
  source, transpiles and evaluates it in a sandbox, and deep-compares its exports
  against the stand-in module that mirrors it, so a real-file edit that isn't carried
  over fails the suite.
- **`tests/readback/*.mjs`** — Playwright scripts that drive the running app (both
  brands, both widths) rather than assert on markup in isolation.

Non-obvious facts worth reading before you touch this app: `apps/portal-nuxt/docs/gotchas.md`.

## Go-real seam

Where the real platform has no module yet, its future shape is written now as a
contract (`app/portal/mock/contracts/*.ts` — the four return layers, named filters,
sortable properties, and the scope it expects) and, where a form needs one, a stand-in
schema module beside it. A mock manager or form declares itself against that contract
today; swapping the mock for the real module later is a source change inside the
manager, never a change to the page, the module, or the contract's shape.

## Further reading

- `docs/client-vue-adoption.md` — the routes client-vue owns, and the gap list against it.
  The design records this app was built from live at `docs/plans/portal-mock-*.md` and
  `docs/analysis/portal-mock-gaps.md` in the repo root — read them for the "why", not the
  docs above, which describe what is actually on disk.
