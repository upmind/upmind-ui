// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" / "Where Shared Code Lives — NO .base Files". A
 * disagreement between this skeleton and the doctrine is a surfaced finding,
 * never silently resolved toward either.
 *
 * USE THIS FILE ONLY WHEN CLAUSE 3 TRIGGERS: at least one context value is
 * exclusive to the `client` actor, or overrides `useModule.context.ts`'s
 * shared implementation — never as an empty scaffold (clause 2,
 * `code-composables.companion.md` "Variance law"). Otherwise DELETE this
 * file; the armless shared factory in `useModule.context.ts` suffices. See
 * `.claude/skills/factory/composable/templates/ARMS.md` for the full when/how decision tree.
 *
 * Illustrates the `client` arm. Rename `client`/`Client` (and this filename's
 * `{actor}` token) to `staff`/`Staff` or `guest`/`Guest` if this module's
 * ADR-001 parity table names a different actor — copy this file once per
 * actor that earns one.
 *
 * NO REFERENCE IMPLEMENTATION EXISTS for this layer — no `.context.{actor}.ts`
 * file exists anywhere in this codebase today
 * (`code-composables.companion.md`'s "Actor set & identifiers": "meta/context
 * are single factories today"). This file's shape is derived directly from
 * the DOCTRINE PROSE, not a runtime citation: `code-composables.md` Part B
 * "Actor-Specific Sub-Composables" states "Actor-specific logic lives in
 * `.<actor>.ts` files (same pattern for every layer — services, actions,
 * context, meta)" — this is that pattern applied here for the first time.
 * Structurally identical to `useModule.actions.{actor}.ts` (this template
 * set's own actions arm — JSDoc block order, decision-record comment
 * placement), cited as a structural sibling only, NOT a runtime precedent for
 * context specifically.
 *
 * MACHINE ↔ QUERY SYMMETRY — this file's two worked members (`entitlements`
 * exclusive, `lookups` overriding) are the SAME conceptual pair as
 * `templates/query/useModule.context.{actor}.ts`'s own (there: `entitlements` /
 * `lookups`), each expressed through its own variant's read mechanism
 * (`useContext(state, path)` here; the reactive TanStack `query` there).
 */

import { computed } from "vue";
import { contextValue, useContext } from "../../utils";
import type { UseActor } from "../../utils";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.context.client
 * @description Client-specific module context — populated ONLY when this
 * module has earned a context arm (clause 3). Shared context stays in
 * `useModule.context.ts`.
 */
export function createClientModuleContext(actor: UseActor) {
  const { state } = actor;

  /**
   * EXCLUSIVE MEMBER worked example — a data value only this actor's context
   * exposes; absent from the shared factory entirely (nothing to justify
   * with a decision-record comment — there is no shared key to duplicate).
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "members exclusive to it".
   * @doctrine (no per-actor runtime file exists for this layer — see this
   * file's own top note). Structural sibling, same client-exclusive concept:
   * `module.services.{actor}.ts` / `useModule.actions.{actor}.ts`'s own
   * `registerAsGuest`.
   */
  const entitlements = useContext<string[]>(state, "clientEntitlements", []);

  /**
   * OVERRIDING MEMBER worked example — same key (`lookups`) as
   * `useModule.context.ts`'s shared factory; this arm's version is spread
   * LAST (per that file's own MERGE SEAM comment) and wins. Shape is A vs
   * A+B: shared returns A (the base lookups set from machine context); this
   * arm returns A + B (base set PLUS the client-specific lookups).
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "overriding the shared implementation".
   * @decision
   * what: this arm's `lookups` returns the shared base set AND appends the
   *   client-only reference data this actor's forms need.
   * why: the extra lookups are meaningless to a staff actor and would be a
   *   wasted fetch there; putting them in the shared factory would either
   *   over-fetch for every actor or force the shared file to branch on
   *   actor (clause 4 violation).
   * rejected: branching the shared `lookups` internally on `actorScope` —
   *   rejected per clause 4 (no runtime actor branch inside a shared
   *   factory) and per Part B "NO .base Files".
   */
  // `contextValue` (not `useContext`) inside the computed: `useContext` IS
  // `computed(() => contextValue(...))` (`utils/useState.ts:294-299`), so
  // wrapping its refs in a second computed would compute a computed. Reactivity
  // holds because `contextValue` -> `safeState` unrefs `state` INSIDE this
  // getter, which is what registers the dependency.
  // @worked-example `client-email/useClientEmailManager.meta.ts:34-35`.
  const lookups = computed(() => [
    ...contextValue<Record<string, unknown>[]>(state, "lookups", []),
    ...contextValue<Record<string, unknown>[]>(state, "clientCustomFields", [])
  ]);

  return {
    /** Client-only entitlement slice (exclusive to this arm). */
    entitlements,

    /** Base lookups PLUS the client-specific additions (A+B override). */
    lookups
  };
}

// Type export for consumers
export type ClientModuleContext = ReturnType<typeof createClientModuleContext>;
