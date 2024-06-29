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
} from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useProductConfig = actor => {
  const { state, send } = actor;
  const model = toRef(state.value.context, "model");
  const lookups = computed(() => state.value.context.lookups);
  // syntactic sugar
  const product = computed(() => state.value.context.lookups.product);
  const terms = computed(() => state.value.context.lookups.terms);
  const attributes = computed(() => state.value.context.lookups.attributes);
  const options = computed(() => state.value.context.lookups.options);
  const fields = computed(() => state.value.context.lookups.provision_fields);
  // ---
  const errors = computed(() => state.value.context.error);
  const meta = computed(() => ({
    isLoading: state.value.matches("loading"),
    isNew: state.value.context.isNew,
    isDirty: state.value.context.isDirty,
    hasErrors: state.value.matches("error") || !isEmpty(errors.value),
    isConfigurable:
      // !isEmpty(state.value?.context?.lookups?.terms) ||
      !isEmpty(state.value?.context?.lookups?.attributes) ||
      !isEmpty(state.value?.context?.lookups?.options) ||
      !isEmpty(state.value?.context?.lookups?.provision_fields?.properties),

    isConfigured: state.value.matches("configured"),
    isCalculating: state.value.matches(
      "configuring.values.summary.calculating"
    ),
    isProcessing: state.value.matches("configured.processing"),
    isUnavailable: state.value.matches("unavailable"),
    // ---
    hasProvisioning:
      !isEmpty(state.value.context.lookups.provision_fields?.properties) &&
      state.value?.context?.model?.provision_fields,
    hasAttributes:
      !isEmpty(state.value.context.lookups.attributes) &&
      state.value?.context?.model?.attributes,
    hasOptions:
      !isEmpty(state.value.context.lookups.options) &&
      state.value?.context?.model?.options,
    hasTerms:
      !isEmpty(state.value.context.lookups.terms) &&
      state.value?.context?.model?.term,
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

  const clearErrors = () => {
    send({
      type: "CLEAR.ERRORS",
    });
  };

  // --- QUANTITY
  const updateQuantity = (value?: number) => {
    send({
      type: "UPDATE.QUANTITY",
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
      type: "UPDATE.TERM",
      data: {
        term: isObject(term) ? term.billing_cycle_months : term,
      },
    });
  //emit("update:term",{itemId: props.id,...);

  // --- ATTRIBUTES

  const updateAttributes = () =>
    send({
      type: "UPDATE.ATTRIBUTES",
      data: {
        attributes: model.value.attributes,
      },
    });
  //emit("update:attributes",{itemId: props.id,...);

  function isSelectedAttribute(attributeId, value) {
    return some(model.value.attributes[attributeId], ["product_id", value]);
  }

  function selectAttribute(attribute, value, { target }) {
    // TODO: handle non multiple attributes

    if (!attribute.multiple && target.checked)
      set(model.value.attributes, attribute.id, {}); // reset all previous attributes

    if (target.checked) {
      set(model.value.attributes, [attribute.id, value.id], {
        product_id: value.id,
      });
    } else {
      unset(model.value.attributes, [attribute.id, value.id]);
    }

    // emit the event
    updateAttributes();
  }

  // --- OPTIONS

  const updateOptions = () =>
    send({
      type: "UPDATE.OPTIONS",
      data: {
        options: model.value.options,
      },
    });
  //emit("update:options",{itemId: props.id,...);

  function isSelectedOption(optionId, value) {
    return some(model.value.options[optionId], ["product_id", value]);
  }

  function selectOption(option, value, { target }) {
    if (!option.multiple && target.checked)
      set(model.value.options, option.id, {}); // reset all previous options

    if (target.checked) {
      set(model.value.options, [option.id, value.id], {
        product_id: value.id,
      });
    } else {
      unset(model.value.options, [option.id, value.id]);
    }

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
      type: "UPDATE.PROVISIONING",
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
    clearErrors,
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
    selectAttribute,
    // ---
    updateOptions,
    isSelectedOption,
    selectOption,
    updateOptionQuantity,
    incrementOption,
    decrementOption,
    // ---
    getProvisioningFields,
    setProvisioningFields,
    updateProvisioning,
    getProvisioningField,
  };
};
