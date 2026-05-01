<template>
  <aside class="w-full" v-auto-animate v-if="meta.hasErrors">
    <Alert
      v-if="count && !meta.isLoading"
      color="danger"
      variant="minimal"
      icon="alert-triangle"
      :title="t('cart.basket_requires_attention_msg')"
      :description="t('cart.basket_review_msg')"
    >
      <pre>{{ meta }}</pre>
      <ol class="text-sm-tight list-disc p-6 py-2 text-left" v-auto-animate>
        <!-- Additional details -->
        <li v-if="meta.hasBasketFieldErrors">
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
        <li v-if="meta.hasBasketBillingErrors">
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
import { sum } from "lodash-es";
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
    meta.value.hasBasketProductsErrors ? productsInvalid.value?.length : 0,
    meta.value.hasBasketBillingErrors ? 1 : 0,
    meta.value.hasBasketFieldErrors ? 1 : 0
  ]);
});

const meta = computed(() => {
  const hasBasketFieldErrors =
    props.basketFields && fieldsErrors.value?.data?.length;
  const hasBasketBillingErrors =
    props.basketBilling && billingErrors.value?.data?.length;
  const hasBasketProductsErrors =
    props.basketProducts && productsInvalid.value?.length;

  return {
    isLoading:
      basketMeta.value.isLoading ||
      fieldsMeta.value.isLoading ||
      (props.basketBilling && billingMeta.value.isLoading),
    hasBasketFieldErrors,
    hasBasketBillingErrors,
    hasBasketProductsErrors,
    hasErrors: hasBasketFieldErrors || hasBasketBillingErrors // || hasBasketProductsErrors
  };
});

const safeBasketBillingRoute = computed(() => {
  return {
    to: {
      ...(props.basketBillingRoute ?? {}),
      hash: "#basket-billing"
    }
  };

  return { hash: "#basket-billing" };
});

const safeBasketFieldsRoute = computed(() => {
  return {
    to: {
      ...(props.basketFieldsRoute ?? {}),
      hash: "#basket-fields"
    }
  };
});

function getBasketProductsRoute(bpid: string) {
  return {
    to: {
      ...(props.basketProductsRoute ?? {}),
      params: { bpid }
    }
  };
}
</script>
