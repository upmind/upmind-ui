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

<script>
// --- external
import { defineComponent } from "vue";
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

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "BasketDetails",
  components: {
    Session,
    BasketSummary,
    BillingDetails,
    PaymentDetails,
    Form,
  },
  props: {},
  setup() {
    const { t } = useI18n();

    const { meta, summary } = useBasket();
    const billingDetails = useBasketBillingDetails();
    const fields = useBasketFields();

    const styles = useStyles(["basket.details"], meta, config);

    // ---

    return {
      t,
      meta,
      billingDetailsModel: billingDetails.model,
      billingDetailsUpdate: billingDetails.update,
      billingDetailsMeta: billingDetails.meta,
      // ---
      fieldsMeta: fields.meta,
      fieldsModel: fields.model,
      fieldsSchema: fields.schema,
      fieldsUischema: fields.uischema,
      fieldsErrors: fields.errors,
      fieldsUpdate: fields.update,
      fieldsClear: fields.clear,
      // ---
      summary,
      // ---
      styles,
      cn,
    };
  },
});
</script>
.
