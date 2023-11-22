// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket, useBrand } from "@upmind/flow";

// --- utils
import { map, some } from "lodash-es";

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasket = () => {
  const { service } = useUpmindBasket();
  const { service: brandService } = useBrand();
  // --------------------------------------------------------
  // we need this for reactive state
  const { state, send } = useActor(service);
  const { state: brandState } = useActor(brandService);

  // --------------------------------------------------------

  return {
    updateBasket: () => send({ type: "UPDATE" }),

    clearBasket: () => send({ type: "CLEAR" }),

    updateCurrency: currency =>
      send({ type: "UPDATE.CURRENCY", data: currency }),

    addPromotion: ({ promocode }) => {
      send({ type: "ADD.PROMOTION", data: { promocode } });
    },

    removePromotion: ({ id }) => {
      send({ type: "REMOVE.PROMOTION", data: { id } });
    },

    addProduct: ({ product_id, quantity, term, attributes, options }) => {
      // const { product_id, quantity, term, attributes, options } = unref(model);
      send({
        type: "ADD",
        data: { product_id, quantity, term, attributes, options }
      });
    },

    removeItem: ({ itemId }) => {
      send({ type: "REMOVE", data: { itemId } });
    },

    updateItem: itemId => {
      send({ type: "UPDATE", data: { itemId } });
    },

    updateTerm: ({ itemId, term }) =>
      send({ type: "UPDATE.TERM", data: { itemId, term } }),

    updateQuantity: ({ itemId, quantity }) =>
      send({ type: "UPDATE.QUANTITY", data: { itemId, quantity } }),

    updateAttributes: ({ itemId, attributes }) =>
      send({ type: "UPDATE.ATTRIBUTES", data: { itemId, attributes } }),

    updateOptions: ({ itemId, options }) =>
      send({ type: "UPDATE.OPTIONS", data: { itemId, options } }),

    updateProvisioning: ({ itemId, provision_fields }) =>
      send({ type: "UPDATE.PROVISIONING", data: { itemId, provision_fields } }),

    // ---
    state: computed(() => state.value.value),

    context: computed(() => state.value.context),

    errors: computed(() => state.value.context?.error),
    //messages: computed(() => state.value.context?.messages),

    // ---
    meta: computed(() => {
      return {
        isLoading: ["loading"].some(state.value.matches),
        isProcessing: [
          "shopping.items.processing",
          "shopping.promotions.adding",
          "shopping.promotions.removing"
        ].some(state.value.matches),
        canProcess: some(
          state.value?.context?.items,
          item =>
            item.state.matches("configured") &&
            (item.state.context.isNew || item.state.context.isDirty)
        ),
        // ---
        hasProducts: !["shopping.items.empty"].some(state.value.matches),
        hasPromotions:
          ["shopping.promotions.active"].some(state.value.matches) ||
          !!state.value?.context?.basket?.total_discount_amount,
        hasTaxes: !!state.value?.context?.basket?.taxes?.length, // TODO: check config for taxes
        isAvailable: ["shopping"].some(state.value.matches),
        isConfigured: ["shopping.items.configured"].some(state.value.matches),
        // ---
        needsAuth: ["shopping.client.unauthenticated"].some(
          state.value.matches
        ),
        needsUpdating: ["shopping.items.configuring"].some(state.value.matches),
        isReadyForCheckout: ["checkout"].some(state.value.matches),
        hasErrors: [
          "shopping.items.processing.error",
          "shopping.promotions.error",
          "shopping.client.error"
        ].some(state.value.matches)
      };
    }),
    //  ---
    basket: computed(() => state.value.context?.basket),
    summary: computed(() => state.value.context?.summary),
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
    products: computed(() => state.value.context?.basket?.products || []),
    promotions: computed(() => state.value.context?.basket?.promotions || []),
    taxes: computed(() => state.value.context?.basket?.taxes || []),
    currency: computed(() => state.value.context?.basket?.currency),
    currencies: computed(() => brandState.value.context?.currencies || [])
  };
};
