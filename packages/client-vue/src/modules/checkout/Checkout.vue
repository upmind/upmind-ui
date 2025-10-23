<template>
  <Layout :variant="layout" minimal v-if="!meta.isCheckout">
    <template #navigation>
      <Back @click.prevent="doReject" />
    </template>

    <template #header>
      <Header
        :title="t('text.secure_checkout')"
        :description="
          t('cart.basket_summary_desc', {
            count: products?.length ?? 0,
            total: summary?.total ?? 0
          })
        "
        :badge="{
          label: t('text.fully_encrypted_title'),
          icon: 'lock-04'
        }"
      />
    </template>

    <template #default>
      <!-- Basket Errors -->
      <BasketErrors
        id="basket-errors"
        :basket-billing="!uischema.showBillingOnCheckout"
        :basket-fields="!uischema.showFieldsOnCheckout"
        :basket-products="!uischema.showProductsOnCheckout"
      />

      <!-- Basket Products -->
      <Section
        id="basket-products"
        :title="t('cart.basket_products')"
        v-show="uischema.showProductsOnCheckout"
      >
        <ProductCards />
      </Section>

      <!-- Additional Options -->
      <Section
        id="basket-fields"
        :title="t('text.additional_details')"
        v-show="uischema.showFieldsOnCheckout"
      >
        <Form
          v-if="!fieldsMeta.isLoading"
          :additional-errors="fieldsErrors?.data"
          :model-value="fieldsModel"
          :schema="fieldsSchema"
          :uischema="fieldsUischema"
          @reject="fieldsClear"
          @resolve="fieldsUpdate"
          @update:modelValue="fieldsUpdate"
          no-actions
          autosave
          :touched="meta.showErrors"
        />
      </Section>

      <!-- Billing Details -->
      <Section
        id="basket-billing"
        :title="t('text.billing_details')"
        v-show="uischema.showBillingOnCheckout"
      >
        <BillingDetails :touched="meta.showErrors" />
      </Section>

      <!-- Payment Details -->
      <Section id="payment-details" :title="t('text.payment_details')">
        <PaymentDetails :class="styles.checkout.paymentDetails" />
      </Section>
    </template>

    <template #aside>
      <Section id="basket-summary" :title="t('text.summary')" aside>
        <Summary
          no-actions
          :show-promotions="uischema.showPromotionsOnCheckout"
        />
      </Section>
    </template>

    <template #aside-footer>
      <Alert
        v-if="meta.hasErrors"
        color="danger"
        icon="alert-triangle"
        :title="t('error.checkout')"
        :description="errors?.message"
      />
    </template>
  </Layout>

  <!-- Basket processing -->
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
      :title="processingTitle"
      :text="processingText"
    >
    </Interstitial>
  </slot>
</template>

<script lang="ts" setup>
// --- external
import { watch, computed, type ComputedRef } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useSession,
  useBasket,
  useBasketPaymentDetails,
  useRoutingEngine,
  ROUTE,
  useDataLayer,
  useBrand,
  useBasketFields
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

import BillingDetails from "../billing/Billing.vue";
import PaymentDetails from "./components/PaymentDetails.vue";
import Summary from "../basket/components/Summary.vue";
import Header from "../../components/content/Header.vue";
import ContentSection from "../../components/content/ContentSection.vue";
import Back from "../../components/navigation/Back.vue";
import Section from "../../components/content/LayoutSection.vue";
import ProductCards from "../basket/product/BasketProductCards.vue";
import Form from "../../components/form/Form.vue";
import BasketErrors from "../basket/components/BasketErrors.vue";

// --- types
import type { CheckoutProps } from "./types";
import { isEqual } from "lodash-es";
// -----------------------------------------------------------------------------

const route = useRoute();
const { t } = useI18n();
// ---

const { navigateNext, navigateBack, isResolved, currentRoute } =
  useRoutingEngine();
const { isAuthenticated } = useSession();
const { attempts, meta, errors, isReady, summary, products, uischema } =
  useBasket();
const { meta: paymentDetailsMeta } = useBasketPaymentDetails();
const {
  errors: fieldsErrors,
  meta: fieldsMeta,
  model: fieldsModel,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  clear: fieldsClear,
  update: fieldsUpdate
} = useBasketFields();

withDefaults(defineProps<CheckoutProps>(), {
  as: Card,
  contentSectionComponent: ContentSection
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

const processingTitle = computed(() => {
  if (meta.value.needsApproval) {
    return t("cart.payment_awaiting_approval_md");
  }

  if (meta.value.isConverting) {
    return t("cart.order_converting_md");
  }

  if (meta.value.isPaying) {
    return t("cart.payment_processing_md");
  }

  if (meta.value.isCheckout) {
    return t("cart.payment_checking_details_md");
  }

  if (paymentDetailsMeta.value.isFree) {
    return t("cart.order_processing_md");
  }

  return t("cart.order_unsuccessful_md");
});

const processingText = computed(() => {
  if (meta.value.needsApproval) {
    return t("cart.payment_awaiting_approval_msg");
  }

  if (meta.value.isConverting) {
    return t("cart.order_converting_msg");
  }

  if (meta.value.isPaying) {
    return t("cart.payment_processing_msg");
  }

  if (meta.value.isCheckout) {
    return t("cart.payment_verifying_msg");
  }

  if (paymentDetailsMeta.value.isFree) {
    return t("cart.order_processing_msg");
  }

  return t("cart.payment_check_details_msg");
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

const layout = computed(() => {
  return currentRoute.value?.meta?.template;
});
// --- side effects

watch(attempts, (value, oldValue) => {
  // scroll to our errors when we have a new failed attempt
  if (value && !isEqual(value, oldValue)) {
    // scroll to relevant section IF we have errors there AND that section is enabled

    if (uischema.value.showProductsOnCheckout && !meta.value.hasProducts) {
      document
        .getElementById("basket-products")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (uischema.value.showFieldsOnCheckout && !meta.value.hasFields) {
      document
        .getElementById("basket-fields")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    if (uischema.value.showBillingOnCheckout && !meta.value.hasBilling) {
      document
        .getElementById("basket-billing")
        ?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    // otherwise scroll to top where our general errors are
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

watch(meta, (value, oldValue) => {
  if (value.isComplete) navigateNext();
});
</script>
