// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket, useBrand } from "@upmind/flow";

// --- utils
import {
  contextMatches,
  machineMatches,
  stateMatches,
  stateValue,
  useChild,
  useChildren,
  useContext,
  useState
} from "../../utils";
import { some } from "lodash-es";

// --------------------------------------------------------
// Helpers

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

  // We can create reactive refs to the child machines,
  // so that when they are invoked we can listen to their state changes

  const customFields = useChild(state, "custom_fields");
  const paymentDetails = useChild(state, "payment_details");
  // const billing = useChild(state, "billing");
  // const currency = useChild(state, "currency");

  // --------------------------------------------------------

  return {
    // ---
    state: useState(state, "value"),
    context: useContext(state),
    errors: useContext(state, "error"),
    // ---
    meta: computed(() => {
      return {
        isLoading: stateMatches(state, ["loading"]),
        isProcessing:
          stateMatches(state, [
            "shopping.items.processing",
            "shopping.billing.processing",
            "shopping.currency.processing",
            "shopping.promotions.adding",
            "shopping.promotions.removing"
          ]) ||
          machineMatches(customFields, ["processing"]) ||
          machineMatches(paymentDetails, ["processing"]),

        needsUpdating:
          machineMatches(customFields, ["valid"]) ||
          machineMatches(paymentDetails, ["valid"]) ||
          (stateMatches(state, ["shopping.items.configuring"]) &&
            some(
              useContext(state, "items"),
              item =>
                stateMatches(item?.state, ["configured"]) &&
                contextMatches(item?.state, ["isNew", "isDirty"])
            )),
        // ---

        hasProducts: !stateMatches(state, ["shopping.items.empty"]),

        hasPromotions:
          stateMatches(state, ["shopping.promotions.active"]) ||
          contextMatches(state, ["basket.total_discount_amount"]),

        hasTaxes: contextMatches(state, ["basket.taxes.length"]), // TODO: check config for taxes

        // ---
        isAvailable: stateMatches(state, ["shopping"]),
        isConfigured: stateMatches(state, ["shopping.items.complete"]),
        hasBilling: stateMatches(state, ["shopping.billing.complete"]),
        hasCurrency: stateMatches(state, ["shopping.currency.complete"]),
        hasPaymentMethod: stateMatches(state, ["payment.complete"]),
        needsAuth: !stateMatches(state, ["shopping.client.authenticated"]),
        // ---
        hasFields: stateMatches(state, ["shopping.custom_fields.complete"]),

        needsFields: !stateMatches(state, [
          "shopping.custom_fields.loading",
          "shopping.custom_fields.complete"
        ]),

        // ---

        isReadyForCheckout: stateMatches(state, ["checkout"]),

        hasErrors:
          stateMatches(state, [
            "shopping.items.processing.error",
            "shopping.promotions.error",
            "shopping.client.error"
          ]) ||
          machineMatches(customFields, ["error"]) ||
          machineMatches(paymentDetails, ["error"]) ||
          !!useContext(state, "error")
      };
    }),
    //  ---
    basket: useContext(state, "basket"),
    summary: useContext(state, "summary"),
    items: useChildren(state, "items"),
    products: useContext(state, "basket?.products", []),
    promotions: useContext(state, "basket?.promotions", []),
    taxes: useContext(state, "basket?.taxes", []),
    currency: useContext(state, "basket?.currency"),
    currencies: useContext(brandState, "currencies", []),
    // ---
    customFields,
    paymentDetails,
    // ---
    updateBasket: () => send({ type: "UPDATE" }),
    clearBasket: () => send({ type: "CLEAR" }),
    clearErrors: () => send({ type: "CLEAR.ERRORS" }),

    // ---
    // Methods

    addProduct: ({ id, product_id, quantity, term, attributes, options }) => {
      // const { product_id, quantity, term, attributes, options } = unref(model);
      send({
        type: "ADD",
        data: { id, product_id, quantity, term, attributes, options }
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
      send({ type: "UPDATE.PROVISIONING", data: { itemId, provision_fields } })
  };
};

export const useBasketFields = actor => {
  const { state, send } = actor;

  // --------------------------------------------------------

  return {
    state: useState(state, "value"),
    context: useContext(state),
    errors: useContext(state, "error"),
    //messages: useContext(state, 'messages'),
    // ---
    meta: computed(() => ({
      isLoading: stateMatches(state, ["loading"]),
      hasErrors: stateMatches(state, ["error"]),
      isProcessing: stateMatches(state, ["checking", "processing"]),
      isValid: stateMatches(state, ["valid"]),
      isComplete:
        stateValue(state, "done", false) ||
        stateMatches(state, ["processed", "complete"])
    })),
    // ---
    model: useContext(state, "model"),
    schema: useContext(state, "schema"),
    uischema: useContext(state, "uischema"),
    // ---
    clear: () => send({ type: "CLEAR" }),
    input: model => send({ type: "SET", data: model }),
    update: () => send({ type: "UPDATE" })
  };
};
