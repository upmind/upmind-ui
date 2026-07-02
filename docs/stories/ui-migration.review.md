# Migrate to in-tree @upmind-automation/upmind-ui (reka-ui + Tailwind 4 + token engine)

> Generated from `docs/stories/ui-migration.json` — do not hand-edit. Edit the JSON and re-render.

**Team:** FE  ·  **Labels:** frontend, ui-migration

### Overview
Replace the `packages/ui` git submodule with the new Upmind UI library (reka-ui + Tailwind 4 + a token engine with derived dark mode), vendored in-tree as first-class `@upmind-automation/*` packages. The package name `@upmind-automation/upmind-ui` is kept, so the 338 client-vue import sites and every app alias never move — no rename, no shim.

### Prime directive
Nothing flips before its replacement is proven. A construct is removed only after its consumers are migrated off it. Each slice flips only after its safety gate — the monorepo's existing Playwright e2e + visual-regression suite, run before/after — is green.

### Source of truth
- ADR: docs/adr/024-adopt-new-upmind-ui-in-tree.md
- Plan: docs/plans/ui-migration/migration-plan.md
- Analysis: docs/plans/ui-migration/analysis.md
- Decisions: docs/plans/ui-migration/decision-log.md

### Key ratified decisions
- Keep the package name; no rename, no re-export shim, no 5-package lockstep.
- Retire the standalone upstream repo — monorepo is the sole home.
- Retire `useStyles`/`uiConfig`/`*.config.ts` override layer; keep `cva()` internal.
- Theming via `defineTheme` + `data-theme`; ship dark mode (system default + toggle + per-brand).
- Brand = base set (light+dark) + per-tenant RUNTIME overrides + one-time backfill; cascade fallback to base (no kill-switch).
- Keep JSON Schema + AJV + JSONForms; delete the new lib's Zod form layer; only re-skin renderers.
- Storybook SB10 + docs as standalone deploys; salvage Lottie + locale JSONs.

### Success criteria
- [ ] New packages vendored in-tree and installing/building in CI; old submodule detached.
- [ ] Every consumer slice migrated behind a green Playwright e2e + vis-reg gate.
- [ ] `useStyles`/`uiConfig` and bespoke theming fully retired.
- [ ] All production tenant brands render correctly (light + dark) post-backfill.
- [ ] Forms unchanged in behaviour (JSONForms/AJV/i18n intact); Zod removed.
- [ ] No net feature loss; no Zod in the dependency tree.

## Phase overview

| Phase | Stories | Points |
|---|---|---|
| Phase 0 — Pre-flight (no code flips; unblocks everything) | 4 | 10 |
| Phase 1 — Vendor the packages in-tree, name-kept | 2 | 8 |
| Phase 2 — Confirm the regression net | 5 | 13 |
| Phase 3 — Leaf utilities + present-in-both components | 5 | 15 |
| Phase 4 — Themed/interactive + the 3 breaking components + gaps | 10 | 40 |
| Phase 5 — Brand-token cutover (gated; runtime base+overrides + backfill) | 6 | 26 |
| Phase 6 — The useStyles layout layer + client-vue bulk | 4 | 16 |
| Phase 7 — Form renderer re-skin (LAST, GATED) — NOT an engine swap | 3 | 12 |
| **Total** | **39** | **140** |


---

## Phase 0 — Pre-flight (no code flips; unblocks everything)

### Phase
Pre-flight tasks that unblock install/build/review. Touch no call-site, cause no regression.

### Safety gate
A throwaway branch landing the three packages installs cleanly (`pnpm install` resolves), tokens build + `build:registry` succeed in CI, and a trivial app import of `@upmind-automation/upmind-ui` + its styles entry compiles.

### P0-1: Port a reconciled pnpm catalog into pnpm-workspace.yaml  _(3 pts)_

**Blocked by:** — (ready to start)

#### Goal
Make the vendored packages installable by resolving their 42 `catalog:` refs in the monorepo.

#### Acceptance Criteria
- [ ] `catalog:` block added to `pnpm-workspace.yaml` covering all 42 refs (ui 31 / tokens 4 / mcp 7).
- [ ] Versions reconciled against the monorepo's pins (vite/vitest/@tailwindcss/vite) unless the new apps force a bump.
- [ ] `tailwindcss` bumped to `^4.3.0` workspace-wide.
- [ ] `pnpm install` resolves with no unmet `catalog:`/`workspace:` specifiers.

#### Technical Notes
The monorepo has no catalog today; this is the hard install blocker. Owner: platform.
The Tailwind ^4.3.0 bump is non-breaking within TW4 (`@theme inline` parses at 4.1.18); rationale = pnpm peer-warning cleanup + incidental 4.2/4.3 features (decision-log §6).

#### Out of Scope
- CI build-order wiring for tokens/registry (covered by P0-2).
- Node engines floor change (covered by P0-3).
- Vendoring the packages themselves (covered by P1-1).

### P0-2: Wire tokens + registry build order into CI  _(3 pts)_

**Blocked by:** P0-1

#### Goal
Produce the generated artifacts (`@upmind-automation/tokens` dist CSS, `@upmind-automation/upmind-ui` registry.json) in CI ahead of any consumer build.

#### Acceptance Criteria
- [ ] `.gitlab-ci.yml` runs `pnpm --filter @upmind-automation/tokens build` then `... upmind-ui build:registry` before consumer builds.
- [ ] tokens-dist + ui-registry treated as CI-generated artifacts, never committed.
- [ ] `pnpm -r build` orders topologically (workspace:* deps declared).

