// --- external
import { computed } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";
import { useI18n } from "vue-i18n";
import { useActor } from "@xstate/vue";

// --- internal
import { useSession, useBrand } from "../..";
import { useProfileDetailsActions, useProfileDetailsGuards } from "./actions";
import { useProfileDetailsServices } from "./services";
import dataManagerMachine from "../../dataManager/dataManager.machine";

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
  stopService
} from "../../../utils";
import { isEqual, get } from "lodash-es";

// --- types
import type { CustomField } from "../../";
import type { FieldsContext, FieldsModel } from "./types";
import type { DataManagerContext } from "../../dataManager/types";

// -----------------------------------------------------------------------------
// We allow an actor to be passed in, but if not, we will use the basket actorRef and wait for the 'actor'' machine to be ready

// /**
//  * Manages the basket fields, state, and interactions.
//  * Provides reactive state, context, and methods to manage basket fields.
//  * Uses internal actors to manage complex state interactions, including field validation and updates.
//  */

export const usePersonalDetailsManager = ({
  allowMultipleEdits = true,
  filterFields = []
}: {
  allowMultipleEdits?: boolean;
  filterFields?: string[];
}) => {
  const { t } = useI18n();
  const { isAuthenticated } = useSession();
  const { languages } = useBrand();

  // --- state
  const service = interpret(
    dataManagerMachine
      .withConfig({
        actions: useProfileDetailsActions() as any,
        guards: useProfileDetailsGuards() as any,
        services: useProfileDetailsServices() as any
      })
      .withContext({
        allowMultipleEdits,
        lookups: {
          filterFields,
          languages: languages.value
        }
      }),
    {
      id: "client-profile-fields",
      devTools: true
    }
  );

  const { state, send } = useActor(service.start());

  // the clientId is required to bring the machine into the available state
  isAuthenticated()
    .then(client => {
      if (client?.id && !contextMatches(state, "id")) {
        send({ type: "REFRESH", data: { id: client.id, clientId: client.id } });
      }
    })
    .catch(() => {
      /* guest sessions won't be authenticated — silently skip */
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
      contextValue<DataManagerContext["model"]>(state, "model"),
      contextValue<DataManagerContext["baseModel"]>(state, "baseModel")
    ),
    showErrors:
      contextMatches(state, ["error"]) && contextMatches(state, ["attempts"]),
    isNew: !stateMatches(state, "model.id"),
    isProcessing: stateMatches(state, "processing"),
    isComplete:
      stateValue(state, "done", false) ||
      stateMatches(state, ["processed", "complete"])
  }));

  // --- context

  const context = useContext<FieldsContext>(state);
  const fields = useContext<CustomField[]>(state, "lookups.fields");
  const errors = useContext<FieldsContext["error"]>(state, "error");
  const model = useContext<FieldsContext["model"]>(state, "model");
  const schema = useContext<FieldsContext["schema"]>(state, "schema");
  const uischema = useContext<FieldsContext["uischema"]>(state, "uischema");

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

  async function update(): Promise<FieldsModel> {
    send({ type: "UPDATE" });

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
        return state.context.model;
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            t("error.profile_details_update_failed"),
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
    // --- state

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
    // update: debounce(update, DEBOUNCE_DELAY),
    update,

    /** Stops the fields service. */
    stop
  };
};

/**
 * The return type of usePersonalDetailsManager composable.
 */
export type usePersonalDetailsManager = ReturnType<
  typeof usePersonalDetailsManager
>;
