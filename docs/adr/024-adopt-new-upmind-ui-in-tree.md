# ADR 024: Adopt the new `@upmind/ui` (reka-ui + Tailwind 4 + token engine) as the in-tree UI library

**Date:** June 17, 2026
**Status:** Accepted — amended August 19, 2026 (consumption mechanism) and 2026-08-25 (the form engine's home); see Amendments below
**Authors:** Dom da Costa

---

## Context

The current UI library (`@upmind-automation/upmind-ui` v0.0.6) is consumed as the `packages/ui` **git submodule**, developed in a standalone repo (`git.upmind.io/upmind/upmind-ui`). A rebuilt library exists (`reka-ui` primitives + Tailwind 4 + an OKLCH token engine with a WCAG contrast gate and derived dark mode) as three packages: `@upmind/ui`, `@upmind/tokens`, `@upmind/mcp`. It is strictly richer than the old lib (no dark mode, no contrast enforcement, suppressed focus rings, no reduced-motion in the old one) and is already consumed the way the monorepo consumes everything — **source-first via Vite aliases**, never a prebuilt `dist/`.

A submodule cannot host it: the new packages' specifiers are all `catalog:` / `workspace:*`, which a submodule would import against a monorepo that has no catalog — `pnpm install` fails outright. The library also needs monorepo-side integration (a reconciled pnpm catalog, a tokens→registry build wired into CI, toolchain alignment) that cannot live behind a submodule boundary.

This ADR records the **final ratified decisions** from a drip review of a design council's analysis; several council recommendations were overridden. The full analysis is in [`../plans/ui-migration/analysis.md`](../plans/ui-migration/analysis.md); the sequenced plan is in [`../plans/ui-migration/migration-plan.md`](../plans/ui-migration/migration-plan.md); the decision record (with the council positions that were superseded) is in [`../plans/ui-migration/decision-log.md`](../plans/ui-migration/decision-log.md).

This complements ADR 023 (which already states the lib is "a first-class monorepo citizen, no longer a submodule"). ADR 023 governs the domain-package cut; this ADR governs the UI-library adoption itself.

---

## Decision

Adopt the new library as **first-class in-tree packages under `packages/`, replacing the `packages/ui` submodule.** The standalone `git.upmind.io/upmind/upmind-ui` repo is **retired** — the monorepo is the sole home; there is no upstream-sync process.

1. **Names.** Keep `@upmind-automation/upmind-ui` **exactly** (the 338 client-vue imports and every app alias keep resolving to it — no rename, no re-export shim, no lockstep). The other two follow the monorepo convention: `@upmind-automation/tokens`, `@upmind-automation/mcp`. The lib's internal `@upmind/*` references get a mechanical find-replace.
2. **Styling model.** Token-driven Tailwind 4. Retire `useStyles` + `uiConfig` + the `*.config.ts` override shape entirely; keep `cva()` as an internal class-organiser. The ~6 orphan behaviours the override system did are baked directly into the migrated components.
3. **Theming + dark mode.** Adopt `@upmind-automation/tokens` `defineTheme` + the `data-theme` cascade. Ship dark mode to users: system-preference default + a persistent user toggle that overrides + a per-brand `preferredMode` initial default.
4. **Brand tokens.** A WCAG-checked base set (light + dark) ships in the lib. Per-tenant overrides apply at **runtime in the app** on top of the base via the CSS cascade; a one-time backfill renames old token variables → new. The base set is the cascade fallback (a brand never collapses). BE→UI transport unchanged.
5. **Forms.** Keep JSON Schema + AJV + JSONForms. **No Zod** — delete the vendored lib's `SchemaForm` + `zod` + `vee-validate`. Headless (~43 schema files) + form-error i18n are untouched. ~~The only form work is re-skinning the ~11 JSONForms renderers to the new field components.~~ *(Superseded 2026-08-25: the engine itself moved to `design-system/packages/ui/src/form/` and the domain renderers stayed in `client-vue` — see the Amendment below. Everything else in this clause stands.)*
6. **Components.** Build the genuine gaps into the lib (Link, Interstitial, Markdown, Sanitized, Image/ImageGrid, Search, Carousel); remap the changed ones (Icon name-map + resolver, Button variant codemod, cards → `option-tile`); compose ButtonGroup and the checkout-critical CheckboxGroup at their sites; retire Autocomplete + Indicator (0 uses). Each lands before its call-sites move.
7. **Docs/standards.** Replace SB8 wholesale with SB10 + a docs site as standalone deploys. Update the canonical `.agent` shared rules to the token-driven model before any consumer migrates.
8. **Migration unit + gate.** Migrate **by component**; nothing flips before its replacement is proven. The safety gate is the **monorepo's existing Playwright e2e + visual-regression suite**, run before/after each slice. Proper tree-shaking (granular exports + correct `sideEffects`) keeps the bundle lean and Zod out — no bundle budget, no new VRT infra.

---

## Consequences

### Positive

- A strict accessibility upgrade (WCAG contrast gate, consistent focus-visible rings, reduced-motion handling, dark mode) shipped to users.
- The monorepo becomes the single source of truth — no submodule, no upstream sync, no rename, no shim, no 5-package lockstep.
- Keeping JSON Schema forms defuses the largest migration risk (no Zod re-platform, no form-i18n re-homing); headless is untouched.
- Brand cutover is safe by construction — the CSS cascade falls back to the base set, so no per-tenant kill-switch is needed.
- Tokens are runtime-overridable per tenant, so brand changes need no deployment (as today).

### Costs / required work

- A reconciled pnpm catalog, a tokens→registry build in CI, and a Node engine-floor bump are hard pre-flight prerequisites.
- The `useStyles` layout layer in client-vue (103 files + 38 `*.config.ts`) must be re-expressed against token utilities — the long pole.
- A one-time backfill of every existing tenant's token-variable names (old → new).
- Build the genuine-gap components and the Icon name-map/resolver before their call-sites flip.
- Re-skin the ~11 JSONForms renderers.
- Update the canonical `.agent` standards docs (which currently mandate the retired CVA/useStyles pattern) before any consumer migrates.

### Neutral

- The consumption model is unchanged (source-first via Vite aliases); only the alias targets retarget to the in-tree packages, and the kept specifier `@upmind-automation/upmind-ui` does not move.
- Whether a tenant can force/lock a dark/light mode (vs the user toggle always winning) is a minor open item.

---

## Amendment (August 19, 2026) — the library's home moves back to the design-system repo; the monorepo consumes it as a submodule

**Scope:** supersedes the *consumption mechanism* of the Decision ("first-class in-tree packages", "the standalone repo is retired", "no upstream-sync process"). Every other decision in this ADR — names for consumers, styling model, theming, forms, component remaps, docs, migration gate (§1–§8) — stands unchanged.

**What changes.** `git.upmind.io/upmind/upmind-ui` (the upmind-design-system monorepo) is the library's single physical home. This monorepo consumes it as the `design-system/` git submodule (currently `branch = ui-migration`), and only `design-system/packages/ui` and `design-system/packages/tokens` join the pnpm workspace — the DS's `mcp` and its apps stay out. This is the same pattern billing-core already uses to consume the DS, so all consumers converge on one mechanism. The in-tree `packages/ui-next`, `packages/tokens`, and `packages/mcp` are deleted.

**Why the original objections no longer hold.** The Decision rejected a submodule because the packages' `catalog:`/`workspace:*` specifiers could not resolve across a submodule boundary. That was true before FE-2884; the reconciled catalog it introduced is exactly what makes the submodule work now — the DS packages' `catalog:` references resolve against this root's catalog (proven: green install, typecheck, and builds on the cutover branch). CI needs no special lane: `GIT_SUBMODULE_STRATEGY: recursive` fetches the submodule and `pnpm -r build` builds its packages like any workspace member.

**Why reverse at all.** The in-tree fork and the DS repo diverged by 247 commits in two months, reconciled only by a hand-run swap-back (August 19, 2026). Two physical copies of a live library re-diverge by default; one physical copy ends that failure class structurally.

**Consumer naming.** The Decision's no-rename rule is retired with the same change: monorepo-owned consumers import `@upmind/ui` and `@upmind/tokens` directly (mechanical rename of every import, path alias, CI filter and script in this branch). The only compatibility shim is a pair of root pnpm `overrides` rewriting the old `@upmind-automation/{upmind-ui,tokens}` names for the checkout submodules (apps/velia, apps/hosting), whose repos still declare them; those two lines drop when each app's own mirror pass renames its imports.

---

## Amendment (2026-08-25) — the form engine's home is `@upmind/ui`, at `src/form/**`

**Scope:** supersedes the *placement* implied by §5 (Forms). The forms **technology** decision — JSON Schema + AJV + JSONForms, **no Zod**, no vee-validate, headless's ~43 schema files and form-error i18n untouched — stands unchanged, as does every other decision in this ADR (§1–§4, §6–§8) and the August 19, 2026 amendment.

**What changes.** The JSONForms **engine** — the host (`Form`, renamed from `FormHost`), the renderer-registration utilities (`registerEntry`, `useUpmindUIRenderer` and siblings), the field chrome, and the generic renderers inherited from the retired `@upmind-automation/upmind-ui` lib — lives in **`@upmind/ui`**, the design system's component library, at `src/form/**`: a vendored subtree outside `src/components/` and therefore outside `COMPONENT_SPEC.md` and the composed-component contract. It imports no `@upmind-automation/*` package; the AJV instance, the translator, BE-served reference data and **the host's icon component** reach it as props or through a documented injection contract — the six host seams, and what each one's absence silently costs, are tabulated in `design-system/packages/ui/src/form/README.md`. `@upmind/ui` accordingly gains five runtime dependencies — `@jsonforms/core`, `@jsonforms/vue`, `ajv` (imported for types only), `lodash-es` and `libphonenumber-js` — plus `ajv-errors` as a devDependency for the subtree's Storybook validator fixture. Adding them is a design-system dependency decision per `COMPONENT_SPEC.md`, taken by operator ruling on 2026-08-25.

**What stays in `client-vue`.** The **Upmind-domain** renderers (Address, Domain, SLD, SubProduct, Terms, Gateways, PaymentDetails, Manage, Image, and the collection `Filter*` family) stay in `@upmind-automation/client-vue` and register into the design-system-hosted registry through `registerEntry`. They move into their domain modules with the ADR 023 package cut.

**Why.** §5 never said where the engine lives — FE-2941 put it in `packages/client-vue` as an implementation decision, not an ADR one. One physical copy, owned by the design system, is what lets every consumer (cart, portal, and the design system's own Storybook) render the same form chrome without taking `client-vue` into its dependency graph. Two further statements in §5 are stale and are corrected here rather than left to mislead: the re-skin it called "the only form work" shipped with FE-2890 / FE-2941, and the renderer split is generic vs Upmind-domain, not the flat "~11 JSONForms renderers" §5 counted.

**Caveat — §8's gate was not issued for this move.** §8's safety gate (the Playwright e2e + visual-regression suite) did not run: `pnpm test:e2e chrome` exits 1 with zero tests on a module-load error that reproduces unchanged on `develop`, and `pnpm visreg:chrome` has no committed baselines to compare against. The relocation is therefore proven at unit and integration level only — `client-vue` type-checks clean against the hosted engine and its full suite passes, and mutating **design-system** source reddens `client-vue`'s assertions, which proves the app runs the hosted engine rather than a copy or a stale `dist` — and it is unproven at e2e and visual level, so reaffirming §8 above records that its rule still binds, not that its gate was satisfied here.

**See also** the ADR 023 amendment of the same date, which narrows its binding constraint 5 ("`ui` stays presentational") to `ui`'s `src/components/` tree — the consequence this placement forces, and the reason the engine sits at `src/form/` rather than under `src/components/`.

---

## References

- Analysis: [`../plans/ui-migration/analysis.md`](../plans/ui-migration/analysis.md)
- Sequenced plan: [`../plans/ui-migration/migration-plan.md`](../plans/ui-migration/migration-plan.md)
- Decision log (with superseded council positions): [`../plans/ui-migration/decision-log.md`](../plans/ui-migration/decision-log.md)
- ADR 023 (UI domain package architecture) — the lib is a first-class monorepo citizen there; this ADR governs the library adoption.
- ADR 003 (shared icons package), ADR 012 (multi-theme architecture), ADR 016 (schema-based validation).
