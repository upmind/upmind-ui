// TEMPLATE FILE — scaffold only when this actor earns an actions arm (ARMS.md).
import { resetQueryByKey } from "../query";
import { useDataLayer } from "../system-analytics";
import type { ModuleModel, ModuleServices } from "./module.types";
// -----------------------------------------------------------------------------
/**
 * @module module/useModule.actions.client
 * @description Client-specific module collection actions.
 */

export function createClientModuleActions(service: ModuleServices) {
  function loginAsClient(credentials: ModuleModel): Promise<unknown> {
    return service
      .login(credentials)
      .then(result => {
        useDataLayer()
          .dataLayer({ event: "login", role: "client" })
          .withUser()
          .push();
        return result;
      })
      .then(resetQueryByKey(service.queryKey));
  }

  function registerAsGuest(): Promise<boolean> {
    if (!service.registerAsGuest) return Promise.resolve(false);
    return service
      .registerAsGuest()
      .then(() => true)
      .catch(() => false);
  }

  return {
    /** Logs in as the client, then drops the cached list. */
    login: loginAsClient,

    /** Registers the client as a guest; resolves false on failure. */
    registerAsGuest
  };
}

export type ClientModuleActions = ReturnType<typeof createClientModuleActions>;
