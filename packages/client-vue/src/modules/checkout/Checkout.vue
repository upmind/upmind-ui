<template>
  <Layout :variant="uiCart?.layout" minimal>
    <template #navigation>
      <Back @click.prevent="doReject" />
    </template>

    <template #header>
      <Header
        :title="t('checkout.header.title')"
        :description="
          t(
            'checkout.header.description',
            [summary.total],
            products?.length || 0
          )
        "
        :badge="{
          label: t('checkout.header.badge'),
          icon: 'lock'
        }"
      />
    </template>

    <template #default>
      <Section :title="t('checkout.billing')">
        <Billing />
      </Section>

      <Section :title="t('checkout.payment')">
        <PaymentDetails
          :class="styles.checkout.paymentDetails"
          :color="color"
        />
      </Section>
    </template>

    <template #aside>
      <Section :title="t('checkout.summary.title')">
        <Summary no-actions />
      </Section>
    </template>

    <template #aside-footer>
      <Alert
        v-if="meta.hasError"
        color="error"
        icon="alert-triangle"
        :title="t('checkout.errors.title')"
        :description="errors?.message"
      >
      </Alert>
    </template>
  </Layout>

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
</template>

<script lang="ts" setup>
// --- external
import { watch, computed, type ComputedRef } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useSession,
  useBasket,
  useBasketPaymentDetails,
  useRoutingEngine,
  ROUTE,
  useDataLayer,
  useBrand
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
import Header from "../../components/content/Header.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import SmartTitle from "../../components/content/SmartTitle.vue";
import Back from "../../components/navigation/Back.vue";
import Section from "../../components/content/LayoutSection.vue";

// --- types
import type { CheckoutProps } from "./types";
// -----------------------------------------------------------------------------
const { t } = useI18n();
// ---

const { meta: account, isAuthenticated } = useSession();
const { state, meta, errors, isReady, summary, products } = useBasket();
const { navigateNext, navigateBack, isResolved } = useRoutingEngine();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();
const { uiCart } = useBrand();

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
