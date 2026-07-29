<template>
  <!-- Basket alerts -->
  <BasketAlerts
    v-show="showCheckout"
    id="basket-errors"
    :basket-billing="!uischema.showBillingOnCheckout"
    :basket-fields="!uischema.showFieldsOnCheckout"
    :basket-products="!uischema.showProductsOnCheckout"
    :basket-products-route="props.editRoute"
    :basket-billing-route="props.billingRoute"
    :basket-fields-route="props.fieldsRoute"
  />

  <!-- Basket Products — gated on the brand's basketItems visibility (brands
       typically hide them here when the items already appear earlier in the
       journey, but the config decides). -->
  <Section
    v-show="showCheckout && ui.basketItems.isVisible"
    id="basket-products"
    :label="t('cart.basket_products')"
    value="products"
    icon="list"
  >
    <Suspense>
      <ProductCards :edit-route="props.editRoute" />
      <template #fallback>
        <BasketProductSkeleton />
      </template>
    </Suspense>
  </Section>

  <!-- Additional Options -->
  <Section
    id="basket-fields"
    v-show="showCheckout && ui.basketFields.isVisible"
    :label="t('text.additional_details')"
    icon="file-attachment-01"
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
      :touched="basketMeta.showErrors"
    />
  </Section>

  <!-- Billing -->
  <CheckoutBilling
    v-if="showCheckout"
    :billing-route="props.billingRoute"
    v-model:editing="isEditingBilling"
  />

  <!-- Product Setup — outstanding provisioning, one product per stage. No config
       gate on purpose: the fallback so a funnel lacking a standalone setup page
       can't strand the shopper. Root must not add v-show — the parent owns it. -->
  <Suspense v-if="meta.showSetup">
    <CheckoutProductSetup
      v-show="showCheckout"
      :disabled="meta.setupDisabled"
    />
    <template #fallback>
      <Section
        v-if="setupMeta.isAvailable"
        :label="t('cart.product_setup_details')"
        icon="asterisk-02"
        :disabled="meta.setupDisabled"
      >
        <CheckoutSetupSkeleton />
      </Section>
    </template>
  </Suspense>

  <!-- Guest Email — a low-priority confirmation field below payment. -->
  <GuestEmail v-show="showCheckout" :disabled="meta.guestEmailDisabled" />

  <!-- Payment -->
  <PaymentDetails
    v-show="showCheckout"
    data-testid="payment-details"
    :disabled="meta.paymentDisabled"
    @resolve="onPlaceOrder"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed, provide, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useBasketFields,
  useBasketPaymentDetails,
  useProductSetup
} from "@upmind-automation/headless";
import { useConfig } from "@upmind-automation/headless";

// --- components
import Section from "../../../components/section/Section.vue";
import CheckoutBilling from "./CheckoutBilling.vue";
import GuestEmail from "./GuestEmail.vue";
import PaymentDetails from "../../payment/components/PaymentDetails.vue";
import CheckoutProductSetup from "./CheckoutProductSetup.vue";
import CheckoutSetupSkeleton from "./CheckoutSetupSkeleton.vue";
import ProductCards from "../../basket-product/components/card/BasketProductCards.vue";
import BasketProductSkeleton from "../../basket-product/components/card/BasketProductSkeleton.vue";
import Form from "../../../components/form/Form.vue";
import BasketAlerts from "../../basket/components/BasketAlerts.vue";

// --- types
import type { CheckoutContentProps } from "../types";

// -----------------------------------------------------------------------------

const props = defineProps<CheckoutContentProps>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta: basketMeta, uischema, checkout } = useBasket();

const { ui } = useConfig();

const { meta: setupMeta } = useProductSetup();

// the view owns the interaction ref — an inline billing edit holds payment closed
const isEditingBilling = ref(false);

// Progressive gating, each prerequisite off its own condition: billing counts only
// where this page captures it, setup only while it is outstanding. Both are false
// on a stepped brand, so nothing gates there. Order placement itself stays gated
// only by canCheckout — once payment opens, the machine answers any refusal.
const meta = computed(() => {
  const needsBilling =
    ui.billingDetails.isEditable &&
    (!basketMeta.value.hasBilling || isEditingBilling.value);
  const needsSetup =
    setupMeta.value.isAvailable || setupMeta.value.isProcessing;
  const isBlocked = needsBilling || needsSetup;

  return {
    guestEmailDisabled: isBlocked,
    paymentDisabled: isBlocked,
    setupDisabled: needsBilling,
    showSetup: setupMeta.value.isAvailable || setupMeta.value.isLoading
  };
});

// The basket machine's canCheckout guard is the only gate: send and react.
// A refusal increments `attempts`; the page-level watcher scrolls to the
// first incomplete section.
function onPlaceOrder() {
  checkout();
}

const paymentDetail = useBasketPaymentDetails();
provide("usePaymentDetail", paymentDetail);

const {
  errors: fieldsErrors,
  meta: fieldsMeta,
  model: fieldsModel,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  clear: fieldsClear,
  update: fieldsUpdate
} = useBasketFields();
</script>
