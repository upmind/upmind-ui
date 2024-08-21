<template>
  <span :class="[styles.badge.root]">
    <slot name="prepend"></slot>
    <span :class="styles.badge.label">
      <slot> {{ label }}</slot>
    </span>
    <slot name="append"> </slot>
  </span>
</template>

<script lang="ts">
// --- external
import { toRefs } from "vue";

// --- internal
import config from "./badge.config";
import { useStyles } from "../../../utils";

// --- components

// --- types
import { type BadgeVariants } from ".";

// -----------------------------------------------------------------------------
export default {
  name: "UwBadge",
  components: {},
  props: {
    variant: {
      type: String as BadgeVariants["variant"],
    },
    color: {
      type: String as BadgeVariants["color"],
      default: "base",
    },
    label: {
      type: String,
    },

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
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
};
</script>
