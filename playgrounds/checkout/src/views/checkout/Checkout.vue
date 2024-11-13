<template>
  <article :class="styles.checkout.root">
    <UpmBasketLoading
      v-if="meta.isLoading || !animationComplete"
      :class="styles.checkout.section.root"
      :title="t('basket.loading.title')"
      :text="t('basket.loading.text')"
    />

    <UpmBasketEmpty
      v-else-if="meta.isEmpty"
      :class="styles.checkout.section.root"
      :title="t('basket.empty.title')"
      :text="t('basket.empty.text')"
      :action="{
        variant: 'ghost',
        href: storefrontUrl,
        appendIcon: 'arrow-right',
        label: t('basket.empty.actions.continue'),
      }"
    />

    <template v-else>
      <UpwSteps :open="activeSection" :steps="steps" @update:open="scrollTo" />

      <!-- Overview -->
      <UpmBasketItems
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
          <template v-if="!session.isAuthenticated && session.showRegisterForm">
            <span :class="styles.checkout.section.text">
              {{ t("session.unauthenticated.header.register.text") }}
            </span>

            <h1 :class="styles.checkout.section.title">
              {{ t("session.unauthenticated.header.register.title") }}
            </h1>
          </template>

          <template
            v-else-if="!session.isAuthenticated && session.showLoginForm"
          >
            <span :class="styles.checkout.section.text">
              {{ t("session.unauthenticated.header.login.text") }}
            </span>

            <h1 :class="styles.checkout.section.title">
              {{ t("session.unauthenticated.header.login.title") }}
            </h1>
          </template>

          <template v-else-if="session.isAuthenticated">
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
            <UpmSession
              id="account"
              ref="account"
              v-if="!meta.hasAccount && !meta.isClaiming"
              no-header
              v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
              :aria-disabled="meta.hasAccount"
              :aria-active="activeSection === 'account'"
            >
            </UpmSession>

            <template v-if="meta.hasAccount">
              <!-- billing details -->
              <UpmBillingDetails
                :open="billingDetailsModel"
                @update:modelValue="billingDetailsUpdate"
              />

              <!-- custom fields  -->
              <Form
                :additional-errors="fieldsErrors?.data"
                :open="fieldsModel"
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
              <UpmPaymentDetails
                id="payment"
                ref="payment"
                v-intersection-observer="[scrollSpy, { threshold: 0.25 }]"
                :aria-disabled="!meta.hasProducts || !meta.hasAccount"
                :aria-active="activeSection === 'payment'"
              />
            </template>
          </div>

          <aside :class="styles.checkout.section.sidebar">
            <UpmBasketSummary no-actions />
          </aside>
        </div>

        <footer :class="styles.checkout.section.footer"></footer>
      </section>

      <!-- Basket procesing -->
      <UpmBasketProcessing
        :class="styles.checkout.section.root"
        :open="meta.isCheckout"
        :title="processingTitle"
        :text="processingText"
      />

      <!-- Order confirmation -->
      <UpmOrderConfirmation
        :class="styles.checkout.section.root"
        :open="meta.isComplete"
        :order-id="invoice?.id"
        :success="meta.hasPaid"
        :title="orderTitle"
        :text="orderText"
        :action="orderAction"
      />
    </template>
  </article>
</template>

<script>
// --- external
import { defineComponent, ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind/upwind";
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
  Form,
  // ---
  UpwSteps,
} from "@upmind/client-vue";

// -- utils
import { vIntersectionObserver } from "@vueuse/components";
import { trimStart, get, forEach, isArray, reject, reduce } from "lodash-es";

// ---types
import { QUERY_PARAMS } from "./types";
// -----------------------------------------------------------------------------
export default defineComponent({
  name: "Checkout",
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
    Form,
    // ---
    UpwSteps,
  },
  directives: {
    "intersection-observer": vIntersectionObserver,
    autoAnimate: vAutoAnimate,
  },
  setup() {
    const { t, tm } = useI18n();
    const { meta: session, user } = useSession();
    const { state, meta, summary, addItem, invoice, isReady } = useBasket();
    const { update: updateCurrency } = useBasketCurrency();
    const billingDetails = useBasketBillingDetails();
    const fields = useBasketFields();

    // ---------------------------------------------------
    // --- basket setup
    let { query } = useRoute();
    const router = useRouter();
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
      // first set the currency if provided
      if (currency) {
        updateCurrency({ code: currency.toUpperCase() }).then(() => {
          const newQuery = reduce(
            query,
            (acc, value, key) => {
              const matches = [QUERY_PARAMS.CURRENCY_CODE].includes(key);
              if (!matches) acc[key] = value;
              return acc;
            },
            {}
          );
          query = newQuery;
          router.replace({ query: newQuery });
        });
      }

      // then add our product(s) to the basket
      if (product) {
        forEach(isArray(product) ? product : [product], productId => {
          addItem({ productId, quantity: 1 }).then(basketItem => {
            // finally clean up our query params for our successfully added product
            basketItem.onDone(() => {
              const newQuery = reduce(
                query,
                (acc, value, key) => {
                  const matches =
                    [QUERY_PARAMS.PRODUCT, QUERY_PARAMS.PRODUCT_ID].includes(
                      key
                    ) && value == productId;

                  if (!matches) acc[key] = value;
                  return acc;
                },
                {}
              );
              query = newQuery;
              router.replace({ query: newQuery });
            });
          });
        });
      }
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
      t,
      tm,
      styles,
      // ---
      state,
      meta,
      summary,
      // ---
      session,
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
  computed: {
    storefrontUrl() {
      return import.meta.env.VITE_APP_STOREFRONT;
    },
    processingTitle() {
      if (this.meta.needsApproval) {
        return this.t("basket.processing.approval.title");
      }

      if (this.meta.isConverting) {
        return this.t("basket.processing.converting.title");
      }

      if (this.meta.isPaying) {
        return this.t("basket.processing.paying.title");
      }

      if (this.meta.isCheckout) {
        return this.t("basket.processing.default.title");
      }

      return this.t("basket.processing.invalid.title");
    },

    processingText() {
      if (this.meta.needsApproval) {
        return this.t("basket.processing.approval.text");
      }

      if (this.meta.isConverting) {
        return this.t("basket.processing.converting.text");
      }

      if (this.meta.isPaying) {
        return this.t("basket.processing.paying.text");
      }

      if (this.meta.isCheckout) {
        return this.t("basket.processing.default.text");
      }

      return this.t("basket.processing.invalid.text");
    },

    orderTitle() {
      if (!this.meta.isAuthenticated)
        return this.tm("order.confirmation.invalid.title");

      if (this.success) return this.t("order.confirmation.success.title");

      return this.t("order.confirmation.failed.title");
    },

    orderText() {
      if (!this.meta.isAuthenticated)
        return this.tm("order.confirmation.invalid.text");

      if (this.success) return this.t("order.confirmation.success.text");

      return this.t("order.confirmation.failed.text");
    },

    orderAction() {
      if (!this.meta.isAuthenticated)
        return {
          label: this.tm("order.confirmation.invalid.actions.continue"),
        };

      if (!this.orderId) return null;

      if (this.meta.hasPaid)
        return {
          label: this.tm("order.confirmation.success.actions.continue"),
        };

      return {
        label: this.tm("order.confirmation.failed.actions.continue"),
      };
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
