<script lang="ts">
// --- components
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from ".";

// --- external
import { TooltipArrow } from "radix-vue";
import { toRefs } from "vue";

// --- local
import config from "./tooltip.cva";

// --- utils
import { useStyles } from "../../../utils";

// --- types
import type { TooltipConfig, TooltipProps } from "./types";
import type { PropType } from "vue";

export default {
  components: {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
    TooltipArrow,
  },

  props: {
    label: String,
    open: {
      type: Boolean,
      default: undefined,
    },
    direction: {
      type: String as PropType<TooltipProps["direction"]>,
      default: "bottom",
    },
    color: String as () => TooltipConfig["color"],
    delayDuration: {
      type: Number,
      default: 300,
    },
    sideOffset: {
      type: Number,
      default: 7,
    },
    upwindConfig: {
      type: Object,
      default: () => ({}),
    },
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
};
</script>

<template>
  <tooltip-provider :delay-duration="delayDuration">
    <tooltip :open="open">
      <tooltip-trigger><slot /></tooltip-trigger>
      <tooltip-content
        :side="direction"
        :sideOffset="sideOffset"
        :class="styles.tooltip.content"
      >
        <div v-if="label">{{ label }}</div>
        <slot v-else name="content" />
        <tooltip-arrow fill="currentColor" :class="styles.tooltip.arrow" />
      </tooltip-content>
    </tooltip>
  </tooltip-provider>
</template>
