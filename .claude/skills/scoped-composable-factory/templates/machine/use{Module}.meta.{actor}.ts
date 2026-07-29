// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" / "Where Shared Code Lives — NO .base Files". A
 * disagreement between this skeleton and the doctrine is a surfaced finding,
 * never silently resolved toward either.
 *
 * USE THIS FILE ONLY WHEN CLAUSE 3 TRIGGERS: at least one meta flag is
 * exclusive to the `client` actor, or overrides `useModule.meta.ts`'s shared
 * implementation — never as an empty scaffold (clause 2,
 * `code-composables.companion.md` "Variance law"). Otherwise DELETE this
 * file; the armless shared factory in `useModule.meta.ts` suffices. See
 * `.claude/skills/scoped-composable-factory/templates/ARMS.md` for the full when/how decision tree.
 *
 * Illustrates the `client` arm. Rename `client`/`Client` (and this filename's
 * `{actor}` token) to `staff`/`Staff` or `guest`/`Guest` if this module's
 * ADR-001 parity table names a different actor — copy this file once per
 * actor that earns one.
 *
 * NO REFERENCE IMPLEMENTATION EXISTS for this layer — no `.meta.{actor}.ts`
 * file exists anywhere in this codebase today
 * (`code-composables.companion.md`'s "Actor set & identifiers": "meta/context
 * are single factories today"). This file's shape is derived directly from
 * the DOCTRINE PROSE (`code-composables.md` Part B "same pattern for every
 * layer — services, actions, context, meta"), not a runtime citation —
 * structurally identical to `useModule.actions.{actor}.ts` (this template
 * set's own actions arm) but NOT a runtime precedent for meta specifically.
 * The EXCLUSIVE member below borrows its CONCEPT (not its arm-split) from a
 * real flag — `auth/useAuth.meta.ts:71-76,101-102`'s `canRegisterAsGuest` —
 * which exists today only in the single shared `createAuthMeta` factory,
 * never split into a per-actor arm; this template illustrates what an EARNED
 * arm for that same concept would look like.
 *
 * MACHINE ↔ QUERY SYMMETRY — this file's two worked members
 * (`canRegisterAsGuest` exclusive, `isProcessing` overriding) are the SAME
 * conceptual pair as `templates/query/useModule.meta.{actor}.ts`'s own
 * (there: `canRegisterAsGuest` / `isLoading`), each expressed through its own
 * variant's read mechanism.
 */

import { computed } from "vue";
import { useStateMatches } from "../../utils";
import type { UseActor } from "../../utils";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.meta.client
 * @description Client-specific module meta — populated ONLY when this
 * module has earned a meta arm (clause 3). Shared meta stays in
 * `useModule.meta.ts`.
 */
export function createClientModuleMeta(actor: UseActor) {
  const { state } = actor;

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
   */
  const canRegisterAsGuest = computed(() => true);

  /**
   * OVERRIDING MEMBER worked example — same key (`isProcessing`) as
   * `useModule.meta.ts`'s shared factory; this arm's version is spread LAST
   * (per that file's own MERGE SEAM comment) and wins. Shape is A vs A+B:
   * shared matches A (the shared processing state); this arm matches A + B
   * (the same state PLUS the client-exclusive guest-registration state).
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "overriding the shared implementation".
   * @decision
   * what: this arm's `isProcessing` matches every state the shared factory
   *   matches AND the client-exclusive guest-registration state.
   * why: that machine state only exists on the client flow (driven by
   *   `useModule.actions.{actor}.ts`'s own `registerAsGuest`), so the shared
   *   factory has no reason to know about it and cannot include it without
   *   branching on actor (clause 4 violation).
   * rejected: branching the shared `isProcessing` internally on `actorScope`
   *   — rejected per clause 4 (no runtime actor branch inside a shared
   *   factory) and per Part B "NO .base Files".
   */
  const isProcessing = useStateMatches(state, [
    "available.checking",
    "available.loggingIn",
    "available.registering",
    "available.registeringAsGuest"
  ]);

  return {
    /** Replace with the real client-only capability check this module's
     * parity table names (e.g. a brand-config lookup, mirroring
     * `auth/useAuth.meta.ts`'s own `canRegisterAsGuest`). */
    canRegisterAsGuest,

    /** True while the module is processing (client-specific states). */
    isProcessing
  };
}

// Type export for consumers
export type ClientModuleMeta = ReturnType<typeof createClientModuleMeta>;
