<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->
  <TooltipProvider v-if="active" v-bind="forwarded">
    <Tooltip v-bind="forwarded">
      <TooltipTrigger tabindex="-1" :class="styles.tooltip.trigger"
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

  <template v-else>
    <slot />
  </template>
</template>

<script lang="ts" setup>
// --- external
import { useForwardPropsEmits, TooltipArrow } from "radix-vue";
import { computed } from "vue";
// --- internal
import config from "./tooltip.config";
// --- components
import Tooltip from "./Tooltip.vue";
import TooltipContent from "./TooltipContent.vue";
import TooltipProvider from "./TooltipProvider.vue";
import TooltipTrigger from "./TooltipTrigger.vue";
import {
  cn,
  useStyles
  //stylesheet
} from "../../utils";
// --- utils
import { isEmpty } from "lodash-es";
// --- types
import type { TooltipProps } from "./types";
import type { TooltipContentEmits, TooltipRootEmits } from "radix-vue";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<TooltipProps>(), {
  active: true,
  delayDuration: 150,
  disableClosingTrigger: true,
  // --- styles
  color: "neutral",
  // --- styles
  class: "",
  to: "body"
});

const emits = defineEmits<TooltipContentEmits & TooltipRootEmits>();
const forwarded = useForwardPropsEmits(props, emits);

const meta = computed(() => ({
  isOpen: !!props.open,
  hasLabel: !isEmpty(props.label)
}));

const styles = useStyles(["tooltip"], meta, config, props.uiConfig ?? {});
</script>
