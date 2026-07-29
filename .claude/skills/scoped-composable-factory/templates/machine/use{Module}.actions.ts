// -----------------------------------------------------------------------------
/**
 * TEMPLATE FILE — doctrine wins over this skeleton and its named worked
 * example. Authority: `code-composables.md` Part B "Actor-Specific
 * Sub-Composables" / "Where Shared Code Lives — NO .base Files" +
 * `code-composables.companion.md` "Variance law" clauses 2/3/5. A
 * disagreement between this skeleton, its worked example, and the doctrine is
 * a surfaced finding, never silently resolved toward either.
 */

import { remove } from "../scope";
import { stopService, waitForProcessing } from "../../utils";
import { useDataLayer } from "../system-analytics";
import type { UseActor } from "../../utils";
import type { ModuleModel } from "./module.types";
import { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.actions
 * @description Module actions factory (machine events).
 *
 * @doctrine clause 2 (fresh modules start armless) — this factory returns
 * ONLY shared members; no `useModule.actions.{actor}.ts` file exists yet.
 * @worked-example `account/useAccount.actions.ts` (armless — no arm file
 * anywhere in that module's actions layer).
 */
export function createModuleActions(
  actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { send, service } = actor;

  function set(data?: ModuleModel): void {
    send({ type: "SET", data });
  }

  /**
   * Destroys this instance — stops the service and removes it from the
   * registry. `scopeKey` (above) is required so a re-mount mints fresh —
   * `code-composables.md` Part B "destroy() vs stop()".
   */
  function destroy(): void {
    stopService(service);
    remove(scopeKey);
  }

  /**
   * Domain action worked example — the canonical A vs A+B override candidate.
   * Shared does A: drive the flow, then push the tracking event every actor
   * needs. An arm spreads its own `login` LAST to do A + B — see
   * `useModule.actions.{actor}.ts`.
   */
  async function login(credentials: ModuleModel): Promise<boolean> {
    send({ type: "LOGIN", data: credentials });
    // Wait on the CONCRETE settle children, never the parent the machine is
    // already in — `available` matches before the flow runs and resolves true
    // on a no-op. @worked-example `auth/useAuth.actions.ts:50-54`.
    const ok = await waitForProcessing(
      service,
      ["available.valid", "done"],
      ["available.invalid", "error"]
    );

    // @worked-example `basket/basket.machine.ts:768-772` — same
    // `useDataLayer().dataLayer({ event }).with*().push()` chain.
    useDataLayer().dataLayer({ event: "login" }).withUser().push();

    return ok;
  }

  async function isReady(): Promise<boolean> {
    // `done` alongside `available`: `waitForProcessing` always includes `done`
    // in what it waits FOR, but treats it as failure unless `done` is also in
    // the success list (`failOnDone`, `utils/useState.ts:361,367`). A machine
    // that completes while we are waiting IS ready, so name it explicitly —
    // otherwise this resolves false the moment the machine finishes.
    // Single success state -> string; multiple -> array.
    return waitForProcessing(service, ["available", "done"], "error");
  }

  // --- actor-specific actions: none earned yet (clause 2 — fresh modules start
  // armless). When a scope earns one, import its factory and spread it LAST so
  // it wins, exactly as `auth/useAuth.actions.ts:196-201` does:
  //   const actorActions =
  //     actorScope === ScopeActorTypes.CLIENT
  //       ? createClientModuleActions(actor)
  //       : {};
  // Never a `.base.ts` file (Part B "NO .base Files"); attach a `@decision`
  // block adjacent to the spread the day an arm overrides a shared member.

  return {
    /** Destroys this scoped instance — stops the service and removes it from the registry. */
    destroy,

    /** Resolves once the module is ready to read/act on. */
    isReady,

    /** Domain action — the canonical override candidate (see JSDoc). */
    login,

    /** Sets/updates the active form model. */
    set

    // The arm merges in HERE, last — a spread overwrites, which is what lets
    // it override a shared member; anything it omits falls through.
    // ...actorActions
  };
}

// Type export for consumers
export type UseModuleActions = ReturnType<typeof createModuleActions>;
