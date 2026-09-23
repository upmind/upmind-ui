# Module: foundation

> Portable, rebuild-grade specification of the shared-base **pattern**. Where a
> domain module's foundation doc describes a data contract behind HTTP endpoints, this
> layer calls no backend of its own — it composes the platform's own identity-linked
> configuration and theme list, each documented at their own layer. This doc specifies
> the shared-base mechanism precisely enough to re-implement in another stack.

## What it is

This layer is the one shared base every business-domain part of the client is allowed
to depend on. It has three jobs: resolve and cache the storefront's identity-linked
configuration once per storefront; work out which visual theme a storefront should
show, without itself drawing anything; and hold three initially-empty contribution
points — one for form-input renderers, one for page routes, one for user-journey
wiring — that business-domain code fills in from the outside. Nothing here specialises
to a single business domain; that is what keeps every domain-specific part free to
depend on it without it becoming a dumping ground itself.

## Core concepts

- **Identity-linked configuration** — a read of the storefront's own settings, cached
  under that storefront's identity so repeat reads for the same identity return the
  same value, and a different identity gets a fresh read.
- **Theme selection** — the resolved decision of which theme id (and colour-scheme
  preference) a storefront should use. Resolving a selection is a pure computation; it
  does not itself change what is rendered.
- **Theme applier** — an interchangeable, externally-supplied implementation that
  receives a resolved theme id and is responsible for making it visible. This layer
  never implements one; without one supplied, applying a selection has no visible
  effect.
- **Contribution registries** — three keyed collections — renderer definitions, page
  routes, and journey-wiring routines — that start empty and only grow through the
  contribution wrapper below.
- **The contribution wrapper** — one function shape every contributing part of the
  client uses to describe itself: a name plus a setup routine, handed write access to
  the three registries and nothing else.
- **The install pass** — running every registered contribution's setup routine exactly
  once, in the order it was registered, regardless of how many times install is
  invoked. A separate reset clears every registration and empties all three registries
  in one step.

## Operations

| # | Capability | Inputs | Outputs |
| --- | --- | --- | --- |
| 1 | **Read the storefront's identity-linked configuration** | — | the resolved configuration, or nothing yet if it has not arrived |
| 2 | **Resolve the active theme id** | — | the storefront's preferred id if currently offered, otherwise the first offered id, otherwise a fixed fallback |
| 3 | **Read the offered theme ids and preferred colour scheme** | — | the full list of ids currently offered; a light/dark preference when the storefront declares one |
| 4 | **Apply the resolved theme** | — | hands the resolved id to whatever theme applier is supplied; has no effect when none is |
| 5 | **Register a set of form-input renderers** | one or more renderer definitions | appended to the shared renderer collection |
| 6 | **Read the active renderer set** | — | an override set if the calling context supplies one, otherwise the shared collection |
| 7 | **Register page routes / read the registered set** | one or more route definitions (register) | appended to the shared route collection; full set on read |
| 8 | **Register a journey / read the registered set** | a routine that wires journeys onto a routing-engine instance (register) | appended to the shared journey collection; full set on read |
| 9 | **Run every registered journey** | a live routing-engine instance | each registered journey routine is invoked against it |
| 10 | **Register / install / reset a contribution** | a name + setup routine (register); a live routing-engine instance is not required for install/reset | register: added once per unique name; install: every registered setup routine runs exactly once; reset: every registration and all three registries are cleared |

**Additional always-on behaviours:**

- A readiness signal for the identity-linked configuration, plus an availability flag
  independent of whether it has resolved to a value yet.
- A readiness / availability signal specific to the offered themes.
- Invalidating one cached configuration entry by identity, or every entry at once.

## Data shape

```ts
// The storefront's identity-linked configuration, cached by that identity.
type BrandConfig = {
  id: string; // the identity the config is cached under
  name?: string;
  faviconUrl?: string;
  themeId?: string; // the storefront's preferred theme id, if it declares one
  brandColor?: string;
  brandFont?: string;
};

type BrandConfigMeta = {
  isAvailable: boolean; // the underlying config source is reachable at all
  isResolved: boolean; // this identity's config has resolved to a value
};

type ColorScheme = "light" | "dark";

type BrandThemeMeta = {
  isAvailable: boolean;
  hasThemes: boolean; // the platform currently offers at least one theme
};

// Anything capable of making a resolved theme id visible.
type ThemeApplier = {
  set: (id: string) => void;
};

// One entry in a form-input renderer set. The exact shape is owned by whichever
// presentational layer renders the form; this layer only collects and
// redistributes entries in that shape without inspecting them.
type FormRendererEntry = unknown;

// A routine that wires a set of user journeys onto a routing-engine instance.
type JourneyRegistrar = (routingEngine: unknown) => void;

// The uniform contribution wrapper every contributing part of the client builds
// against.
type ContributionContext = {
  addRenderers: (renderers: FormRendererEntry[]) => void;
  addRoutes: (routes: unknown[]) => void;
  registerJourney: (registrar: JourneyRegistrar) => void;
};

type Contribution = {
  name: string;
  setup: (ctx: ContributionContext) => void;
};
```

## Dependencies

### Dependants — modules that read from this one

No business-domain part of the client imports from this layer yet — it is a new
shared base whose three registries all currently ship empty. The roster this section
will carry is fixed by the layer's role rather than by current fan-in: any part that
needs the storefront's identity-linked configuration, needs to select a theme, or
contributes a renderer, route, or journey becomes a dependant the moment it does so.

### This layer's own dependencies

- **A presentational component layer** — read for the shape a form-input renderer
  must satisfy; never for a specific renderer.
- **The platform's data-fetching layer** — read for the storefront's identity-linked
  configuration and the list of themes currently offered; documented at that layer's
  own reference, not here.

## Lessons (hard-won)

- **A shared contribution point that imports its own contributors creates a cycle the
  moment a second contributor exists.** The instinct is to seed the shared registries
  directly with an entry per known contributor; doing so makes the shared layer depend
  on every contributor, and every contributor already depends on the shared layer for
  the wiring itself.
- **Resolving a theme selection and applying it are two different moments, and nothing
  forces the second to happen.** A caller that only resolves the selection and never
  wires an applier sees the resolution succeed — there is no error, just silence on
  screen.
- **Caching identity-linked configuration under anything narrower than the storefront's
  own identity grows unbounded with traffic rather than with the number of
  storefronts.** The same storefront's configuration is identical for every visitor;
  keying the cache by a visitor instead of the storefront re-fetches and re-stores the
  same values once per visitor.
- **A form host sometimes needs to swap its whole active renderer set without touching
  what every other host reads.** Reading only from one global collection would force an
  isolated or overridden context to mutate shared state just to run differently from
  everyone else; a per-context override that falls back to the shared collection avoids
  that.
