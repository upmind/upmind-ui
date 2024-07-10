<template>
  <article :class="styles.checkout.root">
    <upm-basket-loading
      id="loading"
      v-if="meta.isLoading || !animationComplete"
      :class="styles.checkout.section.root"
    />

    <upm-basket-empty
      id="empty"
      v-else-if="meta.isEmpty"
      :class="styles.checkout.section.root"
    />

    <template v-else>
      <upw-steps
        :model-value="activeSection"
        :steps="steps"
        :loading="meta.isLoading"
        @update:model-value="scrollTo"
      >
        <template #append>
          <div class="ml-auto w-full max-w-xs text-right">
            <upw-button
              :disabled="!meta.isReadyForCheckout || meta.isProcessing"
              @click.prevent="doCheckout"
              color="primary"
              :label="$t('basket.summary.actions.submit')"
              block
            />
          </div>
        </template>
      </upw-steps>

      <!-- overview -->
      <upm-basket-items
        id="overview"
        :class="styles.checkout.section.root"
        v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
      />

      <!-- account -->
      <upm-session
        id="account"
        :class="styles.checkout.section.root"
        v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
      />

      <!-- payment -->
      <upm-basket-details
        id="payment"
        :class="styles.checkout.section.root"
        v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
      />

      <!-- basket procesing -->
      <upm-basket-processing :model-value="meta.isProcessingOrder" />

      <!-- order confirmation -->
      <upm-order-confirmation
        :model-value="meta.isComplete"
        :order-id="invoice?.id"
        :success="meta.hasPaid"
      />
    </template>
  </article>
</template>

<script>
// --- external
import { defineComponent, ref, computed } from "vue";
import { useRoute } from "vue-router";

// --- internal
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// -- components
import {
  useScrollSpy,
  useBasket,
  // ---
  UpmBasketItems,
  UpmSession,
  UpmBasketDetails,
  UpmBasketProcessing,
  UpmOrderConfirmation,
  UpmBasketEmpty,
  UpmBasketLoading,
  // ---
  UpwSteps,
  UpwButton,
} from "@upmind/client-vue";

// -- utils
import { vIntersectionObserver } from "@vueuse/components";
import { getLocalMessages } from "@/utils";
import { trimStart, get, forEach, isArray } from "lodash-es";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Checkout",
  i18n: { messages: getLocalMessages("checkout") },
  components: {
    UpmBasketItems,
    UpmSession,
    UpmBasketDetails,
    UpmBasketProcessing,
    UpmOrderConfirmation,
    UpmBasketEmpty,
    UpmBasketLoading,
    // ---
    UpwSteps,
    UpwButton,
  },
  directives: { "intersection-observer": vIntersectionObserver },
  setup() {
    const { meta, itemsPending, addProduct, invoice, isReady } = useBasket();

    // ---------------------------------------------------
    // --- basket setup
    const { query } = useRoute();
    const product = get(query, "product");
    const products = ref([]);

    isReady().then(() => {
      // add the product to the basket if the basket is empty
      if (!meta.value.isEmpty) return;

      if (product) {
        forEach(isArray(product) ? product : [product], product_id => {
          products.value.push(addProduct({ product_id, quantity: 1 }));
        });
      }
    });
    // ---------------------------------------------------

    const { isScrolling, scrollIntoView } = useScrollSpy();

    const styles = useStyles(["checkout", "checkout.section"], meta, config);

    // ---------------------------------------------------
    // Create a min Animation time for the Loading Screen to prevent fout/jank
    const animationComplete = ref(false);
    const animationDuration = 2_000;

    new Promise(resolve => setTimeout(resolve, animationDuration)).then(() => {
      animationComplete.value = true;
    });
    // ---------------------------------------------------

    return {
      mergeStyles,
      styles,
      // ---
      itemsPending,
      meta,
      invoice,
      activeSection: ref(null),
      isScrolling,
      scrollIntoView,
      steps: computed(() => {
        return [
          {
            label: "Overview",
            hash: "#overview",
            complete: meta.value.hasProducts && meta.value.hasFields,
            disabled: !meta.value.isAvailable,
          },
          {
            label: "Account",
            hash: "#account",
            complete: meta.value.hasAccount,
            disabled: !meta.value.isAvailable,
          },
          {
            label: "Payment",
            hash: "#payment",
            disabled: !meta.value.hasProducts || !meta.value.hasAccount,
            complete:
              meta.value.hasBillingDetails && meta.value.hasPaymentDetails,
          },
          {
            label: "Confirmation",
            hash: "#confirmation",
            disabled:
              !meta.isCheckout ||
              !meta.isConverting ||
              !meta.isPaying ||
              !meta.isComplete,
            complete: meta.isComplete,
          },
        ];
      }),
      animationComplete,
    };
  },
  watch: {
    meta(meta) {
      // if (meta.isComplete) {
      //   debugger;
      //   this.$router.push({
      //     name: "order",
      //     params: { orderId: this.invoice?.id },
      //     query: { payment_success: meta.hasPaid },
      //   });
      //   return;
      // }
      if (!meta.isLoading || meta.isEmpty) return;
      this.scrollTo();
    },
  },
  methods: {
    scrollSpy([section]) {
      if (!this.activeSection || this.isScrolling) return; // safety check to prevent multiple scrolls

      // if we have manually scrolled to a section, update the active section
      if (section.isIntersecting && section.target?.id) {
        this.activeSection = section.target.id;
      }
    },

    scrollTo(hash = this.$route.hash) {
      // return;
      const current = this.activeSection;
      // fallback to the route hash if set
      let target = trimStart(hash, "#");

      // scroll to the appropriate step when the basket has loaded
      // but only if we dont already have no target, ie user has not navigated to a specific step
      // and only if weve never had a target before, ie on first load
      if (!target && !current && !this.meta.isLoading) {
        // only do this section if weve not scrolled to a section yet
        if (!this.meta.hasProducts || this.itemsPending?.length) {
          target = "overview";
        } else if (!this.meta.hasAccount) {
          target = "account";
        } else {
          target = "payment";
        }
      }

      if (target && target != current) {
        this.isScrolling = false;
        this.activeSection = target;
        this.scrollIntoView(this.activeSection, 108);
      }
    },

    doCheckout: async () => {
      // TODO: implement the checkout progress modal
      this.checkout();
    },
  },
});
</script>
