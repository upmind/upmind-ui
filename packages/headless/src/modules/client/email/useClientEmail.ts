// --- external
import { waitFor } from "xstate/lib/waitFor";
import { actions, interpret } from "xstate";

// --- internal
import services from "../address/services";
import { debounce } from "lodash-es";
import listingsMachine from "../listings.machine";

// --- types
import type { Company } from "../company";

export const useClientEmail = (cpid?: Company["id"]) => {
  // create a global instance of the system machine
  // and a global object to store state
  // NB dont automatically start the machine as in order for the inspector to work
  // it needs to be started after the inspect service is created, so we only start it when we need it

  const safeId = cpid || "new-email";

  const service = interpret(
    listingsMachine.withConfig({
      actions: actions as any,
      services: services as any,
    }),
    {
      id: safeId,
      devTools: false,
    }
  ).start();

  return {
    id: safeId,
    service,
    getSnapshot: () => service?.getSnapshot(),
    stop: () => service.stop(),
    // ---
    isReady: async () => {
      return waitFor(service, state => state.matches("available"), {
        timeout: Infinity, // infinity = no timeout
      });
    },
    clear: () => service.send({ type: "CLEAR" }),
    input: debounce(
      (model: any) => service.send({ type: "SET", data: model }),
      300
    ),
    //--- actions
    add: (data: any) => services.add(data),
    update: async () => {
      return waitFor(service, state => state.matches("available.valid")).then(
        async () => {
          service.send({ type: "UPDATE" });
          return waitFor(service, state => !state.matches("processing"), {
            timeout: Infinity,
          }).then(state => {
            if (["error", "available.error"].some(state.matches)) {
              return Promise.reject(state.context.error);
            }
            return Promise.resolve();
          });
        }
      );
    },
    remove: async () => {
      service.send({ type: "REMOVE" });
      await waitFor(service, state => ["complete"].some(state.matches), {
        timeout: Infinity,
      });
    },
  };
};
