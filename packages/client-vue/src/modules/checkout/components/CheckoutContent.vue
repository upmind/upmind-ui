<template>
  <!-- Basket Errors -->
  <BasketErrors
    id="basket-errors"
    v-show="showCheckout"
    :basket-billing="!uischema.showBillingOnCheckout"
    :basket-fields="!uischema.showFieldsOnCheckout"
    :basket-products="!uischema.showProductsOnCheckout"
    :basket-products-route="props.editRoute"
    :basket-billing-route="props.billingRoute"
    :basket-fields-route="props.fieldsRoute"
  />

  <!-- Basket Products -->
  <Section
    v-show="showCheckout && ui.basketItems.isVisible"
    id="basket-products"
    :label="t('cart.basket_products')"
    value="products"
    icon="list"
  >
    <ProductCards :edit-route="props.editRoute" />
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
      :touched="meta.showErrors"
    />
  </Section>

  <!-- Billing -->
  <template v-if="showCheckout">
    <BillingSummary
      v-if="
        props.billingRoute &&
        !billingDetailsDisabled &&
        ui.billingDetails.isReadonly
      "
      :billing-route="props.billingRoute"
    />
    <BillingForm v-else inline />
  </template>

  <!-- Payment Details -->
  <PaymentDetails
    v-show="showCheckout"
    data-testid="payment-details"
    @resolve="checkout"
  />
</template>

<script lang="ts" setup>
// --- external
import { computed, provide } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useBasketFields,
  useBasketPaymentDetails
} from "@upmind-automation/headless";
import { useConfig, UIContext } from "@upmind-automation/headless";

// --- components
import Section from "../../../components/section/Section.vue";
import BillingForm from "../../billing/components/BillingForm.vue";
import BillingSummary from "../../billing/components/BillingSummary.vue";
import PaymentDetails from "../../payment/components/PaymentDetails.vue";
import ProductCards from "../../basket-product/components/card/BasketProductCards.vue";
import Form from "../../../components/form/Form.vue";
import BasketErrors from "../../basket/components/BasketErrors.vue";

// --- types
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

const props = defineProps<{
  showCheckout: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
  billingRoute?: RouteLocationAsRelativeGeneric;
  fieldsRoute?: RouteLocationAsRelativeGeneric;
}>();
// -----------------------------------------------------------------------------

const { t } = useI18n();
const { meta, uischema, checkout, errors } = useBasket();

const { ui } = useConfig();

const billingDetailsDisabled = computed(
  () =>
    useConfig({ context: UIContext.BILLING_DETAILS }).data
      .billingDetailsDisabled
);

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
