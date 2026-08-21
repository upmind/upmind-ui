# labs-nuxt

A Nuxt playground that renders **live headless composables** — real network requests against a real (staging) backend, no mocked layer — through one generic, dumb rendering pipeline. It exists so a headless module can be looked at and driven without any bespoke page or component being written for it.

## Quick start — driving the client-emails canary

```bash
pnpm --filter @upmind-automation/labs-nuxt dev
```

Then open:

```text
http://labs.localhost:3000/useClientEmails/as/client
```

That boots the signed-in client's own email collection and renders it end to end: a full-width search box and status switches, the active refinements as removable chips, a Results count with a sort control and a table/card view toggle, above a sortable, pageable table. From there:

- **Filter** — type in the search box, or flip a switch. Each one re-queries the server; nothing is filtered client-side.
- **Sort** — click a column header, or use the sort control beside the Results count. The request's `order=` parameter follows.
- **Page** — use the pager below the table. The collection's declared page size is **10** rows.
- **Reload** — refresh the browser tab. The filter, sort, page, view and any sheet/tab you left open come back, because the whole surface state round-trips through the url.
- **Inspect** — open the Debug/Code/Scenario toggle at the right of the row above the table (it lives in the page's scenario bar, not the app chrome). Debug shows the cell's scope, state, meta flags and context — closed by default, remembered after that.

Every other registered scenario lives under the same pattern — see the sidebar or the home page for the full list, or the `modules/scenarios/` directory in source.

## What this is for

Two audiences:

- **Looking at a module's live shape** — open its scenario key and see the real composable's data, meta flags and actions rendered, against the real backend, with no UI work written for that module.
- **Driving the end-to-end proof** — the same page is what the Playwright suite drives (`pnpm test:e2e`), so a capability is only "done" once it can be seen here, not only asserted in a unit test.

This playground renders; it does not implement. Every rendered surface reads a **live composable through a dumb adapter** — no business rule, no re-derivation of module state, lives in the rendering layer. If a surface here shows the wrong thing, the fix is almost always in the module, not in this app.

## The scope bar — always-on identity chrome

The app header carries one grouped control, mounted once in `app/layouts/default.vue`, never per page: brand, then the session pool, then who the page is acting for.

- **The session pool** (`app/components/scope/SessionSwitcher.vue`) is every session the app holds in one menu — staff with their impersonated clients nested beneath them, direct clients in their own group, and ways to add another session (or a guest) at the foot. Logging a session out is per-row; logging out a session that is not the one currently active removes exactly that session. Logging out the **currently active** session is a known rough edge — the row's own logout does not yet fully clear the browser-cookie session behind it, so it can reappear. While the active session has a parent, a small badge beside the avatar says so and a tooltip names who — the same always-visible cue a page's own chrome used to carry, now inside the identity control itself.
- **Acting-for** (`app/components/scope/ActingForSegment.vue`) is who the _current page_ boots at when it isn't the signed-in actor: pick an actor row, then a client from the session pool's own known clients, the ones recently acted for, or an explicit id. A page's own scope matrix greys an actor row it cannot serve, with the reason in a tooltip — the session pool itself is never gated by that matrix, so switching to an actor a page can't render stays available from the header regardless of what the page on screen supports.

This cluster is global and stays mounted across every route. The scenario bar described below is the opposite: it belongs to the page.

## The scenario pattern — how a module reaches this playground

One piece, and a module author touches exactly one file.

### The module declares itself, once

`modules/scenarios/` is a local Nuxt module. Every `<useComposable>/scenario.ts` directory beside it is a scenario — nothing headless-side declares one, and nothing scenario-shaped lives in `packages/headless`, which has no scenario concept at all. Adding a module here is one new directory:

```ts
// modules/scenarios/useClientEmails/scenario.ts
export default {
  key: "client_emails",
  useList: useClientEmails,
  useMutate: useClientEmailManager,
  scope: {
    actor: ScopeActorTypes.CLIENT,
    contextType: ClientEmailsContextTypes.CLIENT
  },
  persistCriteria: true,
  handoff: {
    edit: { target: "client_email", contextType: "email", contextFrom: "/id" }
  },
  presentation: {
    row: rowUischema,
    card: cardUischema,
    rowActions,
    collectionActions
  }
} satisfies ScenarioDeclaration;
```

The directory's own name (`useClientEmails`) **is** the scenario's url segment and route name — there is no separate label to keep in sync, and nothing can be declared here and left unreachable. `scope` says which composable boots at which actor and (optionally) context type; `handoff` names another scenario's key as the editor a row hands off to; `presentation` is how a row draws, as a table row and as a card — none of it is inferred from the module.

At build time, `modules/scenarios/index.ts` globs every `*/scenario.ts` directory and pushes one route per directory at the one shared player component (below); a directory appearing or disappearing restarts the dev server, and two directories that would collide on a route name or path hard-fail the build rather than silently shadow one another. At runtime, `modules/scenarios/runtime/registry.ts` re-globs the same declarations, eagerly, into a lookup keyed by scenario key and by url segment — the registrar and the registry derive the route from the same directory name, so the two can never disagree.

### One page renders every declared scenario

`modules/scenarios/runtime/ScenarioPlayground.vue` is the **only** component behind every scenario route (`/<scenario>/as/:actor/for/:type/:id`, the scope suffix optional). It reads the scenario key off the route, boots that scenario's composable at the scope the url names through `useModulePort`, and hands the result to `ModuleRenderer`. No scenario has a page file of its own — there is nowhere for one to acquire its own boot, its own header, or its own copy of the scenario bar.

## The sidebar and the landing page read the same registry — nothing is hand-listed

A scenario key, the moment it is declared, needs nothing added to the sidebar or to the home page by hand — both derive from the same registry (`app/composables/useNavigation.ts`) the scenario player itself boots from, so the two can never drift out of sync with each other or with what is actually reachable.

- **The sidebar** carries one item per registered scenario key, each linking straight to the actor its own entry declares. A composable can reach the sidebar the other way too — by declaring its own route metadata on its page, the pattern `useAuth`'s page already follows — and either source lands it under the same "Composables" heading.
- **The landing page** counts every composable reachable either way, groups them into families (derived from the leading word of the key or label — `client`, `basket`, `auth`, and so on), and renders one card per composable linking the same way the sidebar does.
- A key another scenario hands off to (an editor a row opens) is an internal destination, not its own menu item — one composable family is one entry, derived from the handoff relation the declaration already carries rather than a second flag a module has to remember.

## The rendering pipeline — dumb by construction

```text
live composable  →  useModulePort (the adapter)  →  ModuleRenderer (the dispatcher)  →  one surface
```

- **`useModulePort`** (`modules/scenarios/runtime/composables/useModulePort.ts`) is the one place that holds the raw composable cell. It boots the declared composable at the requested scope, wraps it in a plain-data adapter (`useCompositionPort`) so nothing downstream touches a `Ref` directly, and — only when the cell publishes query criteria — attaches a table channel that lets a rendered table's sort/filter/page controls write back through the module's own `filterBy`/`sortBy`/pager actions. A cell that does not own request state gets no table channel; nothing is fabricated.
- **`ModuleRenderer`** (`modules/scenarios/runtime/components/ModuleRenderer.vue`) reads one field — `descriptor.archetype.archetype` — and dispatches to exactly one of four surfaces. It never re-derives the archetype and never imports a module directly.
- **The four surfaces** (`modules/scenarios/runtime/components/surfaces/`) — `ListSurface` (a table or card grid, driven by the table channel when present), `DetailSurface` (a read-only record), `FormFlowSurface` (a form from the module's own schema/uischema), `ActionPanelSurface` (a panel of the module's own actions). Each surface owns only its own rendering; none of them knows which module it is showing.
- **A collection's controls are four separate rows, not one**, each owning exactly one job: `FilterBar` renders the module's own declared query schema and UI schema through `@upmind-automation/client-vue`'s `UpmForm`; `RefinementsRow` shows what that narrowed the collection to as removable chips, plus "Clear all"; `DisplayRow` carries the Results count, the sort control and the table/card view toggle — nothing here changes which records are in the collection, only how what came back is drawn; `PageHeader`, drawn by the page above the whole surface, carries the collection's own primary action (e.g. "Add new"), handed up from the surface that owns the handoff it opens. Writes from any of them flow back through the composable's own merging `setCriteria` — this playground owns no filter state of its own.
- A row action in flight shows so on the control that fired it, and its outcome lands as a toast at the top of the screen, plus (on the row it happened to) an inline failure banner sharing the row's own error-outline treatment — never a red fill, never a change to row height.

## The scenario bar and its transport

Every scenario page draws its own bar (`modules/scenarios/runtime/components/ScenarioBar.vue`) beneath the page header — a **page-scoped** bar, distinct from the global scope bar above. It is one component in two states rather than two bars: on **Live** (the state every page boots into) it offers the track list, the force preset picker and the Debug/Code/Scenario toggle; the moment a track is armed it grows a track-name badge, a transport (play/pause/prev/next) and a scene scrubber in the same place, and the force picker disappears (a track owns its own preset while it plays).

A scenario opts into a playlist by declaring `tracks: { feature, catalog, pinned? }` — a Gherkin feature and the step catalog that plays it, parsed into playable tracks by `useFeatureTracks`. Stepping through a track replays it deterministically from its first scene (nothing can un-fire a step, so "back" and "seek" both re-run from the top); arming a track whose declared scope differs from the page currently on screen navigates there first rather than driving an invisible instance. `track=`/`scene=` are url state (`useScenarioPlayer`), so a pasted link arms the same track at the same scene for anyone who opens it.

**Today the bar has nothing to play.** A scenario's playlist reaches this app through one seam (`modules/scenarios/runtime/force/corpus.source.ts`) that is deliberately empty pending an operator ruling on how a committed test fixture may reach app runtime at all — until that lands, every scenario's feature text and step catalog are empty, so the track list is empty and the bar sits on Live permanently. This is a safe default, not a bug: the alternative would be inventing a response to make a preset look servable.

## Forcing a state

`ForceController`/`ForcedCanvas` let a developer fake a state a live backend won't reproduce on demand, by picking a preset that arms a Mock Service Worker registered lazily on the first arm (a bare page load registers nothing). A forced page is framed with an inset ring and a badge naming the preset, so it can never be mistaken for a real one; clearing the preset removes both and returns to Live. `force=` is url state, so a pasted link arms the same preset on load.

The picker shares the same data seam as the track playlist above, so it is presently hidden entirely rather than offering a preset with nothing behind it — the moment that seam resolves, the control appears with no other change.

## Sheets — Debug, Code, Scenario

One sheet (`app/components/sheets/SheetHost.vue`) is mounted once in the layout, overlaid — not padded for — over whichever page is open. The toggle that opens it lives inside that page's own scenario bar, never in the app chrome, and offers three views:

- **Debug** — every section a page registered, as tabs. Each scenario page registers its own section describing its live cell (scope, the scope matrix it resolves against, state, errors, meta flags, context), so Debug is page-scoped: leaving the page removes its section, and a page that registers nothing offers no toggle at all.
- **Code** — a live code snippet reproducing exactly what's on screen (the scoped composable call, `.as()`/`.for()`, and the filter/sort it's currently narrowed by), with one click to copy it.
- **Scenario** — the page's own scenario declaration, its Gherkin playlist, and where the transport has reached in it.

