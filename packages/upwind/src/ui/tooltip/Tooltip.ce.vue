<template>
  <link rel="stylesheet" :href="stylesheet" />

  <tooltip-provider :delay-duration="delayDuration">
    <tooltip-root :open="open">
      <tooltip-trigger><slot /></tooltip-trigger>
      <tooltip-content
        :side="direction"
        :side-offset="sideOffset"
        :class="styles.tooltip.content"
      >
        <slot name="content">
          <div>{{ label }}</div>
        </slot>
        <tooltip-arrow fill="currentColor" :class="styles.tooltip.arrow" />
      </tooltip-content>
    </tooltip-root>
  </tooltip-provider>
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";
import {
  TooltipRoot,
  TooltipContent,
  TooltipTrigger,
  TooltipArrow,
  TooltipProvider,
} from "radix-vue";

// --- internal

import { useStyles, stylesheet } from "../../utils";
import config from "./tooltip.config";

// --- types
import type { TooltipConfig, TooltipProps } from "./types";
import type { PropType } from "vue";

export default defineComponent({
  name: "UwTooltip",
  components: {
    TooltipRoot,
    TooltipContent,
    TooltipTrigger,
    TooltipArrow,
    TooltipProvider,
  },
  props: {
    label: { type: String },
    // Tooltip doesn't open correctly if not defined, radix-vue think we are handling the state ourselves
    open: { type: Boolean, default: undefined },
    direction: {
      type: String as PropType<TooltipProps["direction"]>,
      default: "bottom",
    },
    color: String as PropType<TooltipConfig["color"]>,
    delayDuration: {
      type: Number,
      default: 300,
    },
    sideOffset: {
      type: Number,
      default: 7,
    },
    // --- Provide a way to add custom styles for a specific instance of the component
    upwindConfig: { type: [Object, Array], default: () => ({}) },
  },
  setup(props) {
    const styles = useStyles(
      "tooltip",
      toRefs(props),
      config,
      props.upwindConfig
    );

    return {
      stylesheet,
      styles,
    };
  },
});
</script>
