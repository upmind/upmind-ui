<template>
  <div v-if="meta.hasAlerts" :class="styles.basketAlerts.root" v-auto-animate>
    <!-- Errors -->
    <Alert
      v-if="meta.hasBasketErrors && !meta.isLoading"
      color="danger"
      variant="muted"
      icon="alert-triangle"
      :title="errors!.message"
    />

    <Alert
      v-if="meta.count && !meta.isLoading"
      color="danger"
      variant="muted"
      icon="alert-triangle"
      :title="t('cart.basket_requires_attention_msg', { count: meta.count })"
      :description="t('cart.basket_review_msg')"
    >
      <ol :class="styles.basketAlerts.list" v-auto-animate>
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
      data-testid="basket-warnings"
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
    // ---
    basketBillingRoute?: RouteLocationAsRelativeGeneric;
    basketFieldsRoute?: RouteLocationAsRelativeGeneric;
  }>(),
  {
    basketBilling: false,
    basketFields: true
  }
);

// -----------------------------------------------------------------------------
const { t } = useI18n();
const styles = useStyles(["basketAlerts"], {}, config);
const {
  meta: basketMeta,
  warningNotes,
  dismissAllWarnings,
  errors
} = useBasket();
const { meta: fieldsMeta, errors: fieldsErrors } = useBasketFields();
const { meta: billingMeta, errors: billingErrors } = useBasketBilling();
const meta = computed(() => {
  // Real ResponseError (`.code`) only — parsed per-product field errors have no
  // top-level message and would render a blank alert.
  const hasBasketErrors = basketMeta.value.hasErrors;

  const hasBasketFields =
    props.basketFields && fieldsErrors.value?.data?.length;

  const hasBasketBilling =
    props.basketBilling && billingErrors.value?.data?.length;

  const isLoading =
    basketMeta.value.isLoading ||
    fieldsMeta.value.isLoading ||
    (props.basketBilling && billingMeta.value.isLoading);
  const count = sum([hasBasketBilling ? 1 : 0, hasBasketFields ? 1 : 0]);

  return {
    isLoading,
    hasBasketErrors,
    hasBasketFields,
    hasBasketBilling,
    count,
    hasAlerts:
      (count && !isLoading) ||
      (hasBasketErrors && !basketMeta.value.isLoading) ||
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
</script>
