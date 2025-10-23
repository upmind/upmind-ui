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
    id="basket-products"
    :show="section"
    :title="t('cart.basket_products')"
    v-show="uischema.showProductsOnCheckout"
    icon="list"
  >
    <ProductCards />
  </Section>

  <!-- Additional Options -->
  <Section
    id="basket-fields"
    :show="section"
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
    :show="section"
    :title="t('text.billing_details')"
    v-show="uischema.showBillingOnCheckout"
    icon="building-07"
  >
    <BillingDetails :touched="meta.showErrors" />
  </Section>

  <!-- Payment Details -->
  <Section
    id="payment-details"
    :show="section"
    :title="t('text.payment_details')"
    icon="wallet-02"
  >
    <PaymentDetails />
  </Section>
</template>

<script lang="ts" setup>
import { useI18n } from "vue-i18n";
import { useBasket, useBasketFields } from "@upmind-automation/headless";
import Section from "../../../components/content/LayoutSection.vue";
import BillingDetails from "../../billing/Billing.vue";
import PaymentDetails from "./PaymentDetails.vue";
import ProductCards from "../../basket/product/BasketProductCards.vue";
import Form from "../../../components/form/Form.vue";
import BasketErrors from "../../basket/components/BasketErrors.vue";

interface Props {
  section?: boolean;
}

withDefaults(defineProps<Props>(), {
  section: false
});

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
</script>
