<template>
  <div ref="form" :class="styles.basket.paymentGateway.root">
    <!-- gateway Render Content (* IF Provided) -->
    <div ref="container" :class="styles.basket.paymentGateway.render"></div>

    <!-- gateway Form (* IF Provided) -->
    <upw-form
      v-if="schema && uischema"
      :additional-errors="errors?.data"
      :loading="meta.isLoading"
      :model-value="model"
      :processing="meta.isProcessing"
      :schema="schema"
      :uischema="uischema"
      @reject="clear"
      @resolve="update"
      @update:modelValue="input"
      no-actions
    />
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, onMounted, watch, ref } from "vue";

// --- internal
import { useBasketPaymentGateway } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- components
import { UpwForm } from "@upmind/upwind";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmBasketPaymentGateway",
  components: { UpwForm },
  props: {},
  setup(props) {
    const {
      meta,
      errors,
      model,
      schema,
      uischema,
      renderer,
      clear,
      input,
      update,
      render,
    } = useBasketPaymentGateway();

    const styles = useStyles(["basket.paymentGateway"], meta, config);

    const container = ref();
    // wait till we mount then try to render the gateway if it's provided
    // otherwise watch in case it's provided later
    onMounted(() => {
      render(container.value);
      watch(renderer, () => render(container.value));
    });

    return {
      container,

      meta,
      errors,
      model,
      schema,
      uischema,
      renderer,
      clear,
      input,
      update,
      render,
      // ---
      styles,
      mergeStyles,
    };
  },
});
</script>