#### Technical Notes
Currently tokens/dist + registry.json are gitignored/unbuilt → consumer CSS imports + MCP/docs export break without this. Owner: platform.

#### Out of Scope
- Catalog reconciliation (covered by P0-1).
- Node engines floor change (covered by P0-3).
- Submodule detach (covered by P1-2).

### P0-3: Raise Node engines floor to >=22.18  _(1 pts)_

**Blocked by:** — (ready to start)

#### Goal
Allow tokens/mcp builds that rely on native TS stripping.

#### Acceptance Criteria
- [ ] root `package.json` `engines.node` set to `>=22.18`.
- [ ] CI node image satisfies the floor.

#### Technical Notes
Below 22.18 the MCP/tokens TS-source execution fails. Owner: platform.

#### Out of Scope
- Catalog or build-order changes (covered by P0-1 and P0-2).
- Agent rules updates (covered by P0-4).
- Nothing beyond the two criteria above.

### P0-4: Update the .agent shared rules to the token-driven styling model  _(3 pts)_

**Blocked by:** — (ready to start)

#### Goal
Stop reviewers and code-gen agents rejecting the new lib's code / reproducing the dead pattern.

#### Acceptance Criteria
- [ ] `.agent/rules/code-ui.md` + `code-reviews.md` drop the `useStyles` sample, the 'no inline Tailwind' rule, and the separate `.styles.ts`/`.config.ts` rule.
- [ ] Token-utility + CVA-as-class-organiser model documented.
- [ ] All standards homes swept (`.agent/rules/*`, `packages/client-vue/CLAUDE.md`).
- [ ] `.claude` rules re-synced from `.agent` (canonical source).

#### Technical Notes
Must precede any consumer migration (D-8). Owner: technical-writer.

#### Out of Scope
- Actual component migrations (Phase 3+).
- CI pipeline changes (covered by P0-2).
- Brand token documentation (covered by Phase 5 stories).


---

## Phase 1 — Vendor the packages in-tree, name-kept

### Phase
Vendor the three packages under `packages/`, rename to the `@upmind-automation/*` convention (ui name kept), detach the old submodule. No consumer flips.

### Safety gate
`pnpm install` + full `pnpm -r build` green with every consumer importing the unchanged specifier; existing Playwright + VRT suite green (baseline unchanged).

### P1-1: Vendor + rename the 3 packages to the @upmind-automation/* convention  _(5 pts)_

**Blocked by:** P0-1, P0-2, P0-3

#### Goal
Bring the new lib in-tree under the monorepo naming, keeping the ui name so consumers never move.

#### Acceptance Criteria
- [ ] Source copied under `packages/`; `@upmind/ui`→`@upmind-automation/upmind-ui` (kept), `@upmind/tokens`→`@upmind-automation/tokens`, `@upmind/mcp`→`@upmind-automation/mcp`.
- [ ] Mechanical find-replace of internal `@upmind/*` refs (package.json names/deps, internal imports, registry/styles entrypoints, MCP guidelines).
- [ ] Inter-package deps retargeted to `workspace:*`; packages declared in `pnpm-workspace.yaml`.
- [ ] `pnpm install` + `pnpm -r build` green.

#### Technical Notes
No consumer specifier changes (kept name). No shim, no lockstep.

#### Out of Scope
- Submodule detach (covered by P1-2).
- Any consumer call-site migrations (Phase 3+).
- Brand token cutover (Phase 5).

### P1-2: Detach the old packages/ui submodule + rewire .gitmodules and CI  _(3 pts)_

**Blocked by:** P1-1

#### Goal
Remove the submodule cleanly in a single-purpose, revertible commit.

#### Acceptance Criteria
- [ ] `git submodule deinit -f packages/ui && git rm packages/ui && rm -rf .git/modules/packages/ui`.
- [ ] `packages/ui` stanza removed from `.gitmodules`.
- [ ] `.gitlab-ci.yml` `GIT_SUBMODULE_PATHS` exclude + manual re-init for `packages/ui` removed.
- [ ] Standalone `git.upmind.io/upmind/upmind-ui` repo marked retired (sole home = monorepo; no sync wiring).
- [ ] CI green; consumers resolve the in-tree package.
- [ ] radix-vue peer is no longer resolved (gone with the submodule, deprecation row 147).

#### Technical Notes
Dedicated commit for legible history / trivial revert (D-1).

#### Out of Scope
- Vendoring or renaming the packages (covered by P1-1).
- Consumer call-site migrations (Phase 3+).
- Nothing beyond the submodule removal and CI rewire.


---

## Phase 2 — Confirm the regression net

### Phase
Use the monorepo's existing Playwright e2e + visual-regression suite; wire the new lib's own gates into CI. No new VRT or bundle infra.

### Slice exit criterion (applies Phase 3+)
1. Existing Playwright e2e + vis-reg green before/after the flip.
2. >=1 co-located Vitest test asserting the migrated component's token classes / aria.
3. SB10 a11y gate green for every story exercising the component.

### P2-1: Fix the failing token test (font-display-weight)  _(1 pts)_

**Blocked by:** P1-1

#### Goal
Get the new lib's test suite + WCAG contrast gate green.

#### Acceptance Criteria
- [ ] `define-theme.test.ts` `font-display-weight` reconciled (expects 400; `themes.ts:37` emits 500 — fix the stale side).
- [ ] tokens WCAG contrast suite green.

#### Technical Notes
The contrast suite is the merge gate; it must be green before relying on it.

#### Out of Scope
- Wiring the gate into CI (covered by P2-2).
- Playwright or VRT suite work (covered by P2-3).
- Tree-shaking verification (covered by P2-4).

### P2-2: Wire the new lib's own gates into CI  _(3 pts)_

