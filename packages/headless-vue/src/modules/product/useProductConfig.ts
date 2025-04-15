// --- external
import { computed, ref, toRef, watch } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import {
  useBrand,
  useBasketProductsPending,
  SubproductDetails,
} from "@upmind-automation/headless";
import { stateMatches, contextMatches } from "../../utils";

// --- utils
import {
  add,
  get,
  isEmpty,
  isEqual,
  set,
  some,
  subtract,
  isArray,
  forEach,
  find,
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";
import type {
  Product,
  ProductDetails,
  SubproductValue,
  TermDetails,
} from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export const useProductConfig = (service: ActorRef<any>) => {
  const { checkIncludesTax } = useBrand();

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

  const meta = computed(() => ({
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    isNew: !contextMatches(state, ["basketProduct"]),
    isDirty: stateMatches(state, ["available.valid"]),
    isTouched: touched.value,
    isUnavailable: state.value.done || stateMatches(state, ["error"]),
    hasErrors:
      stateMatches(state, ["available.error", "error"]) ||
      contextMatches(state, ["error"]),

    isConfigurable: contextMatches(state, [
      "lookups.attributes",
      "lookups.options",
      "lookups.provisionFields.properties",
    ]),
    isInvalid: stateMatches(state, ["available.invalid"]),
    isCalculating: contextMatches(state, ["lookups.prices.calculating"]),
    isProcessing: stateMatches(state, ["refreshing", "processing", "complete"]),
    isComplete:
      state.value?.done ||
      stateMatches(state, ["available.complete", "complete"]),
    isDone: state.value?.done,

    // ---

    hasProvisioning: !isEmpty(
      state.value.context?.lookups?.provisionFields?.properties
    ),
    hasAttributes: !isEmpty(state.value.context?.lookups?.attributes),
    hasOptions: !isEmpty(state.value.context?.lookups?.options),
    hasTerms: !isEmpty(state.value.context?.lookups?.terms),
    hasMonthlyTerms: some(state.value.context?.lookups?.terms, ["cycle", 1]),
    hasTaxIncluded: checkIncludesTax(),
  }));

  // keep our model in sync with the machine,
  // typically this is only needed when the machine is updated/refreshed
  watch(state, newVal => {
    if (newVal.context.model !== model.value) {
      model.value = newVal.context.model;
    }
  });

  // --- QUANTITY
  const updateQuantity = async (value?: number): Promise<void> => {
    touched.value = true;
    send({
      type: "SET.QUANTITY",
      data: {
        quantity: value || model.value.quantity,
      },
    });

    return waitFor(service, state => state.matches("available.valid"));
  };

  async function incrementQuantity(): Promise<void> {
    // sanity check
    if (!lookups.value.product?.quantifiable) return;

    const qty = get(model.value, "quantity", 0);

    // emit the event
    return updateQuantity(add(qty, lookups.value.product?.step || 1));
  }

  async function decrementQuantity(): Promise<void> {
    // sanity check
    if (!lookups.value.product?.quantifiable) return;

    const qty = get(model.value, "quantity", 0);

    // emit the event
    return updateQuantity(subtract(qty, lookups.value.product?.step || 1));
  }

  // --- TERMS

  function isSelectedTerm(value: number): boolean {
    return isEqual(value, model.value?.term?.cycle);
  }

  const updateTerm = (calue: number): void => {
    touched.value = true;
    send({
      type: "SET.TERM",
      data: { term: calue },
    });
  };
  //emit("update:term",{itemId: props.id,...);

  // --- ATTRIBUTES

  const updateAttributes = (): void => {
    touched.value = true;
    send({
      type: "SET.ATTRIBUTES",
      data: {
        attributes: model.value.attributes,
      },
    });
  };

  function isSelectedAttribute(attributeId: string, value: string): boolean {
    return some(model.value.attributes[attributeId], ["productId", value]);
  }

  function setAttributes(
    attribute: SubproductDetails,
    values: string | string[]
  ): void {
    const safeValues = isArray(values) ? values : [values];
    set(model.value.attributes, attribute.id, {}); // reset all previous attributes

    forEach(safeValues, value => {
      set(model.value.attributes, [attribute.id, value], {
        productId: value,
      });
    });

    // emit the event
    updateAttributes();
  }

  // --- OPTIONS

  const updateOptions = (): void => {
    touched.value = true;
    send({
      type: "SET.OPTIONS",
      data: {
        options: model.value.options,
      },
    });
  };

  function isSelectedOption(optionId: string, value: string): boolean {
    return some(model.value.options[optionId], ["productId", value]);
  }

  function setOptions(
    option: SubproductDetails,
    values: string | string[]
  ): void {
    const safeValues = isArray(values) ? values : [values];
    set(model.value.options, option.id, {}); // reset all previous options
    forEach(safeValues, value => {
      set(model.value.options, [option.id, value], {
        productId: value,
      });
    });

    // emit the event
    updateOptions();
  }

  function updateOptionQuantity(
    option: SubproductDetails,
    productId: string,
    qty: number
  ): void {
    // sanity check
    const product = find(option.values, ["id", productId]);
    if (!product?.quantifiable) return;

    set(model.value.options, [option.id, productId, "step"], qty);

    // emit the event
    updateOptions();
  }

  function incrementOption(
    option: SubproductDetails,
    value: SubproductValue
  ): void {
    // sanity check
    if (!value?.quantifiable) return;

    const qty = get(model.value.options, [option.id, value.id, "step"], 0);
    set(
      model.value.options,
      [option.id, value.id, "step"],
      add(qty, value?.step || 1)
    );
    // emit the event
    updateOptions();
  }

  function decrementOption(
    option: SubproductDetails,
    value: SubproductValue
  ): void {
    // sanity check
    if (!value?.quantifiable) return;
    const qty = get(model.value.options, [option.id, value.id, "step"], 0);
    set(
      model.value.options,
      [option.id, value.id, "step"],
      subtract(qty, value?.step || 1)
    );
    // emit the event
    updateOptions();
  }

  // --- PROVISIONING

  function setProvisioningFields(values: Record<string, any>): void {
    set(model.value, "provisionFields", values);
    // emit the event
    updateProvisioning();
  }

  function getProvisioningField(field: string): any {
    return get(model.value, ["provisionFields", field]);
  }

  const updateProvisioning = (): void => {
    touched.value = true;
    send({
      type: "SET.PROVISIONING",
      data: { provisionFields: model.value.provisionFields },
    });
  };

  // ---------------------------------------------------------------------------
  return {
    id,
    state,
    // context,
    errors,
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
    updateAttributes,
    isSelectedAttribute,
    setAttributes,
    // ---
    updateOptions,
    isSelectedOption,
    setOptions,
    updateOptionQuantity,
    incrementOption,
    decrementOption,
    // ---
    setProvisioningFields,
    updateProvisioning,
    getProvisioningField,
    // ---
    reset: () => send("RESET"),
  };
};
