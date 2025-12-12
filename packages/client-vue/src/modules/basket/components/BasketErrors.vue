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
                  size="inherit"
                  v-bind="getBasketProductsRoute(basketItem.id)"
                  :label="t('action.review')"
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
                size="inherit"
                v-bind="safeBasketFieldsRoute"
                :label="t('action.review')"
              />
            </template>
          </i18n-t>
        </li>

        <!-- Billing details -->
        <li v-if="meta.hasBasketBilling">
          <i18n-t keypath="cart.basket_billing_review_msg" tag="span">
            <template #review>
              <Link
                size="inherit"
                v-bind="safeBasketBillingRoute"
                :label="t('action.review')"
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
  useBasketFields
} from "@upmind-automation/headless";

// --- utils
import { has, sum } from "lodash-es";
import { isString } from "xstate/lib/utils";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// --- types

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    basketBilling?: boolean;
    basketFields?: boolean;
    basketProducts?: boolean;
    // ---
    basketBillingRoute?: RouteLocationAsRelativeGeneric;
    basketFieldsRoute?: RouteLocationAsRelativeGeneric;
    basketProductsRoute?: RouteLocationAsRelativeGeneric;
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
      (props.basketBilling && billingMeta.value.isLoading),
    hasBasketFields,
    hasBasketBilling,
    hasBasketProducts,
    hasErrors: hasBasketFields || hasBasketBilling || hasBasketProducts
  };
});

const safeBasketBillingRoute = computed(() => {
  if (
    has(props.basketBillingRoute, "href") &&
    isString(props.basketBillingRoute.href)
  )
    return props.basketBillingRoute;

  if (has(props.basketBillingRoute, "to"))
    return {
      to: {
        ...props.basketBillingRoute,
        hash: "#basket-billing"
      }
    };

  return { href: "" };
});

const safeBasketFieldsRoute = computed(() => {
  if (
    has(props.basketFieldsRoute, "href") &&
    isString(props.basketFieldsRoute.href)
  )
    return props.basketFieldsRoute;

  if (has(props.basketFieldsRoute, "to"))
    return {
      to: {
        ...props.basketFieldsRoute,
        hash: "#basket-fields"
      }
    };

  return { href: "" };
});

function getBasketProductsRoute(bpid: string) {
  if (
    has(props.basketProductsRoute, "href") &&
    isString(props.basketProductsRoute.href)
  )
    return props.basketProductsRoute;

  if (has(props.basketProductsRoute, "to"))
    return {
      to: {
        ...props.basketProductsRoute,
        params: { bpid }
      }
    };

  if (has(props.basketProductsRoute, "name"))
    return {
      to: {
        ...props.basketProductsRoute,
        params: { bpid }
      }
    };

  return { href: "" };
}
</script>
