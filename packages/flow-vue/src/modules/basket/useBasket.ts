// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket } from "@upmind/flow";

// --- utils
import {
  childActor,
  contextActor,
  contextMatches,
  contextValue,
  machineMatches,
  stateMatches,
  useChildActor,
  useContext,
  useContextActor,
  useState,
} from "../../utils";
import { isEmpty, some } from "lodash-es";

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
  // Actors
  // We can create reactive actors to the child machines,
  // so that when they are invoked we can listen to their state changes
  const actors = computed(() => ({
    customFields: contextActor(state, "actors.custom_fields"),
    paymentDetails: contextActor(state, "actors.payment_details"),
    billingDetails: contextActor(state, "actors.billing_details"),
    currency: contextActor(state, "actors.currency"),
    promotions: contextActor(state, "actors.promotions"),
  }));

  const payment = useChildActor(state, "payment");

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
            "refreshing",
            "generating",
            "claiming",
            "shopping.items.processing",
          ]) ||
          machineMatches(actors.value.currency, ["processing"]) ||
          machineMatches(actors.value.customFields, ["processing"]) ||
          machineMatches(actors.value.billingDetails, ["processing"]) ||
          machineMatches(actors.value.promotions, ["processing"]),

        needsUpdating:
          machineMatches(actors.value.currency, ["valid"]) ||
          machineMatches(actors.value.customFields, ["valid"]) ||
          machineMatches(actors.value.billingDetails, ["valid"]) ||
          machineMatches(actors.value.promotions, ["valid"]) ||
          (stateMatches(state, ["shopping.items.configuring"]) &&
            some(
              contextValue(state, "items"),
              item =>
                machineMatches(item, ["configured"]) &&
                contextMatches(item?.state, ["isNew", "isDirty"])
            )),

        // ---

        isAvailable:
          stateMatches(state, [
            "claiming",
            "generating",
            "refreshing",
            "shopping",
            "checkout.configuring",
            "checkout.available",
          ]) && !stateMatches(state, ["shopping.items.empty"]),

        needsAuth: !stateMatches(state, [
          "shopping.account.complete",
          "checkout",
        ]),

        // ---
        hasProducts: stateMatches(state, [
          "shopping.items.complete",
          "checkout",
        ]),

        hasTaxes: contextMatches(state, ["basket.taxes"]), // TODO: check config for taxes

        hasPromotions: machineMatches(actors.value.promotions, ["complete"]),

        hasBillingDetails: machineMatches(actors.value.billingDetails, [
          "complete",
        ]),

        hasCurrency: machineMatches(actors.value.currency, ["complete"]),

        hasPaymentDetails: machineMatches(actors.value.paymentDetails, [
          "complete",
          "valid",
          "processing",
        ]),

        hasFields: machineMatches(actors.value.customFields, ["complete"]),

        hasAccount: stateMatches(state, [
          "shopping.account.complete",
          "checkout",
        ]),

        // ---
        isReadyForCheckout: stateMatches(state, ["checkout.available"]),
        isCheckout: stateMatches(state, ["checkout.processing"]),
        isConverting: stateMatches(state, ["converting"]),
        isPaying: stateMatches(state, ["paying"]),
        needsApproval: machineMatches(payment, ["approving"]),

        isProcessingOrder:
          machineMatches(payment, ["approving"]) ||
          stateMatches(state, ["converting"]) ||
          stateMatches(state, ["paying"]) ||
          stateMatches(state, ["checkout.processing"]),

        isComplete: stateMatches(state, ["complete"]),

        hasErrors:
          stateMatches(state, [
            "shopping.items.processing.error",
            "shopping.promotions.error",
            "shopping.account.error",
          ]) ||
          machineMatches(actors.value.customFields, ["error"]) ||
          machineMatches(actors.value.paymentDetails, ["error"]) ||
          !!useContext(state, "error"),
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
    actors,
    // ---
    updateBasket: () => send({ type: "UPDATE" }),
    clearBasket: () => send({ type: "CLEAR" }),
    clearErrors: () => send({ type: "CLEAR.ERRORS" }),
    checkout: () => send({ type: "CHECKOUT" }),
    // ---
    // Item Methods

    addProduct: ({ id, product_id, quantity, term, attributes, options }) => {
      // const { product_id, quantity, term, attributes, options } = unref(model);
      send({
        type: "ADD",
        data: { id, product_id, quantity, term, attributes, options },
      });
    },

    removeItem: itemId => {
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
  };
};
