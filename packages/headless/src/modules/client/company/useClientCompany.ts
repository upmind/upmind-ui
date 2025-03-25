// --- external
import { waitFor } from "xstate/lib/waitFor";
import { actions, interpret } from "xstate";

// --- internal
import services from "../address/services";
import itemMachine from "../item.machine";
import { debounce } from "lodash-es";

// --- types
import type { Company } from "./types";
import { useClientAddresses } from "../address";

export const useClientCompany = (cpid?: Company["id"]) => {
  // create a global instance of the system machine
  // and a global object to store state
  // NB dont automatically start the machine as in order for the inspector to work
  // it needs to be started after the inspect service is created, so we only start it when we need it

  const safeId = cpid || "new-company";

  const service = interpret(
    itemMachine
      .withConfig({
        actions: actions as any,
        services: services as any,
      })
      .withContext(() => {
        if (!cpid) return { model: undefined };

        const { getOne } = useClientAddresses();
        return { model: getOne(cpid) };
      }),
    {
      id: safeId,
      devTools: false,
    }
  ).start();

  return {
    id: safeId,
    service,
    getModel: () => service?.getSnapshot().context.model,
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
