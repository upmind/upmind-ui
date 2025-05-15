// --- external
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";

// --- internal
import itemMachine from "../item.machine";
import { useClientPhones } from "./useClientPhones";
import { useClientPhoneActions } from "./actions";
import { useClientPhoneServices } from "./services";

// --- utils
import { get } from "lodash-es";
import { DetailedError, responseCodes } from "../../../utils";

// --- types
import type { Phone, PhoneModel } from "./types";

// -----------------------------------------------------------------------------

export const useClientPhone = (
  id?: Phone["id"],
  { allowMultipleEdits }: { allowMultipleEdits?: boolean } = {}
) => {
  const service = interpret(
    itemMachine
      .withConfig({
        actions: useClientPhoneActions() as any,
        services: useClientPhoneServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined };
        const { getOne } = useClientPhones();
        return {
          id,
          model: getOne(id),
          allowMultipleEdits,
        };
      }),
    {
      id: id ?? "new-phone",
      devTools: true,
    }
  ).start();

  return {
    id,
    service,
    getModel: () => service?.getSnapshot().context.model as PhoneModel,
    getSnapshot: () => service?.getSnapshot(),
    stop: () => service.stop(),
    // ---
    isReady: async () => {
      return waitFor(service, state => state.matches("available"), {
        timeout: Infinity, // infinity = no timeout
      });
    },
    clear: () => service.send({ type: "CLEAR" }),
    input: async (model: PhoneModel): Promise<PhoneModel> => {
      // we have to ensure we are able to input data
      return waitFor(service, state =>
        ["available.valid", "available.invalid", "available.error"].some(
          state.matches
        )
      )
        .then(async () => {
          service.send({ type: "SET", data: model });
          // then we wait until the module has been checked and is valid/invalid
          return waitFor(service, state =>
            ["available.valid", "available.invalid", "available.error"].some(
              state.matches
            )
          ).then(state => get(state, "context.model") as PhoneModel);
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
            .then(() => useClientPhoneServices().refresh());
        })
        .catch(error => {
          return Promise.reject(
            new DetailedError(
              error ?? "Update only available if model is valid",
              responseCodes.Forbidden
            )
          );
        });
    },
  };
};
