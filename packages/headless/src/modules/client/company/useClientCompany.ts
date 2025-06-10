// --- external
import { waitFor } from "xstate/lib/waitFor";
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { interpret } from "xstate";

// --- internal
import itemMachine from "../item.machine";
import { useClientCompanies } from "./useClientCompanies";
import { useClientCompanyActions } from "./actions";
import { useClientCompanyServices } from "./services";

// --- utils
import {
  useContext,
  stateMatches,
  DetailedError,
  responseCodes,
  contextValue,
  UnavailableError,
} from "../../../utils";
import { get } from "lodash-es";

// --- types
import type { AddressModel } from "../address";
import type { ClientItemContext } from "../types";
import type { Company, CompanyModel } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import type { QueryResponseError } from "../../query";

// -----------------------------------------------------------------------------

export const useClientCompany = (
  id?: Company["id"],
  { allowMultipleEdits }: { allowMultipleEdits?: boolean } = {}
) => {
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
          allowMultipleEdits,
        };
      }),
    {
      id: id ?? "new-company",
      devTools: false,
    }
  ).start();

  const { state, send } = useActor(service);

  const isReady = async () => {
    return waitFor(service, state => stateMatches(state, "available"), {
      timeout: Infinity,
    }).then(state => {
      if (stateMatches(state, "error")) {
        if (
          (errors.value as QueryResponseError)?.status ==
          responseCodes.Service_Unavailable
        ) {
          return Promise.reject(new UnavailableError());
        }
        return false;
      }
      return true;
    });
  };

  const meta = computed(() => ({
    isNew: !stateMatches(state, "mode.id"),
    isValid: stateMatches(state, "available.valid"),
    isLoading: stateMatches(state, "loading"),
    hasErrors: stateMatches(state, "available.error"),
    canRemove: !stateMatches(state, "mode.canDelete"),
    isDefault: !contextValue(state, "model.default"),
    isVerified: stateMatches(state, "model.verified"),
    isComplete: state.value.done || stateMatches(state, "complete"),
    isProcessing: stateMatches(state, "processing"),
  }));

  const title = useContext<string | undefined>(state, "title");

  const model = useContext<AddressModel>(state, "model");

  const errors = useContext<ClientItemContext["error"]>(state, "error");

  const schema = useContext<JsonSchema>(state, "schema");

  const context = useContext<ClientItemContext>(state);

  const uischema = useContext<UISchemaElement>(state, "uischema");

  const companyId = useContext<string | undefined>(state, "id");

  const description = useContext<string | undefined>(state, "description");

  // --- methods

  const stop = () => service.stop();

  const clear = () => send({ type: "CLEAR" });

  const input = async (model: CompanyModel): Promise<CompanyModel> => {
    // we have to ensure we are able to input data
    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(async () => {
        send({ type: "SET", data: model });
        // then we wait until the module has been checked and is valid/invalid
        return waitFor(service, state =>
          stateMatches(state, ["available.valid", "available.invalid"])
        ).then(state => get(state, "context.model") as CompanyModel);
      })
      .catch(() => {
        return Promise.reject(
          new DetailedError("Input not available", responseCodes.Forbidden)
        );
      });
  };

  const update = async () => {
    // we have to ensure we are able to update the address, i.e., it's available and valid
    return waitFor(service, state => stateMatches(state, "available.valid"))
      .then(async () => {
        send({ type: "UPDATE" });
        return waitFor(
          service,
          state => stateMatches(state, ["processed", "available.error"]),
          { timeout: Infinity }
        )
          .then(state => {
            if (stateMatches(state, ["error", "available.error"])) {
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
  };

  return {
    // --- state

    /**
     * Resolves when the service is ready to accept input or perform actions.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Computed meta-information about the company state.
     */
    meta,

    /**
     * Title of the company.
     */
    title,

    /**
     * The current company model.
     */
    model,

    /**
     * Any error object from the company context.
     */
    errors,

    /**
     * The JSON schema for the company.
     */
    schema,

    /**
     * The full company context from the XState machine.
     */
    context,

    /**
     * The UI schema for the company.
     */
    uischema,

    /**
     * The unique identifier of the company.
     */
    companyId,

    /**
     * Description of the company.
     */
    description,

    // --- methods

    /**
     * Stops the company service.
     */
    stop,

    /**
     * Clears the company context.
     */
    clear,

    /**
     * Inputs the company model, resolving when the input is processed.
     * @param {CompanyModel} model - The company model to input.
     * @returns {Promise<CompanyModel>} Resolves to the updated company model.
     */
    input,

    /**
     * Updates the company model, resolving when the update is processed.
     * @returns {Promise<void>} Resolves when the update is complete.
     */
    update,
  };
};

export type UseClientCompanies = ReturnType<typeof useClientCompanies>;
