<template>
  <!-- Basket Errors -->
  <BasketErrors
    id="basket-errors"
    :basket-billing="!uischema.showBillingOnCheckout"
    :basket-fields="!uischema.showFieldsOnCheckout"
    :basket-products="!uischema.showProductsOnCheckout"
  />

  <!-- Basket Products -->
  <Section
    v-show="uischema.showProductsOnCheckout"
    id="basket-products"
    :title="t('cart.basket_products')"
    icon="list"
  >
    <ProductCards />
  </Section>

  <!-- Additional Options -->
  <Section
    id="basket-fields"
    :title="t('text.additional_details')"
    v-show="uischema.showFieldsOnCheckout"
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
      :touched="meta.showErrors"
    />
  </Section>

  <!-- Billing Details -->
  <Section
    id="basket-billing"
    :title="t('text.billing_details')"
    v-show="uischema.showBillingOnCheckout"
    icon="building-07"
  >
    <BillingDetails :touched="meta.showErrors" />
  </Section>

  <!-- Payment Details -->
  <Section
    id="payment-details"
    :title="t('text.payment_details')"
    icon="wallet-02"
  >
    <PaymentDetails :class="styles.checkout.paymentDetails" />
  </Section>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useBasket, useBasketFields } from "@upmind-automation/headless";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "../checkout.config";

// --- components
import Section from "../../../components/section/Section.vue";
import BillingDetails from "../../billing/Billing.vue";
import PaymentDetails from "./PaymentDetails.vue";
import ProductCards from "../../basket/product/BasketProductCards.vue";
import Form from "../../../components/form/Form.vue";
import BasketErrors from "../../basket/components/BasketErrors.vue";

// --- types
import type { ComputedRef } from "vue";

const { t } = useI18n();
const { meta, uischema } = useBasket();
const {
  errors: fieldsErrors,
  meta: fieldsMeta,
  model: fieldsModel,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  clear: fieldsClear,
  update: fieldsUpdate
} = useBasketFields();

const styles = useStyles(["checkout"], meta, config) as ComputedRef<{
  checkout: {
    paymentDetails?: string;
  };
}>;
</script>
