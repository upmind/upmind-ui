<template>
  <!-- <link rel="preload" href="/styles.css" as="style" /> -->

  <primitive
    :as="as"
    :as-child="asChild"
    :class="styles.button.root"
    :disabled="disabled"
  >
    <slot name="prepend"></slot>

    <slot>
      <span :class="styles.button.label">{{ label }}</span></slot
    >

    <slot name="append"></slot>
  </primitive>
</template>

<script lang="ts">
// ---external
import { defineComponent, toRefs } from "vue";
import { Primitive } from "radix-vue";

// --- internal
import config from "./button.config";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { PrimitiveProps } from "radix-vue";
import type { ButtonConfig } from "./types";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UwButton",
  components: {
    Primitive,
  },
  props: {
    as: {
      type: String as PropType<PrimitiveProps["as"]>,
      default: "button",
    },
    asChild: {
      type: Boolean as PropType<PrimitiveProps["asChild"]>,
    },
    label: { type: String },
    color: { type: String as PropType<ButtonConfig["color"]> },
    variant: { type: String as PropType<ButtonConfig["variant"]> },
    size: { type: String as PropType<ButtonConfig["size"]> },
    upwindConfig: { type: Object as PropType<ButtonConfig> },
    block: { type: Boolean },
    disabled: { type: Boolean },
    loading: { type: Boolean },
  },
  setup(props) {
    const styles = useStyles(
      "button",
      toRefs(props),
      config,
      props.upwindConfig
    );
    return { styles };
  },
});
</script>

<style src="@/assets/main.css" />
