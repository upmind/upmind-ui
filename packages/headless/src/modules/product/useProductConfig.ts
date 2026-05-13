// --- external
import { computed, ref } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBrand } from "../brand";
import {
  stateMatches,
  contextMatches,
  DEBOUNCE_DELAY,
  contextValue,
  useImageUrl,
  useContext,
  type ResponseError,
  responseCodes,
  DetailedError,
  ErrorOrigin
} from "../../utils";

// --- utils
import {
  add,
  compact,
  debounce,
  filter,
  find,
  forEach,
  get,
  isArray,
  isEmpty,
  isEqual,
  keys,
  set,
  some,
  subtract
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type {
  Product,
  ProductDetails,
  ProductModel,
  TermDetails,
  SubproductDetails,
  ProductConfigContext
} from "./";
import { generateShareUrlConfig } from "./utils";
import { useI18n } from "../system";

// -----------------------------------------------------------------------------

/**
 * A composable function that provides functionality and state management for product configuration.
 * It integrates various aspects of product customisation, such as quantity, terms, attributes, and options,
 * while managing the underlying state using an actor-based state management system.
 * @param {ActorRef<any>} service - The actor reference representing the product configuration state machine.
 * @returns The {@link UseProductConfig} composable methods and state for product configuration.
 */
export const useProductConfig = (service: ActorRef<any>) => {
  const { includesTax } = useBrand();

  const { state, send } = useActor(service);
  const model = useContext<ProductModel>(state, "model");
  const baseModel = useContext<ProductModel>(state, "baseModel");
  const lookups = useContext<ProductConfigContext["lookups"]>(state, "lookups");
  const raw = computed(() => ({
    product: contextValue<ProductConfigContext["rawProduct"]>(
      state,
      "rawProduct"
    ),
    basketProduct: contextValue<ProductConfigContext["rawBasketProduct"]>(
      state,
      "rawBasketProduct"
    ),
    provisionFields: contextValue<ProductConfigContext["rawProvisionFields"]>(
      state,
      "rawProvisionFields"
    )
  }));
  const id = computed(() => service.id);
  const touched = ref(false);

  // syntactic sugar
  const productDetails = useContext<ProductDetails>(state, "lookups.product");

  const productImage = (size: string = "400x400"): string | undefined => {
    return useImageUrl(productDetails.value?.imgUrl, size);
  };

  const product = useContext<Product>(state, "product");
  const title = useContext<string>(state, "product.title");
  const terms = useContext<TermDetails[]>(state, "lookups.terms");
  const attributes = useContext<SubproductDetails[]>(
    state,
    "lookups.attributes"
  );
  const options = useContext<SubproductDetails[]>(state, "lookups.options");
  const fields = useContext<Record<string, any>>(
    state,
    "schema.properties.provisionFields"
  );

  const schema = useContext<JsonSchema7>(state, "schema");
  const uischema = useContext<UISchemaElement>(state, "uischema");

  // ---
  const errors = useContext<Product["errors"]>(state, "error");

  const validationErrors = useContext<Product["errors"]>(state, "error.data");
  const additionalErrors = useContext<Product["errors"]>(
    state,
    "errorExternal.data"
  );
  const externalErrors = useContext<ResponseError>(state, "errorExternal");

  const shareUrl = computed(() => {
    const baseUrl = `${window.location.origin}/order/product/${productDetails.value?.id}`;

    if (!model.value) return baseUrl;

    const config = generateShareUrlConfig(model.value);
    return `${baseUrl}?${config}`;
  });

  const meta = computed<UseProductConfigMeta>(() => ({
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    isNew: !contextMatches(state, ["basketProduct"]),
    isDirty: !isEqual(
      contextValue<ProductConfigContext["model"]>(state, "model"),
      contextValue<ProductConfigContext["baseModel"]>(state, "baseModel")
    ),
    isTouched: touched.value,
    showErrors:
      isArray(contextValue(state, "errorExternal")) ||
      (contextMatches(state, ["error"]) && contextMatches(state, ["attempts"])),

    hasErrors:
      stateMatches(state, [
        "unavailable",
        "available.invalid",
        "available.error"
      ]) || contextMatches(state, ["error"]),

    isConfigurable:
      (terms.value?.length ?? 0) > 1 ||
      contextMatches(state, [
        "lookups.attributes",
        "lookups.options",
        "lookups.provisionFields"
      ]),
    isInvalid: stateMatches(state, ["available.invalid"]),
    isCalculating: contextMatches(state, ["lookups.prices.calculating"]),
    isProcessing: stateMatches(state, ["refreshing", "processing"]),
    isAvailable: stateMatches(state, ["available", "refreshing", "processing"]),
    isLocked:
      stateMatches(state, ["unavailable"]) && !!contextValue(state, "readonly"),
    isUnavailable: stateMatches(state, ["unavailable", "available.error"]),
    isComplete: stateMatches(state, ["complete"]),
    isDone: !state.value || state.value?.done,

    // ---
    hasProvisioning: !isEmpty(state.value.context?.lookups?.provisionFields),
    hasAttributes: !isEmpty(state.value.context?.lookups?.attributes),
    hasOptions: !isEmpty(state.value.context?.lookups?.options),
    hasTerms: !isEmpty(state.value.context?.lookups?.terms),
    hasTaxIncluded: includesTax.value,
    // --- trial
    hasTrial: !!state.value.context?.lookups?.product?.trialSupported,
    isTrialForced: !!state.value.context?.lookups?.product?.trialForce,
    isTrialSelected: !!model.value?.startTrial
  }));

  // --
  async function setValues(
    type:
      | "SET.QUANTITY"
      | "SET.TERM"
      | "SET.ATTRIBUTES"
      | "SET.OPTIONS"
      | "SET.PROVISIONING"
      | "SET.TRIAL"
      | "SET",
    data: Partial<ProductModel>
  ) {
    // Bail if locked - product contains non-orderable subproducts
    if (meta.value.isLocked) {
      const { t } = useI18n();
      throw new DetailedError(
        t("error.basket_product_readonly"),
        responseCodes.Forbidden,
        ErrorOrigin.Headless
      );
    }
    touched.value = true;
    send({ type, data });

    return waitFor(
      service,
      state => ["available.valid", "available.invalid"].some(state.matches),
      { timeout: 60_000 }
    );
  }

  async function setConfig(data: Partial<ProductModel>): Promise<void> {
    setValues("SET", data);
  }

  // --- QUANTITY

  async function updateQuantity(value?: number): Promise<void> {
    return setValues("SET.QUANTITY", {
      quantity: value
    });
  }

  async function incrementQuantity(value?: number): Promise<void> {
    // sanity check
    if (!lookups.value?.product?.quantifiable) return;

    const qty = get(model.value, "quantity", 0);

    // emit the event
    return updateQuantity(add(qty, lookups.value.product?.step || 1));
  }

  async function decrementQuantity(value?: number): Promise<void> {
    // sanity check
    if (!lookups.value?.product?.quantifiable) return;

    const qty = get(model.value, "quantity", 0);

    // emit the event
    return updateQuantity(subtract(qty, lookups.value.product?.step || 1));
  }

  // --- TERMS

  function isSelectedTerm(value: number): boolean {
    return isEqual(value, model.value?.term);
  }

  async function updateTerm(value: number): Promise<void> {
    return setValues("SET.TERM", {
      term: value
    });
  }

  // --- ATTRIBUTES

  function isSelectedAttribute(attributeId: string, value: string): boolean {
    return some(model.value?.attributes?.[attributeId], ["productId", value]);
  }

  async function setAttributes(
    attribute: SubproductDetails,
    values: string | string[]
  ): Promise<void> {
    const attributes = model.value?.attributes ?? {};
    set(attributes, attribute.id, {}); // reset all previous attributes

    const safeValues = compact(isArray(values) ? values : [values]);

    forEach(safeValues, value => {
      set(attributes, [attribute.id, value], {
        productId: value
      });
    });

    // emit the event
    return setValues("SET.ATTRIBUTES", { attributes });
  }

  async function toggleAttribute(
    attribute: SubproductDetails,
    valueId: string,
    enabled: boolean
  ): Promise<void> {
    if (!attribute.meta.multiple) {
      return setAttributes(attribute, enabled ? [valueId] : []);
    }

    const currentSelections = model.value?.attributes?.[attribute.id] ?? {};
    const currentIds = keys(currentSelections);

    const updatedIds = enabled
      ? [...currentIds, valueId]
      : filter(currentIds, id => id !== valueId);

    return setAttributes(attribute, updatedIds);
  }

  // --- OPTIONS

  function isSelectedOption(optionId: string, value: string): boolean {
    return some(model.value?.options?.[optionId], ["productId", value]);
  }

  async function setOptions(
    option: SubproductDetails,
    values: string | string[]
  ): Promise<void> {
    const options = model.value?.options ?? {};
    const previousStates = get(options, option.id, {}); // keep the previous state to restore quantity

    set(options, option.id, {}); // reset all previous options

    const safeValues = compact(isArray(values) ? values : [values]);
    forEach(safeValues, value => {
      const quantity = get(previousStates, [value, "quantity"]);

      const optionValue: { productId: string; quantity?: number } = {
        productId: value
      };

      if (quantity) {
        optionValue.quantity = quantity;
      }

      set(options, [option.id, value], optionValue);
    });

    // emit the event
    return setValues("SET.OPTIONS", { options });
  }

  async function toggleOption(
    option: SubproductDetails,
    valueId: string,
    enabled: boolean
  ): Promise<void> {
    if (!option.meta.multiple) {
      if (enabled) {
        return setOptions(option, [valueId]);
      }

      const options = { ...(model.value?.options ?? {}) };
      delete options[option.id];
      return setValues("SET.OPTIONS", { options });
    }

    const currentSelections = model.value?.options?.[option.id] ?? {};
    const currentIds = keys(currentSelections);

    const updatedIds = enabled
      ? [...currentIds, valueId]
      : filter(currentIds, id => id !== valueId);

    return setOptions(option, updatedIds);
  }

  async function updateOptionQuantity(
    option: SubproductDetails,
    valueId: string,
    qty: number
  ): Promise<void> {
    // sanity check
    const value = find(option.values, ["id", valueId]);
    if (!value?.quantifiable) return;
    const options = model.value?.options ?? {};
    set(options, [option.id, value.id, "quantity"], qty);
    // emit the event
    return setValues("SET.OPTIONS", { options });
  }

  async function incrementOption(
    option: SubproductDetails,
    valueId: string
  ): Promise<void> {
    // sanity check
    const value = find(option.values, ["id", valueId]);
    if (!value?.quantifiable) return;
    const options = model.value?.options ?? {};
    const qty = get(options, [option.id, value.id, "step"], 0);
    set(options, [option.id, value.id, "quantity"], add(qty, value?.step || 1));

    // emit the event
    return setValues("SET.OPTIONS", { options });
  }

  async function decrementOption(
    option: SubproductDetails,
    valueId: string
  ): Promise<void> {
    // sanity check
    const value = find(option.values, ["id", valueId]);
    if (!value?.quantifiable) return;

    const options = model.value?.options ?? {};
    const qty = get(options, [option.id, value.id, "step"], 0);
    set(
      options,
      [option.id, value.id, "quantity"],
      subtract(qty, value?.step || 1)
    );

    // emit the event
    return setValues("SET.OPTIONS", { options });
  }

  // --- PROVISIONING

  async function setProvisioningFields(
    values: Record<string, any>
  ): Promise<void> {
    // emit the event
    return setValues("SET.PROVISIONING", { provisionFields: values });
  }

  function getProvisioningField(field: string): any {
    return get(model.value, ["provisionFields", field]);
  }

  // --- TRIAL

  async function setTrial(enabled: boolean): Promise<void> {
    return setValues("SET.TRIAL", { startTrial: enabled });
  }

  // ---------------------------------------------------------------------------
  return {
    id,
    state,
    service,
    // context,
    errors,
    validationErrors,
    additionalErrors,
    externalErrors,
    meta,
    // ---
    lookups,
    raw,
    schema,
    uischema,
    title,
    // productDetails,
    productImage,
    terms,
    options,
    attributes,
    fields,
    // ---
    model,
    baseModel,
    product,
    shareUrl,
    // ---
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    // ---
    updateTerm,
    isSelectedTerm,
    // ---
    isSelectedAttribute,
    setAttributes,
    toggleAttribute,
    // ---
    isSelectedOption,
    setOptions,
    toggleOption,
    updateOptionQuantity,
    incrementOption,
    decrementOption,
    // ---
    setConfig,
    setProvisioningFields,
    getProvisioningField,
    // ---
    setTrial,
    // ---
    reset: () => send({ type: "RESET" }),
    onDone: () =>
      new Promise(resolve => {
        const sub = service.subscribe(state => {
          if (state.done) {
            resolve(state.context);
            sub.unsubscribe();
          }
        });
      })
  };
};

/**
 * The return type of the {@link useProductConfig} composable function.
 */
export type UseProductConfig = ReturnType<typeof useProductConfig>;

/**
 * Represents the metadata related to a product configuration process.
 *
 * This type provides a set of boolean flags that indicate various states and conditions
 * during the product configuration lifecycle. It encapsulates important information such
 * as loading states, validation status, availability, completion, and additional feature-related flags.
 */
export type UseProductConfigMeta = {
  isLoading: boolean;
  isNew: boolean;
  isDirty: boolean;
  isTouched: boolean;
  showErrors: boolean;
  hasErrors: boolean;
  isConfigurable: boolean;
  isInvalid: boolean;
  isProcessing: boolean;
  isCalculating: boolean;
  isAvailable: boolean;
  /** `true` if the product contains non-orderable subproducts and cannot be modified. */
  isLocked: boolean;
  isUnavailable: boolean;
  isComplete: boolean;
  isDone: boolean;
  // ---
  hasProvisioning: boolean;
  hasAttributes: boolean;
  hasOptions: boolean;
  hasTerms: boolean;
  hasTaxIncluded: boolean;
  // --- trial
  hasTrial: boolean;
  isTrialForced: boolean;
  isTrialSelected: boolean;
};
