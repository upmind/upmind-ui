// --- external
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";

// --- internal
import { get } from "lodash-es";
import itemMachine from "../item.machine";
import { useClientCompanies } from "./useClientCompanies";
import { useClientCompanyActions } from "./actions";
import { useClientCompanyServices } from "./services";
import { DetailedError, responseCodes } from "../../../utils";

// --- types
import type { Company, CompanyModel } from "./types";

export const useClientCompany = (id?: Company["id"]) => {
  // create a global instance of the system machine
  // and a global object to store state
  // NB dont automatically start the machine as in order for the inspector to work
  // it needs to be started after the inspect service is created, so we only start it when we need it

  const service = interpret(
    itemMachine
      .withConfig({
        actions: useClientCompanyActions() as any,
        services: useClientCompanyServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined };
        const { getOne } = useClientCompanies();
        return {
          id: id,
          model: getOne(id),
        };
      }),
    {
      id: id ?? "new-company",
      devTools: false,
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
    input: async (model: CompanyModel): Promise<CompanyModel> => {
      // we have to ensure we are able to input data
      return waitFor(service, state =>
        ["available.valid", "available.invalid"].some(state.matches)
      )
        .then(async () => {
          service.send({ type: "SET", data: model });
          // then we wait until the module has been checked and is valid/invalid
          return waitFor(service, state =>
            ["available.valid", "available.invalid"].some(state.matches)
          ).then(state => get(state, "context.model") as CompanyModel);
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
            .then(() => useClientCompanyServices().refresh());
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
