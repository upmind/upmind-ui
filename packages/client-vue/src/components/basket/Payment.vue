<template>
  <section :class="styles.paymentDetails.root">
    <header :class="styles.paymentDetails.header">
      <slot name="header" v-bind="{ meta }"></slot>
    </header>

    <!-- <upw-skeleton-list
      :class="styles.paymentDetails.loading"
      v-else-if="meta.isLoading || (meta.isAdding && !meta.isEmpty)"
    /> -->

    <footer :class="styles.paymentDetails.footer">
      <slot name="footer" v-bind="{ meta }"></slot>
    </footer>
  </section>
</template>

<script>
// --- external
import { defineComponent, provide, ref } from "vue";

// --- internal
import {
  useBasketPaymentDetails,
  // useBasketBillingDetails,
} from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
// import {  } from "@upmind/upwind";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmClient",
  components: {},
  props: {
    i18nKey: { type: String },
  },
  setup() {
    const paymentDetails = useBasketPaymentDetails();
    // const billingDetails = useBasketBillingDetails();

    const styles = useStyles(["paymentDetails"], paymentDetails.meta, config);
    // ---

    const { meta } = paymentDetails;

    // Provide the paymentDetails to the form/card components
    provide("paymentDetails", useClientUnifiedAddress);

    // ---

    return {
      meta,
      styles,
    };
  },
});
</script>
.
