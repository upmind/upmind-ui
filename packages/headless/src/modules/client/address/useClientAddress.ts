// --- external
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";

// --- internal
import itemMachine from "../item.machine";
import { useClientAddresses } from "./useClientAddresses";
import { useClientAddressActions } from "./actions";
import { useClientAddressServices } from "./services";

// --- utils
import { get } from "lodash-es";
import { DetailedError, responseCodes } from "../../../utils";

// --- types
import type { Address, AddressModel } from "./types";

// -----------------------------------------------------------------------------

export const useClientAddress = (id?: Address["id"]) => {
  const service = interpret(
    itemMachine
      .withConfig({
        actions: useClientAddressActions() as any,
        services: useClientAddressServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined };
        const { getOne } = useClientAddresses();
        return {
          id,
          model: getOne(id),
        };
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
    input: async (model: AddressModel): Promise<AddressModel> => {
      // we have to ensure we are able to input data
      return waitFor(service, state =>
        ["available.valid", "available.invalid"].some(state.matches)
      )
        .then(async () => {
          service.send({ type: "SET", data: model });
          // then we wait until the module has been checked and is valid/invalid
          return waitFor(service, state =>
            ["available.valid", "available.invalid"].some(state.matches)
          ).then(state => get(state, "context.model") as AddressModel);
        })
        .catch(() => {
          return Promise.reject(
            new DetailedError("Input not available", responseCodes.Forbidden)
          );
        });
    },
    //--- actions
    update: async () => {
      // we have to ensure we are able to update the address, ie it's available and valid
      return waitFor(service, state => state.matches("available.valid"))
        .then(async () => {
          service.send({ type: "UPDATE" });
          return waitFor(
            service,
            state => ["processed", "available.error"].some(state.matches),
            {
              timeout: Infinity,
            }
          )
            .then(state => {
              if (["error", "available.error"].some(state.matches)) {
                return Promise.reject(state.context.error);
              }
              return Promise.resolve();
            })
            .then(() => useClientAddressServices().refresh());
        })
        .catch(() => {
          return Promise.reject(
            new DetailedError(
              "Update only available if model is valid",
              responseCodes.Forbidden
            )
          );
        });
    },
  };
};
