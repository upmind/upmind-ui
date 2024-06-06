// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

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
import { isEmpty, some, reject, filter, last } from "lodash-es";

// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasket = () => {
  const { service, isReady } = useUpmindBasket();
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
            "generating",
            "claiming",
            "shopping.refreshing.processing",
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
        isEmpty: stateMatches(state, ["shopping.items.empty"]),

        isAvailable:
          stateMatches(state, [
            "claiming",
            "generating",
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
          "available.valid",
          "available.processing",
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
    itemsPending: computed(() => {
      const items = contextActor(state, "items", []);
      return filter(items, item => contextMatches(item?.state, ["isNew"]));
    }),
    itemsConfigured: computed(() => {
      const items = contextActor(state, "items", []);
      return filter(items, item => !contextMatches(item?.state, ["isNew"]));
    }),
    products: useContext(state, "basket.products", []),
    promotions: useContext(state, "basket.promotions", []),
    taxes: useContext(state, "basket.taxes", []),
    currency: useContext(state, "basket.currency", []),
    // ---
    actors,
    // ---
    isReady,
    updateBasket: async () => {
      send({ type: "UPDATE" });
      return waitFor(service, newstate =>
        newstate.matches("shopping.items.processed")
      );
    },
    clearBasket: () => send({ type: "CLEAR" }),
    clearErrors: () => send({ type: "CLEAR.ERRORS" }),
    checkout: () => send({ type: "CHECKOUT" }),
    // ---
    // Item Methods

    addProduct: async ({
      id,
      product_id,
      quantity,
      term,
      attributes,
      options,
    }) => {
      // lets wait for our basket  to be ready for shopping
      await waitFor(service, newstate => newstate.matches("shopping")).catch(
        () => {
          return; // bail if we have an error
        }
      );

      // lets add the new product base don the provided config to the basket
      send({
        type: "ADD",
        data: { id, product_id, quantity, term, attributes, options },
      });

      // then wait/check for the new product actor to be configured
      // then send the update event to the basket
      const item = last(contextValue(state, "items"));
      return item;
    },

    removeItem: itemId => {
      send({ type: "REMOVE", data: { itemId } });
    },

    updateItem: async itemId => {
      send({ type: "UPDATE", data: { itemId } });
      return waitFor(service, newstate =>
        newstate.matches("shopping.items.processed")
      );
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
