// --- external
import { computed, toRef, watch } from "vue";

// --- internal

// --- utils
import {
  add,
  get,
  isEqual,
  isNil,
  omitBy,
  reduce,
  set,
  some,
  subtract,
  unset
} from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useProductConfig = item => {
  const { state, send } = item;
  const model = toRef(state.value.context, "values");
  const available = computed(() => state.value.context.available);
  // syntactic sugar
  const availableProduct = computed(
    () => state.value.context.available.product
  );
  const availableTerms = computed(() => state.value.context.available.terms);
  const availableAttributes = computed(
    () => state.value.context.available.attributes
  );
  const availableOptions = computed(
    () => state.value.context.available.options
  );
  const availableFields = computed(
    () => state.value.context.available.provision_fields
  );
  // ---
  const errors = computed(() => state.value.context.errors);
  const meta = computed(() => ({
    isLoading: state.value.matches("loading"),
    isNew: state.value.context.isNew,
    isDirty: state.value.context.isDirty,
    hasErrors: state.value.matches("error"),
    isConfiguring: state.value.matches("configuring"),
    isConfigured: state.value.matches("configured"),
    isCalculating: state.value.matches("calculating")
  }));

  const summary = computed(() => state.value.context.summary);

  // keep our model in sync with the machine,
  // typically this is only needed when the machine is updated/refreshed
  watch(state, (newVal, oldVal) => {
    if (newVal.context.values !== model.value) {
      model.value = newVal.context.values;
    }
  });

  // --- QUANTITY
  const updateQuantity = (value?: number) =>
    send({
      type: "UPDATE.QUANTITY",
      data: {
        quantity: value || model.value.quantity
      }
    });
  //emit("update:quantity",{itemId: props.id,...);

  function incrementQuantity() {
    // sanity check
    if (!available.value.product?.canChangeQuantity) return;

    const qty = get(model.value, "quantity", 0);
    set(
      model.value,
      "quantity",
      add(qty, available.value.product?.unit_quantity || 1)
    );
    // emit the event
    updateQuantity();
  }

  function decrementQuantity() {
    // sanity check
    if (!available.value.product?.canChangeQuantity) return;

    const qty = get(model.value, "quantity", 0);
    set(
      model.value,
      "quantity",
      subtract(qty, available.value.product?.unit_quantity || 1)
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
        term: term.billing_cycle_months
      }
    });
  //emit("update:term",{itemId: props.id,...);

  // --- ATTRIBUTES

  const updateAttributes = () =>
    send({
      type: "UPDATE.ATTRIBUTES",
      data: {
        attributes: model.value.attributes
      }
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
      set(model.value.attributes, [attribute.id, value], {
        product_id: value
      });
    } else {
      unset(model.value.attributes, [attribute.id, value]);
    }

    // emit the event
    updateAttributes();
  }

  function incrementAttribute(attributeId, value) {
    // sanity check
    if (!value?.canChangeQuantity) return;
    const qty = get(
      model.value.attributes,
      [attributeId, value.id, "unit_quantity"],
      0
    );
    set(
      model.value.attributes,
      [attributeId, value.id, "unit_quantity"],
      add(qty, value?.min_order_quantity || 1)
    );
    // emit the event
    updateAttributes();
  }

  function decrementAttribute(attributeId, value) {
    // sanity check
    if (!value?.canChangeQuantity) return;
    const qty = get(
      model.value.attributes,
      [attributeId, value.id, "unit_quantity"],
      0
    );
    set(
      model.value.attributes,
      [attributeId, value.id, "unit_quantity"],
      subtract(qty, value?.min_order_quantity || 1)
    );
    // emit the event
    updateAttributes();
  }

  // --- OPTIONS

  const updateOptions = () =>
    send({
      type: "UPDATE.OPTIONS",
      data: {
        options: model.value.options
      }
    });
  //emit("update:options",{itemId: props.id,...);

  function isSelectedOption(optionId, value) {
    return some(model.value.options[optionId], ["product_id", value]);
  }

  function selectOption(option, value, { target }) {
    if (!option.multiple && target.checked)
      set(model.value.options, option.id, {}); // reset all previous options

    if (target.checked) {
      set(model.value.options, [option.id, value], {
        product_id: value
      });
    } else {
      unset(model.value.options, [option.id, value]);
    }

    // emit the event
    updateOptions();
  }

  function incrementOption(optionId, value) {
    // sanity check
    if (!value?.canChangeQuantity) return;

    const qty = get(
      model.value.options,
      [optionId, value.id, "unit_quantity"],
      0
    );
    set(
      model.value.options,
      [optionId, value.id, "unit_quantity"],
      add(qty, value?.min_order_quantity || 1)
    );
    // emit the event
    updateOptions();
  }

  function decrementOption(optionId, value) {
    // sanity check
    if (!value?.canChangeQuantity) return;
    const qty = get(
      model.value.options,
      [optionId, value.id, "unit_quantity"],
      0
    );
    set(
      model.value.options,
      [optionId, value.id, "unit_quantity"],
      subtract(qty, value?.min_order_quantity || 1)
    );
    // emit the event
    updateOptions();
  }

  // --- PROVISIONING
  function getProvisioningFields(showOptional = true, showHidden = false) {
    const schema = availableFields.value;

    // weere showing all fields, so return the schema
    if (showHidden && showOptional) return schema;

    schema.properties = omitBy(
      schema?.properties,
      property =>
        (!showHidden && property?.defer == "hidden") ||
        (!showOptional && property?.defer == "optional")
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
      data: { provision_fields: model.value.provision_fields }
    });
  };

  // --------------------------------------------------------

  return {
    state,
    available,
    // ---
    availableProduct,
    availableTerms,
    availableOptions,
    availableAttributes,
    availableFields,
    // ---
    errors,
    model,
    meta,
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
    selectAttribute,
    incrementAttribute,
    decrementAttribute,
    // ---
    updateOptions,
    isSelectedOption,
    selectOption,
    incrementOption,
    decrementOption,
    // ---
    getProvisioningFields,
    setProvisioningFields,
    updateProvisioning,
    getProvisioningField
  };
};
