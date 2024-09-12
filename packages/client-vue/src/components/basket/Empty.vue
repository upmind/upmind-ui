<template>
  <component
    :is="modal ? 'uw-dialog' : 'div'"
    size="xl"
    :model-value="meta.isEmpty"
    no-actions
    persistent
    skrim="light"
  >
    <section :class="styles.basket.empty.root">
      <uw-avatar v-bind="avatar" />

      <h3 :class="styles.basket.empty.title">
        {{ title }}
      </h3>

      <p :class="styles.basket.empty.text">{{ text }}</p>

      <footer>
        <uw-button
          v-if="action"
          v-bind="action"
          block
          variant="ghost"
          :href="storefrontUrl"
        />
      </footer>
    </section>
  </component>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useBasket } from "@upmind/flow-vue";
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { UwAvatar, UwButton, UwDialog, useCustomElement } from "@upmind/upwind";
useCustomElement(UwDialog);
useCustomElement(UwAvatar);
useCustomElement(UwButton);

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmBasketEmpty",
  props: {
    modal: { type: Boolean, default: true },
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

    const styles = useStyles(["basket.empty"], meta, config);

    // ---

    return {
      meta,
      styles,
    };
  },
  computed: {
    storefrontUrl() {
      return import.meta.env.VITE_APP_STOREFRONT;
    },
  },
});
</script>
.
