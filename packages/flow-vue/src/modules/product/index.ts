// --- external
import { computed, toRef, watch } from "vue";

// --- internal

// --- utils
import {
  add,
  get,
  isEmpty,
  isObject,
  isEqual,
  omitBy,
  set,
  some,
  subtract,
  unset,
  has,
  isArray,
  forEach,
} from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useProductConfig = actor => {
  const { state, send } = actor;
  const model = toRef(state.value.context, "model");
  const lookups = computed(() => state.value.context.lookups);
  // syntactic sugar
  const product = computed(() => state.value.context?.lookups?.product);
  const terms = computed(() => state.value.context?.lookups?.terms);
  const attributes = computed(() => state.value.context?.lookups?.attributes);
  const options = computed(() => state.value.context?.lookups?.options);
  const fields = computed(() => state.value.context?.lookups?.provision_fields);
  // ---
  const errors = computed(() => state.value.context?.error);

  const meta = computed(() => ({
    isLoading: ["subscribing", "loading"].some(state.value.matches),
    isNew: isEmpty(state.value.context.basket_product),
    isDirty: !isEmpty(state.value.context.basket_product),
    hasErrors:
      ["available.error", "error"].some(state.value.matches) ||
      !isEmpty(state.value.context?.error),
    isConfigurable:
      // !isEmpty(state.value?.context?.lookups?.terms) ||
      !isEmpty(state.value?.context?.lookups?.attributes) ||
      !isEmpty(state.value?.context?.lookups?.options) ||
      !isEmpty(state.value?.context?.lookups?.provision_fields?.properties),

    isConfigured: state.value.matches("available.configured"),
    isCalculating: state.value.context?.summary?.isCalculating,

    isProcessing: ["processing", "complete"].some(state.value.matches),
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

  const summary = computed(() => state.value.context.summary);

  // keep our model in sync with the machine,
  // typically this is only needed when the machine is updated/refreshed
  watch(state, newVal => {
    if (newVal.context.model !== model.value) {
      model.value = newVal.context.model;
    }
  });

  // --------------------------------------------------------

  // --- QUANTITY
  const updateQuantity = (value?: number) => {
    send({
      type: "SET.QUANTITY",
      data: {
        quantity: value || model.value.quantity,
      },
    });
  };

  function incrementQuantity() {
    // sanity check
    if (!lookups.value.product?.canChangeQuantity) return;

    const qty = get(model.value, "quantity", 0);
    set(
      model.value,
      "quantity",
      add(qty, lookups.value.product?.unit_quantity || 1)
    );
    // emit the event
    updateQuantity();
  }

  function decrementQuantity() {
    // sanity check
    if (!lookups.value.product?.canChangeQuantity) return;

    const qty = get(model.value, "quantity", 0);
    set(
      model.value,
      "quantity",
      subtract(qty, lookups.value.product?.unit_quantity || 1)
    );
    // emit the event
    updateQuantity();
  }

  // --- TERMS

  function isSelectedTerm(term) {
    const value = isEqual(
      term.billing_cycle_months,
      model.value?.term?.billing_cycle_months
    );
    return value;
  }

  const updateTerm = term =>
    send({
      type: "SET.TERM",
      data: {
        term: isObject(term) ? term.billing_cycle_months : term,
      },
    });
  //emit("update:term",{itemId: props.id,...);

  // --- ATTRIBUTES

  const updateAttributes = () =>
    send({
      type: "SET.ATTRIBUTES",
      data: {
        attributes: model.value.attributes,
      },
    });

  function isSelectedAttribute(attributeId, value) {
    return some(model.value.attributes[attributeId], ["product_id", value]);
  }

  function setAttributes(attribute, values) {
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

  const updateOptions = () =>
    send({
      type: "SET.OPTIONS",
      data: {
        options: model.value.options,
      },
    });

  function isSelectedOption(optionId, value) {
    return some(model.value.options[optionId], ["product_id", value]);
  }

  function setOptions(option, values) {
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

  function updateOptionQuantity(option, value, qty) {
    // sanity check
    if (!value?.canChangeQuantity) return;

    set(model.value.options, [option.id, value.id, "unit_quantity"], qty);

    // emit the event
    updateOptions();
  }

  function incrementOption(option, value) {
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

  function decrementOption(option, value) {
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
  function getProvisioningFields(showOptional = true, showHidden = false) {
    const schema = fields.value || {
      type: "object",
    };

    // weere showing all fields, so return the schema
    if (showHidden && showOptional) return schema;

    set(
      schema,
      "properties",
      omitBy(
        schema?.properties,
        property =>
          (!showHidden && property?.defer == "hidden") ||
          (!showOptional && property?.defer == "optional")
      )
    );
    return schema;
  }

  function setProvisioningFields(value) {
    set(model.value, "provision_fields", value);
    // emit the event
    updateProvisioning();
  }

  function getProvisioningField(field) {
    const value = get(model.value, ["provision_fields", field], null);
    return value;
  }

  const updateProvisioning = () => {
    send({
      type: "SET.PROVISIONING",
      data: { provision_fields: model.value.provision_fields },
    });
  };

  // --------------------------------------------------------

  return {
    state,
    // context,
    errors,
    meta,
    // ---
    lookups,
    product,
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
    getProvisioningFields,
    setProvisioningFields,
    updateProvisioning,
    getProvisioningField,
    // ---
    reset: () => send("RESET"),
  };
};
