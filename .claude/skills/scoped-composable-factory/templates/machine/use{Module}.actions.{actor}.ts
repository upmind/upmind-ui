// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" / "Where Shared Code Lives — NO .base Files" +
 * `code-composables.companion.md` "Variance law" clauses 2/3/4/5. A
 * disagreement between this skeleton, its worked example, and the doctrine is
 * a surfaced finding, never silently resolved toward either.
 *
 * USE THIS FILE ONLY WHEN CLAUSE 3 TRIGGERS: at least one action is exclusive
 * to the `client` actor, or overrides `useModule.actions.ts`'s shared
 * implementation — never as an empty scaffold (clause 2,
 * `code-composables.companion.md` "Variance law"). Otherwise DELETE this
 * file; the armless shared factory in `useModule.actions.ts` suffices. See
 * `.claude/skills/scoped-composable-factory/templates/ARMS.md` for the full when/how decision tree.
 *
 * Illustrates the `client` arm. Rename `client`/`Client` (and this filename's
 * `{actor}` token) to `staff`/`Staff` or `guest`/`Guest` if this module's
 * ADR-001 parity table names a different actor — copy this file once per
 * actor that earns one.
 *
 * MACHINE ↔ QUERY SYMMETRY — this file's two worked members (`registerAsGuest`
 * exclusive, `login` overriding) are the SAME conceptual pair as
 * `templates/query/useModule.actions.{actor}.ts`'s own, each expressed
 * through its own variant's mechanism (a machine `send`/`waitFor` here; a
 * directly-awaited query call there) — not two unrelated examples.
 */

import { waitForProcessing } from "../../utils";
import { useDataLayer } from "../system-analytics";
import type { UseActor } from "../../utils";
import type { ModuleModel } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.actions.client
 * @description Client-specific module actions — populated ONLY when this
 * module has earned an actions arm (clause 3). Shared actions stay in
 * `useModule.actions.ts`.
 */
export function createClientModuleActions(actor: UseActor) {
  const { send, service } = actor;

  /**
   * EXCLUSIVE MEMBER worked example — a capability only this actor has;
   * absent from the shared factory entirely (nothing to justify with a
   * decision-record comment — there is no shared key to duplicate or
   * override).
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "members exclusive to it".
   * @worked-example `auth/useAuth.actions.client.ts:57-60,72-73`'s
   * `registerAsGuest` — drives the two-step guest-registration flow (M5);
   * absent from `auth/useAuth.actions.staff.ts` and from the shared
   * `createAuthActions` factory (`auth/useAuth.actions.ts`) entirely. Same
   * exclusive member the services-layer arm illustrates
   * (`module.services.{actor}.ts`'s own `registerAsGuest`) — this action is
   * the domain mutation that drives that wire call.
   */
  async function registerAsGuest(): Promise<boolean> {
    send({ type: "REGISTER_AS_GUEST" });
    // The CONCRETE settle children the flow lands in — waiting on the parent
    // `available` would match the state the machine already occupies and
    // resolve true on a no-op. @worked-example `auth/useAuth.actions.ts:50-54`.
    return waitForProcessing(
      service,
      ["available.valid", "done"],
      ["available.invalid", "error"]
    );
  }

  /**
   * OVERRIDING MEMBER worked example — same key (`login`) as
   * `useModule.actions.ts`'s shared factory; this arm's version is spread LAST
   * (per that file's own MERGE SEAM comment) and wins.
   *
   * The difference is in THIS FUNCTION's own composition, not in a service
   * that differs — both call the same `LOGIN` event. Shared does A; this arm
   * does A + B.
   *
   * @doctrine clause 3 (`code-composables.md` Part B "Actor-Specific
   * Sub-Composables") — "overriding the shared implementation".
   * @decision
   * what: this arm drives the same flow and pushes the same event, but adds
   *   `role` to the payload.
   * why: without it, an action a STAFF member performed on a client's behalf
   *   is indistinguishable downstream from one the client performed itself —
   *   same event, same user, different actor. The staff arm pushes
   *   `role: "staff"`. The shared factory has no actor to name, and deriving
   *   one there would need a runtime actor branch (clause 4).
   * rejected: branching the shared `login` internally on `actorScope` —
   *   rejected per clause 4 and per Part B "NO .base Files".
   */
  async function login(credentials: ModuleModel): Promise<boolean> {
    send({ type: "LOGIN", data: credentials });
    const ok = await waitForProcessing(
      service,
      ["available.valid", "done"],
      ["available.invalid", "error"]
    );

    useDataLayer()
      .dataLayer({ event: "login", role: "client" })
      .withUser()
      .push();

    return ok;
  }

  return {
    /** Domain login, plus an actor-named payload (A+B override). */
    login,

    /** Drive the guest-registration flow (M5), client-exclusive. */
    registerAsGuest
  };
}

// Type export for consumers
export type ClientModuleActions = ReturnType<typeof createClientModuleActions>;
