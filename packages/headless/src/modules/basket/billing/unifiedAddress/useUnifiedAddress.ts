// --- external
import { computed, toRaw, unref } from "vue";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";
import { useActor } from "@xstate/vue";

// --- internal
import itemMachine from "../../../client/item.machine";
import { useClientCompanies, useClientAddresses } from "../../../client";
import { useUnifiedAddressActions } from "./actions";
import { useUnifiedAddressServices } from "./services";

// --- utils
import {
  DetailedError,
  responseCodes,
  useContext,
  contextMatches,
  stateMatches,
  stateValue,
  contextValue,
} from "../../../../utils";
import { get, isEqual } from "lodash-es";

// --- types
import type { UnifiedAddressModel, UnifiedAddressContext } from "./types";
import { QueryResponseError } from "../../../query";

// -----------------------------------------------------------------------------

export const useUnifiedAddress = (
  id?: string,
  { allowMultipleEdits }: { allowMultipleEdits?: boolean } = {}
) => {
  const { getOne: getCompany } = useClientCompanies();
  const { getOne: getAddress } = useClientAddresses();

  // --- state
  const service = interpret(
    itemMachine
      .withConfig({
        actions: useUnifiedAddressActions() as any,
        services: useUnifiedAddressServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined } as Partial<UnifiedAddressContext>;

        return {
          id,
          model: getCompany(id) ?? getAddress(id),
          allowMultipleEdits,
        } as Partial<UnifiedAddressContext>;
      }),
    {
      id: id ?? "new-billing-detail",
      devTools: false,
    }
  );

  const { state, send } = useActor(service.start());

  async function isReady() {
    return waitFor(service, state => state.matches("available"), {
      timeout: Infinity, // infinity = no timeout
    });
  }

  const meta = computed(() => ({
    isAvailable: stateMatches(state, "available"),
    isLoading: stateMatches(state, "processing"),
    hasErrors: stateMatches(state, "error"),
    isProcessing: stateMatches(state, "processing"),
    isValid: stateMatches(state, "available.valid"),
    isDirty: contextMatches(state, "dirty"),
    isComplete:
      stateValue(state, "done", false) ||
      stateMatches(state, ["processed", "complete"]),
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

  const errors = useContext<QueryResponseError>(state, "error");

  const model = useContext<UnifiedAddressContext["model"]>(state, "model");

  const schema = useContext<UnifiedAddressContext["schema"]>(state, "schema");

  const uischema = useContext<UnifiedAddressContext["uischema"]>(
    state,
    "uischema"
  );

  // -- methods

  async function input(model: UnifiedAddressModel) {
    // we have to ensure we are able to input data
    service.send({ type: "SET", data: model });
    // then we wait until the module has been checked and is valid/invalid
    return waitFor(service, state =>
      ["available.valid", "available.invalid"].some(state.matches)
    )
      .then(state => get(state, "context.model") as UnifiedAddressModel)

      .catch(() => {
        return Promise.reject(
          new DetailedError("Input not available", responseCodes.Forbidden)
        );
      });
  }

  async function update(value: UnifiedAddressModel): Promise<void> {
    // first check if our unified address has changed, ie: model.code has changed

    const model = contextValue<UnifiedAddressModel>(state, "model");

    // if it has not then bail
    if (!isEqual(value, model)) {
      send({ type: "SET", data: value, update: true });
    } else {
      send({ type: "UPDATE" });
    }

    // we have to ensure we are able to update the address, ie it's available and valid

    return waitFor(
      service,
      state => {
        return stateMatches(state, ["processed", "complete", "error"]);
      },
      { timeout: 60_000 }
    )
      .then(state => {
        if (stateMatches(state, "available.error")) throw state.context.error;

        return Promise.resolve();
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] update Unified Address on basket failed",
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
     * Waits for the unified address actor to be ready (not loading or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the unified address state.
     * @typedef {Object} UnifiedAddressMeta
     * @property {boolean} isAvailable - Indicates if the unified address actor is available.
     * @property {boolean} isLoading - Indicates if the unified address actor is loading.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isProcessing - Indicates if the unified address is processing.
     * @property {boolean} isValid - Indicates if the unified address is valid.
     * @property {boolean} isDirty - Indicates if the unified address is dirty.
     * @property {boolean} isComplete - Indicates if the unified address is complete.
     */
    meta,

    // --- context

    /** The full unified address context object. */
    context,

    /** The list of available addresses. */
    addresses,

    /** The list of available companies. */
    companies,

    /** The list of available phones. */
    phones,

    /** Any error returned by the unified address actor. */
    errors,

    /** The current unified address model. */
    model,

    /** The unified address schema. */
    schema,

    /** The unified address UI schema. */
    uischema,

    // --- methods

    /** Clears the unified address state. */
    clear,

    /**
     * Sends a SET event to update the unified address model.
     * @param {UnifiedAddressModel} value The unified address model to set.
     * @returns {void} Does not return anything.
     */
    input,

    /**
     * Updates the unified address if the code has changed.
     * @param {UnifiedAddressModel} value The new unified address model to set.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update,
  };
};

/**
 * The return type of the composable.
 */
export type UseUnifiedAddress = ReturnType<typeof useUnifiedAddress>;
