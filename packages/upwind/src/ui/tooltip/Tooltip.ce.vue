<template>
  <tooltip-root
    :open="open"
    :default-open="open"
    :delay-duration="delayDuration"
  >
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
</template>

<script lang="ts">
// --- external
import { defineComponent, toRefs } from "vue";
import {
  TooltipRoot,
  TooltipContent,
  TooltipTrigger,
  TooltipArrow,
} from "radix-vue";

// --- local
import config from "./tooltip.config";
import { useStyles } from "../../utils";

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

<style src="@/assets/main.css" />
