<template>
  <article v-auto-animate>
    <slot v-if="!meta.isCheckout && !meta.isComplete" name="back-button">
      <Back :class="styles.checkout.backButton" />
    </slot>

    <section :class="styles.checkout.section" v-auto-animate>
      <div :class="styles.checkout.container">
        <div :class="styles.checkout.mainContent">
          <!-- Account -->
          <slot name="session">
            <component
              :is="props.contentSectionComponent"
              v-if="!account.isAuthenticated && !meta.isCheckout"
            >
              <component :is="props.cardComponent">
                <Session
                  :class="styles.checkout.session"
                  id="account"
                  :noTabs="true"
                  no-header
                  :aria-disabled="meta.hasAccount"
                  model-value="register"
                />
              </component>
            </component>
          </slot>

          <component
            v-if="meta.hasAccount && !meta.isCheckout"
            :is="props.contentSectionComponent"
          >
            <template #title>
              <slot name="billing-details-title">
                <SmartTitle
                  i18n-key="checkout.billing_details.title"
                  size="2xl"
                />
              </slot>
            </template>
            <component :is="props.cardComponent">
              <slot name="billing-details">
                <BillingDetails
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
          >
            <template #title>
              <slot name="payment-details-title">
                <template v-if="paymentDetailsMeta.isFree">
                  <SmartTitle
                    i18n-key="checkout.payment_details.title"
                    size="2xl"
                  />
                </template>
                <template v-else>
                  <SmartTitle
                    i18n-key="checkout.payment_details.title"
                    size="2xl"
                  />
                </template>
              </slot>
            </template>
            <slot name="payment-details">
              <PaymentDetails
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
              :title="t('checkout.summary.title')"
            >
              <component :is="props.cardComponent">
                <slot name="summary">
                  <Summary no-actions />
                </slot>
              </component>
            </component>
          </aside>
        </aside>
      </div>
    </section>

    <!-- Basket procesing -->
    <slot name="processing" v-if="meta.isCheckout">
      <Interstitial
        open
        modal
        size="2xl"
        :animatedIcon="{
          icon: processingIcon,
          primaryColor: 'primary',
          secondaryColor: 'secondary',
          size: '4xl',
        }"
        :title="t(processingTitleKey)"
        :text="t(processingTextKey)"
      >
        <template #title>
          <SmartTitle :i18n-key="processingTitleKey" align="center" />
        </template>
      </Interstitial>
    </slot>
  </article>
</template>

<script lang="ts" setup>
// --- external
import { watch, computed, type ComputedRef } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useSession,
  useBasket,
  useBasketBillingDetails,
  useBasketPaymentDetails,
  useRoutingEngine,
} from "@upmind-automation/headless-vue";

import config from "./checkout.config";
import { useStyles, Interstitial } from "@upmind-automation/upmind-ui";

// -- components
import Session from "../session/Session.vue";
import BillingDetails from "./components/BillingDetails.vue";
import PaymentDetails from "./components/PaymentDetails.vue";
import Summary from "../basket/components/Summary.vue";
import Card from "../../components/content/Card.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import Back from "../../components/navigation/Back.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";

// --- types
import type { CheckoutProps } from "./types";
import { isEqual } from "lodash-es";

// -----------------------------------------------------------------------------
const { t } = useI18n();
// ---

const { meta: account, isAuthenticated } = useSession();
const { state, meta, isReady } = useBasket();
const { next, back } = useRoutingEngine();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();

const props = withDefaults(defineProps<CheckoutProps>(), {
  cardComponent: Card,
  contentSectionComponent: ContentSection,
  color: "secondary",
});

const styles = useStyles(["checkout"], meta, config) as ComputedRef<{
  checkout: {
    session?: string;
    section?: string;
    container?: string;
    mainContent?: string;
    aside?: string;
    asideInner?: string;
    backButton?: string;
    paymentDetails?: string;
  };
}>;

const { model: billingDetailsModel, update: billingDetailsUpdate } =
  useBasketBillingDetails();
// -----------------------------------------------------------------------------
await isReady().then(() => isAuthenticated().catch(back));

// -----------------------------------------------------------------------------

const processingTitleKey = computed(() => {
  if (meta.value.needsApproval) {
    return "checkout.processing.approval.title";
  }

  if (meta.value.isConverting) {
    return "checkout.processing.converting.title";
  }

  if (meta.value.isPaying) {
    return "checkout.processing.paying.title";
  }

  if (meta.value.isCheckout) {
    return "checkout.processing.default.title";
  }

  if (paymentDetailsMeta.value.isFree) {
    return "checkout.processing.noCharge.title";
  }

  return "checkout.processing.invalid.title";
});

const processingTextKey = computed(() => {
  if (meta.value.needsApproval) {
    return "checkout.processing.approval.text";
  }

  if (meta.value.isConverting) {
    return "checkout.processing.converting.text";
  }

  if (meta.value.isPaying) {
    return "checkout.processing.paying.text";
  }

  if (meta.value.isCheckout) {
    return "checkout.processing.default.text";
  }

  if (paymentDetailsMeta.value.isFree) {
    return "checkout.processing.noCharge.text";
  }

  return "checkout.processing.invalid.text";
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
    next();
    return;
  }
});
</script>
