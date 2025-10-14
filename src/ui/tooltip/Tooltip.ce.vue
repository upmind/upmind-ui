<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->
  <TooltipProvider v-bind="forwarded">
    <Tooltip v-bind="forwarded">
      <TooltipTrigger
        :color="color"
        tabindex="-1"
        :class="styles.tooltip.trigger"
        ><slot
      /></TooltipTrigger>
      <TooltipContent
        v-bind="forwarded"
        :class="cn(styles.tooltip.content, props.class)"
      >
        <slot name="content">{{ props.label }}</slot>
        <TooltipArrow fill="currentColor" :class="styles.tooltip.arrow" />
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";
import { useForwardPropsEmits, TooltipArrow } from "radix-vue";

// --- internal
import {
  cn,
  useStyles
  //stylesheet
} from "../../utils";
import config from "./tooltip.config";

// --- components
import Tooltip from "./Tooltip.vue";
import TooltipContent from "./TooltipContent.vue";
import TooltipProvider from "./TooltipProvider.vue";
import TooltipTrigger from "./TooltipTrigger.vue";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { TooltipProps } from "./types";
import type { TooltipContentEmits, TooltipRootEmits } from "radix-vue";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TooltipProps>(), {
  delayDuration: 150,
  // --- styles
  color: "neutral",
  // --- styles
  class: "",
  to: "body"
});

const emits = defineEmits<TooltipContentEmits & TooltipRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  color: props.color,
  // ---
  isOpen: !!props.open,
  hasLabel: !isEmpty(props.label)
}));

const styles = useStyles(["tooltip"], meta, config, {
  tooltip: props.uiConfig
}) as ComputedRef<{
  tooltip: {
    content: string;
    arrow: string;
    trigger: string;
  };
}>;
</script>
