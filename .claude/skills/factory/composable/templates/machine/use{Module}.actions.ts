// TEMPLATE FILE — scaffolded by the factory; replace every placeholder.
import { remove } from "../scope";
import { useDataLayer } from "../system-analytics";
import { stopService, waitForProcessing } from "../../utils";
import type { UseActor } from "../../utils";
import type { ScopeActorTypes } from "../scope";
import type { ModuleModel } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.actions
 * @description Module actions factory.
 */

export function createModuleActions(
  actorScope: ScopeActorTypes,
  actor: UseActor,
  scopeKey: string
) {
  const { send, service } = actor;

  function destroy(): void {
    stopService(service);
    remove(scopeKey);
  }

  // `done` counts as ready: `waitForProcessing` treats it as failure unless
  // it is named a success state.
  async function isReady(): Promise<boolean> {
    return waitForProcessing(service, ["available", "done"], "error");
  }

  // Waits on the settle states, never `available`, which already matches
  // before the flow runs.
  async function login(credentials: ModuleModel): Promise<boolean> {
    send({ type: "LOGIN", data: credentials });
    const ok = await waitForProcessing(
      service,
      ["available.valid", "done"],
      ["available.invalid", "error"]
    );
    useDataLayer().dataLayer({ event: "login" }).withUser().push();
    return ok;
  }

  function set(data?: ModuleModel): void {
    send({ type: "SET", data });
  }

  return {
    /** Stops the machine and removes this scoped instance from the registry. */
    destroy,

    /** Resolves once the module is ready to read or act on. */
    isReady,

    /** Logs in with the given credentials. */
    login,

    /** Sets the active form model. */
    set
  };
}

export type UseModuleActions = ReturnType<typeof createModuleActions>;
