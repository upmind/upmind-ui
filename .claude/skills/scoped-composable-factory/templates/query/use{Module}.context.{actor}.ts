// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" / "Where Shared Code Lives — NO .base Files" / "TanStack
 * Query variant". A disagreement between this skeleton and the doctrine is a
 * surfaced finding, never silently resolved toward either.
 *
 * USE THIS FILE ONLY WHEN CLAUSE 3 TRIGGERS: at least one context value is
 * exclusive to the `client` actor, or overrides `useModule.context.ts`'s
 * shared implementation — never as an empty scaffold (clause 2,
 * `code-composables.companion.md` "Variance law"). Otherwise DELETE this
 * file; the armless shared factory in `useModule.context.ts` suffices. See
 * `.claude/skills/scoped-composable-factory/templates/ARMS.md` for the full when/how decision tree.
 *
 * Illustrates the `client` arm. Rename `client`/`Client` (and this filename's
 * `{actor}` token) to `staff`/`Staff` or `guest`/`Guest` if this module's
 * ADR-001 parity table names a different actor — copy this file once per
 * actor that earns one.
 *
 * NO REFERENCE IMPLEMENTATION EXISTS for this layer — no `.context.{actor}.ts`
 * file exists anywhere in this codebase today, XState or Query
 * (`code-composables.companion.md`'s "Actor set & identifiers": "meta/context
 * are single factories today"). This file's shape is derived directly from
 * the DOCTRINE PROSE, not a runtime citation: `code-composables.md` Part B
 * "Actor-Specific Sub-Composables" states "same pattern for every layer —
 * services, actions, context, meta." Structurally identical to
 * `useModule.actions.{actor}.ts` (this template set's own actions arm), cited
 * as a structural sibling only, NOT a runtime precedent for context
 * specifically.
 *
 * MACHINE ↔ QUERY SYMMETRY — this file's two worked members (`entitlements`
 * exclusive, `lookups` overriding) are the SAME conceptual pair as
 * `templates/machine/useModule.context.{actor}.ts`'s own (there: `entitlements` /
 * `lookups`), each expressed through its own variant's read mechanism (the
 * reactive TanStack `query` here; `useContext(state, path)` there).
 */

import { computed } from "vue";
import { castArray, flatMap } from "lodash-es";
import { baseLookups } from "./useModule.context";
import type { ModuleItem, ModuleListQuery } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.context.client
 * @description Client-specific module collection context — populated ONLY
 * when this module has earned a context arm (clause 3). Shared context stays
 * in `useModule.context.ts`.
 */
export function createClientModuleContext(query: ModuleListQuery) {
  /**
   * EXCLUSIVE MEMBER worked example — a value only this actor's context
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
  const entitlements = computed<string[]>(() =>
    flatMap(
      castArray(query.data.value ?? []),
      (item: ModuleItem) => item.entitlements ?? []
    )
  );

  /**
   * OVERRIDING MEMBER worked example — same key (`lookups`) as
   * `useModule.context.ts`'s shared factory; this arm's version is spread
   * LAST (per that file's own MERGE SEAM comment) and wins. Shape is A vs
   * A+B: shared returns A (the base lookups set); this arm returns A + B
   * (base set PLUS the client-specific lookups this actor needs).
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "overriding the shared implementation".
   * @decision
   * what: this arm's `lookups` spreads the shared factory's exported
   *   `baseLookups` AND appends the client-only reference data this actor's
   *   forms need — imported, never re-declared, so the base cannot drift.
   * why: the extra lookups are meaningless to a staff actor and would be a
   *   wasted fetch there; putting them in the shared factory would either
   *   over-fetch for every actor or force the shared file to branch on
   *   actor (clause 4 violation).
   * rejected: branching the shared `lookups` computed internally on actor —
   *   rejected per clause 4 (no runtime actor branch inside a shared
   *   factory) and per Part B "NO .base Files".
   */
  const lookups = computed(() => [
    ...baseLookups,
    { key: "clientCustomFields" }
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
