<template>
  <article :class="styles.checkout.root">
    <upm-basket-loading
      v-if="meta.isLoading || !animationComplete"
      id="loading"
      :class="styles.checkout.section.root"
      :title="$t('basket.loading.title')"
      :text="$t('basket.loading.text')"
      :action="$tm('basket.loading.actions.continue')"
    />

    <upm-basket-empty
      v-else-if="meta.isEmpty"
      id="empty"
      :class="styles.checkout.section.root"
      :title="$t('basket.empty.title')"
      :text="$t('basket.empty.text')"
      :action="$tm('basket.empty.actions.continue')"
    />

    <template v-else>
      <upw-steps
        :model-value="activeSection"
        :steps="steps"
        @update:model-value="scrollTo"
      />

      <!-- Overview -->
      <upm-basket-items
        id="overview"
        ref="overview"
        :aria-disabled="!meta.isAvailable"
        :aria-active="activeSection === 'overview'"
        :class="styles.checkout.section.root"
        v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
      />

      <!-- Account + Payment -->
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

          <template v-else-if="account.isAuthenticated">
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
          <div :class="styles.checkout.section.content" v-auto-animate>
            <!-- account -->
            <upm-session
              id="account"
              ref="account"
              v-if="!meta.hasAccount && !meta.isClaiming"
              no-header
              v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
              :aria-disabled="meta.hasAccount"
              :aria-active="activeSection === 'account'"
            >
            </upm-session>

            <template v-if="meta.hasAccount">
              <!-- billing details -->
              <upm-billing-details
                :model-value="billingDetailsModel"
                @update:modelValue="billingDetailsUpdate"
              />

              <!-- custom fields  -->
              <upw-form
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
              <upm-payment-details
                id="payment"
                ref="payment"
                v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
                :aria-disabled="!meta.hasProducts || !meta.hasAccount"
                :aria-active="activeSection === 'payment'"
              />
            </template>
          </div>

          <aside :class="styles.checkout.section.sidebar">
            <upm-basket-summary no-actions />
          </aside>
        </div>

        <footer :class="styles.checkout.section.footer"></footer>
      </section>

      <!-- Basket procesing -->
      <upm-basket-processing :model-value="meta.isCheckout" />

      <!-- Order confirmation -->
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
import { vAutoAnimate } from "@formkit/auto-animate";

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
import { trimStart, get, forEach, isArray, reject } from "lodash-es";

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
  directives: {
    "intersection-observer": vIntersectionObserver,
    autoAnimate: vAutoAnimate,
  },
  setup() {
    const { meta: account, user } = useSession();
    const { state, meta, summary, addItem, invoice, isReady } = useBasket();
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
          addItem({ product_id, quantity: 1 });
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

    const styles = useStyles(
      [
        "checkout",
        "checkout.section",
        "checkout.transition.enter",
        "checkout.transition.leave",
      ],
      meta,
      config
    );

    // ---------------------------------------------------
    // Create a min Animation time for the Loading Screen to prevent fout/jank
    // but only 'complete' the animation once our basket is available, ie the products have been added
    const animationComplete = ref(false);
    const animationDuration = 1_000;
    const interval = setInterval(() => {
      if (meta.value.isAvailable || !product) {
        animationComplete.value = true;
        clearInterval(interval);
      }
    }, animationDuration);

    // ---------------------------------------------------

    return {
      mergeStyles,
      styles,
      // ---
      state,
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
        let values = [
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
              meta.value.hasProducts &&
              meta.value.hasAccount &&
              meta.value.hasBillingDetails &&
              meta.value.hasPaymentDetails,
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

        if (meta.value.hasAccount) {
          values = reject(values, { label: "Account" });
        }

        return values;
      }),
      animationComplete,
    };
  },
  watch: {
    meta(meta) {
      if (!this.animationComplete || meta.isLoading || meta.isEmpty) return;

      // MAYBE: redirect after complete instead of dialog?
      // if (meta.isComplete) {
      //   this.$router.push({
      //     name: "order",
      //     params: { orderId: this.invoice?.id },
      //     query: { payment_success: meta.hasPaid },
      //   });
      //   return;
      // }

      this.scrollTo(this.$route.hash);
    },
  },
  methods: {
    scrollSpy([section]) {
      // if we have manually sctolled to a section, update the active section
      // only if the section is intersecting, not disabled and we are not already scrolling
      if (
        !this.isScrolling &&
        section.isIntersecting &&
        section.target?.id &&
        section.target?.ariaDisabled != "true"
      ) {
        this.activeSection = section.target.id;
      }
    },

    scrollTo(hash) {
      // Clean the hash of any leading # characters
      const target = trimStart(hash, "#");

      // if we have a target, check if it exists in the DOM before scrolling to it
      if (this.$refs[target]) {
        this.isScrolling = false;
        this.activeSection = target;
        this.scrollIntoView(this.activeSection, 108);
      }
    },
  },
});
</script>
