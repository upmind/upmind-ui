<template>
  <div v-if="meta.hasAlerts" :class="styles.basketAlerts.root" v-auto-animate>
    <!-- Errors -->
    <Alert
      v-if="meta.count && !meta.isLoading"
      color="danger"
      variant="muted"
      icon="alert-triangle"
      :title="t('cart.basket_requires_attention_msg', { count: meta.count })"
      :description="t('cart.basket_review_msg')"
    >
      <ol :class="styles.basketAlerts.list" v-auto-animate>
        <!-- Basket products -->
        <template v-if="meta.hasBasketProducts">
          <li
            v-for="basketItem in productsInvalid"
            :key="basketItem.id"
            :class="styles.basketAlerts.item"
          >
            <i18n-t keypath="cart.basket_product_review_msg" tag="span">
              <template #productName>
                <span>{{ basketItem?.productDetails?.title }}</span>
              </template>
              <template #review>
                <Link
                  size="inherit"
                  color="inherit"
                  v-bind="getBasketProductsRoute(basketItem.id)"
                  :label="t('action.review')"
                />
              </template>
            </i18n-t>
          </li>
        </template>

        <!-- Additional details -->
        <li v-if="meta.hasBasketFields" :class="styles.basketAlerts.item">
          <i18n-t keypath="cart.basket_fields_review_msg" tag="span">
            <template #review>
              <Link
                size="inherit"
                color="inherit"
                v-bind="safeBasketFieldsRoute"
                :label="t('action.review')"
              />
            </template>
          </i18n-t>
        </li>

        <!-- Billing details -->
        <li v-if="meta.hasBasketBilling" :class="styles.basketAlerts.item">
          <i18n-t keypath="cart.basket_billing_review_msg" tag="span">
            <template #review>
              <Link
                size="inherit"
                color="inherit"
                v-bind="safeBasketBillingRoute"
                :label="t('action.review')"
              />
            </template>
          </i18n-t>
        </li>
      </ol>

      <!-- Captures initial autofocus so the page doesn't auto-scroll to the first focusable Link inside the alert when it mounts. -->
      <input autofocus class="sr-only" id="prevent-autoscroll" />
    </Alert>

    <!-- Warnings -->
    <Alert
      v-if="basketMeta.hasWarningNotes && !basketMeta.isLoading"
      color="warning"
      variant="muted"
      icon="alert-triangle"
      :title="t('cart.warning_notes_title', warningNotes.length)"
      :action="{ label: t('action.dismiss_all') }"
      @click="dismissAllWarnings"
    >
      <template #description>
        <ul :class="styles.basketAlerts.list" v-auto-animate>
          <li
            v-for="note in warningNotes"
            :key="note.id"
            :class="styles.basketAlerts.item"
          >
            {{ note.message }}
          </li>
        </ul>
      </template>
    </Alert>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- components
import { Alert, Link, useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import {
  useBasket,
  useBasketBilling,
  useBasketFields
} from "@upmind-automation/headless";
import config from "./basket-alerts.config";

// --- utils
import { sum } from "lodash-es";

// --- types
import type { RouteLocationAsRelativeGeneric } from "vue-router";

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

// -----------------------------------------------------------------------------
const { t } = useI18n();
const styles = useStyles(["basketAlerts"], {}, config);
const {
  meta: basketMeta,
  productsInvalid,
  warningNotes,
  dismissAllWarnings
} = useBasket();
const { meta: fieldsMeta, errors: fieldsErrors } = useBasketFields();
const { meta: billingMeta, errors: billingErrors } = useBasketBilling();
const meta = computed(() => {
  const hasBasketFields =
    props.basketFields && fieldsErrors.value?.data?.length;
  const hasBasketBilling =
    props.basketBilling && billingErrors.value?.data?.length;
  const hasBasketProducts =
    props.basketProducts && productsInvalid.value?.length;
  const isLoading =
    basketMeta.value.isLoading ||
    fieldsMeta.value.isLoading ||
    (props.basketBilling && billingMeta.value.isLoading);
  const count = sum([
    hasBasketProducts ? productsInvalid.value?.length : 0,
    hasBasketBilling ? 1 : 0,
    hasBasketFields ? 1 : 0
  ]);

  return {
    isLoading,
    hasBasketFields,
    hasBasketBilling,
    hasBasketProducts,
    count,
    hasAlerts:
      (count && !isLoading) ||
      (basketMeta.value.hasWarningNotes && !basketMeta.value.isLoading)
  };
});

const safeBasketBillingRoute = computed(() => {
  return {
    to: {
      ...(props.basketBillingRoute ?? {}),
      hash: "#basket-billing"
    }
  };
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
