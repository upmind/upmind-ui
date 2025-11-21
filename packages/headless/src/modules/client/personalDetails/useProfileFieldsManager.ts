// --- external
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";
import {
  computed
  //  toRaw, unref
} from "vue";
import { useI18n } from "vue-i18n";
import { useActor } from "@xstate/vue";

// --- internal
// import { useBasket } from "./";
import { useProfileDetailsActions, useProfileDetailsGuards } from "./actions";
import services from "./services";

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useContext,
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
  DEBOUNCE_DELAY,
  stopService
} from "../../../utils";
import dataManagerMachine from "../../../utils/dataManager.machine";
import { useSession } from "../..";
import { debounce, isEqual, isEmpty, get } from "lodash-es";

// --- types
// import type { ActorRef } from "xstate";
import { FieldsContext, FieldsModel } from "./types";
import type { ClientItemContext } from "../types";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

// /**
//  * Manages the basket fields, state, and interactions.
//  * Provides reactive state, context, and methods to manage basket fields.
//  * Uses internal actors to manage complex state interactions, including field validation and updates.
//  */

export const useProfileFieldsManager = (
  {
    allowMultipleEdits,
    filterFields
  }: { allowMultipleEdits?: boolean; filterFields?: string[] } = {
    allowMultipleEdits: true,
    filterFields: []
  }
) => {
  const { t } = useI18n();
  const { isAuthenticated } = useSession();

  // --- state
  const service = interpret(
    dataManagerMachine
      .withConfig({
        actions: useProfileDetailsActions() as any,
        guards: useProfileDetailsGuards() as any,
        services: services() as any
      })
      .withContext({
        // clientId,
        // client: client.value,
        // model: getOne(id),
        allowMultipleEdits
        // filter: fields
      }),
    {
      id: "client-profile-fields",
      devTools: true
    }
  );

  const { state, send } = useActor(service.start());

  // the clientId is required to bring the machine into the available state
  isAuthenticated().then(client => {
    if (client?.id && !contextMatches(state, "clientId")) {
      send({ type: "REFRESH", data: { clientId: client.id } });
    }
  });

  async function isReady(): Promise<boolean> {
    return isAuthenticated().then(() =>
      waitFor(
        service,
        state => stateMatches(state, ["available", "unavailable"]),
        {
          timeout: Infinity
        }
      ).then(state => !stateMatches(state, "error"))
    );
  }

  const meta = computed(() => ({
    isAvailable: stateMatches(state, "available"),
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    hasErrors: stateMatches(state, "available.error"),
    isValid: stateMatches(state, "available.valid"),
    isDirty: !isEqual(
      contextValue<ClientItemContext["model"]>(state, "model"),
      contextValue<ClientItemContext["baseModel"]>(state, "baseModel")
    ),
    showErrors:
      contextMatches(state, ["error"]) && contextMatches(state, ["attempts"]),
    isNew: !stateMatches(state, "model.id"),
    isProcessing: stateMatches(state, "processing"),
    isComplete:
      stateValue(state, "done", false) ||
      stateMatches(state, ["processed", "complete"])
  }));

  // const meta = computed(() => ({
  //   client: client.value,
  //   isAvailable: !!client.value,
  //   isLoading: !client.value,
  //   hasFields: true,
  //   hasErrors: false,
  //   isProcessing: false,
  //   isValid: true,
  //   isDirty: false,
  //   isComplete: false,
  //   fields: customFields.value
  //   // hasFields: contextMatches(actor, ["fields"]),
  //   // hasErrors: stateMatches(actor, ["error"]),
  //   // isProcessing: stateMatches(actor, ["processing"]),
  //   // isValid: stateMatches(actor, ["valid"]),
  //   // isDirty: !isEqual(
  //   //   contextValue<FieldsContext["model"]>(actor, "model"),
  //   //   contextValue<FieldsContext["baseModel"]>(actor, "baseModel")
  //   // ),
  //   // isComplete:
  //   //   stateValue(actor, "done", false) ||
  //   //   stateMatches(actor, ["processed", "complete"])
  // }));

  // --- context

  const context = useContext<FieldsContext>(service);
  const fields = useContext<FieldsContext["fields"]>(service, "fields");
  const errors = useContext<FieldsContext["error"]>(service, "error");
  const model = useContext<FieldsContext["model"]>(service, "model");
  const schema = useContext<FieldsContext["schema"]>(service, "schema");
  const uischema = useContext<FieldsContext["uischema"]>(service, "uischema");

  // --- methods

  async function input(
    model: FieldsModel | Record<string, any>
  ): Promise<FieldsModel> {
    send({ type: "SET", data: model });
    // then we wait until the module has been checked and is valid/invalid
    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(state => get(state, "context.model") as FieldsModel)
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
    value?: FieldsModel | Record<string, any>
  ): Promise<FieldsModel> {
    // first check if our model has changed, if it has, we need to send it

    const model = contextValue<FieldsModel>(state, "model");

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
            t("error.client_email_update_failed"),
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
  //   // ---------------------------------------------------------------------------
  return {
    //     // --- state

    /**
     * Waits for the fields actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    //     /**
    //      * Meta-information about the basket fields state.
    //      * @property {boolean} isAvailable - Indicates if the fields actor is available.
    //      * @property {boolean} isLoading - Indicates if the fields actor is loading.
    //      * @property {boolean} hasFields - Indicates if a fields is set.
    //      * @property {boolean} hasErrors - Indicates if there are errors.
    //      * @property {boolean} isProcessing - Indicates if the fields is processing.
    //      * @property {boolean} isValid - Indicates if the fields is valid.
    //      * @property {boolean} isDirty - Indicates if the fields is dirty.
    //      * @property {boolean} isComplete - Indicates if the fields is complete.
    //      */
    meta,

    /** The full fields context object. */
    context,

    /** The list of available fields. */
    fields,

    /** Any error returned by the fields actor. */
    errors,

    /** The current fields model. */
    model,

    /** The fields schema. */
    schema,

    /** The fields UI schema. */
    uischema,

    // --- methods

    /** Clears the fields state. */
    clear,

    /** Sends a SET event to update the fields model.
     * @param {FieldsModel} value The fields model to set.
     * @returns {void} Does not return anything.
     */

    input,

    /**
     * Updates the fields if the code has changed.
     * @param {FieldsModel} value The new fields model to set.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update: debounce(update, DEBOUNCE_DELAY)
  };
};

/**
 * The return type of useProfileFieldsManager composable.
 */
export type useProfileFieldsManager = ReturnType<
  typeof useProfileFieldsManager
>;
