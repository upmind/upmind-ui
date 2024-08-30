<template>
  <span :class="styles.badge.root">
    <slot name="prepend"></slot>
    <span :class="styles.badge.label">
      <slot> {{ label }}</slot>
    </span>
    <slot name="append"> </slot>
  </span>
</template>

<script lang="ts">
// --- external
import { toRefs, defineComponent } from "vue";

// --- internal
import config from "./badge.config";
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { BadgeConfig } from "./types";

// -----------------------------------------------------------------------------
export default defineComponent({
  name: "UwBadge",
  props: {
    variant: {
      type: String as PropType<BadgeConfig["variant"]>,
    },
    color: {
      type: String as PropType<BadgeConfig["color"]>,
      default: "base",
    },
    label: { type: String },

    upwindConfig: { type: Object, default: () => ({}) },
  },

  setup(props) {
    const styles = useStyles(
      "badge",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      styles,
    };
  },
});
</script>

<style src="@/assets/main.css" />
