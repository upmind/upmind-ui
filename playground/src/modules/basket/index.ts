// --- external
import { computed, toRef } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket } from "@upmind/flow";

// --- utils
import {
  map,
  isEqual,
  get,
  set,
  some,
  unset,
  add,
  subtract,
  find
} from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasket = () => {
  const { service } = useUpmindBasket();

  // --------------------------------------------------------
  // we need this for reactive state
  const { state, send } = useActor(service);

  // --------------------------------------------------------

  return {
    addProduct: ({ productId, quantity, term, attributes, options }) => {
      // const { productId, quantity, term, attributes, options } = unref(model);
      send({
        type: "ADD",
        data: { productId, quantity, term, attributes, options }
      });
    },

    removeProduct: ({ itemId }) => {
      send({ type: "REMOVE", data: { itemId } });
    },

    updateTerm: ({ itemId, term }) =>
      send({ type: "UPDATE.TERM", data: { itemId, term } }),

    updateQuantity: ({ itemId, quantity }) =>
      send({ type: "UPDATE.QUANTITY", data: { itemId, quantity } }),

    updateAttributes: ({ itemId, attributes }) =>
      send({ type: "UPDATE.ATTRIBUTES", data: { itemId, attributes } }),

    updateOptions: ({ itemId, options }) =>
      send({ type: "UPDATE.OPTIONS", data: { itemId, options } }),

    updateProvisioning: ({ itemId, provisioning }) =>
      send({ type: "UPDATE.PROVISIONING", data: { itemId, provisioning } }),

    // ---
    state: computed(() => state.value.value),

    context: computed(() => state.value.context),

    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),

    // ---
    meta: computed(() => {
      return {
        isLoading: ["loading"].some(state.value.matches),
        isAvailable: ["shopping"].some(state.value.matches),
        isAdding: ["shopping.items.adding"].some(state.value.matches),
        isRemoving: ["shopping.items.removing"].some(state.value.matches),
        isUpdating: ["shopping.items.updating"].some(state.value.matches),
        hasProducts: !["shopping.items.empty"].some(state.value.matches),
        isReadyForCheckout: ["readyForCheckout"].some(state.value.matches),
        hasErrors: ["error"].some(state.value.matches)
      };
    }),
    //  ---
    basket: computed(() => state.value.context.basket),
    // ---

    items: computed(
      () =>
        map(state.value.context.items, item => ({
          id: item.id,
          ...useActor(item)
        }))
      // map(state.value.context.items, item => ({
      //   id: item.id,
      //   ...item.getSnapshot()
      // }))
    ),

    products: computed(() => state.value.context.basket?.products || [])
  };
};

export const useBasketItem = item => {
  const { state, send } = item;
  const model = toRef(state.value.context, "values");
  const available = computed(() => state.value.context.available);
  const errors = computed(() => state.value.context.errors);
  const meta = computed(() => ({
    isLoading: state.value.matches("loading"),
    isNew: !model.value?.id,
    hasErrors: state.value.matches("error"),
    isConfiguring: state.value.matches("configuring"),
    isConfigured: state.value.matches("configured")
  }));

  const totalAmount = computed(() => {
    // TODO: calculate the pricess of options and attributes, etc
    debugger;
    // get this from the machine
    const term = find(available.value.terms, [
      "billing_cycle_months",
      model.value.term
    ]);
    debugger;

    const price = get(term, "price", available.value?.product?.price || 0);

    debugger;
    return model.value.quantity * price || 0;
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
      "unit_quantity",
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
      "unit_quantity",
      subtract(qty, available.value.product?.unit_quantity || 1)
    );
    // emit the event
    updateQuantity();
  }

  // --- TERMS

  function isSelectedTerm(term) {
    const value = isEqual(term.billing_cycle_months, model.value?.term);
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

  // --------------------------------------------------------

  return {
    state,
    available,
    errors,
    model,
    meta,
    // ---
    totalAmount,
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
    decrementOption
  };
};
