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
    :label="t('cart.basket_products')"
    value="products"
    icon="list"
  >
    <ProductCards />
  </Section>

  <!-- Additional Options -->
  <Section
    id="basket-fields"
    v-show="uischema.showFieldsOnCheckout"
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
      :touched="meta.showErrors"
    />
  </Section>

  <!-- Billing Details -->
  <BillingDetails
    id="basket-billing"
    v-show="uischema.showBillingOnCheckout"
    :touched="meta.showErrors"
  />

  <!-- Payment Details -->
  <PaymentDetails />
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";
import { useBasket, useBasketFields } from "@upmind-automation/headless";

// --- components
import Section from "../../../components/section/Section.vue";
import BillingDetails from "../../billing/Billing.vue";
import PaymentDetails from "./PaymentDetails.vue";
import ProductCards from "../../basket/product/BasketProductCards.vue";
import Form from "../../../components/form/Form.vue";
import BasketErrors from "../../basket/components/BasketErrors.vue";

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
