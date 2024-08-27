<template>
  <tooltip-provider :delay-duration="delayDuration">
    <tooltip :open="open">
      <tooltip-trigger><slot /></tooltip-trigger>
      <tooltip-content
        :side="direction"
        :sideOffset="sideOffset"
        :class="styles.tooltip.content"
      >
        <slot name="content">
          <div>{{ label }}</div>
        </slot>
        <tooltip-arrow fill="currentColor" :class="styles.tooltip.arrow" />
      </tooltip-content>
    </tooltip>
  </tooltip-provider>
</template>

<script lang="ts">
// --- external

import { defineComponent, toRefs } from "vue";
import { TooltipArrow } from "radix-vue";

// --- components
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from ".";

// --- local
import config from "./tooltip.config";
import { useStyles } from "../../utils";

// --- utils

// --- types
import type { TooltipConfig, TooltipProps } from "./types";
import type { PropType } from "vue";

// ----------------------------------------------------------------------------
export default defineComponent({
  name: "UwTooltip",
  components: {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
    TooltipArrow,
  },
  props: {
    label: { type: String },
    open: { type: Boolean },
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
    upwindConfig: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const styles = useStyles(
      "tooltip",
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
