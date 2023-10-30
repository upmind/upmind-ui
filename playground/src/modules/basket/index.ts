// --- external
import { computed, reactive, ref, unref, toRef } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket } from "@upmind/flow";

// --- utils
import { map, find } from "lodash-es";

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
    isNew: !model.value?.id
  }));

  const updateQuantity = value =>
    send({
      type: "UPDATE.QUANTITY",
      data: {
        quantity: value || model.value.quantity
      }
    });
  //emit("update:quantity",{itemId: props.id,...);

  const updateTerm = term =>
    send({
      type: "UPDATE.TERM",
      data: {
        term: term.billing_cycle_months
      }
    });
  //emit("update:term",{itemId: props.id,...);

  const updateAttributes = () =>
    send({
      type: "UPDATE.ATTRIBUTES",
      data: {
        attributes: model.value.attributes
      }
    });
  //emit("update:attributes",{itemId: props.id,...);

  const updateOptions = () =>
    send({
      type: "UPDATE.OPTIONS",
      data: {
        options: model.value.options
      }
    });
  //emit("update:options",{itemId: props.id,...);

  // const
  return {
    state,
    available,
    errors,
    model,
    meta,
    // ---
    updateQuantity,
    updateTerm,
    updateAttributes,
    updateOptions
  };
};
