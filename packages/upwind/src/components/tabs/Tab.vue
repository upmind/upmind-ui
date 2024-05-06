<template>
  <button
    :class="styles.tab.root"
    :disabled="meta.isDisabled"
    :aria-controls="id"
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
import UpwIcon from "../icon/Icon.vue";

// --- utils
import { useStyles } from "../../utils";

// --- types
import type { PropType } from "vue";
import type { TabProps } from "./types";

// ----------------------------------------------

export default defineComponent({
  name: "UpwButton",
  components: {
    UpwIcon,
  },

  props: {
    id: {
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

    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: {
      type: Object,
      default: null,
    },
  },

  setup(props) {
    const meta = computed(() => ({
      size: props.size,
      // ---
      isActive: props.active,
    }));

    const styles = useStyles("tab", meta, config, props.upwindConfig);

    return {
      meta,
      styles,
    };
  },
});
</script>
