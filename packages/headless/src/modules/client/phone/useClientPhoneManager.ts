// --- external
import { computed } from "vue";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { useActor } from "@xstate/vue";

// --- internal
import { useI18n } from "../../system";
import dataManagerMachine from "../../dataManager/dataManager.machine";
import { useClientPhoneActions, useClientPhoneGuards } from "./actions";
import { useClientPhoneServices } from "./services";
import { useClientPhones } from "./useClientPhones";
import { useSession } from "../../session";

// --- utils
import {
  DEBOUNCE_DELAY,
  DetailedError,
  contextMatches,
  contextValue,
  responseCodes,
  stateMatches,
  stateValue,
  useContext,
  stopService,
  ErrorOrigin,
  type ResponseError
} from "../../../utils";
import { debounce, get, isEmpty, isEqual } from "lodash-es";

// --- types
import type { IClient } from "@upmind-automation/types";
import type { ErrorObject } from "ajv";
import type { DataManagerContext } from "../../dataManager/types";
import type { Phone, PhoneModel } from "./types";

// -----------------------------------------------------------------------------

/**
 * Provides functionalities to manage a client's phone, leveraging an XState machine.
 * This composable handles phone data, validation, saving, and interaction states.
 * It's designed for use in contexts like client profile management or checkout phone selection.
 *
 * @param id - The unique identifier of the phone to manage. If omitted, it may imply a new phone.
 * @param options - Optional configuration for the address management.
 * @param options.allowMultipleEdits - If `true`, allows multiple instances of this composable to manage different phones concurrently.
 * @param options.clientId - The unique identifier of the client to whom this phone belongs.
 * @returns The API for managing the client phone.
 */
export const useClientPhoneManager = (
  id?: Phone["id"],
  {
    allowMultipleEdits,
    clientId
  }: { allowMultipleEdits?: boolean; clientId?: IClient["id"] } = {}
) => {
  const { t } = useI18n();
  const { getOne } = useClientPhones();

  const service = interpret(
    dataManagerMachine
      .withConfig({
        actions: useClientPhoneActions() as any,
        guards: useClientPhoneGuards() as any,
        services: useClientPhoneServices() as any
      })
      .withContext({
        clientId,
        id,
        model: getOne(id),
        allowMultipleEdits
      }),
    {
      id: id ?? "new-phone",
      devTools: false
    }
  );

  const { state, send } = useActor(service.start());

  // --- state

  // the clientId is required to bring the machine into the available state
  const { isAuthenticated } = useSession();
  isAuthenticated()
    .then(client => {
      if (client?.id && !contextMatches(state, "clientId")) {
        send({ type: "REFRESH", data: { clientId: client.id } });
      }
    })
    .catch(() => {
      /* guest sessions won't be authenticated — silently skip */
    });

  async function isReady(): Promise<boolean> {
    return waitFor(service, state => stateMatches(state, "available"), {
      timeout: Infinity
    }).then(state => !stateMatches(state, "error"));
  }

  const meta = computed(() => ({
    isAvailable: stateMatches(state, "available"),
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    hasErrors: stateMatches(state, "available.error"),
    isValid: stateMatches(state, "available.valid"),
    isNew: !stateMatches(state, "model.id"),
    isDirty: !isEqual(
      contextValue<DataManagerContext["model"]>(state, "model"),
      contextValue<DataManagerContext["baseModel"]>(state, "baseModel")
    ),
    isProcessing: stateMatches(state, "processing"),
    isComplete:
      stateValue(state, "done", false) ||
      stateMatches(state, ["processed", "complete"])
  }));

  // --- context
  const context = useContext<DataManagerContext>(state);

  const title = useContext<string | undefined>(state, "title");

  const description = useContext<string | undefined>(state, "description");

  const errors = useContext<ResponseError["message"]>(state, "error.message");
  const validationErrors = useContext<ErrorObject[]>(state, "error.data");

  const model = useContext<DataManagerContext["model"]>(state, "model");

  const schema = useContext<DataManagerContext["schema"]>(state, "schema");

  const uischema = useContext<DataManagerContext["uischema"]>(
    state,
    "uischema"
  );

  // --- methods

  async function input(
    model: PhoneModel | Record<string, any>
  ): Promise<PhoneModel> {
    send({ type: "SET", data: model });
    // then we wait until the module has been checked and is valid/invalid
    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(state => get(state, "context.model") as PhoneModel)
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

  async function update(
    value?: PhoneModel | Record<string, any>
  ): Promise<PhoneModel> {
    // first check if our model has changed, if it has, we need to send it

    const model = contextValue<PhoneModel>(state, "model");

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
          "processed",
          "available.error",
          "available.invalid"
        ]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, ["available.error", "available.invalid"]))
          throw state.context.error;
        return Promise.resolve(state.context.model);
      })
      .then(model => {
        useClientPhoneServices().refresh();
        return model as PhoneModel;
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            t("error.client_phone_update_failed"),
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
     * @type {Object} UnifiedPhoneMeta
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

    /** Title of the phone */
    title,

    /** Description of the phone */
    description,

    /** The ID of the phone */
    id: useContext<string | undefined>(state, "id"),

    /** Any error object from the context. */
    errors,

    /** Any validation errors from the context. */
    validationErrors,

    /** The current model. */
    model,

    /** The JSON schema for the form */
    schema,

    /** The UI schema for the form */
    uischema,

    // --- methods

    /** Stops the service. */
    stop,

    /** Clears the context.*/
    clear,

    /**
     * Inputs a new model, resolving to the updated model. This is debounced to avoid excessive calls.
     * @param {PhoneModel} model - The model to input.
     * @returns {Promise<PhoneModel>} The updated model.
     */
    input: debounce(input, DEBOUNCE_DELAY),

    /**
     * Sends the current model to the service for processing.
     * @param {PhoneModel} value The optional new model to set. uses the current model if not provided.
     * @returns {Promise<PhoneModel>} Resolves when updated model from the service, rejects on error.
     */
    update
  };
};

/**
 * The return type of the {@link useClientPhoneManager} composable function.
 */
export type UseClientPhone = ReturnType<typeof useClientPhoneManager>;
