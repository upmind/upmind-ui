// --- external
import type { ComputedRef } from "vue";
import { computed, ref, toRef, watch } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal

import { stateMatches, contextMatches } from "../../utils";

// --- utils
import {
  add,
  get,
  isEmpty,
  isObject,
  isEqual,
  set,
  some,
  subtract,
  isArray,
  forEach,
} from "lodash-es";

// --- types
import type { ActorRef } from "xstate";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useProductConfig = (service: ActorRef<any, any>) => {
  const { state, send } = useActor(service);
  const model = toRef(state.value.context, "model");
  const lookups = computed(() => state.value.context.lookups);
  const id = computed(() => service.id);
  const touched = ref(false);

  // syntactic sugar
  const product = computed(() => state.value.context?.lookups?.product);
  const productImage = (size: string = "400x400") => {
    const product = state.value.context?.lookups?.product;

    if (!product?.full_url) return null;

    const url = new URL(product.full_url);
    url.searchParams.set("size", size);
    return url.toString();
  };

  const terms = computed(() => state.value.context?.lookups?.terms);
  const attributes = computed(() => state.value.context?.lookups?.attributes);
  const options = computed(() => state.value.context?.lookups?.options);
  const fields = computed(() => state.value.context?.lookups?.provision_fields);
  // ---
  const errors = computed(() => state.value.context?.error);

  const meta = computed(() => ({
    isLoading: stateMatches(state, ["subscribing", "loading"]),
    isNew: !contextMatches(state, ["basket_product"]),
    isDirty: stateMatches(state, ["available.configured"]),
    isTouched: touched.value,
    isUnavailable: stateMatches(state, ["error"]),
    hasErrors:
      stateMatches(state, ["available.error", "error"]) ||
      contextMatches(state, ["error"]),
    isConfigurable: contextMatches(state, [
      "lookups.attributes",
      "lookups.options",
      "lookups.provision_fields.properties",
    ]),
    isConfigured: stateMatches(state, [
      "available.configured",
      "available.complete",
      "complete",
    ]),
    isCalculating: contextMatches(state, ["summary.isCalculating"]),
    isProcessing: stateMatches(state, ["processing", "complete"]),
    // ---

    hasProvisioning:
      !isEmpty(state.value.context?.lookups?.provision_fields?.properties) &&
      !!state.value?.context?.model?.provision_fields,
    hasAttributes:
      !isEmpty(state.value.context?.lookups?.attributes) &&
      !!state.value?.context?.model?.attributes,
    hasOptions:
      !isEmpty(state.value.context?.lookups?.options) &&
      !!state.value?.context?.model?.options,
    hasTerms:
      !isEmpty(state.value.context?.lookups?.terms) &&
      !!state.value?.context?.model?.term,
  }));

  const summary = computed(() => state.value.context?.summary);

  // keep our model in sync with the machine,
  // typically this is only needed when the machine is updated/refreshed
  watch(state, newVal => {
    if (newVal.context.model !== model.value) {
      model.value = newVal.context.model;
    }
  });

  // --------------------------------------------------------

  // --- QUANTITY
  const updateQuantity = async (value?: number) => {
    touched.value = true;
    send({
      type: "SET.QUANTITY",
      data: {
        quantity: value || model.value.quantity,
      },
    });

    return waitFor(service, state => state.matches("available.configured"));
  };

  async function incrementQuantity() {
    // sanity check
    if (!lookups.value.product?.canChangeQuantity) return;

    const qty = get(model.value, "quantity", 0);

    // emit the event
    return updateQuantity(add(qty, lookups.value.product?.unit_quantity || 1));
  }

  async function decrementQuantity() {
    // sanity check
    if (!lookups.value.product?.canChangeQuantity) return;

    const qty = get(model.value, "quantity", 0);

    // emit the event
    return updateQuantity(
      subtract(qty, lookups.value.product?.unit_quantity || 1)
    );
  }

  // --- TERMS

  function isSelectedTerm(term: any) {
    const value = isEqual(
      term.billing_cycle_months,
      model.value?.term?.billing_cycle_months
    );
    return value;
  }

  const updateTerm = (term: any) => {
    touched.value = true;
    send({
      type: "SET.TERM",
      data: {
        // @ts-ignore
        term: isObject(term) ? term.billing_cycle_months : term,
      },
    });
  };
  //emit("update:term",{itemId: props.id,...);

  // --- ATTRIBUTES

  const updateAttributes = () => {
    touched.value = true;
    send({
      type: "SET.ATTRIBUTES",
      data: {
        attributes: model.value.attributes,
      },
    });
  };

  function isSelectedAttribute(attributeId: any, value: any) {
    return some(model.value.attributes[attributeId], ["product_id", value]);
  }

  function setAttributes(attribute: any, values: any) {
    const safeValues = isArray(values) ? values : [values];
    set(model.value.attributes, attribute.id, {}); // reset all previous attributes

    forEach(safeValues, value => {
      set(model.value.attributes, [attribute.id, value], {
        product_id: value,
      });
    });

    // emit the event
    updateAttributes();
  }

  // --- OPTIONS

  const updateOptions = () => {
    touched.value = true;
    send({
      type: "SET.OPTIONS",
      data: {
        options: model.value.options,
      },
    });
  };

  function isSelectedOption(optionId: any, value: any) {
    return some(model.value.options[optionId], ["product_id", value]);
  }

  function setOptions(option: any, values: any) {
    const safeValues = isArray(values) ? values : [values];
    set(model.value.options, option.id, {}); // reset all previous options
    forEach(safeValues, value => {
      set(model.value.options, [option.id, value], {
        product_id: value,
      });
    });

    // emit the event
    updateOptions();
  }

  function updateOptionQuantity(option: any, value: any, qty: any) {
    // sanity check
    if (!value?.canChangeQuantity) return;

    set(model.value.options, [option.id, value.id, "unit_quantity"], qty);

    // emit the event
    updateOptions();
  }

  function incrementOption(option: any, value: any) {
    // sanity check
    if (!value?.canChangeQuantity) return;

    const qty = get(
      model.value.options,
      [option.id, value.id, "unit_quantity"],
      0
    );
    set(
      model.value.options,
      [option.id, value.id, "unit_quantity"],
      add(qty, value?.min_order_quantity || 1)
    );
    // emit the event
    updateOptions();
  }

  function decrementOption(option: any, value: any) {
    // sanity check
    if (!value?.canChangeQuantity) return;
    const qty = get(
      model.value.options,
      [option.id, value.id, "unit_quantity"],
      0
    );
    set(
      model.value.options,
      [option.id, value.id, "unit_quantity"],
      subtract(qty, value?.min_order_quantity || 1)
    );
    // emit the event
    updateOptions();
  }

  // --- PROVISIONING

  function setProvisioningFields(value: any) {
    set(model.value, "provision_fields", value);
    // emit the event
    updateProvisioning();
  }

  function getProvisioningField(field: any) {
    const value = get(model.value, ["provision_fields", field], null);
    return value;
  }

  const updateProvisioning = () => {
    touched.value = true;
    send({
      type: "SET.PROVISIONING",
      data: { provision_fields: model.value.provision_fields },
    });
  };

  // --------------------------------------------------------

  return {
    id,
    state,
    // context,
    errors,
    meta,
    // ---
    lookups,
    product,
    productImage,
    terms,
    options,
    attributes,
    fields,
    // ---
    model,
    summary,
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
