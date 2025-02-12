<template>
  <section :class="styles.basket.details.root">
    <header :class="styles.basket.details.header">
      <slot name="header" v-bind="{ meta }">
        <span :class="styles.basket.details.text">
          {{ t("basket.details.text") }}
        </span>

        <h1 :class="styles.basket.details.title">
          {{ t("basket.details.title", summary) }}
        </h1>
      </slot>
    </header>

    <div :class="styles.basket.details.content">
      <!-- billing details -->
      <BillingDetails
        v-if="!meta.needsAuth"
        :model-value="billingDetailsModel"
        @update:modelValue="billingDetailsUpdate"
      />

      <!-- custom fields  -->

      <Form
        v-if="!meta.needsAuth"
        :additional-errors="fieldsErrors?.data"
        :model-value="fieldsModel"
        :processing="fieldsMeta.isProcessing"
        :schema="fieldsSchema"
        :uischema="fieldsUischema"
        @reject="fieldsClear"
        @resolve="fieldsUpdate"
        @update:modelValue="fieldsUpdate"
        no-actions
        autosave
      />

      <!-- payment details -->
      <PaymentDetails />
    </div>

    <footer :class="styles.basket.details.footer">
      <slot name="footer" v-bind="{ meta }">
        <BasketSummary no-actions />
      </slot>
    </footer>
  </section>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useBasket,
  useBasketBillingDetails,
  // useBasketPaymentDetails,
  useBasketFields,
} from "@upmind-automation/headless-vue";
import { useStyles, cn } from "@upmind-automation/upmind-ui";
import config from "./basket.config";

// --- components
import Session from "../session/Session.vue";
import BasketSummary from "./Summary.vue";
import BillingDetails from "../checkout/BillingDetails.vue";
import PaymentDetails from "../checkout/PaymentDetails.vue";
import Form from "../form/Form.vue";

// --- types
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const { meta, summary } = useBasket();
const {
  model: billingDetailsModel,
  update: billingDetailsUpdate,
  meta: billingDetailsMeta,
} = useBasketBillingDetails();

const {
  model: fieldsModel,
  meta: fieldsMeta,
  schema: fieldsSchema,
  uischema: fieldsUischema,
  errors: fieldsErrors,
  update: fieldsUpdate,
  clear: fieldsClear,
} = useBasketFields();

const styles = useStyles(["basket.details"], meta, config) as ComputedRef<{
  basket: {
    details: {
      root: string;
      header: string;
      content: string;
      footer: string;
      text: string;
      title: string;
    };
  };
}>;
</script>
