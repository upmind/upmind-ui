<template>
  <link rel="stylesheet" :href="stylesheet" />

  <span :class="styles.indicator.root">
    <slot>
      <u-icon
        v-if="meta.hasIcon"
        :icon="icon"
        :class="styles.indicator.icon"
        :upwindConfig="{ icon: config.indicator.icon }"
      />

      <span v-else-if="meta.hasValue" :class="styles.indicator.value">
        {{ modelValue }}
      </span>
    </slot>
  </span>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";

// --- components
import UIcon from "../icon/Icon.ce.vue";

// --- internal

import { useStyles, stylesheet } from "../../utils";
import config from "./indicator.config";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { PropType } from "vue";
import type { IndicatorConfig } from "./types";
import type { IconProps } from "../../components/icon/types";
// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UwIndicator",
  inheritAttrs: false,
  components: {
    UIcon,
  },
  props: {
    color: { type: String as PropType<IndicatorConfig["color"]> },

    size: {
      type: String as PropType<IndicatorConfig["size"]>,
      default: "full",
    },
    icon: {
      type: [String, Object] as PropType<IconProps["icon"]>,
    },
    modelValue: { type: String },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },

  setup(props) {
    const styles = useStyles(
      "indicator",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      config,
      styles,
      stylesheet,
    };
  },

  computed: {
    meta() {
      return {
        hasIcon: !isEmpty(this.icon),
        hasValue: !isEmpty(this.modelValue) || true,
      };
    },
  },
});
</script>
