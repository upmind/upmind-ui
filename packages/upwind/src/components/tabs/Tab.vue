<template>
  <button
    :class="styles.tab.root"
    :disabled="disabled"
    :aria-controls="value"
    role="tab"
  >
    <slot v-bind="{ meta, label }">
      <span :class="styles.tab.label" v-if="label" class="label">
        {{ label }}
      </span>
      <slot name="icon" v-bind="{ meta, icon: icon }">
        <upw-icon v-if="icon" :class="styles.tab.icon" :icon="icon" />
      </slot>
    </slot>
  </button>
</template>

<script lang="ts">
// --- external
import { defineComponent, computed } from "vue";

// --- local
import config from "./config.cva";

// --- components
import UpwIcon from "../../ui/icon/Icon.ce.vue";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { TabProps } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UwButton",
  components: {
    UpwIcon,
  },

  props: {
    value: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      default: null,
    },
    icon: {
      type: [String, Object],
      default: null,
    },
    // ---
    active: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // ---
    size: {
      type: String as PropType<TabProps["size"]>,
      default: null,
    },
    stretch: {
      type: Boolean,
      default: false,
    },

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },

  setup(props) {
    const meta = computed(() => ({
      size: props.size,
      // ---
      isActive: props.active,
      isStretched: props.stretch,
      isDisabled: props.disabled,
    }));

    const styles = useStyles("tab", meta, config, props.upwindConfig);

    return {
      meta,
      styles,
    };
  },
});
</script>
