<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <span :class="cn(variants.indicator, props.class)">
    <slot>
      <Icon
        v-if="meta.hasIcon"
        :icon="icon"
        class="h-full w-full object-cover p-[0.5em]"
      />

      <span v-else-if="meta.hasValue" class="text-center">
        {{ modelValue }}
      </span>
    </slot>
  </span>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import {
  useStyles,
  cn,
  //stylesheet
} from "../../utils";
import config from "./indicator.config";

// --- components
import { Icon } from "../icon";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { IndicatorProps } from ".";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<IndicatorProps>(), {
  // --- props
  icon: undefined,
  //  --- variants
  color: "base",
  shape: "circle",
  size: "full",
  // --- styles
  upmindUIConfig: () => ({ indicator: {} }),
  class: "",
});

const meta = computed(() => ({
  color: props.color,
  shape: props.shape,
  size: props.size,
  // ---
  hasIcon: !isEmpty(props.icon),
  hasValue: !isEmpty(props.modelValue),
}));

const variants = useStyles(
  "indicator",
  meta,
  config,
  props.upmindUIConfig ?? {}
) as ComputedRef<{ indicator: string }>;
</script>