**Blocked by:** P1-1, P2-5

#### Goal
Keep the strongest nets the new lib brings, running on every PR.

#### Acceptance Criteria
- [ ] Vendored lib's Vitest component suite runs on every PR.
- [ ] `@upmind-automation/tokens` WCAG contrast gate runs on every PR.
- [ ] SB10 a11y:error runner runs on every PR.

#### Technical Notes
These must survive the vendor step, not be dropped at the boundary.

#### Out of Scope
- Fixing the failing token test (covered by P2-1).
- Playwright/VRT baseline confirmation (covered by P2-3).
- Bundle/tree-shaking checks (covered by P2-4).

### P2-3: Confirm the existing Playwright e2e + vis-reg suite is the slice gate  _(2 pts)_

**Blocked by:** P1-1

#### Goal
Establish the migration safety gate from existing infra (no new VRT).

#### Acceptance Criteria
- [ ] Confirm Playwright e2e + visual-regression baselines are real (resolve committed-vs-gitignored PNGs).
- [ ] Suite documented as the before/after gate for every Phase 3+ slice.

#### Technical Notes
Corrects the council's 'no VRT infra' claim — it exists (Item 11).

#### Out of Scope
- Adding new VRT infrastructure (explicitly not in scope per ADR).
- Wiring new lib gates into CI (covered by P2-2).
- Running actual component migrations (Phase 3+).

### P2-4: Verify tree-shaking (granular exports + sideEffects)  _(2 pts)_

**Blocked by:** P1-1

#### Goal
Keep the bundle lean and ensure Zod stays out — match current behaviour.

#### Acceptance Criteria
- [ ] Per-component exports are granular; `sideEffects` correctly declared (CSS only).
- [ ] A test import of one component does not pull the whole lib or Zod.
- [ ] No bundle-size CI budget added (Item 11).

#### Technical Notes
Zod is deleted in Phase 7; tree-shaking guarantees it's not bundled meanwhile.

#### Out of Scope
- Deleting Zod from the source (covered by P7-1).
- Adding a bundle-size CI budget (explicitly out of scope per Item 11).
- Any consumer migration work (Phase 3+).

### P2-5: Stand up SB10 + docs as standalone deploys; salvage Lottie + locale JSONs; retire SB8  _(5 pts)_

**Blocked by:** P1-1

#### Goal
Bring the new Storybook (SB10) + docs site online as standalone deploys (D-7), salvage value from the old SB8, retire SB8.

#### Acceptance Criteria
- [ ] SB10 + docs site deploy standalone.
- [ ] The 15 Lottie JSONs salvaged.
- [ ] Locale JSONs kept temporarily.
- [ ] The SB10 a11y:error runner is available (P2-2 wires it into CI).
- [ ] Old playgrounds/storybook (SB8) retired.
- [ ] Consumes registry.json from P0-2.

#### Technical Notes
D-7 + deprecation row 157.

#### Out of Scope
- Component migrations.
- The a11y CI wiring itself (covered by P2-2).


---

## Phase 3 — Leaf utilities + present-in-both components

### Phase
Mechanical, low-risk per-callsite changes against the unchanged specifier. No useStyles, no JSONForms, no theming. Compatible components swap silently.

### Safety gate
Per-slice exit criterion (Playwright+VRT, co-located test, a11y).

### P3-1: Migrate leaf utilities off the old lib  _(3 pts)_

**Blocked by:** P2-3, P0-4

#### Goal
Relocate/replace the small utility surface.

#### Acceptance Criteria
- [ ] `isMobile`→`@vueuse useMediaQuery`; `isEmptySlot`→local util; `parseVariants`/`VariantValues`→relocated into client-vue; `useForwardPropsEmits`→`reka-ui`.
- [ ] `useStyleSheet` dropped (0 uses).
- [ ] `tsc` + unit tests green.

#### Technical Notes
Blocker-free leaves; do first.

#### Out of Scope
- Migrating any component (covered by P3-2 and Phase 4).
- useStyles retirement (covered by Phase 6).
- Nothing beyond the listed utility relocations.

### P3-2: Migrate pure-static components  _(5 pts)_

**Blocked by:** P2-3, P0-4

#### Goal
Swap the API-compatible, theming-free components.

#### Acceptance Criteria
- [ ] Skeleton, Badge (prop-adapter), Avatar, Tooltip, Card, Separator, DescriptionList, Pagination, Breadcrumb migrated.
- [ ] FormField (11 uses) migrated as a static prop-adapter.
- [ ] Alert (26 uses) migrated as a two-axis prop-adapter: `color`→`variant` and `variant`→`appearance`.
- [ ] Rename: Banner→announcement-bar; validate the 1 live use (per-slice exit criterion).
- [ ] Existing Playwright e2e + vis-reg green before/after.
- [ ] Co-located Vitest test + SB10 a11y green per component.

#### Technical Notes
No useStyles, no theming — should swap silently behind the kept name.
Silent-swap audit (analysis §5.1): Collapsible, Label, List, Textarea have no consumer — they swap silently, no flip.

#### Out of Scope
- Interactive or themed components (covered by Phase 4 — Accordion, DropdownMenu, Popover, RadioGroup go to P4-4).
- Lottie plugin bootstrap removal (covered by P3-3).
- Component renames Sonner/Lineclamp/InputOtp (covered by P3-4).

### P3-3: Remove the Lottie plugins bootstrap (per app)  _(2 pts)_

**Blocked by:** P2-3, P0-4, P1-1

#### Goal
Drop the app-level `forEach(uiPlugins…)` registration now that AnimatedIcon self-registers.

