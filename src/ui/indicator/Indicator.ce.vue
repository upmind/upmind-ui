<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <span :class="cn(styles.indicator, props.class)">
    <slot>
      <Icon
        v-if="meta.hasIcon"
        :icon="props.icon!"
        class="h-full w-full object-cover p-[0.5em]"
      />

      <span v-else-if="meta.hasValue" class="text-center">
        {{ modelValue }}
      </span>
    </slot>
  </span>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { Icon } from "../icon";
import config from "./indicator.config";
import {
  useStyles,
  cn
  //stylesheet
} from "../../utils";
import { isEmpty } from "lodash-es";
import type { IndicatorProps } from ".";
// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<IndicatorProps>(), {
  // --- props
  icon: undefined,
  //  --- styles
  color: "base",
  shape: "circle",
  size: "full",
  // --- styles
  uiConfig: () => ({ indicator: [] }),
  class: ""
});

const meta = computed(() => ({
  color: props.color,
  shape: props.shape,
  size: props.size,
  // ---
  hasIcon: !isEmpty(props.icon),
  hasValue: !isEmpty(props.modelValue)
}));

const styles = useStyles("indicator", meta, config, props.uiConfig ?? {});
</script>
