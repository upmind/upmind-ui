<template>
  <span :class="[styles.badge.root]">
    <slot name="prepend" v-bind="{ icon }">
      <upw-icon v-if="icon" :class="styles.badge.icon" :icon="icon" />
    </slot>

    <slot v-if="label === ''" />
    <span v-else :class="styles.badge.label">{{ label }}</span>

    <slot name="append" v-bind="{ icon }"> </slot>
  </span>
</template>

<script lang="ts">
// --- components
import UpwIcon from "../../icon/Icon.vue";

// --- external
import { toRefs } from "vue";

// --- types
import { type BadgeVariants } from ".";
import type { IconProps } from "./types";

// --- config
import config from "./badge.config";
import { useStyles } from "../../../utils";

export default {
  name: "Badge",
  components: {
    UpwIcon,
  },

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
    icon: {
      type: [String, Object] as IconProps["icon"],
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
