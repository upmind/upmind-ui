<template>
  <span class="badge" :class="styles.badge.root" v-if="visible">
    <slot v-if="loading" name="loading" v-bind="{ isLoading: loading }">
      <upw-spinner :class="styles.badge.spinner" class="loading" />
    </slot>

    <slot name="prepend" v-bind="{ icon }">
      <upw-icon v-if="icon" :class="styles.badge.icon" :icon="icon" />
    </slot>

    <slot v-bind="{ isLoading: loading, label }">
      <span :class="styles.badge.label" v-if="label" class="label">
        {{ label }}
      </span>
    </slot>

    <slot name="append" v-bind="{ isLoading: loading, icon }"> </slot>
  </span>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

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
  name: "UpwBadge",
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

    visible: {
      type: Boolean,
      default: true,
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
