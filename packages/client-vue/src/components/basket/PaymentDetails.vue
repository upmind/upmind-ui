<template>
  <section ref="form" :class="styles.basket.paymentDetails.root">
    <upw-form
      :additional-errors="errors?.data"
      :loading="meta.isLoading && false"
      :model-value="model"
      :processing="meta.isProcessing"
      :schema="schema"
      :uischema="uischema"
      @reject="clear"
      @resolve="update"
      @update:modelValue="input"
      no-actions
    >
    </upw-form>

    <upm-payment-gateway v-if="gateway" :key="gateway?.id" />
  </section>
</template>

<script lang="ts">
// --- external
import { defineComponent } from "vue";

// --- internal
import { useBasketPaymentDetails } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwForm } from "@upmind/upwind";
import UpmPaymentGateway from "./PaymentGateway.vue";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmBasketPaymentDetails",
  components: { UpwForm, UpmPaymentGateway },
  props: {},
  setup(props) {
    const {
      meta,
      errors,
      model,
      schema,
      uischema,
      gateway,
      clear,
      input,
      update,
    } = useBasketPaymentDetails();

    const styles = useStyles(["basket.paymentDetails"], meta, config);
    return {
      meta,
      errors,
      model,
      schema,
      uischema,
      gateway,
      clear,
      input,
      update,
      // ---
      styles,
      mergeStyles,
    };
  },
});
</script>
