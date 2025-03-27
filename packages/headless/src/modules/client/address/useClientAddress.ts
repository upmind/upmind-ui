// --- external
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";

// --- internal
import itemMachine from "../item.machine";
import { useClientAddresses } from "./useClientAddresses";
import { useClientAddressServices } from "./services";
import { useClientAddressActions } from "./actions";

// --- utils
import { debounce, get } from "lodash-es";

// --- types
import type { Address } from "./types";

export const useClientAddress = (id?: Address["id"]) => {
  // create a global instance of the system machine
  // and a global object to store state
  // NB dont automatically start the machine as in order for the inspector to work
  // it needs to be started after the inspect service is created, so we only start it when we need it
  const service = interpret(
    itemMachine
      .withConfig({
        actions: useClientAddressActions() as any,
        services: useClientAddressServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined };
        const { getOne } = useClientAddresses();
        return { model: getOne(id) };
      }),
    {
      id: id ?? "new-address",
      devTools: true,
    }
  ).start();

  return {
    id,
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
    input: async (model: Address): Promise<Address> => {
      service.send({ type: "SET", data: model });
      return waitFor(service, state => state.matches("available")).then(
        state => {
          return Promise.resolve(get(state, "context.model", {}) as Address);
        }
      );
    },
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
