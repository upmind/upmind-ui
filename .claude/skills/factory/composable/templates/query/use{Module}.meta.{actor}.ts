// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" / "Where Shared Code Lives — NO .base Files" / "TanStack
 * Query variant". A disagreement between this skeleton and the doctrine is a
 * surfaced finding, never silently resolved toward either.
 *
 * USE THIS FILE ONLY WHEN CLAUSE 3 TRIGGERS: at least one meta flag is
 * exclusive to the `client` actor, or overrides `useModule.meta.ts`'s shared
 * implementation — never as an empty scaffold (clause 2,
 * `code-composables.companion.md` "Variance law"). Otherwise DELETE this
 * file; the armless shared factory in `useModule.meta.ts` suffices. See
 * `.claude/skills/factory/composable/templates/ARMS.md` for the full when/how decision tree.
 *
 * Illustrates the `client` arm. Rename `client`/`Client` (and this filename's
 * `{actor}` token) to `staff`/`Staff` or `guest`/`Guest` if this module's
 * ADR-001 parity table names a different actor — copy this file once per
 * actor that earns one.
 *
 * NO REFERENCE IMPLEMENTATION EXISTS for this layer — no `.meta.{actor}.ts`
 * file exists anywhere in this codebase today, XState or Query
 * (`code-composables.companion.md`'s "Actor set & identifiers": "meta/context
 * are single factories today"). This file's shape is derived directly from
 * the DOCTRINE PROSE (`code-composables.md` Part B "same pattern for every
 * layer — services, actions, context, meta"), not a runtime citation. The
 * EXCLUSIVE member below borrows its CONCEPT (not its arm-split) from a real
 * flag — `auth/useAuth.meta.ts:71-76,101-102`'s `canRegisterAsGuest` — which
 * exists today only in the single shared `createAuthMeta` factory, never
 * split into a per-actor arm.
 *
 * MACHINE ↔ QUERY SYMMETRY — this file's two worked members
 * (`canRegisterAsGuest` exclusive, `isLoading` overriding) are the SAME
 * conceptual pair as `templates/machine/useModule.meta.{actor}.ts`'s own
 * (there: `canRegisterAsGuest` / `isProcessing`), each expressed through its
 * own variant's read mechanism.
 */

import { computed } from "vue";
import type { ModuleListQuery } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.meta.client
 * @description Client-specific module collection meta — populated ONLY when
 * this module has earned a meta arm (clause 3). Shared meta stays in
 * `useModule.meta.ts`.
 */
export function createClientModuleMeta(query: ModuleListQuery) {
  /**
   * EXCLUSIVE MEMBER worked example — a flag only this actor's meta exposes;
   * absent from the shared factory entirely (nothing to justify with a
   * decision-record comment — there is no shared key to duplicate).
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "members exclusive to it".
   * @doctrine (no per-actor runtime file exists for this layer — see this
   * file's own top note). Concept borrowed from
   * `auth/useAuth.meta.ts:71-76,101-102`'s `canRegisterAsGuest` (real, but
   * shared today, not arm-split) — the same client-exclusive capability the
   * services/actions arms illustrate (`module.services.{actor}.ts` /
   * `useModule.actions.{actor}.ts`'s own `registerAsGuest`).
   *
   * @single-source If this capability flag ALSO gates an `actions`-arm member,
   * do NOT recompute it here — compute it once (e.g. in `useModule.ts` or a
   * shared util) and pass the one value to both this meta arm and the actions
   * arm, so the displayed flag and the gate can never drift. See ARMS.md
   * "When to arm".
   */
  const canRegisterAsGuest = computed(() => true);

  /**
   * OVERRIDING MEMBER worked example — same key (`isLoading`) as
   * `useModule.meta.ts`'s shared factory; this arm's version is spread LAST
   * (per that file's own MERGE SEAM comment) and wins. Shape is A vs A+B:
   * shared returns A (the first-fetch check); this arm returns A + B (the
   * same first-fetch check OR any in-flight refetch).
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "overriding the shared implementation".
   * @worked-example `product-catalogue/useProductCatalogue.ts:66` — the same
   * widened `isFetching || !isFetched` read of a list query.
   * @decision
   * what: this arm's `isLoading` keeps the shared first-fetch condition AND
   *   additionally reports loading while any refetch of this actor's list is
   *   in flight.
   * why: this actor reads the richer client payload
   *   (`module.services.{actor}.ts`'s own `loadList`), so a page change or
   *   refetch is a wait it must show; widening the shared flag for one actor
   *   would need a runtime actor branch there (clause 4 violation).
   * rejected: branching the shared `isLoading` computed internally on actor
   *   — rejected per clause 4 (no runtime actor branch inside a shared
   *   factory) and per Part B "NO .base Files".
   */
  const isLoading = computed(
    () =>
      query?.isLoading.value || !query.isFetched.value || query.isFetching.value
  );

  return {
    /** Client-only capability flag (exclusive to this arm). */
    canRegisterAsGuest,

    /** Shared first-fetch check PLUS any in-flight refetch (A+B override). */
    isLoading
  };
}

// Type export for consumers
export type ClientModuleMeta = ReturnType<typeof createClientModuleMeta>;
