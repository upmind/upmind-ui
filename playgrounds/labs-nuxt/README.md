# labs-nuxt

A Nuxt playground that renders **live headless composables** — real network requests against a real (staging) backend, no mocked layer — through one generic, dumb rendering pipeline. It exists so a headless module can be looked at and driven without any bespoke page or component being written for it.

## Quick start — driving the client-emails canary

```bash
pnpm --filter @upmind-automation/labs-nuxt dev
```

Then open:

```text
http://labs.localhost:3000/scenarios/client_emails/as/client
```

That boots the signed-in client's own email collection and renders it end to end: a full-width search box and three status switches above a sortable, pageable table. From there:

- **Filter** — type in the search box, or flip a switch. Each one re-queries the server; nothing is filtered client-side.
- **Sort** — click a column header. The request's `order=` parameter follows.
- **Page** — use the pager below the table. The collection's declared page size is **10** rows.
- **Reload** — refresh the browser tab. The filter, sort and page you left it on come back, because the whole request state round-trips through the url.
- **Inspect** — the panel on the right (open by default) shows, side by side: the declared query schema, its UI schema, the current parsed model, and the exact request parameters that model builds — all computed with **zero requests fired**, so you can read "what would go out" before anything does.

Every other registered scenario lives under the same pattern — see `/scenarios` in the running app for the full list, or `app/composables/factory/registry.ts` in source.

## What this is for

Two audiences:

- **Looking at a module's live shape** — open its scenario key and see the real composable's data, meta flags and actions rendered, against the real backend, with no UI work written for that module.
- **Driving the end-to-end proof** — the same page is what the Playwright suite drives (`pnpm test:e2e`), so a capability is only "done" once it can be seen here, not only asserted in a unit test.

This playground renders; it does not implement. Every rendered surface reads a **live composable through a dumb adapter** — no business rule, no re-derivation of module state, lives in the rendering layer. If a surface here shows the wrong thing, the fix is almost always in the module, not in this app.

## The scenario pattern — how a module reaches this playground

Three pieces, and a module author touches exactly one of them.

### 1. The module declares a scenario key (headless, one line)

`@upmind-automation/headless/scenarios` is a small, separate entry point — never the package's main barrel — that maps a key to a thunk booting the module's own composable:

```ts
// packages/headless/src/scenarios.ts
const scenarios = {
  client_emails: () => useClientEmails(),
  client_email: () => useClientEmailManager()
} as const;

export type ScenarioKey = keyof typeof scenarios;
export default scenarios;
```

A key is added here, in headless, once. Nothing under `playgrounds/` needs to import a module directly.

### 2. This playground declares how to boot that key (one registry entry)

`app/composables/factory/registry.ts` is the only file that pairs a scenario key with the scope it boots at, which composable a row hands off to for editing, and whether its request state should persist to the url:

```ts
export const registry = {
  client_emails: {
    useList: useClientEmails,
    useMutate: useClientEmailManager,
    scope: { actor: ScopeActorTypes.CLIENT, contextType: ClientEmailsContextTypes.CLIENT },
    persistCriteria: true,
    handoff: { edit: { target: "client_email", contextType: "email", contextFrom: "/id" } }
  }
} satisfies Record<ScenarioKey, ScenarioBinding>;
```

`satisfies Record<ScenarioKey, ScenarioBinding>` is the whole point of the pattern: a key added to headless and left undeclared here **fails to compile**. There is no way for a module to reach the factory and be silently unreachable.

### 3. Nothing else — one page renders every key

`app/pages/scenarios/[key]/[...scopeSuffix].vue` is the **only** page. It reads the key from the url, resolves the registry entry, boots the composable at the named scope (or a scope the url overrides, e.g. `/for/client/<id>`), and hands the result to the adapter. Adding a module to this playground is a headless line plus a registry entry — **zero new files, zero new pages, zero new components.**

## The rendering pipeline — dumb by construction

```text
live composable  →  useModulePort (the adapter)  →  ModuleRenderer (the dispatcher)  →  one surface
```

- **`useModulePort`** (`app/composables/factory/useModulePort.ts`) is the one place that holds the raw composable cell. It boots the registry entry at the requested scope, wraps it in a plain-data adapter (`useCompositionPort`) so nothing downstream touches a `Ref` directly, and — only when the cell publishes a query schema — attaches a table channel that lets a rendered table's sort/filter/page controls write back through the module's own `filterBy`/`sortBy`/pager actions. A cell that does not own request state gets no table channel; nothing is fabricated.
- **`ModuleRenderer`** (`app/components/factory/ModuleRenderer.vue`) reads one field — `descriptor.archetype.archetype` — and dispatches to exactly one of four surfaces. It never re-derives the archetype and never imports a module directly.
- **The four surfaces** (`app/components/factory/surfaces/`) — `ListSurface` (a table, driven by the table channel when present), `DetailSurface` (a read-only record), `FormFlowSurface` (a form from the module's own schema/uischema), `ActionPanelSurface` (a panel of the module's own actions). Each surface owns only its own rendering; none of them knows which module it is showing.
- **The filter bar** (`app/components/factory/FilterBar.vue`) is not part of the four surfaces — it renders above them, only when the composable's port publishes `criteria`. It mounts the module's own declared query schema and UI schema through `@upmind-automation/client-vue`'s `Form`, which is what resolves each `Filter`-typed element to a control (switch, search box, select, or range) purely from the column's declared operators. Writes flow back through the composable's own merging `setCriteria` — this playground owns no filter state of its own.
- **The Inspector** (`app/components/inspector/`) is the raw half of "raw vs rendered": one code-styled panel per context key, including a dedicated debug entry showing the query schema, its uischema, the live model, and the wire parameters that model would build — computed, never fetched, so it is populated before the first request goes out.

## Persistence

A registry entry that sets `persistCriteria: true` gets its whole request state (filters, sort, page) mirrored to the browser url on the page that hosts it (`useCriteriaUrlSync`), so a reload lands back where you left it and a shared link reproduces the same view. This is opt-in per scenario and lives entirely in this playground — the composable itself knows nothing about the url.

## Running the tests

```bash
pnpm --filter @upmind-automation/labs-nuxt test          # unit + component (vitest)
pnpm --filter @upmind-automation/labs-nuxt test:unit      # composables only
pnpm --filter @upmind-automation/labs-nuxt test:component # components only
pnpm --filter @upmind-automation/labs-nuxt test:e2e       # Playwright, against a dedicated dev server on a fixed port
```

`test:e2e` drives the **same** `.feature` file from two directions in one run — once through an in-page "world" bridge that calls the page's own composables directly rather than simulating clicks, and once through Playwright driving the actual rendered page (real clicks, real DOM) — so a scenario is proven both as a headless capability and as something a human clicking through this playground actually sees.
