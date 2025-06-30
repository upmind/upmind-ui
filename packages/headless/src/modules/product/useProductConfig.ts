// --- external
import { computed, ref, toRef, watch } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useBrand } from "../brand";
import { stateMatches, contextMatches, DEBOUNCE_DELAY } from "../../utils";

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
  mapValues,
  reject,
  set,
  some,
  subtract
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type {
  Product,
  ProductDetails,
  ProductModel,
  TermDetails,
  SubproductDetails
} from "./";

// -----------------------------------------------------------------------------

export const useProductConfig = (service: ActorRef<any>) => {
  const { includesTax } = useBrand();

  const { state, send } = useActor(service);
  const model = toRef(state.value.context, "model");
  const lookups = computed(() => state.value.context.lookups);
  const id = computed(() => service.id);
  const touched = ref(false);

  // syntactic sugar
  const productDetails = computed<ProductDetails>(
    () => state.value.context?.lookups?.product
  );
  const productImage = (size: string = "400x400"): string | undefined => {
    if (!productDetails.value?.imgUrl) return undefined;
    const url = new URL(productDetails.value.imgUrl);
    url.searchParams.set("size", size);
    return url.toString();
  };

  const product = computed<Product>(() => state.value.context?.product);

  const title = computed<string>(() => state.value.context?.product?.title);

  const terms = computed<TermDetails[]>(
    () => state.value.context?.lookups?.terms
  );

  const attributes = computed<SubproductDetails[]>(
    () => state.value.context?.lookups?.attributes
  );

  const options = computed<SubproductDetails[]>(
    () => state.value.context?.lookups?.options
  );

  const fields = computed<Record<string, any>>(
    () => state.value.context?.lookups?.provisionFields
  );

  // ---
  const errors = computed<Product["errors"]>(() => state.value.context?.error);

  const additionalErrors = computed<Product["errors"]>(
    () => state.value.context?.errorExternal
  );

  const meta = computed(() => ({
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    isNew: !contextMatches(state, ["basketProduct"]),
    isDirty: stateMatches(state, ["available.valid"]),
    isTouched: touched.value,
    showErrors:
      contextMatches(state, ["error"]) && contextMatches(state, ["attempts"]),

    isUnavailable: state.value.done || stateMatches(state, ["error"]),
    hasErrors:
      stateMatches(state, ["error", "available.invalid", "available.error"]) ||
      contextMatches(state, ["error"]),

    isConfigurable: contextMatches(state, [
      "lookups.attributes",
      "lookups.options",
      "lookups.provisionFields.properties"
    ]),
    isInvalid: stateMatches(state, ["available.invalid"]),
    isCalculating: contextMatches(state, ["lookups.prices.calculating"]),
    isProcessing: stateMatches(state, ["refreshing", "processing"]),
    isComplete: state.value?.done || stateMatches(state, ["complete"]),
    isDone: state.value?.done,

    // ---
    hasProvisioning: !isEmpty(
      state.value.context?.lookups?.provisionFields?.properties
    ),
    hasAttributes: !isEmpty(state.value.context?.lookups?.attributes),
    hasOptions: !isEmpty(state.value.context?.lookups?.options),
    hasTerms: !isEmpty(state.value.context?.lookups?.terms),
    hasMonthlyTerms: some(
      state.value.context?.lookups?.terms,
      ({ cycle }) => cycle > 0
    ),
    hasTaxIncluded: includesTax.value
  }));

  // keep our model in sync with the machine,
  // typically this is only needed when the machine is updated/refreshed
  watch(state, newVal => {
    if (newVal.context.model !== model.value) {
      model.value = newVal.context.model;
    }
  });

  // --
  async function setValues(
    type:
      | "SET.QUANTITY"
      | "SET.TERM"
      | "SET.ATTRIBUTES"
      | "SET.OPTIONS"
      | "SET.PROVISIONING",
    data: Partial<ProductModel>
  ) {
    touched.value = true;
    send({ type, data });

    return waitFor(
      service,
      state => ["available.valid", "available.invalid"].some(state.matches),
      { timeout: 60_000 }
    ).then(state => {
      // NB only updat ethe model AFTER we have chaecked/parsed/validated
      model.value = state.context.model;
    });
  }

  // --- QUANTITY

  const updateQuantity = debounce(async (value?: number): Promise<void> => {
    setValues("SET.QUANTITY", {
      quantity: value
    });
  }, DEBOUNCE_DELAY);

  const incrementQuantity = debounce(async (value?: number): Promise<void> => {
    // sanity check
    if (!lookups.value.product?.quantifiable) return;

    const qty = get(model.value, "quantity", 0);

    // emit the event
    return updateQuantity(add(qty, lookups.value.product?.step || 1));
  }, DEBOUNCE_DELAY);

  const decrementQuantity = debounce(async (value?: number): Promise<void> => {
    // sanity check
    if (!lookups.value.product?.quantifiable) return;

    const qty = get(model.value, "quantity", 0);

    // emit the event
    return updateQuantity(subtract(qty, lookups.value.product?.step || 1));
  }, DEBOUNCE_DELAY);

  // --- TERMS

  function isSelectedTerm(value: number): boolean {
    return isEqual(value, model.value?.term?.cycle);
  }

  const updateTerm = async (value: number): Promise<void> =>
    setValues("SET.TERM", {
      term: value
    });

  // --- ATTRIBUTES

  function isSelectedAttribute(attributeId: string, value: string): boolean {
    return some(model.value.attributes[attributeId], ["productId", value]);
  }

  async function setAttributes(
    attribute: SubproductDetails,
    values: string | string[]
  ): Promise<void> {
    const attributes = model.value.attributes;
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

  // --- OPTIONS

  function isSelectedOption(optionId: string, value: string): boolean {
    return some(model.value.options[optionId], ["productId", value]);
  }

  async function setOptions(
    option: SubproductDetails,
    values: string | string[]
  ): Promise<void> {
    const options = model.value.options;
    const previousStates = get(options, option.id, {}); // keep previous state to restore quantity

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

  async function updateOptionQuantity(
    option: SubproductDetails,
    valueId: string,
    qty: number
  ): Promise<void> {
    // sanity check
    const value = find(option.values, ["id", valueId]);
    if (!value?.quantifiable) return;
    const options = model.value.options;
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
    const options = model.value.options;
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

    const options = model.value.options;
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

  // ---------------------------------------------------------------------------
  return {
    id,
    state,
    service,
    // context,
    errors,
    additionalErrors,
    meta,
    // ---
    lookups,
    title,
    // productDetails,
    productImage,
    terms,
    options,
    attributes,
    fields,
    // ---
    model,
    product,
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
    // ---
    isSelectedOption,
    setOptions,
    updateOptionQuantity,
    incrementOption,
    decrementOption,
    // ---
    setProvisioningFields,
    getProvisioningField,
    // ---
    reset: () => send({ type: "RESET" })
  };
};
