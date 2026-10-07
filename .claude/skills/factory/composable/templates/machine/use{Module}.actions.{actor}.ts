// TEMPLATE FILE — scaffold only when this actor earns an actions arm (ARMS.md).
import { useDataLayer } from "../system-analytics";
import { waitForProcessing } from "../../utils";
import type { ModuleModel } from "./module.types";
import type { UseActor } from "../../utils";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.actions.client
 * @description Client-specific module actions.
 */

export function createClientModuleActions(actor: UseActor) {
  const { send, service } = actor;

  async function loginAsClient(credentials: ModuleModel): Promise<boolean> {
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

  async function registerAsGuest(): Promise<boolean> {
    send({ type: "REGISTER_AS_GUEST" });
    return waitForProcessing(
      service,
      ["available.valid", "done"],
      ["available.invalid", "error"]
    );
  }

  return {
    /** Logs in as the client, tagging the tracking event with the role. */
    login: loginAsClient,

    /** Registers the client as a guest. */
    registerAsGuest
  };
}

export type ClientModuleActions = ReturnType<typeof createClientModuleActions>;