**Code and Scenario are built but not yet wired up.** Both components exist and render correctly when given props, but no page in the current tree registers a pane for either, so opening them shows an empty-state message rather than content — only Debug has a live registration today. Which sheet and which tab are open is url state (`sheet=`/`tab=`), so a colleague sent a link lands on the exact pane; absent that, a developer's own last choice is remembered, closed on a first visit.

## Persistence — the url is the state

Every piece of this playground's own surface state — which view (table/card), which track and scene are armed, which sheet and tab are open, which force preset is active — lives in one shared query-string bag (`app/composables/usePlaygroundUrlState.ts`). There is exactly one writer: every consumer hands its change to the same bag, which merges everything written in one tick and commits it once, so a filter write and a track write landing in the same render both survive regardless of order. Scope (actor, context, brand) stays the router's own path segments, not this bag, because scope changes the page that mounts.

A scenario that sets `persistCriteria: true` gets its whole request state (filters, sort, page) mirrored into the **same** bag (`useCriteriaUrlSync`), so a reload lands back where it was left and a shared link reproduces the same view. This is opt-in per scenario and lives entirely in this playground — the composable itself knows nothing about the url.

## Running the tests

```bash
pnpm --filter @upmind-automation/labs-nuxt test          # every vitest project (unit, component, module, audits)
pnpm --filter @upmind-automation/labs-nuxt test:unit      # composables only
pnpm --filter @upmind-automation/labs-nuxt test:component # components only
pnpm --filter @upmind-automation/labs-nuxt test:e2e       # Playwright, against a dedicated dev server on a fixed port
```

`test:e2e` drives the **same** `.feature` file from two directions in one run — once through an in-page "world" bridge that calls the page's own composables directly rather than simulating clicks, and once through Playwright driving the actual rendered page (real clicks, real DOM) — so a scenario is proven both as a headless capability and as something a human clicking through this playground actually sees.
