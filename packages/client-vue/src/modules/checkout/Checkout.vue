<template>
  <Layout>
    <template #navigation>
      <Back @click.prevent="doReject" />
    </template>

    <section :class="styles.checkout.section" v-auto-animate>
      <div :class="styles.checkout.container">
        <div :class="styles.checkout.mainContent">
          <!-- Account -->
          <slot name="session">
            <component
              :is="props.contentSectionComponent"
              v-if="!account.isAuthenticated && !meta.isCheckout"
            >
              <component :is="props.as">
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
            <slot name="billing-details">
              <Billing :as="props.as" />
            </slot>
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
                :as="props.as"
                :class="styles.checkout.paymentDetails"
                :color="color"
              />
            </slot>
          </component>
        </div>

        <aside v-if="!meta.isCheckout" :class="styles.checkout.aside">
          <div :class="styles.checkout.asideInner">
            <component
              :is="props.contentSectionComponent"
              :title="t('checkout.summary.title')"
            >
              <component :is="props.as">
                <slot name="summary">
                  <Summary no-actions />
                </slot>
              </component>
            </component>
          </div>

          <Alert
            v-if="meta.hasError"
            color="error"
            icon="alert-triangle"
            :title="t('checkout.errors.title')"
            :description="errors?.message"
          >
          </Alert>
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
          size: '4xl'
        }"
        :title="t(processingTitleKey)"
        :text="t(processingTextKey)"
      >
        <template #title>
          <SmartTitle :i18n-key="processingTitleKey" align="center" />
        </template>
      </Interstitial>
    </slot>
  </Layout>
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
  useBasketPaymentDetails,
  useRoutingEngine,
  ROUTE,
  useDataLayer
} from "@upmind-automation/headless";

import config from "./checkout.config";

// -- components
import {
  useStyles,
  Interstitial,
  Alert,
  Card,
  Layout
} from "@upmind-automation/upmind-ui";
import Session from "../session/Session.vue";
import Billing from "../billing/Billing.vue";
import PaymentDetails from "./components/PaymentDetails.vue";
import Summary from "../basket/components/Summary.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";
import Back from "../../components/navigation/Back.vue";

// --- types
import type { CheckoutProps } from "./types";
import { isEqual } from "lodash-es";

// -----------------------------------------------------------------------------
const { t } = useI18n();
// ---

const { meta: account, isAuthenticated } = useSession();
const { state, meta, errors, isReady } = useBasket();
const { navigateNext, navigateBack, isResolved } = useRoutingEngine();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();

const props = withDefaults(defineProps<CheckoutProps>(), {
  as: Card,
  contentSectionComponent: ContentSection,
  color: "primary"
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

// -----------------------------------------------------------------------------
await isResolved(ROUTE.CHECKOUT);
await isReady().then(() => isAuthenticated().catch(navigateBack));

const { dataLayer } = useDataLayer();
dataLayer({ event: "begin_checkout" }).withEcommerce().push();

// -----------------------------------------------------------------------------

function doReject() {
  navigateBack();
}

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
const stop = watch(meta, value => {
  if (value.isComplete) {
    navigateNext();
    stop();
  }
});
</script>
