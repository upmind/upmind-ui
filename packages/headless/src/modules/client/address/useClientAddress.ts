// --- external
import { waitFor } from "xstate/lib/waitFor";
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { interpret } from "xstate";

// --- internal
import itemMachine from "../item.machine";
import { useClientAddresses } from "./useClientAddresses";
import { useClientAddressActions } from "./actions";
import { useClientAddressServices } from "./services";

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
import type { ClientItemContext } from "../types";
import type { Address, AddressModel } from "./types";
import type { JsonSchema, UISchemaElement } from "@jsonforms/core";
import { QueryResponseError } from "src/modules/query";

// -----------------------------------------------------------------------------

export const useClientAddress = (
  id?: Address["id"],
  { allowMultipleEdits }: { allowMultipleEdits?: boolean } = {}
) => {
  // --- state

  const service = interpret(
    itemMachine
      .withConfig({
        actions: useClientAddressActions() as any,
        services: useClientAddressServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined };
        const { getOne } = useClientAddresses();
        return {
          id,
          model: getOne(id),
          allowMultipleEdits,
        };
      }),
    {
      id: id ?? "new-address",
      devTools: false,
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
    isNew: stateMatches(state, "loading"),
    isValid: stateMatches(state, "available.error"),
    isLoading: stateMatches(state, "processing"),
    hasErrors: stateMatches(state, "available.valid"),
    canRemove: !contextValue(state, "model.id"),
    isDefault: stateMatches(state, "model.canDelete"),
    isVerified: stateMatches(state, "model.default"),
    isComplete: stateMatches(state, "model.verified"),
    isProcessing: state.value.done || stateMatches(state, "complete"),
  }));

  // --- context

  const title = useContext<string | undefined>(state, "title");

  const model = useContext<AddressModel>(state, "model");

  const errors = useContext<ClientItemContext["error"]>(state, "error");

  const schema = useContext<JsonSchema>(state, "schema");

  const context = useContext<ClientItemContext>(state);

  const uischema = useContext<UISchemaElement>(state, "uischema");

  const addressId = useContext<string | undefined>(state, "id");

  const description = useContext<string | undefined>(state, "description");

  // --- methods

  const stop = () => service.stop();

  const clear = () => send({ type: "CLEAR" });

  const input = async (model: AddressModel): Promise<AddressModel> => {
    // we have to ensure we are able to input data
    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(async () => {
        send({ type: "SET", data: model });
        // then we wait until the module has been checked and is valid/invalid
        return waitFor(service, state =>
          stateMatches(state, ["available.valid", "available.invalid"])
        ).then(state => get(state, "context.model") as AddressModel);
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
              return Promise.reject(errors.value);
            }
            return Promise.resolve();
          })
          .then(() => useClientAddressServices().refresh());
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
     * Resolves when the address is ready for input or update.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Computed meta-information about the address state.
     */
    meta,

    // --- context

    /**
     * Title of the address.
     */
    title,

    /**
     * The current address model.
     */
    model,

    /**
     * Any error object from the address context.
     */
    errors,

    /**
     * The JSON schema for the address.
     */
    schema,

    /**
     * The full address context from the XState machine.
     */
    context,

    /**
     * The UI schema for the address.
     */
    uischema,

    /**
     * The current address ID.
     */
    addressId,

    /**
     * Description of the address.
     */
    description,

    // --- methods

    /**
     * Stops the address service.
     */
    stop,

    /**
     * Clears the address context.
     */
    clear,

    /**
     * Inputs a new address model, resolving to the updated model.
     * @param {AddressModel} model - The address model to input.
     * @returns {Promise<AddressModel>} The updated address model.
     */
    input,

    /**
     * Updates the address, resolving when the update is processed.
     * @returns {Promise<void>} Resolves when the update is complete.
     */
    update,
  };
};

export type UseClientAddress = ReturnType<typeof useClientAddress>;
