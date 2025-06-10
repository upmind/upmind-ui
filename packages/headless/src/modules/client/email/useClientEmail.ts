// --- external
import { waitFor } from "xstate/lib/waitFor";
import { useActor } from "@xstate/vue";
import { computed } from "vue";
import { interpret } from "xstate";

// --- internal
import itemMachine from "../item.machine";
import { useClientEmails } from "./useClientEmails";
import { useClientEmailActions } from "./actions";
import { useClientEmailServices } from "./services";

// --- utils
import {
  useContext,
  contextValue,
  stateMatches,
  DetailedError,
  responseCodes,
  UnavailableError,
} from "../../../utils";
import { get } from "lodash-es";

// --- types
import type { QueryResponseError } from "../../query";
import type { Email, EmailModel } from "./types";
import type { ClientItemContext } from "../types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";

// -----------------------------------------------------------------------------

export const useClientEmail = (
  id?: Email["id"],
  { allowMultipleEdits }: { allowMultipleEdits?: boolean } = {}
) => {
  // --- state

  const service = interpret(
    itemMachine
      .withConfig({
        actions: useClientEmailActions() as any,
        services: useClientEmailServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined };
        const { getOne } = useClientEmails();
        return {
          id,
          model: getOne(id),
          allowMultipleEdits,
        };
      }),
    {
      id: id ?? "new-email",
      devTools: true,
    }
  ).start();

  const { state, send } = useActor(service);

  const isReady = async (): Promise<boolean> =>
    waitFor(service, state => stateMatches(state, "available"), {
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

  const emailId = useContext<string | undefined>(state, "id");

  const context = useContext<ClientItemContext>(state);

  const uischema = useContext<UISchemaElement>(state, "uischema");

  const description = useContext<string | undefined>(state, "description");

  // --- methods

  const stop = () => service.stop();

  const clear = () => send({ type: "CLEAR" });

  const input = async (model: EmailModel): Promise<EmailModel> => {
    // we have to ensure we are able to input data
    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(async () => {
        send({ type: "SET", data: model });
        // then we wait until the module has been checked and is valid/invalid
        return waitFor(service, state =>
          stateMatches(state, ["available.valid", "available.invalid"])
        ).then(state => get(state, "context.model") as EmailModel);
      })
      .catch(() => {
        return Promise.reject(
          new DetailedError("Input not available", responseCodes.Forbidden)
        );
      });
  };

  const update = async () => {
    // we have to ensure we are able to update the email, i.e., it's available and valid
    return waitFor(service, state => stateMatches(state, "available.valid"))
      .then(async () => {
        send({ type: "UPDATE" });
        return (
          waitFor(
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
            // TODO: invalidation will be handled by the service
            .then(() => useClientEmailServices().refresh())
        );
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
     * Resolves when the email is ready for input or update.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Computed meta-information about the email state.
     */
    meta,

    // --- context

    /**
     * Title of the email.
     */
    title,

    /**
     * The current email model.
     */
    model,

    /**
     * Any error object from the email context.
     */
    errors,

    /**
     * The JSON schema for the email.
     */
    schema,

    /**
     * The full email context from the XState machine.
     */
    context,

    /**
     * The UI schema for the email.
     */
    uischema,

    /**
     * The current email ID.
     */
    emailId,

    /**
     * Description of the email.
     */
    description,

    // --- methods

    /**
     * Stops the email service.
     */
    stop,

    /**
     * Clears the email context.
     */
    clear,

    /**
     * Inputs a new email model, resolving to the updated model.
     * @param {EmailModel} model - The email model to input.
     * @returns {Promise<EmailModel>} The updated email model.
     */
    input,

    /**
     * Updates the email, resolving when the update is processed.
     * @returns {Promise<void>} Resolves when the update is complete.
     */
    update,
  };
};

export type UseClientEmail = ReturnType<typeof useClientEmail>;
