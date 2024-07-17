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
      />

      <!-- overview -->
      <upm-basket-items
        id="overview"
        :class="styles.checkout.section.root"
        v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
      />

      <section :class="styles.checkout.section.root">
        <header :class="styles.checkout.section.header">
          <template v-if="!account.isAuthenticated && account.showRegisterForm">
            <span :class="styles.checkout.section.text">
              {{ $t("session.unauthenticated.header.register.text") }}
            </span>

            <h1 :class="styles.checkout.section.title">
              {{ $t("session.unauthenticated.header.register.title") }}
            </h1>
          </template>

          <template
            v-else-if="!account.isAuthenticated && account.showLoginForm"
          >
            <span :class="styles.checkout.section.text">
              {{ $t("session.unauthenticated.header.login.text") }}
            </span>

            <h1 :class="styles.checkout.section.title">
              {{ $t("session.unauthenticated.header.login.title") }}
            </h1>
          </template>

          <template v-else>
            <i18n-t
              :class="styles.checkout.section.text"
              keypath="basket.details.text"
              tag="span"
            >
              <template #[`name`]>{{ user?.display }}</template>
            </i18n-t>

            <i18n-t
              :class="styles.checkout.section.title"
              keypath="basket.details.title"
              tag="h2"
            >
              <template #[`name`]>{{ user?.display }}</template>
              <template #[`total`]>{{ summary?.total }}</template>
            </i18n-t>
          </template>
        </header>

        <div :class="styles.checkout.section.wrapper">
          <div :class="styles.checkout.section.content">
            <!-- account -->

            <upm-session
              v-if="!meta.hasAccount"
              id="account"
              no-header
              v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
            >
            </upm-session>

            <!-- billing details -->
            <upm-billing-details
              v-if="!meta.needsAuth"
              :model-value="billingDetailsModel"
              @update:modelValue="billingDetailsUpdate"
            />

            <!-- custom fields  -->
            <upw-form
              v-if="!meta.needsAuth"
              :additional-errors="fieldsErrors?.data"
              :model-value="fieldsModel"
              :processing="fieldsMeta.isProcessing"
              :schema="fieldsSchema"
              :uischema="fieldsUischema"
              @reject="fieldsClear"
              @resolve="fieldsUpdate"
              @update:modelValue="fieldsUpdate"
              no-actions
              autosave
            />

            <!-- payment details -->
            <upm-payment-details />
          </div>

          <aside :class="styles.checkout.section.sidebar">
            <upm-basket-summary no-actions />
          </aside>
        </div>

        <footer :class="styles.checkout.section.footer"></footer>
      </section>

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
import { useRoute, useRouter } from "vue-router";

// --- internal
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// -- components
import {
  useScrollSpy,
  useSession,
  useBasket,
  useBasketCurrency,
  // ---
  UpmBasketEmpty,
  UpmBasketItems,
  UpmBasketLoading,
  UpmBasketProcessing,
  UpmBasketSummary,
  UpmBillingDetails,
  UpmOrderConfirmation,
  UpmPaymentDetails,
  useBasketBillingDetails,
  useBasketFields,
  UpmSession,
  UpwForm,

  // ---
  UpwSteps,
} from "@upmind/client-vue";

// -- utils
import { vIntersectionObserver } from "@vueuse/components";
import { getLocalMessages } from "@/utils";
import { trimStart, get, forEach, isArray } from "lodash-es";

// ---types
import { QUERY_PARAMS } from "./types.d";
// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Checkout",
  i18n: { messages: getLocalMessages("checkout") },
  components: {
    UpmBasketEmpty,
    UpmBasketItems,
    UpmBasketLoading,
    UpmBasketProcessing,
    UpmBasketSummary,
    UpmBillingDetails,
    UpmOrderConfirmation,
    UpmPaymentDetails,
    UpmSession,
    UpwForm,
    // ---
    UpwSteps,
  },
  directives: { "intersection-observer": vIntersectionObserver },
  setup() {
    const { meta: account, user } = useSession();
    const { meta, summary, addProduct, invoice, isReady } = useBasket();
    const { update } = useBasketCurrency();
    const billingDetails = useBasketBillingDetails();
    const fields = useBasketFields();

    // ---------------------------------------------------
    // --- basket setup
    const { query } = useRoute();
    // const router = useRouter();
    // ---
    // parse our query params that may be passed in
    const product = get(
      query,
      QUERY_PARAMS.PRODUCT,
      get(query, QUERY_PARAMS.PRODUCT_ID)
    );
    const products = ref([]);
    // ---
    const currency = get(
      query,
      QUERY_PARAMS.CURRENCY,
      get(query, QUERY_PARAMS.CURRENCY_CODE)
    );

    isReady().then(() => {
      // first add our product(s) to the basket if the basket is ready & empty
      if (meta.value.isEmpty && product) {
        forEach(isArray(product) ? product : [product], product_id => {
          products.value.push(addProduct({ product_id, quantity: 1 }));
        });
      }

      // then set the currency if provided
      if (currency) {
        update({ code: currency.toUpperCase() });
      }

      // finally clean up our query params
      // router.replace({ query: {} });
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
      meta,
      summary,
      // ---
      account,
      user,
      // ---
      billingDetailsModel: billingDetails.model,
      billingDetailsUpdate: billingDetails.update,
      billingDetailsMeta: billingDetails.meta,
      // ---
      fieldsMeta: fields.meta,
      fieldsModel: fields.model,
      fieldsSchema: fields.schema,
      fieldsUischema: fields.uischema,
      fieldsErrors: fields.errors,
      fieldsUpdate: fields.update,
      fieldsClear: fields.clear,
      // ---
      invoice,
      // ---
      activeSection: ref(null),
      isScrolling,
      scrollIntoView,
      // ---
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
      // MAYBE: redirect after complete instead of dialog?
      // if (meta.isComplete) {
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
