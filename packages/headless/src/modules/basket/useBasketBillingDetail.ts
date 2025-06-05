// --- external
import { computed, onUnmounted, toRaw, unref } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";
import { interpret, InterpreterFrom } from "xstate";

// --- internal
import {
  type UnifiedAddress,
  type UnifiedAddressModel,
  UnifiedAddressContext,
  useBillingDetailsActions,
  useBillingDetailsServices,
} from "./billing/unifiedAddress";
import itemMachine from "../client/item.machine";
import { useBasketBillingDetails } from "./";

// --- utils
import {
  contextMatches,
  contextValue,
  DetailedError,
  responseCodes,
  stateMatches,
  stateValue,
  stopService,
  useContext,
} from "../../utils";

// -----------------------------------------------------------------------------

/**
 * Composable for a single billing detail (unified address).
 * @param id The id of the billing detail.
 * @param options Options for the billing detail composable.
 * @returns DEVX-compliant composable for a single billing detail.
 */
export const useBasketBillingDetail = (
  id?: UnifiedAddress["id"],
  options: { allowMultipleEdits?: boolean } = {}
) => {
  const service = interpret(
    itemMachine
      .withConfig({
        actions: useBillingDetailsActions() as any,
        services: useBillingDetailsServices() as any,
      })
      .withContext(() => {
        if (!id) return { model: undefined } as Partial<UnifiedAddressContext>;
        const { getOne } = useBasketBillingDetails();
        return {
          id,
          model: getOne(id),
          allowMultipleEdits: options.allowMultipleEdits,
        } as Partial<UnifiedAddressContext>;
      }),
    {
      id: id ?? "new-billing-detail",
      devTools: false,
    }
  ).start();

  const { state, send } = useActor(service);

  onUnmounted(() => stop());

  // --- state

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => stateMatches(state, ["available", "error"]),
      { timeout: Infinity }
    )
      .then(() => stateMatches(state.value, "available"))
      .catch(() => false);
  }

  const meta = computed(() => ({
    canRemove: contextMatches(state, "model.canDelete"),
    hasErrors: stateMatches(state, ["available.error"]),
    isComplete:
      stateValue(state, "done", false) || stateMatches(state, ["complete"]),
    isDefault: contextMatches(state, "model.default"),
    isLoading: stateMatches(state, "loading"),
    isNew: !contextMatches(state, "model.id"),
    isProcessing: stateMatches(state, "processing"),
    isValid: stateMatches(state, "available.valid"),
    isVerified: contextMatches(state, "model.verified"),
  }));

  const context = useContext<UnifiedAddressContext>(state);
  const errors = useContext<UnifiedAddressContext["error"]>(state, "error");
  const model = useContext<UnifiedAddressContext["model"]>(state, "model");
  const schema = useContext<UnifiedAddressContext["schema"]>(state, "schema");
  const uischema = useContext<UnifiedAddressContext["uischema"]>(
    state,
    "uischema"
  );
  const title = useContext<UnifiedAddressContext["title"]>(state, "title");
  const description = useContext<UnifiedAddressContext["description"]>(
    state,
    "description"
  );

  // --- methods

  async function input(
    value: UnifiedAddressModel
  ): Promise<UnifiedAddressModel> {
    value = toRaw(unref(value));

    send({ type: "SET", data: value });

    return waitFor(service, state =>
      stateMatches(state, ["available.valid", "available.invalid"])
    )
      .then(state => {
        // XState state object should have a context property
        // Defensive: if not, return undefined
        return (
          contextValue<UnifiedAddressModel>(state, "model") ??
          ({} as UnifiedAddressModel)
        );
      })

      .catch(() => {
        return Promise.reject(
          new DetailedError("Input not available", responseCodes.Forbidden)
        );
      });
  }

  async function update(): Promise<void> {
    send({ type: "UPDATE" });
    return waitFor(
      service,
      state => stateMatches(state, ["processed", "available.error"]),
      { timeout: Infinity }
    )
      .then(state => {
        if (stateMatches(state, ["error", "available.error"])) {
          throw state.context.error;
        }
        return Promise.resolve();
      })

      .catch(error => {
        return Promise.reject(
          new DetailedError(
            "[headless] update Billing Details on basket failed",
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
    send({ type: "CLEAR" });
  }

  function stop(): void {
    stopService(service as InterpreterFrom<any>);
  }

  // ---------------------------------------------------------------------------
  return {
    // --- state

    /**
     * Waits for the billing detail actor to be ready (in available state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the billing detail state.
     * @property {boolean} isLoading - Indicates if the billing detail is loading.
     * @property {boolean} hasErrors - Indicates if there are errors.
     * @property {boolean} isProcessing - Indicates if the billing detail is processing.
     * @property {boolean} isValid - Indicates if the billing detail is valid.
     * @property {boolean} isNew - Indicates if the billing detail is new.
     * @property {boolean} canRemove - Indicates if the billing detail can be removed.
     * @property {boolean} isDefault - Indicates if the billing detail is default.
     * @property {boolean} isVerified - Indicates if the billing detail is verified.
     * @property {boolean} isComplete - Indicates if the billing detail is complete.
     */
    meta,

    // --- context

    /**
     * The billing detail id.
     */
    id,

    /**
     * The billing detail context object.
     */
    context,

    /**
     * The billing detail description.
     */
    description,

    /**
     * Any error message from the billing detail.
     */
    errors,

    /**
     * The billing detail model.
     */
    model,

    /**
     * The billing detail schema.
     */
    schema,

    /**
     * The billing detail title.
     */
    title,

    /**
     * The billing detail UI schema.
     */
    uischema,

    // --- methods

    /**
     * Clears the billing detail state.
     * @returns {void}
     */
    clear,

    /**
     * Sends a SET event to update the billing detail model.
     * @param {UnifiedAddressModel} value The billing detail model to set.
     * @returns {Promise<UnifiedAddressModel>} Resolves with the updated model.
     */
    input,

    /**
     * Updates the billing detail if valid.
     * @returns {Promise<void>} Resolves when updated, rejects on error.
     */
    update,

    /**
     * Stops the billing detail service.
     * @returns {void}
     */
    stop,
  };
};

/**
 * The return type of useBasketBillingDetail composable.
 */
export type UseBasketBillingDetail = ReturnType<typeof useBasketBillingDetail>;
