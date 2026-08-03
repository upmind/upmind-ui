---
paths:
  - '**/modules/**/docs/foundation.md'
  - '**/modules/**/docs/**/*.md'
---
> Companion to [docs-modules.md](./docs-modules.md) — Upmind-monorepo-specific bindings/examples.

# Module documentation — Upmind bindings

## Deliverable & workflows

- The rebuild deliverable is the **Contabo workshop** (per-module foundation doc, SDD, build-your-own guide).
- The audience does not know **Upmind**.
- Workflows: `/docs` (the module docs factory — its delta mode, was `/story-docs`, defines *when*) and `/docs-review` (module/foundation lane).

## Paths

- Foundation doc: `packages/headless/src/modules/<name>/docs/foundation.md` (the module `README.md` is internal-facing and stays untouched).
- Shared types / enums: `packages/types/src/models/` and `packages/types/src/data/enums/`.
- Import graph for dependant weighting: `graphify-out/graph.json` (cross-module import edges).
- Direction check: `grep -rl 'from "../<module>"' packages/headless/src/modules/<other>/`.
- Fixtures: `tests/fixtures/recordings/` (monorepo) / `07-references/recordings/` (bundle); new-format request-capturing index at `docs/workshop/references/fixture-index.md`.

## Validated sibling scope-boundary examples

Do not duplicate scope across these pairs:

| Module | Owns | Forwards to sibling |
| --- | --- | --- |
| `product` | catalogue read, initial configuration, seating (`POST /orders`, `POST /orders/{basketId}/products`) | re-resolve / edit / remove → `basketProduct` |
| `basketProduct` | in-basket re-resolve, edit, remove, validate-saved, bulk replace | catalogue browsing + seating → `product` |
| `basket` | basket envelope (create, claim, currency, promotions, billing, conversion) | per-line product operations → `basketProduct` |
| `session` | identity / token / actor surfaces | client profile reads + sub-records → `client` |

## Implementation names to strip (concrete)

- Composable surface: `useBrand()`, `isReady()`, `getConfigValue(key)`, `validateCurrency(model)`.
- Internal stores / identifiers: `brandConfigKeysStore`, `["brand", "config"]` query keys, `localStoragePersister`.
- Internal functions: `service.fetchBrandConfig`, `mapBrandSettings`.

## Framework / library choices to strip (Upmind stack)

- **Vue** reactivity: `computed`, `ref`, `watch`.
- **XState** machines, actors, services, guards, `spawn`.
- **TanStack Query**: query keys, refetch, persisters.
- **Scoped composables**: `useX().as('client')` — the actor-scoping accessor (ADR-001).

## SDD / process vocabulary to strip (Upmind bindings)

Binds the base rule's **"SDD / process vocabulary & references"** strip category (`docs-modules.md`) to this repo's concrete tokens — the base carries the principle + generic examples; only the repo-specific bindings live here.

- **Id schemes:** decision ids are `D1`–`D4`; acceptance-criteria ids follow `AC-<cell><n>` — `AC-A1` / `AC-A2` / `AC-B1` / `AC-B2` / `AC-B3` / `AC-S1` / `AC-12a`…
- **Tracker:** the `FE-####` provenance ids the base forbids are **Linear** issues.
- **SDD tree:** the links that must never surface are `docs/sdd/<story>/` (`design.md`, `parity.yaml`, `research.md`) and its `evidence/` (`verify.md`, `test-report.md`, `operator-ruling-*.md`).

**Receipt (2026-07-30 · client-phone-dry).** The `client-phone-dry` module docs shipped with all of the above transcribed straight from `docs/sdd/client-phone-dry-smoke/` — docs-review scored 83/100, dragged down entirely by this leak; `foundation.md`'s ADR-025 provenance cite was flagged 🔴 for the rebuild audience. The base category (added `docs-modules.md` v0.9.9) + this binding close it at authoring time; not a gate.

## The `.meta` / `object_meta` envelope (the client-only bag)

The client-only bag in Upmind is **`.meta`** (and `object_meta`). Top-of-doc note:

> *Any `meta` field returned by Upmind endpoints is UI-specific to our own client — ignore for spec purposes.*

- **Include** when fixtures show `meta` / `object_meta` / a sub-keyed bag (`meta.i18n`) at the *data* level (on `data`, per-row inside `data: [...]`, or nested on an embedded record e.g. a basket's embedded product carrying `meta.uischema`).
- **Omit** when the only `meta` is the response *envelope wrapper*'s `meta: null` (sibling of `data` / `error` / `messages` on every Upmind response).
- **Tighten** when only a sub-key exists (brand carries `meta.i18n` only).
- **Cover both** when multiple bags exist (basket responses carry `meta` and `object_meta`).

Everything inside `meta` is out of spec regardless of sub-property — `meta.i18n`, `meta.cart`, `meta.uischema`, and anything surfaced under another name (i18n message overrides, translation overrides, brand-cart layout, cart UI overrides) that resolves to a meta-located bag. Never reference meta-derived content by name in any section.

## Rolled-up substrate examples (concrete)

- `brand` exposes a single `useBrand()` substrate internally fetching `/brand/settings`, `/config/brand/values`, `/config/organisation/values`, `/org/modules`.
- `system` exposes a single `useSystem()` substrate internally fetching `/countries`, `/billing_cycles`, `/currencies`, `/languages`, `/statuses`, `/tickets/departments`, etc.

Document one Operations row / Data-shape block / API-endpoint entry per BE endpoint — never the composed `useBrand()` / `useSystem()` object.

## Wire flags vs wrapper concepts (concrete)

- Real wire flags that MUST be documented in `RequestBody` + curl: `provision_field_values_validate: false`, `skip_recompute: true`.
- Wrapper framing to strip: `{ silent: true }` convenience toggle.
- Sentinels: `min_order_quantity: 0` = "no minimum"; `currency_id: null` = "use brand default".
- Composite enum value: `product_type: 2` (bundle) — enumerate as data; strip "bundle" as an architectural primitive.
- URL-parameter bag types to strip: `DeepLinkConfig`, `pid` / `qty` / `bcm` shorthand fields.

## Presentation-layer convenience flags to strip

`hasStorefront`, `keepsUserInSitu`, `hasUpmindBranding` — config-derived presentation shortcuts, not architectural primitives.

## Hot-keys to omit

- Cart-UI-specific: `BASKET_FUNNELLING`, `CHECKOUT_FLOW`.
- Upmind-app-specific: `REMOVE_UPMIND_BRANDING_ENABLED`, `UI_*`.
- Internal-admin: `CREATE_USER_API_TOKENS`, `WEBHOOKS`.

## Dependants-table exclusions (concrete)

Exclude `query` (HTTP transport) and `routing` (app navigation); exclude UI-internal helpers `datamanager`, `client-vue`. Surface UI fan-in via the "Presentation layer" row (header/footer chrome, locale + currency switchers, white-label gating).

## Register discipline

The register discipline underlying this rule is ADR-019 (Module Documentation Shape). Cite ADR-019; do not restate it.
