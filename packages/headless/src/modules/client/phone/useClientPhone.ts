// --- external
import { computed } from "vue";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { useActor } from "@xstate/vue";

// --- internal
import itemMachine from "../item.machine";
import { useClientPhoneActions, useClientPhoneGuards } from "./actions";
import { useClientPhoneServices } from "./services";
import { useClientPhones } from "./useClientPhones";
import { useSession } from "../../session";

// --- utils
import {
  DetailedError,
  contextValue,
  responseCodes,
  stateMatches,
  stateValue,
  useContext,
} from "../../../utils";
import { get, isEmpty, isEqual } from "lodash-es";

// --- types
import { IClient } from "@upmind-automation/types";
import type { ClientItemContext } from "../types";
import type { Phone, PhoneModel } from "./types";
import { QueryResponseError } from "../../query";
import { ErrorObject } from "ajv";

// -----------------------------------------------------------------------------

export const useClientPhone = (
  id?: Phone["id"],
  {
    allowMultipleEdits,
    clientId,
  }: { allowMultipleEdits?: boolean; clientId?: IClient["id"] } = {}
) => {
  const { getOne } = useClientPhones();

  const service = interpret(
    itemMachine
      .withConfig({
        actions: useClientPhoneActions() as any,
        guards: useClientPhoneGuards() as any,
        services: useClientPhoneServices() as any,
      })
      .withContext({
        clientId,
        id,
        model: getOne(id),
        allowMultipleEdits,
      }),
    {
      id: id ?? "new-phone",
      devTools: true,
    }
  );

  const { state, send } = useActor(service.start());

  // --- state

  // the clientId is required to bring the machine into the available state
  const { isAuthenticated } = useSession();
  isAuthenticated().then(user => {
    if (user?.id && !contextValue<string | undefined>(state, "clientId")) {
      service.send({ type: "REFRESH", data: { clientId: user.id } });
    }
  });

  async function isReady(): Promise<boolean> {
    return waitFor(service, state => stateMatches(state, "available"), {
      timeout: Infinity,
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

  const errors = useContext<QueryResponseError["message"]>(
    state,
    "error.message"
  );
  const validationErrors = useContext<ErrorObject[]>(state, "error.data");

  const model = useContext<ClientItemContext["model"]>(state, "model");

  const schema = useContext<ClientItemContext["schema"]>(state, "schema");

  const uischema = useContext<ClientItemContext["uischema"]>(state, "uischema");

  // --- methods

  async function input(model: PhoneModel): Promise<PhoneModel> {
    send({ type: "SET", data: model });
    // then we wait until the module has been checked and is valid/invalid
    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(state => get(state, "context.model") as PhoneModel)
      .catch(() => {
        return Promise.reject(
          new DetailedError("Input not available", responseCodes.Forbidden)
        );
      });
  }

  async function update(value?: PhoneModel): Promise<PhoneModel> {
    // first check if our model has changed, if it has we need to send it

    const model = contextValue<PhoneModel>(state, "model");

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
      .then(model => {
        useClientPhoneServices().refresh();
        return model as PhoneModel;
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] update Phone failed",
            error?.status ?? responseCodes.Timeout,
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
     * @typedef {Object} UnifiedPhoneMeta
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

    /** Title of the phone*/
    title,

    /** Description of the.phone*/
    description,

    /** The ID of the phone */
    id: useContext<string | undefined>(state, "id"),

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
     * Inputs a new model, resolving to the updated model.
     * @param {PhoneModel} model - The model to input.
     * @returns {Promise<PhoneModel>} The updated model.
     */
    input,

    /**
     * Sends the current model to the service for processing.
     * @param {PhoneModel} value The optional new model to set. uses the current model if not provided.
     * @returns {Promise<PhoneModel>} Resolves when updated model from the service, rejects on error.
     */
    update,
  };
};

/** The return type of the composable.*/
export type UseClientPhone = ReturnType<typeof useClientPhone>;
