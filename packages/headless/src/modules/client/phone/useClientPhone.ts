// --- external
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";

// --- internal
import itemMachine from "../item.machine";
import { useClientPhones } from "./useClientPhones";
import { useClientPhoneActions } from "./actions";
import { useClientPhoneServices } from "./services";

// --- utils
import { get } from "lodash-es";
import {
  contextValue,
  DetailedError,
  responseCodes,
  stateMatches,
  UnavailableError,
  useContext,
} from "../../../utils";

// --- types
import type { Phone, PhoneModel } from "./types";
import { useActor } from "@xstate/vue";
import type { QueryResponseError } from "../../query";
import { computed } from "vue";
import type { EmailModel } from "../email";
import type { ClientItemContext } from "../types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useClientPhone = (
  id?: Phone["id"],
  { allowMultipleEdits }: { allowMultipleEdits?: boolean } = {}
) => {
  // --- state

  const service = interpret(
    itemMachine
      .withConfig({
        actions: useClientPhoneActions() as any,
        services: useClientPhoneServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined };
        const { getOne } = useClientPhones();
        return {
          id,
          model: getOne(id),
          allowMultipleEdits,
        };
      }),
    {
      id: id ?? "new-phone",
      devTools: true,
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

  // --- context

  const title = useContext<string | undefined>(state, "title");

  const model = useContext<EmailModel>(state, "model");

  const errors = useContext<ClientItemContext["error"]>(state, "error");

  const schema = useContext<JsonSchema>(state, "schema");

  const phoneId = useContext<string | undefined>(state, "id");

  const context = useContext<ClientItemContext>(state);

  const uischema = useContext<UISchemaElement>(state, "uischema");

  const description = useContext<string | undefined>(state, "description");

  // --- methods

  const stop = () => service.stop();

  const clear = () => send({ type: "CLEAR" });

  const input = async (model: PhoneModel): Promise<PhoneModel> => {
    // we have to ensure we are able to input data
    return waitFor(service, state =>
      stateMatches(state, [
        "available.valid",
        "available.error",
        "available.invalid",
      ])
    )
      .then(async () => {
        send({ type: "SET", data: model });
        // then we wait until the module has been checked and is valid/invalid
        return waitFor(service, state =>
          stateMatches(state, [
            "available.valid",
            "available.error",
            "available.invalid",
          ])
        ).then(state => get(state, "context.model") as PhoneModel);
      })
      .catch(() => {
        return Promise.reject(
          new DetailedError("Input not available", responseCodes.Forbidden)
        );
      });
  };

  const update = async () => {
    // we have to ensure we are able to update the phone, i.e., it's available and valid
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
          .then(() => useClientPhoneServices().refresh());
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            error ?? "Update only available if model is valid",
            responseCodes.Forbidden
          )
        );
      });
  };

  return {
    // --- state

    /**
     * Resolves when the phone is ready for input or update.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Computed meta-information about the phone state.
     */
    meta,

    // --- context

    /**
     * Title of the phone.
     */
    title,

    /**
     * The current phone model.
     */
    model,

    /**
     * Any error object from the phone context.
     */
    errors,

    /**
     * The JSON schema for the phone.
     */
    schema,

    /**
     * The full phone context from the XState machine.
     */
    context,

    /**
     * The UI schema for the phone.
     */
    uischema,

    /**
     * The current phone ID.
     */
    phoneId,

    /**
     * Description of the phone.
     */
    description,

    // --- methods

    /**
     * Stops the phone service.
     */
    stop,

    /**
     * Clears the phone context.
     */
    clear,

    /**
     * Inputs a new phone model, resolving to the updated model.
     * @param {PhoneModel} model - The phone model to input.
     * @returns {Promise<PhoneModel>} The updated phone model.
     */
    input,

    /**
     * Updates the phone, resolving when the update is processed.
     * @returns {Promise<void>} Resolves when the update is complete.
     */
    update,
  };
};

export type UseClientPhone = ReturnType<typeof useClientPhone>;
