// --- external
import { computed } from "vue";
import { interpret, InterpreterFrom } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { useActor } from "@xstate/vue";

// --- internal
import itemMachine from "../../../client/item.machine";
import { useUnifiedAddressActions, useUnifiedAddressGuards } from "./actions";
import { useUnifiedAddressServices } from "./services";
import { useSession } from "../../../session";

// --- utils
import {
  DetailedError,
  contextMatches,
  contextValue,
  responseCodes,
  stateMatches,
  stateValue,
  useContext,
  DEBOUNCE_DELAY,
  stopService
} from "../../../../utils";
import { debounce, get, isEmpty, isEqual } from "lodash-es";

// --- types
import { IClient } from "@upmind-automation/types";
import { UnifiedAddressType } from "./types";
import type { UnifiedAddressModel, UnifiedAddressContext } from "./types";
import { QueryResponseError } from "../../../query";
import { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

export const useUnifiedAddress = (
  type: UnifiedAddressContext["type"] = UnifiedAddressType.PERSONAL,
  { clientId }: { clientId?: IClient["id"] } = {}
) => {
  const service = interpret(
    itemMachine
      .withConfig({
        actions: useUnifiedAddressActions() as any,
        guards: useUnifiedAddressGuards() as any,
        services: useUnifiedAddressServices() as any
      })
      .withContext(() => {
        return {
          clientId,

          type,
          allowMultipleEdits: false
        };
      }),
    {
      id: "new-billing-detail",
      devTools: true
    }
  );

  const { state, send } = useActor(service.start());

  // --- state

  // the clientId is required to bring the machine into the available state
  const { isAuthenticated } = useSession();
  isAuthenticated().then(user => {
    if (user?.id && !contextMatches(state, "clientId")) {
      send({ type: "REFRESH", data: { clientId: user.id } });
    }
  });

  async function isReady(): Promise<boolean> {
    return waitFor(service, state => stateMatches(state, "available"), {
      timeout: Infinity
    }).then(state => {
      if (stateMatches(state, "error")) return false;

      return true;
    });
  }

  const meta = computed(() => ({
    isAvailable: stateMatches(state, "available"),
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    hasErrors: stateMatches(state, "available.error"),
    isValid: stateMatches(state, "available.valid"),
    isProcessing: stateMatches(state, "processing"),
    isComplete:
      stateValue(state, "done", false) ||
      stateMatches(state, ["processed", "complete"])
  }));

  // --- context
  const context = useContext<UnifiedAddressContext>(state);

  const addresses = useContext<UnifiedAddressContext["addresses"]>(
    state,
    "addresses"
  );

  const companies = useContext<UnifiedAddressContext["companies"]>(
    state,
    "companies"
  );

  const phones = useContext<UnifiedAddressContext["phones"]>(state, "phones");

  const title = useContext<string | undefined>(state, "title");

  const description = useContext<string | undefined>(state, "description");

  const errors = useContext<QueryResponseError["message"]>(
    state,
    "error.message"
  );
  const validationErrors = useContext<ErrorObject[]>(state, "error.data");

  const model = useContext<UnifiedAddressContext["model"]>(state, "model");

  const schema = useContext<UnifiedAddressContext["schema"]>(state, "schema");

  const uischema = useContext<UnifiedAddressContext["uischema"]>(
    state,
    "uischema"
  );

  // --- methods

  async function input(
    model: UnifiedAddressModel
  ): Promise<UnifiedAddressModel> {
    send({ type: "SET", data: model });
    // then we wait until the module has been checked and is valid/invalid
    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(state => get(state, "context.model") as UnifiedAddressModel)
      .catch(() => {
        return Promise.reject(
          new DetailedError("Input not available", responseCodes.Forbidden)
        );
      });
  }

  async function update(
    value?: UnifiedAddressModel
  ): Promise<UnifiedAddressModel> {
    // first check if our model has changed, if it has we need to send it

    const model = contextValue<UnifiedAddressModel>(state, "model");

    if (!isEmpty(value) && !isEqual(value, model)) {
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
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] update Unified Address failed",
            error?.status ?? responseCodes.Timeout,
            {
              error,
              state: state.value
            }
          )
        );
      });
  }

  function clear(): void {
    service.send({ type: "CLEAR" });
  }

  function stop(): void {
    stopService(service as InterpreterFrom<any>);
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
     * @typedef {Object} UnifiedAddressMeta
     * @property {boolean} isAvailable - Indicates if the actor is available.
     * @property {boolean} isLoading - Indicates if the actor is loading.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isValid - Indicates if the is valid.
     * @property {boolean} isProcessing - Indicates if the is processing.
     * @property {boolean} isComplete - Indicates if the is complete.
     */
    meta,

    // --- context

    /** The full context object. */
    context,

    /** Title of the address */
    title,

    /** Description of the.address */
    description,

    /** The ID of the address */
    id: useContext<string | undefined>(state, "id"),

    /** The list of available addresses. */
    addresses,

    /** The list of available companies. */
    companies,

    /** The list of available phones. */
    phones,

    /** Any error object from the context. */
    errors,

    /** Any validation errors from the context. */
    validationErrors,

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
     * Inputs a new model, resolving to the updated model., this is debounced to avoid excessive calls.
     * @param {UnifiedAddressModel} value The model to input.
     * @returns {Promise<UnifiedAddressModel>} The updated model.
     */
    input: debounce(input, DEBOUNCE_DELAY),

    /**
     * Sends the current model to the service for processing.
     * @param {UnifiedAddressModel} value The optional new model to set. uses the current model if not provided.
     * @returns {Promise<UnifiedAddressModel>} Resolves when updated model from the service, rejects on error.
     */
    update
  };
};

/** The return type of the composable.*/
export type UseUnifiedAddress = ReturnType<typeof useUnifiedAddress>;