#### Acceptance Criteria
- [ ] Per app: delete the bootstrap block ONLY after that app's `IconAnimated`/`<lord-icon>` call-sites use the new `AnimatedIcon`.
- [ ] Animated icons render in each app (cart, cart-nuxt, hosting, velia).

#### Technical Notes
New `AnimatedIcon` self-registers `<lord-icon>` (lazy/SSR-safe).
AnimatedIcon self-registers from the vendored lib (P1-1); swap call-sites before deleting the bootstrap.

#### Out of Scope
- Icon name-map or resolver work (covered by P4-2).
- Other plugin bootstrap removals unrelated to Lottie/AnimatedIcon.
- Nothing beyond the listed apps.

### P3-4: Component renames (Sonner→Toaster, Lineclamp→ClampText, InputOtp→PinInput)  _(2 pts)_

**Blocked by:** P2-3, P0-4

#### Goal
Apply the straight renames.

#### Acceptance Criteria
- [ ] `Sonner`→`Toaster`, `Lineclamp`→`ClampText`, `InputOtp`→`PinInput` at all call-sites.
- [ ] Per-slice exit criterion green.

#### Technical Notes
Mechanical; codemod-assisted.

#### Out of Scope
- Breaking API changes beyond a rename (those belong in Phase 4).
- Icon renames or custom-pack name-maps (covered by P4-2).
- Nothing beyond the three listed component renames.

### P3-5: Adopt the per-app styles entry (cart, cart-nuxt, hosting, velia); drop /vars, @source globs, tailwindcss-animate  _(3 pts)_

**Blocked by:** P1-1, P2-3

#### Goal
Swap each app's CSS import to the new lib's styles entry and remove the superseded styling plumbing (deprecation rows 148-150).

#### Acceptance Criteria
- [ ] Each of the 4 apps imports the new styles entry.
- [ ] `/vars` alias + `vars.css` removed.
- [ ] Hardcoded `@source` globs removed (new styles entry self-declares `@source`).
- [ ] `tailwindcss-animate` dropped.
- [ ] Per-slice exit criterion green per app.

#### Technical Notes
P1-1 is intra-lib only; this is the per-app consumer adoption. Run early in Phase 3.

#### Out of Scope
- In-component token migration (Phase 6).


---

## Phase 4 — Themed/interactive + the 3 breaking components + gaps

### Phase
Themed/interactive components behind a verified token bridge. The 3 breaking components (Button/Icon/Link) get an in-package adapter or per-component flip; each built/remapped component lands before its call-sites move. Build the genuine gaps; retire the dead ones.

### Safety gate
Per-slice exit criterion + manual visual sweep for Icon glyphs.

### P4-1: Button variant codemod (2D variant×color → single variant + slots)  _(5 pts)_

**Blocked by:** P2-3, P0-4, P4-2

#### Goal
Map the old Button API to the new single-axis variant model without regressions.

#### Acceptance Criteria
- [ ] Hand-built map: old `variant`×`color` matrix → single `variant`; content props (`label`/`icon`/`avatar`) → slots.
- [ ] `control` handled per-site (2 sites, no target): add a `control` variant on `bg-control-surface`/`shadow-control`, OR re-express as outline/ghost+class.
- [ ] Codemod + `tsc` (not blind sed).
- [ ] Playwright VRT on every Button surface; `control` sites reviewed by hand.

#### Technical Notes
Breaking component — lands before call-sites move.

#### Out of Scope
- Icon name-map (covered by P4-2).
- Link colour-axis migration (covered by P4-3).
- ButtonGroup composition (covered by P4-8).

### P4-2: Icon resolver + custom-pack→lucide name-map (~99 dynamic usages)  _(5 pts)_

**Blocked by:** P2-3, P0-4

#### Goal
Keep every dynamic `icon="…"` rendering the correct glyph under the new Icon.

