<template>
  <article class="flex flex-col gap-4">
    <!-- confirmation -->
    <upm-order-confirmation
      id="confirmation"
      :class="styles.order.section.root"
      :orderId="orderId"
      :success="success"
    />
  </article>
</template>

<script>
// --- external
import { defineComponent } from "vue";
import { useRoute } from "vue-router";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// -- components
import {
  // useBasket,
  UpmOrderConfirmation,
} from "@upmind/client-vue";

// --- utils
import { getLocalMessages } from "@/utils";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "Order",
  i18n: { messages: getLocalMessages("order") },
  components: {
    UpmOrderConfirmation,
  },
  setup() {
    const route = useRoute();
    const styles = useStyles(["order", "order.section"], {}, config);

    return {
      orderId: route.params.orderId,
      success: route.query.payment_success === "true",
      styles,
    };
  },
});
</script>
