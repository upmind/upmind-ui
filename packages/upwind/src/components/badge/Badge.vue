<template>
  <span class="badge" :class="styles.badge.root">
    <slot v-if="meta.isLoading" name="loading" v-bind="{ meta }">
      <upw-spinner :class="styles.badge.spinner" class="loading" />
    </slot>

    <slot name="prepend-icon" v-bind="{ meta, icon }">
      <upw-icon v-if="icon" :class="styles.badge.icon" :icon="icon" />
    </slot>

    <slot v-bind="{ meta, label }">
      <span :class="styles.badge.label" v-if="label" class="label">
        {{ label }}
      </span>
    </slot>
  </span>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed, toRefs } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwIcon from "../icon/Icon.vue";
import UpwSpinner from "../spinner/Spinner.vue";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { BadgeProps, IconProps } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "Upwbadge",
  components: {
    UpwSpinner,
    UpwIcon,
  },

  props: {
    label: {
      type: String,
      default: null,
    },

    icon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
      default: null,
    },

    // ---
    loading: {
      type: Boolean,
      default: false,
    },

    // ---
    variant: {
      type: String as PropType<BadgeProps["variant"]>,
      default: null,
    },
    color: {
      type: String as PropType<BadgeProps["color"]>,
      default: null,
    },

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    const meta = computed(() => ({
      isLoading: props.loading,
    }));

    const styles = useStyles(
      "badge",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      meta,
      styles,
    };
  },
});
</script>
