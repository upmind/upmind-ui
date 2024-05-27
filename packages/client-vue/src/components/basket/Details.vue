<template>
  <section
    :class="styles.basket.details.root"
    :disabled="!meta.hasProducts || !meta.hasAccount"
  >
    <header :class="styles.basket.details.header">
      <slot name="header" v-bind="{ meta }">
        <span :class="styles.basket.details.text">
          {{ $t("basket.details.text") }}
        </span>

        <h1 :class="styles.basket.details.title">
          {{ $t("basket.details.title", summary) }}
        </h1>
      </slot>
    </header>

    <!-- <upw-skeleton-list
      :class="styles.basket.details.loading"
      v-else-if="meta.isLoading || (meta.isAdding && !meta.isEmpty)"
    /> -->

    <upm-basket-summary :class="styles.basket.details.summary" no-actions />

    <div :class="styles.basket.details.content">
      <upm-billing-details
        :model-value="modelBillingDetails"
        @update:modelValue="updateBillingDetails"
      />

      <!-- fields -->
    </div>

    <footer :class="styles.basket.details.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import {
  useBasket,
  useBasketBillingDetails,
  // useBasketPaymentDetails,
  // useBasketFields
} from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmBasketSummary from "./Summary.vue";
import UpmBillingDetails from "../client/Basket.vue";
// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketDetails",
  components: {
    UpmBasketSummary,
    UpmBillingDetails,
  },
  props: {},
  setup() {
    const { meta, summary } = useBasket();
    const billingDetails = useBasketBillingDetails();

    // const details = useBasketPaymentDetails();

    const styles = useStyles(["basket.details"], meta, config);

    // ---

    return {
      meta,
      modelBillingDetails: billingDetails?.model,
      updateBillingDetails: billingDetails?.update,
      summary,
      // ---
      styles,
      mergeStyles,
    };
  },
});
</script>
.
