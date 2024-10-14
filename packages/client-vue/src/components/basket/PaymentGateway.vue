<template>
  <div ref="form" :class="styles.basket.paymentGateway.root">
    <transition-group
      tag="div"
      :class="styles.basket.paymentGateway.wrapper"
      :enter-active-class="styles.basket.paymentGateway.transition.enter.active"
      :enter-from-class="styles.basket.paymentGateway.transition.enter.from"
      :enter-to-class="styles.basket.paymentGateway.transition.enter.to"
      :leave-active-class="styles.basket.paymentGateway.transition.leave.active"
      :leave-from-class="styles.basket.paymentGateway.transition.leave.from"
      :leave-to-class="styles.basket.paymentGateway.transition.leave.to"
      appear
    >
      <upw-spinner size="xs" v-if="meta.isLoading" key="spinner" />

      <!-- Instructions -->
      <upw-markdown
        v-if="instructions"
        :class="styles.basket.paymentGateway.instructions"
        :model-value="instructions"
      />

      <!-- gateway Render Content (* IF Provided) -->
      <div
        ref="container"
        :class="styles.basket.paymentGateway.render"
        v-show="!meta.isLoading"
        key="render"
      ></div>

      <!-- gateway Form (* IF Provided) -->
      <upw-form
        key="form"
        v-if="schema && uischema"
        v-show="!meta.isLoading"
        :class="styles.basket.paymentGateway.form"
        :additional-errors="errors?.data"
        :model-value="model"
        :processing="meta.isProcessing"
        :schema="schema"
        :uischema="uischema"
        @reject="clear"
        @resolve="update"
        @update:modelValue="input"
        no-actions
      />
    </transition-group>
  </div>
</template>

<script lang="ts">
// --- external
import { defineComponent, onMounted, watch, ref, computed } from "vue";

// --- internal
import { useBasketPaymentGateway } from "@upmind-automation/headless-vue";
import { useStyles, mergeStyles, UpwMarkdown } from "@upmind-automation/upwind";
import config from "./config.cva";

// --- components
import { UpwForm, UpwSpinner } from "@upmind-automation/upwind";

// --- utils

// --- types

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmBasketPaymentGateway",
  components: { UpwForm, UpwSpinner, UpwMarkdown },
  props: {
    id: {
      type: String,
      required: true,
    },
    variant: {
      type: String,
    },
  },
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
      instructions,
    } = useBasketPaymentGateway();

    const styles = useStyles(
      [
        "basket.paymentGateway",
        "basket.paymentGateway.transition.enter",
        "basket.paymentGateway.transition.leave",
      ],
      computed(() => ({
        hasErrors: meta.value?.hasErrors,
        variant:
          props.variant ||
          meta.value?.hasRenderer ||
          meta.value?.hasInstructions
            ? "outlined"
            : "",
      })),
      config
    );

    const container = ref();
    // wait till we mount then try to render the gateway if it's provided
    // otherwise watch in case it's provided later
    onMounted(() => {
      watch(renderer, () => {
        // only render if we have a renderer and weve not already rendered
        if (container.value?.innerHTML) return;

        render(container.value).catch(err => {
          if (err) console.error(err);
        });
      });
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
      instructions,
      // ---
      styles,
      mergeStyles,
    };
  },
});
</script>
