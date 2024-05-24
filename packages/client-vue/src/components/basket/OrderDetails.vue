<template>
  <section
    :class="styles.basket.orderDetails.root"
    :disabled="!meta.hasProducts || !meta.hasAccount"
  >
    <header :class="styles.basket.orderDetails.header">
      <slot name="header" v-bind="{ meta }">
        <span :class="styles.basket.orderDetails.text">
          {{ $t("basket.orderDetails.text") }}
        </span>

        <h1 :class="styles.basket.orderDetails.title">
          {{ $t("basket.orderDetails.title", summary) }}
        </h1>
      </slot>
    </header>

    <!-- <upw-skeleton-list
      :class="styles.basket.orderDetails.loading"
      v-else-if="meta.isLoading || (meta.isAdding && !meta.isEmpty)"
    /> -->

    <upm-basket-summary
      :class="styles.basket.orderDetails.summary"
      no-actions
    />

    <div :class="styles.basket.orderDetails.content"></div>

    <footer :class="styles.basket.orderDetails.footer">
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
  // useBasketPaymentDetails,
  // useBasketBillingDetails,
  // useBasketFields
} from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import UpmBasketSummary from "./Summary.vue";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClient",
  components: {
    UpmBasketSummary,
  },
  props: {},
  setup() {
    const { meta, summary } = useBasket();

    // const orderDetails = useBasketPaymentDetails();
    // const billingDetails = useBasketBillingDetails();

    const styles = useStyles(["basket.orderDetails"], meta, config);

    // ---

    return {
      meta,
      summary,
      styles,
      mergeStyles,
    };
  },
});
</script>
.
