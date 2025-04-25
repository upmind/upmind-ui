// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import {
  useBasket as useUpmindBasket,
  useBrand,
} from "@upmind-automation/headless";

import { useSession } from "../session";

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
import { some, filter, isEmpty } from "lodash-es";

// --- types
// -----------------------------------------------------------------------------

export const useBasket = (): any => {
  const { checkIncludesTax } = useBrand();
  const { service, isReady, clear, checkout, getProduct } = useUpmindBasket();

  const { meta: sessionMeta } = useSession();
  // ---  // we need this for reactive state
  const { state } = useActor(service);

  // ---  // Actors
  // We can create reactive actors to the child machines,
  // so that when they are invoked we can listen to their state changes
  const actors = computed(() => ({
    customFields: contextActor(state, "actors.customFields"),
    paymentDetails: contextActor(state, "actors.paymentDetails"),
    billingDetails: contextActor(state, "actors.billingDetails"),
    currency: contextActor(state, "actors.currency"),
    promotions: contextActor(state, "actors.promotions"),
  }));

  const payment = useChildActor(state, "payment");

  // ---------------------------------------------------------------------------
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
          stateMatches(state, ["shopping.refreshing.processing"]) ||
          some(contextValue(state, "items"), item =>
            machineMatches(item, ["processing"])
          ) ||
          machineMatches(actors.value.currency, ["processing"]) ||
          machineMatches(actors.value.customFields, ["processing"]) ||
          machineMatches(actors.value.billingDetails, [
            "processing",
            "available.processing",
          ]) ||
          machineMatches(actors.value.promotions, ["processing"]),

        needsUpdating:
          machineMatches(actors.value.currency, ["valid"]) ||
          machineMatches(actors.value.customFields, ["valid"]) ||
          machineMatches(actors.value.billingDetails, ["valid"]) ||
          machineMatches(actors.value.promotions, ["valid"]),

        // ---
        isAvailable:
          stateMatches(state, [
            "shopping",
            "checkout.configuring",
            "checkout.available",
          ]) && contextMatches(state, ["products"]),

        needsAuth: !sessionMeta.value?.isAuthenticated,

        // ---
        hasProducts: contextMatches(state, ["products"]),
        hasInvalidProducts: some(
          contextValue(state, "products", []),
          product => !isEmpty(product?.errors)
        ),

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
        hasTaxIncluded: checkIncludesTax(),

        // ---
        // this state means ALL the data is ready for checkout for each parallel machine
        isReadyForCheckout: stateMatches(
          state,
          [
            "shopping.products.complete",
            "shopping.promotions.complete",
            "shopping.account.complete",
            "shopping.currency.complete",
            "shopping.billingDetails.complete",
            "shopping.customFields.complete",
            "shopping.paymentDetails.available",
          ],
          true
        ),

        isCheckout:
          machineMatches(payment, ["approving"]) ||
          stateMatches(state, ["checkout", "converting", "paying"]),

        isProcessingDetails:
          machineMatches(payment, ["approving"]) ||
          stateMatches(state, ["shopping.paymentDetails.processing"]),
        isConverting: stateMatches(state, ["converting"]),
        isPaying: stateMatches(state, ["paying"]),
        needsApproval: machineMatches(payment, ["approving"]),
        isComplete: stateMatches(state, ["complete", "failed"]),
        hasPaid: stateMatches(state, ["complete"]),
        hasFailed: stateMatches(state, ["failed"]),
      };
    }),
    //  ---
    basket: useContext(state, "basket"),
    summary: useContext(state, "summary"),
    products: useContext(state, "products", []),
    productsInvalid: computed(() =>
      filter(
        contextValue(state, "products", []),
        product => !isEmpty(product?.errors)
      )
    ),
    promotions: useContext(state, "basket.promotions", []),
    taxes: useContext(state, "basket.taxes", []),
    currency: useContext(state, "basket.currency"),
    payment: useContext(state, "payment"),
    invoice: useContext(state, "invoice"),
    // ---
    actors,
    // ---
    isReady,
    clear,
    checkout,
    getProduct,
  };
};
