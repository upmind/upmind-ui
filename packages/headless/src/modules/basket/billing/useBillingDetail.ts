// --- external
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";

// --- internal
import {
  useBillingDetailsActions,
  useBillingDetailsServices,
} from "./unifiedAddress";
import itemMachine from "../../client/item.machine";
import { useBillingDetails } from "./useBillingDetails";

// --- utils
import { get } from "lodash-es";
import { DetailedError, responseCodes } from "../../../utils";

// --- types
import type { UnifiedAddressModel } from "./unifiedAddress";

// -----------------------------------------------------------------------------

export const useBillingDetail = (
  id?: string,
  { allowMultipleEdits }: { allowMultipleEdits?: boolean } = {}
) => {
  const service = interpret(
    itemMachine
      .withConfig({
        actions: useBillingDetailsActions() as any,
        services: useBillingDetailsServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined };
        const { getOne } = useBillingDetails();
        return {
          id,
          model: getOne(id),
          allowMultipleEdits,
        };
      }),
    {
      id: id ?? "new-billing-detail",
      devTools: false,
    }
  ).start();

  return {
    id,
    service,
    getModel: () => service?.getSnapshot().context.model as UnifiedAddressModel,
    getSnapshot: () => service?.getSnapshot(),
    stop: () => service.stop(),
    // ---
    isReady: async () => {
      return waitFor(service, state => state.matches("available"), {
        timeout: Infinity, // infinity = no timeout
      });
    },
    clear: () => service.send({ type: "CLEAR" }),
    input: async (model: UnifiedAddressModel): Promise<UnifiedAddressModel> => {
      // we have to ensure we are able to input data
      return waitFor(service, state =>
        ["available.valid", "available.invalid"].some(state.matches)
      )
        .then(async () => {
          service.send({ type: "SET", data: model });
          // then we wait until the module has been checked and is valid/invalid
          return waitFor(service, state =>
            ["available.valid", "available.invalid"].some(state.matches)
          ).then(state => get(state, "context.model") as UnifiedAddressModel);
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
            .then(() => useBillingDetailsServices().refresh());
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
