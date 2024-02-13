// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket } from "@upmind/flow";

// --- utils
import {
  contextMatches,
  machineMatches,
  stateMatches,
  useChildActor,
  useContextActor,
  useContext,
  useState
} from "../../utils";
import { some } from "lodash-es";

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasket = () => {
  const { service } = useUpmindBasket();
  // --------------------------------------------------------
  // we need this for reactive state
  const { state, send } = useActor(service);

  // --------------------------------------------------------

  // We can create reactive refs to the child machines,
  // so that when they are invoked we can listen to their state changes

  const customFields = useChildActor(state, "custom_fields");
  const paymentDetails = useChildActor(state, "payment_details");
  const billingDetails = useChildActor(state, "billing_details");
  const currency = useChildActor(state, "currency");
  const promotions = useChildActor(state, "promotions");
  // --------------------------------------------------------

  return {
    // ---
    state: useState(state, "value"),
    context: useContext(state),
    errors: useContext(state, "error"),
    // ---
    meta: computed(() => {
      return {
        isLoading:
          stateMatches(state, ["refreshing"]) ||
          stateMatches(state, ["loading"]) ||
          machineMatches(currency, ["loading"]) ||
          machineMatches(customFields, ["loading"]) ||
          machineMatches(paymentDetails, ["loading"]) ||
          machineMatches(billingDetails, ["loading"]) ||
          machineMatches(promotions, ["loading"]),

        isProcessing:
          stateMatches(state, ["shopping.items.processing"]) ||
          machineMatches(currency, ["processing"]) ||
          machineMatches(customFields, ["processing"]) ||
          machineMatches(paymentDetails, ["processing"]) ||
          machineMatches(billingDetails, ["processing"]) ||
          machineMatches(promotions, ["processing"]),

        needsUpdating:
          machineMatches(currency, ["valid"]) ||
          machineMatches(customFields, ["valid"]) ||
          machineMatches(paymentDetails, ["valid"]) ||
          machineMatches(billingDetails, ["valid"]) ||
          machineMatches(promotions, ["valid"]) ||
          (stateMatches(state, ["shopping.items.configuring"]) &&
            some(
              useContext(state, "items"),
              item =>
                machineMatches(item, ["configured"]) &&
                contextMatches(item?.state, ["isNew", "isDirty"])
            )),
        // ---

        hasProducts: !stateMatches(state, ["shopping.items.empty"]),

        hasTaxes: contextMatches(state, ["basket.taxes"]), // TODO: check config for taxes

        // ---
        isAvailable: stateMatches(state, ["shopping"]),
        isConfigured: stateMatches(state, ["shopping.items.complete"]),

        // ---

        hasPromotions:
          stateMatches(state, ["shopping.promotions.complete"]) ||
          machineMatches(promotions, ["complete"]),

        hasBillingDetails:
          stateMatches(state, ["shopping.billing_details.complete"]) ||
          machineMatches(billingDetails, ["complete"]),

        hasCurrency:
          stateMatches(state, ["shopping.currency.complete"]) ||
          machineMatches(currency, ["complete"]),

        hasPaymentDetails:
          stateMatches(state, ["payment_details.complete"]) ||
          machineMatches(paymentDetails, ["complete"]),

        hasFields:
          stateMatches(state, ["shopping.custom_fields.complete"]) ||
          machineMatches(customFields, ["complete"]),

        needsAuth: !stateMatches(state, ["shopping.client.authenticated"]),

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
    items: useContextActor(state, "items", []),
    products: useContext(state, "basket.products", []),
    promotions: useContext(state, "basket.promotions", []),
    taxes: useContext(state, "basket.taxes", []),
    currency: useContext(state, "basket.currency", []),
    // ---
    actors: computed(() => ({
      currency: currency.value,
      customFields: customFields.value,
      paymentDetails: paymentDetails.value,
      promotions: promotions.value,
      billingDetails: billingDetails.value
    })),
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
