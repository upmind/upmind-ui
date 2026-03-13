// --- external
import { computed } from "vue";
import { interpret, type InterpreterFrom } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { useActor } from "@xstate/vue";

// --- internal
import { useI18n } from "../../../system";
import dataManagerMachine from "../../../dataManager/dataManager.machine";
import { useUnifiedActions, useUnifiedGuards } from "./actions";
import { useUnifiedServices } from "./services";
import { useSession } from "../../../session";

// --- utils
import {
  stateValue,
  useContext,
  ErrorOrigin,
  contextValue,
  stateMatches,
  DetailedError,
  responseCodes,
  type ResponseError,
  contextMatches,
  DEBOUNCE_DELAY,
  stopService,
  type ErrorObject,
  isDirty
} from "../../../../utils";
import { debounce, get, isEmpty, isEqual } from "lodash-es";

// --- types
import type { IClient } from "@upmind-automation/types";
import { UnifiedType } from "./types";
import type { UnifiedModel, UnifiedContext } from "./types";

// -----------------------------------------------------------------------------

/**
 * A composable that provides a unified interface for managing billing details.
 * It allows for the creation of personal or company billing details, including phones and addresses.
 * It uses a state machine to manage the state and actions related to billing details.
 * @param {UnifiedContext["type"]} type - The type of billing detail to create, either personal or company.
 * @param {Object} options - Optional parameters.
 * @param {IClient["id"]} options.clientId - The ID of the client for which the billing detail is being created.
 * @returns {UseUnified} An object containing methods
 */
export const useUnified = (
  type: UnifiedContext["type"] = UnifiedType.PERSONAL,
  { clientId }: { clientId?: IClient["id"] } = {}
) => {
  const { t } = useI18n();
  const service = interpret(
    dataManagerMachine
      .withConfig({
        actions: useUnifiedActions() as any,
        guards: useUnifiedGuards() as any,
        services: useUnifiedServices() as any
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
      devTools: false
    }
  );

  const { state, send } = useActor(service.start());

  // --- state

  // the clientId is required to bring the machine into the available state
  const { isAuthenticated } = useSession();
  isAuthenticated().then(client => {
    if (client?.id && !contextMatches(state, "clientId")) {
      send({ type: "REFRESH", data: { clientId: client.id } });
    }
  });

  async function isReady(): Promise<boolean> {
    return waitFor(service, state => stateMatches(state, "available"), {
      timeout: Infinity
    }).then(state => {
      return !stateMatches(state, "error");
    });
  }

  const meta = computed(() => ({
    isAvailable: stateMatches(state, "available"),
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    hasErrors: stateMatches(state, "error"),
    isValid: stateMatches(state, "available.valid"),
    isNew: true, // always true for new billing details
    isDirty: isDirty(
      contextValue<UnifiedContext["model"]>(state, "model"),
      contextValue<UnifiedContext["baseModel"]>(state, "baseModel")
    ),
    isProcessing: stateMatches(state, "processing"),
    isComplete:
      stateValue(state, "done", false) ||
      stateMatches(state, ["processed", "complete"])
  }));

  // --- context
  const context = useContext<UnifiedContext>(state);

  const addresses = useContext<UnifiedContext["addresses"]>(state, "addresses");

  const companies = useContext<UnifiedContext["companies"]>(state, "companies");

  const phones = useContext<UnifiedContext["phones"]>(state, "phones");

  const title = useContext<string | undefined>(state, "title");

  const description = useContext<string | undefined>(state, "description");

  const errors = useContext<ResponseError["message"]>(state, "error.message");

  const validationErrors = useContext<ErrorObject[]>(state, "error.data");

  const model = useContext<UnifiedContext["model"]>(state, "model");

  const schema = useContext<UnifiedContext["schema"]>(state, "schema");

  const uischema = useContext<UnifiedContext["uischema"]>(state, "uischema");

  // --- methods

  async function input(model: UnifiedModel): Promise<UnifiedModel> {
    send({ type: "SET", data: model });
    // then we wait until the module has been checked and is valid/invalid
    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(state => get(state, "context.model") as UnifiedModel)
      .catch(() => {
        return Promise.reject(
          new DetailedError(
            t("error.input_not_available"),
            responseCodes.Forbidden,
            ErrorOrigin.Headless
          )
        );
      });
  }

  async function update(value?: UnifiedModel): Promise<UnifiedModel> {
    // first check if our model has changed, if it has we need to send it

    const model = contextValue<UnifiedModel>(state, "model");

    if (!isEmpty(value) && !isEqual(value, model)) {
      send({ type: "SET", data: value, update: true });
    } else {
      send({ type: "UPDATE" });
    }

    // we have to ensure the update is processed and the state is either processed or available.error
    return waitFor(
      service,
      state =>
        stateMatches(state, [
          "complete",
          "processed",
          "error",
          "available.invalid"
        ]),
      { timeout: 60_000 }
    )
      .then(state => {
        const model = contextValue<UnifiedModel>(state, "model");
        if (!model || stateMatches(state, ["error", "available.invalid"]))
          throw state.context.error;
        return model;
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            t("error.unified_address_update_failed"),
            error?.status ?? responseCodes.Timeout,
            ErrorOrigin.Headless,
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
    stopService(service);
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
     * Meta-information about the state.
     * @type {Object} UnifiedMeta
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

    /** Description of the address */
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
     * Inputs a new model, resolving to the updated model. This is debounced to avoid excessive calls.
     * @param {UnifiedModel} value The model to input.
     * @returns {Promise<UnifiedModel>} The updated model.
     */
    input: debounce(input, DEBOUNCE_DELAY),

    /**
     * Sends the current model to the service for processing.
     * @param {UnifiedModel} value The optional new model to set. uses the current model if not provided.
     * @returns {Promise<UnifiedModel>} Resolves when updated model from the service, rejects on error.
     */
    update
  };
};

/** The return type of the composable.*/
export type UseUnified = ReturnType<typeof useUnified>;