#### Acceptance Criteria
- [ ] String→component resolver re-homes the `registerIcons`/`loadIcon` API.
- [ ] Explicit custom-pack (Untitled-UI) → lucide name-translation table for the ~99 usages.
- [ ] Resolver handles the ~99 dynamic usages.
- [ ] lucide 0.x→1.x rename audit run.
- [ ] Manual visual sweep confirms correct glyphs (tsc/VRT won't catch wrong glyphs).

#### Technical Notes
Silent-wrong-glyph risk — manual sweep is mandatory.

#### Out of Scope
- Button variant codemod (covered by P4-1).
- Lottie/AnimatedIcon bootstrap (covered by P3-3).
- Building gap components that embed icons (covered by P4-6).

### P4-3: Build Link component + migrate its colour-axis call-sites  _(5 pts)_

**Blocked by:** P2-3, P0-4

#### Goal
Replace the 29 Link usages without losing the colour axis or nuxt routing.

#### Acceptance Criteria
- [ ] Link built into the lib (first-class, stories + a11y).
- [ ] Map `color` axis: muted (20), inherit (12), danger (2) to props/classes; `color="inherit"` gets explicit `text-inherit`.
- [ ] `icon` moved to slot (5 sites).
- [ ] asChild/RouterLink path validated separately for cart-nuxt (NuxtLink).
- [ ] Playwright VRT + navigation works in all apps incl. cart-nuxt.

#### Technical Notes
Breaking component; cart-nuxt routing differs from vue-router.

#### Out of Scope
- Button variant codemod (covered by P4-1).
- Icon name-map (covered by P4-2).
- Theming layer migration (covered by Phase 6).

### P4-4: Migrate remaining interactive components  _(5 pts)_

**Blocked by:** P2-3, P0-4

#### Goal
Swap the interactive primitives-backed components.

#### Acceptance Criteria
- [ ] Input, Dialog, Drawer, Select (primitive parts), Combobox, NumberField, Tabs (primitive parts), Switch migrated.
- [ ] Accordion (1 use), DropdownMenu (1 use), Popover (1 use), RadioGroup (6 uses) migrated.
- [ ] Per-slice exit criterion green for each.

#### Technical Notes
reka-ui primitives; verify keyboard/focus parity.

#### Out of Scope
- Breaking components Button/Icon/Link (covered by P4-1, P4-2, P4-3).
- Option-tile/card-family remap (covered by P4-5).
- Gap components that don't exist in the old lib (covered by P4-6).

### P4-5: Remap the card family → option-tile  _(3 pts)_

**Blocked by:** P2-3, P0-4

#### Goal
Move RadioCards/CheckboxCards/SelectCards/RadioCardsCollapsible to the new option-tile family.

#### Acceptance Criteria
- [ ] Remapped to `option-tile` (group mode + nested).
- [ ] UX parity confirmed in live purchase flows (`BasketProductTermSelector`, `ProductTerm`) before flipping.
- [ ] Playwright VRT on purchase flow + interaction test.

#### Technical Notes
Equivalent exists (not a build) — per-callsite API remap.

#### Out of Scope
- CheckboxGroup composition (covered by P4-8).
- Building gap components from scratch (covered by P4-6).
- Carousel (covered by P4-7).

### P4-6: Build the genuine gap components  _(5 pts)_

**Blocked by:** P2-3, P4-4

#### Goal
Build the missing components into the lib as first-class (stories + a11y).

#### Acceptance Criteria
- [ ] Interstitial (compose Stage+EmptyState+AnimatedIcon+Dialog).
- [ ] Markdown (+ Sanitized via dompurify).
- [ ] Image/ImageGrid; Search; Loading-overlay wrapper.
- [ ] RadioCardsCollapsible suppressed focus rings NOT carried forward.
- [ ] Sanitized/Markdown strip `<script>`, `on*` handlers, and `javascript:` URLs (co-located XSS test); Markdown renders only through Sanitized.
- [ ] Per-component exit criterion + a11y gate.

#### Technical Notes
MUST be split per-component at execution kickoff (e.g. Sanitized+Markdown / Interstitial / Image+ImageGrid+Search+Loading-overlay).

#### Out of Scope
- Carousel (covered by P4-7).
- ButtonGroup/CheckboxGroup composition (covered by P4-8).
- Retiring zero-use components (covered by P4-9).

### P4-7: Build Carousel into the lib  _(3 pts)_

**Blocked by:** P2-3

#### Goal
Replace the Embla-driven Carousel used by recommendations.

#### Acceptance Criteria
- [ ] Carousel built into the lib (Embla-backed), exposing the API `CardsCarousel.vue` needs (`@init-api`, `slidesInView()`, `containerNode()`).
- [ ] Playwright VRT on `CardsCarousel` (recommendations).

#### Technical Notes
No new-lib equivalent; 1 non-trivial call-site drives the Embla API directly.

#### Out of Scope
- Other gap components (covered by P4-6).
- ButtonGroup/CheckboxGroup (covered by P4-8).
- Nothing beyond the CardsCarousel call-site API surface.

### P4-8: Compose ButtonGroup (2 sites) + CheckboxGroup (checkout-critical)  _(3 pts)_

**Blocked by:** P2-3, P0-4, P4-4, P1-1

#### Goal
Replace the two no-equivalent group widgets by composing from new primitives at their call-sites.

#### Acceptance Criteria
- [ ] ButtonGroup composed inline at its 2 non-checkout sites from new `Toolbar` + `Select` (EmailHistorySort, ProductSort).
- [ ] CheckboxGroup composed at `ApplyToOthers.vue` from reka `CheckboxGroupRoot` + new `Checkbox`.
- [ ] VRT + interaction test at each site; checkout flow green for `ApplyToOthers` (checkout-critical).

#### Technical Notes
CheckboxGroup is in the gated product-setup step — cannot be dropped.
Checkbox + Toolbar ship ready in the vendored lib (P1-1) as present-in-both COMPOSE primitives (cf. Switch) — compose only, do not build; do not add them to P4-4's build list.

#### Out of Scope
- Icon name-map (separate story P4-2).
- Option-tile/card-family remap (covered by P4-5).
- Consumer call-sites beyond the listed 3 sites (EmailHistorySort, ProductSort, ApplyToOthers).

### P4-9: Retire Autocomplete + Indicator (0 uses)  _(1 pts)_

**Blocked by:** — (ready to start)

#### Goal
Drop the two components with zero consumers.

#### Acceptance Criteria
- [ ] Confirm 0 usages remain (grep client-vue/apps/playgrounds).
- [ ] Not carried into the vendored lib's public surface (or removed).

#### Technical Notes
Autocomplete's reka Combobox primitives remain available if needed later.

#### Out of Scope
- Retiring any component that has active call-sites.
- Combobox primitive removal (reka-ui Combobox stays; only the wrapper is dropped).
- Nothing beyond the two listed components.

### P4-10: Migrate call-sites onto the built gap components + Loading→Spinner  _(5 pts)_

**Blocked by:** P4-6

#### Goal
Flip live consumers onto the gap components built in P4-6 (P4-6 builds; this flips).

#### Acceptance Criteria
- [ ] Migrate call-sites for Markdown (12 uses), Interstitial (9), Image/ImageGrid (2), Search (1+2), and Loading→Spinner (5 uses).
- [ ] Each flip behind the per-slice exit criterion (Playwright e2e + vis-reg green before/after).
- [ ] Old components retired only after their sites move.

#### Technical Notes
Components are built in P4-6; mirrors P4-3 (Link)'s build-then-flip pattern.

#### Out of Scope
- Building the components (covered by P4-6).
- Bare Spinner usages if they swap silently (covered by P3-2).


---

## Phase 5 — Brand-token cutover (gated; runtime base+overrides + backfill)

### Phase
Independent of component slices; must NOT be bundled with them. Base token set (light+dark) ships in the lib; per-tenant overrides apply at RUNTIME via the data-theme/CSS cascade; one-time backfill renames old token vars → new; cascade fallback to base is the safety net (no kill-switch). BE→UI transport unchanged.

### Safety gate
Per-tenant visual diff with WCAG-nudge triage; cascade fallback demonstrably degrades to base, never collapses.

### P5-1: Inventory production tenant brands  _(3 pts)_

**Blocked by:** — (ready to start)

#### Goal
Know the full shape of tenant brand data before cutover.

#### Acceptance Criteria
- [ ] Count tenants; dump each `style.tokens`.
- [ ] Classify: (1) standard (anchors + radius + font), (2) dark-active (`meta.variant: "dark"`), (3) exotic per-token overrides.
- [ ] Each class has a per-tenant plan; classes (2)/(3) flagged.

#### Technical Notes
Open string-keyed overrides reach all ~320 tokens, so all classes are expressible as runtime overrides.

#### Out of Scope
- Building the base token set or runtime override path (covered by P5-2).
- Data migration/backfill (covered by P5-3).
- Per-tenant visual diff (covered by P5-4).

### P5-2: Build the base token set + runtime override path  _(5 pts)_

**Blocked by:** P1-1

#### Goal
Ship the base theme and the in-app runtime override mechanism with cascade fallback.

#### Acceptance Criteria
- [ ] Base light+dark theme ships in the lib (WCAG-checked).
- [ ] Runtime (option B) override path: tenant overrides layer over base via data-theme/CSS cascade.
- [ ] Un-overridden/missing/bad tokens demonstrably fall back to base (no collapse).
- [ ] Base passes the WCAG gate.

#### Technical Notes
BE→UI transport unchanged; the cascade is the safety net.

#### Out of Scope
- Per-tenant inventory (covered by P5-1).
- Data migration/backfill of existing tenant token names (covered by P5-3).
- Dark mode user toggle UI (covered by P5-5).

### P5-3: One-time backfill: old → new token variable names  _(5 pts)_

**Blocked by:** P5-1, P5-2

#### Goal
Convert existing tenants' stored token vocabulary to the new names so their brands survive.

#### Acceptance Criteria
- [ ] Data migration renames each tenant's stored token vars old→new (not a runtime shim).
- [ ] Backfilled strings resolve against the new tokens.
- [ ] Spot-checked tenants render their brand; un-mapped tokens fall back to base.
- [ ] Migration is reversible at the data layer.

#### Technical Notes
The #1 risk mitigation — done at the brand-delivery boundary before flipping.
Cutover assumes the BE emits new token names from go-live; the CSS cascade falls back to base for any un-mapped string (D-5, BE→UI transport unchanged).

#### Out of Scope
- Per-tenant visual diff (covered by P5-4).
- Dark mode or `preferredMode` handling (covered by P5-5).
- Retiring brand uiConfig (covered by P5-6).

### P5-4: Per-tenant visual diff + WCAG-nudge triage  _(5 pts)_

**Blocked by:** P5-3

#### Goal
Prove every tenant looks right old-vs-new before go-live.

#### Acceptance Criteria
- [ ] Render each tenant old-vs-new on checkout/portal/forms/buttons (light + dark).
- [ ] Diff report separates intentional WCAG nudges (engine deepens sub-4.5:1 fills) from genuine regressions.
- [ ] Reviewed diff per tenant.

#### Technical Notes
WCAG nudges are correct, not regressions — triage must not flag them as breakage.

#### Out of Scope
- Dark mode feature delivery (covered by P5-5).
- Retiring brand uiConfig (covered by P5-6).
- Nothing beyond the visual diff and triage report.

### P5-5: Ship dark mode to users  _(5 pts)_

**Blocked by:** P5-2, P6-2

#### Goal
Turn on dark mode with the agreed selection model.

#### Acceptance Criteria
- [ ] System-preference default + persistent user toggle (overrides) + per-brand `preferredMode` initial default.
- [ ] Dark-mode a11y smoke pass on client-vue layout/content (hardcoded backgrounds inherit dark tokens; focus rings visible).
- [ ] Dark-active tenants handled per the 5.1 inventory.
- [ ] Toggle persistence + brand `preferredMode` default verified.

#### Technical Notes
Minor open item: whether a tenant can force/lock a mode (vs toggle always winning).

#### Out of Scope
- Per-tenant visual diff (covered by P5-4).
- Retiring brand uiConfig (covered by P5-6).
- useStyles/theming layer migration (covered by Phase 6).

### P5-6: Retire brand uiConfig (bake structural overrides)  _(3 pts)_

**Blocked by:** P5-2, P6-2

#### Goal
Remove the brand `ui.config.ts` override surface.

#### Acceptance Criteria
- [ ] color/gradient/radius/font re-expressed as token inputs.
- [ ] ~6 structural/type overrides baked into the migrated client-vue components (prop or built-in).
- [ ] velia/hosting `ui.config.ts` deleted; dead hosting gradient blocks dropped.
- [ ] Visual parity per brand.

#### Technical Notes
The override system dies; the behaviours don't (D-3).
The ~6 structural overrides target P6-2 layout primitives (decision-log §4). If any targets a P6-3-bulk component, add P6-3 to blockedBy.

#### Out of Scope
- The bulk useStyles file migration (covered by P6-3).
- Theming layer defineTheme migration (covered by P6-4).
- Per-tenant visual diff (covered by P5-4).


---

## Phase 6 — The useStyles layout layer + client-vue bulk

### Phase
The long pole: 103 files + 38 `*.config.ts` re-expressed against token utilities / `cn()`. Override system retired entirely; the ~6 orphan behaviours baked into components.

### Safety gate
Playwright VRT per layout surface; theme switching works.

### P6-1: Freeze useStyles (no new call-sites)  _(1 pts)_

**Blocked by:** P0-4

#### Goal
Stop the override surface growing during migration.

#### Acceptance Criteria
- [ ] Lint/grep guard blocks new `useStyles` call-sites.
- [ ] New layout primitives/variants use the token API directly.

#### Technical Notes
Guard precedes the bulk rewrite.

#### Out of Scope
- Migrating existing useStyles call-sites (covered by P6-2 and P6-3).
- Theming layer migration (covered by P6-4).
- Nothing beyond the lint/grep guard.

### P6-2: Migrate layout primitives + their configs to token utilities  _(5 pts)_

**Blocked by:** P6-1, P4-4

#### Goal
Rewrite the core layout primitives off useStyles.

#### Acceptance Criteria
- [ ] `Page`/`Content`/`Container`/`Root`/`Column`/`Ribbon`/`Footer*` + their `*.config.ts` rewritten to token utilities + `cn()`.
- [ ] Orphan behaviours (force-hide, font-weight override) baked into the component as prop/built-in.
- [ ] Playwright VRT per layout surface.

#### Technical Notes
Large surface — will sub-divide into per-area tasks during execution.
The P4-4 edge is intentional — P6-2's per-layout VRT renders whole screens containing P4-4 interactive components, so flipping interactives first keeps the baseline clean (blast-radius staging).

#### Out of Scope
- The remaining 103 useStyles files beyond layout primitives (covered by P6-3).
- Theming layer / defineTheme migration (covered by P6-4).
- Retiring brand uiConfig (covered by P5-6).

### P6-3: Migrate the client-vue useStyles bulk (remaining of 103 files)  _(5 pts)_

**Blocked by:** P6-2

#### Goal
Retire the remaining useStyles call-sites across client-vue.

#### Acceptance Criteria
- [ ] Remaining of the 103 `useStyles` files + 38 configs re-expressed against token utilities / `cn()`.
- [ ] `useStyles`/`uiConfig`/`*.config.ts` shape deleted once the last file migrates.
- [ ] Playwright VRT per affected surface.

#### Technical Notes
The long pole — decompose into per-module sub-tasks during execution. Optional thin client-vue-local merge helper if 103 can't move in one slice (not re-exported, not re-adopted).

#### Out of Scope
- Layout primitives (covered by P6-2).
- Theming layer / defineTheme migration (covered by P6-4).
- Brand uiConfig retirement (covered by P5-6).

### P6-4: Migrate the theming layer to defineTheme + data-theme  _(5 pts)_

**Blocked by:** P5-2, P6-2, P4-2

#### Goal
Replace the bespoke theming registry.

#### Acceptance Criteria
- [ ] `defineTheme` + data-theme path stood up in `client-vue/modules/theming/useTheme.ts` (co-migrate `setTokens`/font-loading; drop `Theme.uiConfig`).
- [ ] 14 call-sites migrated; old registry deleted.
- [ ] `useThemeIcons` resolved separately (per-brand icon-variant selection in the new Icon).
- [ ] Theme switching works; VRT green.

#### Technical Notes
useThemes/Theme.uiConfig retired here.

#### Out of Scope
- useStyles bulk migration (covered by P6-3).
- Brand uiConfig retirement (covered by P5-6).
- Dark mode user toggle (covered by P5-5).


---

## Phase 7 — Form renderer re-skin (LAST, GATED) — NOT an engine swap

### Phase
JSON Schema + AJV + JSONForms STAY. The new lib's Zod form layer is deleted; headless and form-error i18n untouched. The only work is re-skinning the ~11 JSONForms renderers to output the new lib's field components.

### Safety gate
Each checkout/provision flow Playwright VRT + interaction green; form-error i18n still localised (verify in >=2 non-English locales).

### P7-1: Delete the vendored Zod form layer  _(2 pts)_

**Blocked by:** P1-1

#### Goal
Remove Zod entirely from the tree.

#### Acceptance Criteria
- [ ] Remove `.../upmind-ui/src/components/form/` (SchemaForm.vue, schema-form.ts, zod-introspect.ts, field-registry.ts, SchemaField.vue, SchemaNode.vue, FormMessage.vue, useFormField.ts + tests/stories).
- [ ] Remove `zod` + `vee-validate` deps.
- [ ] Confirm nothing else imports the Zod form layer first.
- [ ] `tsc` green; no orphaned zod/vee-validate imports.

#### Technical Notes
Forms use JSONForms — this layer is unused (D-6).

#### Out of Scope
- Re-skinning JSONForms renderers (covered by P7-2 and P7-3).
- Any JSONForms engine changes (explicitly not in scope — engine stays).
- Nothing beyond the Zod form layer files listed in the criteria.

### P7-2: Re-skin JSONForms renderers — batch 1  _(5 pts)_

**Blocked by:** P4-4, P4-5, P4-6, P4-2

#### Goal
Make the first half of the renderers output the new lib's field components.

#### Acceptance Criteria
- [ ] Re-skin Address, Domain, EnumRadioCollapsible, Image, Manage renderers.
- [ ] JSONForms wiring (`useUpmindUIRenderer`, `registerEntry`, AJV), headless schemas, and form-error i18n unchanged.
- [ ] Each affected flow Playwright VRT + interaction green; i18n still localised (verify >=2 non-English locales).

#### Technical Notes
Renderer re-skin only — NOT an engine swap.

#### Out of Scope
- Renderers in batch 2 (covered by P7-3).
- Deleting the Zod form layer (covered by P7-1).
- Any changes to JSONForms engine, AJV, or headless schemas.

### P7-3: Re-skin JSONForms renderers — batch 2  _(5 pts)_

**Blocked by:** P4-4, P4-2

#### Goal
Make the second half of the renderers output the new lib's field components.

#### Acceptance Criteria
- [ ] Re-skin GatewayDLocal, Gateways, PaymentDetails, SLD, SubProduct, Terms renderers.
- [ ] JSONForms wiring, headless schemas, and form-error i18n unchanged.
- [ ] Each checkout/provision flow Playwright VRT + interaction green; i18n still localised (verify >=2 non-English locales).

#### Technical Notes
Payment/gateway flows are revenue-critical — extra interaction coverage.

#### Out of Scope
- Renderers in batch 1 (covered by P7-2).
- Deleting the Zod form layer (covered by P7-1).
- Any changes to JSONForms engine, AJV, headless schemas, or payment provider integrations.


---

## Dependency overview

| Story | Blocked by | Blocks |
|---|---|---|
| P0-1 Port a reconciled pnpm catalog into  | — | P0-2, P1-1 |
| P0-2 Wire tokens + registry build order i | P0-1 | P1-1 |
| P0-3 Raise Node engines floor to >=22.18 | — | P1-1 |
| P0-4 Update the .agent shared rules to th | — | P3-1, P3-2, P3-3, P3-4, P4-1, P4-2, P4-3, P4-4, P4-5, P4-8, P6-1 |
| P1-1 Vendor + rename the 3 packages to th | P0-1, P0-2, P0-3 | P1-2, P2-1, P2-2, P2-3, P2-4, P2-5, P3-3, P3-5, P4-8, P5-2, P7-1 |
| P1-2 Detach the old packages/ui submodule | P1-1 | — |
| P2-1 Fix the failing token test (font-dis | P1-1 | — |
| P2-2 Wire the new lib's own gates into CI | P1-1, P2-5 | — |
| P2-3 Confirm the existing Playwright e2e  | P1-1 | P3-1, P3-2, P3-3, P3-4, P3-5, P4-1, P4-2, P4-3, P4-4, P4-5, P4-6, P4-7, P4-8 |
| P2-4 Verify tree-shaking (granular export | P1-1 | — |
| P2-5 Stand up SB10 + docs as standalone d | P1-1 | P2-2 |
| P3-1 Migrate leaf utilities off the old l | P2-3, P0-4 | — |
| P3-2 Migrate pure-static components | P2-3, P0-4 | — |
| P3-3 Remove the Lottie plugins bootstrap  | P2-3, P0-4, P1-1 | — |
| P3-4 Component renames (Sonner→Toaster, L | P2-3, P0-4 | — |
| P3-5 Adopt the per-app styles entry (cart | P1-1, P2-3 | — |
| P4-1 Button variant codemod (2D variant×c | P2-3, P0-4, P4-2 | — |
| P4-2 Icon resolver + custom-pack→lucide n | P2-3, P0-4 | P4-1, P6-4, P7-2, P7-3 |
| P4-3 Build Link component + migrate its c | P2-3, P0-4 | — |
| P4-4 Migrate remaining interactive compon | P2-3, P0-4 | P4-6, P4-8, P6-2, P7-2, P7-3 |
| P4-5 Remap the card family → option-tile | P2-3, P0-4 | P7-2 |
| P4-6 Build the genuine gap components | P2-3, P4-4 | P4-10, P7-2 |
| P4-7 Build Carousel into the lib | P2-3 | — |
| P4-8 Compose ButtonGroup (2 sites) + Chec | P2-3, P0-4, P4-4, P1-1 | — |
| P4-9 Retire Autocomplete + Indicator (0 u | — | — |
| P4-10 Migrate call-sites onto the built ga | P4-6 | — |
| P5-1 Inventory production tenant brands | — | P5-3 |
| P5-2 Build the base token set + runtime o | P1-1 | P5-3, P5-5, P5-6, P6-4 |
| P5-3 One-time backfill: old → new token v | P5-1, P5-2 | P5-4 |
| P5-4 Per-tenant visual diff + WCAG-nudge  | P5-3 | — |
| P5-5 Ship dark mode to users | P5-2, P6-2 | — |
| P5-6 Retire brand uiConfig (bake structur | P5-2, P6-2 | — |
| P6-1 Freeze useStyles (no new call-sites) | P0-4 | P6-2 |
| P6-2 Migrate layout primitives + their co | P6-1, P4-4 | P5-5, P5-6, P6-3, P6-4 |
| P6-3 Migrate the client-vue useStyles bul | P6-2 | — |
| P6-4 Migrate the theming layer to defineT | P5-2, P6-2, P4-2 | — |
| P7-1 Delete the vendored Zod form layer | P1-1 | — |
| P7-2 Re-skin JSONForms renderers — batch  | P4-4, P4-5, P4-6, P4-2 | — |
| P7-3 Re-skin JSONForms renderers — batch  | P4-4, P4-2 | — |

**Ready to start (no blockers):** P0-1, P0-3, P0-4, P4-9, P5-1
