<template>
  <article v-auto-animate>
    <slot v-if="!meta.isCheckout && !meta.isComplete" name="back-button" />

    <!-- Account + Payment -->
    <section
      class="relative mx-auto flex w-full flex-wrap items-start justify-start gap-6"
      v-auto-animate
    >
      <div
        class="relative flex w-full flex-wrap items-start justify-start gap-8"
      >
        <div class="flex w-full flex-1 flex-col gap-8">
          <!-- Account -->
          <slot name="session">
            <component
              :is="props.contentComponent"
              v-if="!meta.hasAccount && !meta.isCheckout"
            >
              <component :is="props.cardComponent">
                <UpmSession
                  class="w-full min-w-full"
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
            :is="props.contentComponent"
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
                  color="secondary"
                />
              </slot>
            </component>
          </component>

          <component
            :is="props.contentComponent"
            v-show="meta.hasAccount && !meta.isCheckout"
            :title="t('basket.payment_details.title')"
          >
            <template #title v-if="$slots['payment-details-title']">
              <slot name="payment-details-title" />
            </template>
            <slot name="payment-details">
              <UpmPaymentDetails
                :card-component="props.cardComponent"
                class="!p-0"
              />
            </slot>
          </component>
        </div>

        <aside
          v-if="!meta.isCheckout"
          class="order-last flex w-full flex-col items-start gap-6 sm:sticky sm:top-1 xl:max-w-md"
        >
          <aside class="flex w-full flex-col gap-6 text-left">
            <component
              :is="props.contentComponent"
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
        primaryColor: 'primary',
        secondaryColor: 'secondary',
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
} from "@upmind-automation/client-vue";

// -- components
import {
  UpmSession,
  UpmBillingDetails,
  UpmBasketProcessing,
  UpmPaymentDetails,
  UpmSummary,
  useBasketPaymentDetails,
} from "@upmind-automation/client-vue";

// --- types
import type { CheckoutProps } from "./types";

// -----------------------------------------------------------------------------
const { t } = useI18n();
const router = useRouter();
// ---

const { meta: account } = useSession();
const { isReady, meta, invoice } = useBasket();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();

const props = withDefaults(defineProps<CheckoutProps>(), {
  cardComponent: "div",
  contentComponent: "div",
});

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
  if (paymentDetailsMeta.value.isFree) {
    return "basket";
  }

  return "tapping-card";
});
// --- side effects
watch(
  meta,
  ({ isComplete, hasPaid }: { isComplete: boolean; hasPaid: boolean }) => {
    if (isComplete) {
      // MAYBE: redirect after complete instead of dialog?
      router.replace({
        name: "order",
        params: { orderId: invoice.value?.id },
        query: { payment_success: hasPaid.toString() },
      });
      return;
    }
  }
);
</script>
