<template>
  <aside class="w-full" v-auto-animate>
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
                  name: 'product.edit',
                  params: { bpid: basketItem.id }
                }"
              />
            </template>
          </i18n-t>
        </li>
        <!-- Additional details -->
        <li v-if="fieldsErrors?.data?.length">
          <i18n-t keypath="cart.basket_fields_review_msg" tag="span">
            <template #review>
              <Link
                @click.native="scrollToId('additional-details')"
                :label="t('action.review')"
                :to="{ hash: '#additional-details' }"
              />
            </template>
          </i18n-t>
        </li>
        <!-- Billing details -->
        <li v-if="props.hasBillingDetails && billingErrors?.data?.length">
          <i18n-t keypath="cart.basket_billing_review_msg" tag="span">
            <template #review>
              <Link
                @click.native="scrollToId('billing-details')"
                :label="t('action.review')"
                :to="{ hash: '#billing-details' }"
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
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import { Alert, Link } from "@upmind-automation/upmind-ui";

// --- internal
import {
  useBasket,
  useBasketBilling,
  useBasketFields
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

const props = defineProps<{
  basketBilling?: keyof typeof visibilityType;
  basketFields?: keyof typeof visibilityType;
  basketProducts?: keyof typeof visibilityType;
}>();
// Example comparison check using values:
// if (props.basketBilling === visibilityType.CHECKOUT) {
// Do something if basketBilling is "checkout"
// }

const emits = defineEmits(["update:quantity"]);

// -----------------------------------------------------------------------------
const route = useRoute();
const { t } = useI18n();
const { meta: basketMeta, productsInvalid } = useBasket();
const { meta: fieldsMeta, errors: fieldsErrors } = useBasketFields();
const { meta: billingMeta, errors: billingErrors } = useBasketBilling();
const count = computed(() => {
  return sum([
    productsInvalid.value?.length,
    fieldsErrors.value?.data?.length ? 1 : 0,
    props.hasBillingDetails && billingErrors.value?.data?.length ? 1 : 0
  ]);
});

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

const meta = computed(() => {
  return {
    isLoading:
      basketMeta.value.isLoading ||
      fieldsMeta.value.isLoading ||
      billingMeta.value.isLoading
  };
});
</script>
