<template>
  <component
    :is="modal ? 'uw-dialog' : 'div'"
    size="xl"
    :model-value="true"
    no-actions
    persistent
    skrim="light"
  >
    <section :class="styles.domain.empty.root">
      <uw-avatar v-bind="avatar" />

      <h3 :class="styles.domain.empty.title">
        {{ title }}
      </h3>

      <p :class="styles.domain.empty.text">{{ text }}</p>
    </section>
  </component>
</template>

<script>
// --- external
import { defineComponent } from "vue";

// --- internal
import { useStyles } from "@upmind/upwind";
import config from "./config.cva";

// --- custom elements
import { UwAvatar, UwButton, UwDialog, useCustomElement } from "@upmind/upwind";
useCustomElement(UwDialog);
useCustomElement(UwAvatar);
useCustomElement(UwButton);

// --- utils

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UpmDomainEmpty",
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
      }),
    },
  },
  setup() {
    const styles = useStyles(["domain.empty"], {}, config);

    return {
      styles,
    };
  },
});
</script>
