<template>
  <article v-auto-animate>
    <slot v-if="!meta.isCheckout && !meta.isComplete" name="back-button">
      <UpmBack :class="styles.checkout.backButton" />
    </slot>

    <section :class="styles.checkout.section" v-auto-animate>
      <div :class="styles.checkout.container">
        <div :class="styles.checkout.mainContent">
          <!-- Account -->
          <slot name="session">
            <component
              :is="props.contentSectionComponent"
              v-if="!meta.hasAccount && !meta.isCheckout"
            >
              <component :is="props.cardComponent">
                <UpmSession
                  :class="styles.checkout.session"
                  id="account"
                  ref="account"
                  :noTabs="true"
                  no-header
                  :aria-disabled="meta.hasAccount"
                >
                </UpmSession>
              </component>
            </component>
          </slot>

          <component
            v-if="meta.hasAccount && !meta.isCheckout"
            :is="props.contentSectionComponent"
            :title="t('basket.billing_details.title')"
          >
            <template #title v-if="$slots['billing-details-title']">
              <slot name="billing-details-title" />
            </template>
            <component :is="props.cardComponent">
              <slot name="billing-details">
                <UpmBillingDetails
                  :model-value="billingDetailsModel"
                  @update:modelValue="billingDetailsUpdate"
                  :color="color"
                />
              </slot>
            </component>
          </component>

          <component
            :is="props.contentSectionComponent"
            v-show="meta.hasAccount && !meta.isCheckout"
            :title="t('basket.payment_details.title')"
          >
            <template #title v-if="$slots['payment-details-title']">
              <slot name="payment-details-title" />
            </template>
            <slot name="payment-details">
              <UpmPaymentDetails
                :card-component="props.cardComponent"
                :class="styles.checkout.paymentDetails"
                :color="color"
              />
            </slot>
          </component>
        </div>

        <aside v-if="!meta.isCheckout" :class="styles.checkout.aside">
          <aside :class="styles.checkout.asideInner">
            <component
              :is="props.contentSectionComponent"
              :title="t('basket.summary.title')"
            >
              <component :is="props.cardComponent">
                <slot name="summary">
                  <UpmSummary no-actions />
                </slot>
              </component>
            </component>
          </aside>
        </aside>
      </div>
    </section>

    <!-- Basket procesing -->
    <UpmBasketProcessing
      v-if="meta.isCheckout"
      :open="meta.isCheckout"
      :title="t(processingTitle)"
      :text="processingText"
      :animated-icon="{
        icon: processingIcon,
        primaryColor: 'base-foreground',
        secondaryColor: 'accent',
        size: '4xl',
      }"
      modal
      skrim="light"
    >
      <template #title v-if="$slots['processing-title']">
        <slot
          name="processing-title"
          :processing-title="processingTitle"
          :processing-title-mask="processingTitleMask"
        />
      </template>
    </UpmBasketProcessing>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { watch, computed } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";

// --- internal
import {
  useSession,
  useBasket,
  useBasketBillingDetails,
  useBasketPaymentDetails,
} from "@upmind-automation/headless-vue";
import config from "./config.cva.js";
import { useStyles } from "@upmind-automation/upwind";

// -- components
import UpmSession from "../session/Session.vue";
import UpmBillingDetails from "./BillingDetails.vue";
import UpmBasketProcessing from "../basket/Procesing.vue";
import UpmPaymentDetails from "./PaymentDetails.vue";
import UpmSummary from "../basket/Summary.vue";
import UpmCard from "../content/Card.vue";
import UpmContentSection from "../content/ContentSection.vue";
import UpmBack from "../navigation/Back.vue";

// --- types
import type { CheckoutProps } from "./types";
import { isEqual } from "lodash-es";

// -----------------------------------------------------------------------------
const { t } = useI18n();
const router = useRouter();
// ---

const { meta: account } = useSession();
const { state, isReady, meta, invoice } = useBasket();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();

const props = withDefaults(defineProps<CheckoutProps>(), {
  cardComponent: UpmCard,
  contentSectionComponent: UpmContentSection,
  color: "secondary",
});

const styles = useStyles(["checkout"], meta, config);

await isReady();

// --- route guards
if (meta.value.isEmpty) {
  router.replace({ name: "empty" });
}

const { model: billingDetailsModel, update: billingDetailsUpdate } =
  useBasketBillingDetails();

const processingTitle = computed(() => {
  if (meta.value.needsApproval) {
    return "basket.processing.approval.title";
  }

  if (meta.value.isConverting) {
    return "basket.processing.converting.title";
  }

  if (meta.value.isPaying) {
    return "basket.processing.paying.title";
  }

  if (meta.value.isCheckout) {
    return "basket.processing.default.title";
  }

  if (paymentDetailsMeta.value.isFree) {
    return "basket.processing.noCharge.title";
  }

  return "basket.processing.invalid.title";
});

const processingTitleMask = computed(() => {
  if (meta.value.needsApproval) {
    return "basket.processing.approval.mask";
  }

  if (meta.value.isConverting) {
    return "basket.processing.converting.mask";
  }

  if (meta.value.isPaying) {
    return "basket.processing.paying.mask";
  }

  if (meta.value.isCheckout) {
    return "basket.processing.default.mask";
  }

  if (paymentDetailsMeta.value.isFree) {
    return "basket.processing.noCharge.mask";
  }

  return "basket.processing.invalid.mask";
});

const processingText = computed(() => {
  if (meta.value.needsApproval) {
    return t("basket.processing.approval.text");
  }

  if (meta.value.isConverting) {
    return t("basket.processing.converting.text");
  }

  if (meta.value.isPaying) {
    return t("basket.processing.paying.text");
  }

  if (meta.value.isCheckout) {
    return t("basket.processing.default.text");
  }

  if (paymentDetailsMeta.value.isFree) {
    return t("basket.processing.noCharge.text");
  }

  return t("basket.processing.invalid.text");
});

const processingIcon = computed(() => {
  if (meta.value.needsApproval) {
    return "basket";
  }

  if (meta.value.isConverting) {
    return "receipt";
  }

  if (meta.value.isPaying) {
    return "tapping-card";
  }

  if (meta.value.isCheckout) {
    return "tapping-card";
  }

  if (paymentDetailsMeta.value.isFree) {
    return "basket";
  }

  return "basket";
});
// --- side effects
watch(meta, (value, oldValue) => {
  // TEMP: DC added this log to be able to debug production using sentry when we have issues with the checkout not being Ready/Able to actually Check Out
  if (!isEqual(value, oldValue)) {
    console.info("** Checkout State **", {
      state: state.value,
      value,
    });
  }

  if (value.isComplete) {
    router.replace({
      name: "order",
      params: { orderId: invoice.value?.id },
      query: { payment_success: value.hasPaid.toString() },
    });
    return;
  }
});
</script>
