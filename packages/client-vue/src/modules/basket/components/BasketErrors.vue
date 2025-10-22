<template>
  <aside class="w-full" v-auto-animate v-if="meta.hasErrors">
    <Alert
      v-if="count && !meta.isLoading"
      color="danger"
      variant="minimal"
      icon="alert-triangle"
      :title="t('cart.basket_requires_attention_msg', { count })"
      :description="t('cart.basket_review_msg')"
    >
      <ol class="list-disc p-6 py-2 text-left" v-auto-animate>
        <!-- Basket products -->
        <template v-if="meta.hasBasketProducts">
          <li
            v-for="basketItem in productsInvalid"
            :key="basketItem.id"
            class="marker:text-inherit"
          >
            <i18n-t keypath="cart.basket_product_review_msg" tag="span">
              <template #productName>
                <span>{{ basketItem?.productDetails?.title }}</span>
              </template>
              <template #review>
                <Link
                  :label="t('action.review')"
                  :to="{
                    name: safeProductsRoute,
                    params: { bpid: basketItem.id }
                  }"
                />
              </template>
            </i18n-t>
          </li>
        </template>

        <!-- Additional details -->
        <li v-if="meta.hasBasketFields">
          <i18n-t keypath="cart.basket_fields_review_msg" tag="span">
            <template #review>
              <Link
                :label="t('action.review')"
                :to="{
                  name: safeBasketFieldsRoute,
                  hash: '#additional-details'
                }"
              />
            </template>
          </i18n-t>
        </li>

        <!-- Billing details -->
        <li v-if="meta.hasBasketBilling">
          <i18n-t keypath="cart.basket_billing_review_msg" tag="span">
            <template #review>
              <Link
                :label="t('action.review')"
                :to="{
                  name: safeBasketBillingRoute,
                  hash: '#billing-details'
                }"
              />
            </template>
          </i18n-t>
        </li>
      </ol>

      <input autofocus class="sr-only" id="prevent-autoscroll" />
    </Alert>
  </aside>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import { Alert, Link } from "@upmind-automation/upmind-ui";

// --- internal
import {
  useBasket,
  useBasketBilling,
  useBasketFields,
  ROUTE
} from "@upmind-automation/headless";

// --- utils
import { sum } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
enum visibilityType {
  HIDDEN = 0,
  CHECKOUT = "checkout",
  BASKET = "basket"
}

const props = withDefaults(
  defineProps<{
    basketBilling?: boolean;
    basketFields?: boolean;
    basketProducts?: boolean;
    // ---
    basketBillingRoute?: ROUTE.CHECKOUT; // ROUTE.BASKET
    basketFieldsRoute?: ROUTE.CHECKOUT | ROUTE.BASKET;
    basketProductsRoute?: ROUTE.PRODUCT_EDIT;
  }>(),
  {
    basketBilling: false,
    basketFields: true,
    basketProducts: true
  }
);

const emits = defineEmits(["update:quantity"]);

// -----------------------------------------------------------------------------
const { t } = useI18n();
const { meta: basketMeta, productsInvalid } = useBasket();
const { meta: fieldsMeta, errors: fieldsErrors } = useBasketFields();
const { meta: billingMeta, errors: billingErrors } = useBasketBilling();
const count = computed(() => {
  return sum([
    meta.value.hasBasketProducts ? productsInvalid.value?.length : 0,
    meta.value.hasBasketBilling ? 1 : 0,
    meta.value.hasBasketFields ? 1 : 0
  ]);
});

const meta = computed(() => {
  const hasBasketFields =
    props.basketFields && fieldsErrors.value?.data?.length;
  const hasBasketBilling =
    props.basketBilling && billingErrors.value?.data?.length;
  const hasBasketProducts =
    props.basketProducts && productsInvalid.value?.length;

  return {
    isLoading:
      basketMeta.value.isLoading ||
      fieldsMeta.value.isLoading ||
      billingMeta.value.isLoading,
    hasBasketFields,
    hasBasketBilling,
    hasBasketProducts,
    hasErrors: hasBasketFields || hasBasketBilling || hasBasketProducts
  };
});

const safeBasketBillingRoute = computed(() => {
  return props.basketBillingRoute || ROUTE.CHECKOUT;
});
const safeBasketFieldsRoute = computed(() => {
  return props.basketFieldsRoute || ROUTE.BASKET;
});
const safeProductsRoute = computed(() => {
  return props.basketProductsRoute || ROUTE.PRODUCT_EDIT;
});
</script>
