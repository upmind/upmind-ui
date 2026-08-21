// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" / "Where Shared Code Lives — NO .base Files" / "TanStack
 * Query variant" + `code-composables.companion.md` "Variance law" clauses
 * 2/3/4/5. A disagreement between this skeleton, its worked example, and the
 * doctrine is a surfaced finding, never silently resolved toward either.
 *
 * USE THIS FILE ONLY WHEN CLAUSE 3 TRIGGERS: at least one action is exclusive
 * to the `client` actor, or overrides `useModule.actions.ts`'s shared
 * implementation — never as an empty scaffold (clause 2,
 * `code-composables.companion.md` "Variance law"). Otherwise DELETE this
 * file; the armless shared factory in `useModule.actions.ts` suffices. See
 * `.claude/skills/factory/composable/templates/ARMS.md` for the full when/how decision tree.
 *
 * Illustrates the `client` arm. Rename `client`/`Client` (and this filename's
 * `{actor}` token) to `staff`/`Staff` or `guest`/`Guest` if this module's
 * ADR-001 parity table names a different actor — copy this file once per
 * actor that earns one.
 *
 * NO LIVE QUERY-VARIANT PRECEDENT EXISTS for this layer (no TanStack-backed
 * module in this codebase has earned an actions arm — `client-email/` is
 * armless throughout, per `useClientEmails.actions.ts`'s own worked-example
 * note). The two worked members below (`registerAsGuest` exclusive,
 * `login` overriding) are the SAME conceptual pair as
 * `templates/machine/useModule.actions.{actor}.ts`'s own — the worked-example
 * citations are cross-variant, borrowed honestly from the machine variant's
 * `auth/`, since the earned SHAPE is variant-agnostic (Part B "Actor-Specific
 * Sub-Composables" applies per-layer, XState or Query), only the concrete
 * mechanism differs (a directly-awaited service call here, a machine
 * `send`/`waitFor` there).
 */

import { useDataLayer } from "../system-analytics";
import { useActiveSession } from "../session-store";
import type { ModuleModel, ModuleServices } from "./module.types";
import { useQuery } from "../query";
import { queryKey } from "./module.services";

// -----------------------------------------------------------------------------
/**
 * @module module/useModule.actions.client
 * @description Client-specific module collection actions — populated ONLY
 * when this module has earned an actions arm (clause 3). Shared actions stay
 * in `useModule.actions.ts`.
 */
export function createClientModuleActions(service: ModuleServices) {
  /**
   * EXCLUSIVE MEMBER worked example — a capability only this actor has;
   * absent from the shared factory entirely (nothing to justify with a
   * decision-record comment).
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "members exclusive to it".
   * @worked-example (cross-variant) `auth/useAuth.actions.client.ts:57-60,72-73`'s
   * `registerAsGuest` — drives the two-step guest-registration flow (M5);
   * absent from `auth/useAuth.actions.staff.ts` and the shared
   * `createAuthActions` factory entirely. Same exclusive member the
   * services-layer arm illustrates (`module.services.{actor}.ts`'s own
   * `registerAsGuest`) — this action is the domain mutation that drives that
   * wire call.
   */
  async function registerAsGuest(): Promise<boolean> {
    // Replace with the client-only mutation this module's parity table names.
    // `service.registerAsGuest` resolves once `module.services.ts`'s
    // `scopedServices()` has this actor's `case` (see ARMS.md step 3).
    return (
      service
        .registerAsGuest?.()
        .then(() => true)
        .catch(() => false) ?? Promise.resolve(false)
    );
  }

  /**
   * OVERRIDING MEMBER worked example — same key (`login`) as
   * `useModule.actions.ts`'s shared factory; this arm's version is spread LAST
   * (per that file's own MERGE SEAM comment) and wins.
   *
   * The difference is in THIS FUNCTION's own composition, not in a service that
   * differs — both call the same `service.login`. Shared does A; this arm does
   * A + B.
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "overriding the shared implementation".
   * @decision
   * what: this arm calls the same service and pushes the same event, but adds
   *   `role` to the payload and resets the list the mutation invalidates.
   * why: without `role`, an action a STAFF member performed on a client's
   *   behalf is indistinguishable downstream from one the client performed
   *   itself. The shared factory has no actor to name, and deriving one there
   *   would need a runtime actor branch (clause 4).
   * rejected: branching the shared `login` internally on actor — rejected per
   *   clause 4 and per Part B "NO .base Files".
   */
  function login(credentials: ModuleModel): Promise<unknown> {
    // `queryClient` comes off `useQuery()` INSIDE the factory, never passed in
    // (`code-composables.md` Part B). @worked-example `query/query.utils.ts:76`.
    const { queryClient } = useQuery();
    const { activeUser: client } = useActiveSession().useContext();

    return service.login(credentials).then(result => {
      useDataLayer()
        .dataLayer({ event: "login", role: "client" })
        .withUser()
        .push();

      // Mirrors the key `loadList` registers (`module.services.ts`) — a filter
      // that partial-matches nothing resets nothing, silently. The key names
      // the RESOURCE, never the reader: keying by actor would fragment the
      // cache per actor and defeat it.
      queryClient.resetQueries({
        queryKey: [...queryKey, { client: client.value?.id }]
      });

      return result;
    });
  }

  return {
    /** Domain login, plus an actor-named payload and cache reset (A+B). */
    login,

    /** Drive the guest-registration flow (M5), client-exclusive. */
    registerAsGuest
  };
}

// Type export for consumers
export type ClientModuleActions = ReturnType<typeof createClientModuleActions>;
