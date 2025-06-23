// --- external
import { computed } from "vue";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { useActor } from "@xstate/vue";

// --- internal
import itemMachine from "../item.machine";
import { useClientCompanyActions, useClientCompanyGuards } from "./actions";
import { useClientCompanyServices } from "./services";
import { useClientCompanies } from "./useClientCompanies";

// --- utils
import {
  DetailedError,
  contextValue,
  responseCodes,
  stateMatches,
  stateValue,
  useContext,
  UnavailableError,
  ErrorOrigin,
} from "../../../utils";
import { get, isEqual } from "lodash-es";

// --- types
import { IClient } from "@upmind-automation/types";
import type { ClientItemContext } from "../types";
import type { Company, CompanyModel } from "./types";
import { QueryResponseError } from "../../query";

// -----------------------------------------------------------------------------

export const useClientCompany = (
  clientId: IClient["id"],
  id?: Company["id"],
  { allowMultipleEdits }: { allowMultipleEdits?: boolean } = {}
) => {
  // --- state
  const service = interpret(
    itemMachine
      .withConfig({
        actions: useClientCompanyActions() as any,
        guards: useClientCompanyGuards() as any,
        services: useClientCompanyServices() as any,
      })
      .withContext(() => {
        const { getOne } = useClientCompanies();
        return {
          clientId,
          id,
          model: getOne(id),
          allowMultipleEdits,
        };
      }),
    {
      id: id ?? "new-company",
      devTools: false,
    }
  );

  const { state, send } = useActor(service.start());

  async function isReady(): Promise<boolean> {
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
  }

  const meta = computed(() => ({
    isAvailable: stateMatches(state, "available"),
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    hasErrors: stateMatches(state, "available.error"),
    isValid: stateMatches(state, "available.valid"),
    isNew: !stateMatches(state, "model.id"),
    isProcessing: stateMatches(state, "processing"),
    isComplete:
      stateValue(state, "done", false) ||
      stateMatches(state, ["processed", "complete"]),
  }));

  // --- context
  const context = useContext<ClientItemContext>(state);

  const title = useContext<string | undefined>(state, "title");

  const description = useContext<string | undefined>(state, "description");

  const errors = useContext<ClientItemContext["error"]>(state, "error");

  const model = useContext<ClientItemContext["model"]>(state, "model");

  const schema = useContext<ClientItemContext["schema"]>(state, "schema");

  const uischema = useContext<ClientItemContext["uischema"]>(state, "uischema");

  // --- methods

  async function input(model: CompanyModel): Promise<CompanyModel> {
    send({ type: "SET", data: model });
    // then we wait until the module has been checked and is valid/invalid
    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(state => get(state, "context.model") as CompanyModel)
      .catch(() => {
        return Promise.reject(
          new DetailedError(
            "[headless] Input not available",
            responseCodes.Forbidden,
            ErrorOrigin.Headless
          )
        );
      });
  }

  async function update(value?: CompanyModel): Promise<CompanyModel> {
    // first check if our model has changed, if it has we need to send it

    const model = contextValue<CompanyModel>(state, "model");

    if (!isEqual(value, model)) {
      send({ type: "SET", data: value, update: true });
    } else {
      send({ type: "UPDATE" });
    }

    // we have to ensure the update is processed and the state is either processed or available.error
    return waitFor(
      service,
      state => stateMatches(state, ["processed", "available.error"]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, "available.error")) throw state.context.error;
        return Promise.resolve(state.context.model);
      })
      .then(model => {
        useClientCompanyServices().refresh();
        return model as CompanyModel;
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] update Company failed",
            error?.status ?? responseCodes.Timeout,
            ErrorOrigin.Headless,
            {
              error,
              state: state.value,
            }
          )
        );
      });
  }

  function clear(): void {
    service.send({ type: "CLEAR" });
  }
  // ---------------------------------------------------------------------------
  return {
    // --- state

    /**
     * Resolves when the service is ready to accept input or perform actions.
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the state.
     * @typedef {Object} UnifiedCompanyMeta
     * @property {boolean} isAvailable - Indicates if the actor is available.
     * @property {boolean} isLoading - Indicates if the actor is loading.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isValid - Indicates if the is valid.
     * @property {boolean} isNew - Indicates if the is new (not yet saved).
     * @property {boolean} isProcessing - Indicates if the is processing.
     * @property {boolean} isComplete - Indicates if the is complete.
     */
    meta,

    // --- context

    /** The full context object. */
    context,

    /** Title of the company*/
    title,

    /** Description of the.company*/
    description,

    /** The ID of the company */
    id: useContext<string | undefined>(state, "id"),

    /** Any error object from the context. */
    errors,

    /** The current model.*/
    model,

    /** The JSON schema for the form*/
    schema,

    /** The UI schema for the form */
    uischema,

    // --- methods

    /**
     * Stops the service.
     */
    stop,

    /** Clears the context.*/
    clear,

    /**
     * Inputs a new model, resolving to the updated model.
     * @param {CompanyModel} model - The model to input.
     * @returns {Promise<CompanyModel>} The updated model.
     */
    input,

    /**
     * Sends the current model to the service for processing.
     * @param {CompanyModel} value The optional new model to set. uses the current model if not provided.
     * @returns {Promise<CompanyModel>} Resolves when updated model from the service, rejects on error.
     */
    update,
  };
};

/** The return type of the composable.*/
export type UseClientCompany = ReturnType<typeof useClientCompany>;
