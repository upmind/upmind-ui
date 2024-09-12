<template>
  <component
    :is="modal ? 'uw-dialog' : 'div'"
    size="xl"
    :model-value="open"
    no-actions
    persistent
    skrim="light"
  >
    <section :class="styles.basket.loading.root">
      <uw-avatar v-bind="avatar" />

      <h3 :class="styles.basket.loading.title">
        {{ title }}
      </h3>

      <p :class="styles.basket.loading.text">{{ text }}</p>
    </section>
  </component>
</template>

<script>
// --- external
import { defineComponent, computed } from "vue";

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles, mergeStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { UwAvatar, UwButton, UwDialog, useCustomElement } from "@upmind/upwind";
useCustomElement(UwAvatar);
useCustomElement(UwButton);
useCustomElement(UwDialog);

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketloading",
  props: {
    modal: { type: Boolean },
    title: { type: String },
    text: { type: String },
    action: { type: Object, default: () => null },
    avatar: {
      type: Object,
      default: () => ({
        size: "lg",
        shape: "circle",
        color: "primary",
        icon: "basket",
        fit: "contain",
      }),
    },
  },
  setup() {
    const { meta } = useBasket();

    const styles = useStyles(["basket.loading"], meta, config);

    // ---

    return {
      meta,
      open: computed(() => {
        const value = meta.value.isCheckout || meta.value.isComplete;
        return value;
      }),

      // ---
      styles,
      mergeStyles,
    };
  },
});
</script>
.
