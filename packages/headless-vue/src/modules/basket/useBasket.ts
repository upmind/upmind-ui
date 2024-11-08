// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBasket as useUpmindBasket } from "@upmind/headless";

// --- utils
import {
  contextActor,
  contextMatches,
  contextValue,
  machineMatches,
  stateMatches,
  useChildActor,
  useContext,
  useState,
} from "../../utils";
import { some, filter } from "lodash-es";

// --- types
// --------------------------------------------------------

// --------------------------------------------------------
// a composable that provides a simple interface to the api requests machine
//  with some state helpers

export const useBasket: any = () => {
  const {
    service,
    isReady,
    clear,
    checkout,
    // ---
    addItem,
    updateItem,
    removeItem,
  } = useUpmindBasket();
  // --------------------------------------------------------
  // we need this for reactive state
  const { state } = useActor(service);

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
        isLoading: stateMatches(state, ["subscribing", "loading"]), //

        isProcessing:
          stateMatches(state, [
            "generating",
            "claiming",
            "shopping.refreshing.processing",
          ]) ||
          some(contextValue(state, "items"), item =>
            machineMatches(item, ["processing"])
          ) ||
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
            some(contextValue(state, "items"), item =>
              machineMatches(item, ["available.configured"])
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

        needsAuth: !stateMatches(state, ["shopping.account.complete"]),

        // ---
        hasProducts: stateMatches(state, ["shopping.items.complete"]),

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
          "shopping.account.claiming",
          "shopping.account.complete",
          "checkout",
        ]),
        isClaiming: stateMatches(state, ["shopping.account.claiming"]),

        // ---
        // this state means ALL the data is ready for checkout for each parallel machine
        isReadyForCheckout: stateMatches(
          state,
          [
            "shopping.items.complete",
            "shopping.promotions.complete",
            "shopping.account.complete",
            "shopping.currency.complete",
            "shopping.billing_details.complete",
            "shopping.custom_fields.complete",
            "shopping.payment_details.available",
          ],
          true
        ),

        isCheckout:
          machineMatches(payment, ["approving"]) ||
          stateMatches(state, ["checkout", "converting", "paying"]),

        isProcessingDetails:
          machineMatches(payment, ["approving"]) ||
          stateMatches(state, ["shopping.payment_details.processing"]),
        isConverting: stateMatches(state, ["converting"]),
        isPaying: stateMatches(state, ["paying"]),
        needsApproval: machineMatches(payment, ["approving"]),
        isComplete: stateMatches(state, ["complete", "failed"]),
        hasPaid: stateMatches(state, ["complete"]),
        hasFailed: stateMatches(state, ["failed"]),

        // hasErrors:
        //   stateMatches(state, [
        //     "shopping.items.processing.error",
        //     "shopping.promotions.error",
        //     "shopping.account.error",
        //   ]) ||
        //   machineMatches(actors.value.customFields, ["error"]) ||
        //   machineMatches(actors.value.paymentDetails, ["error"]) ||
        //   !!useContext(state, "error"),
      };
    }),
    //  ---
    basket: useContext(state, "basket"),
    summary: useContext(state, "summary"),
    items: useContext(state, "items", []),
    itemsPending: computed(() => {
      const items = contextValue(state, "items", []);
      return filter(
        items,
        item => !item?.state?.done && !contextMatches(item, ["basket_product"])
      );
    }),
    itemsInvalid: computed(() => {
      const items = contextValue(state, "items", []);
      return filter(
        items,
        item =>
          contextMatches(item, ["basket_product"]) &&
          machineMatches(item, ["available.error"])
      );
    }),
    itemsConfigured: computed(() => {
      const items = contextValue(state, "items", []);
      return filter(
        items,
        item =>
          contextMatches(item, ["basket_product"]) &&
          !machineMatches(item, ["available.error"])
      );
    }),
    products: useContext(state, "basket.products", []),
    promotions: useContext(state, "basket.promotions", []),
    taxes: useContext(state, "basket.taxes", []),
    currency: useContext(state, "basket.currency", []),
    payment: useContext(state, "payment"),
    invoice: useContext(state, "invoice"),
    // ---
    actors,
    // ---
    // Basket Methods
    isReady,
    clear,
    checkout,
    // ---
    // Item Methods
    addItem,
    updateItem,
    removeItem,
  };
};
