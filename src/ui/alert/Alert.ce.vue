<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <Alert :class="cn(styles.alert, props.class)">
    <div class="flex items-center justify-start gap-2">
      <Icon v-if="icon" :icon="icon" size="2xs" />
      <div class="flex w-full items-center justify-between gap-2">
        <AlertTitle
          class="leading-none font-medium tracking-tight"
          :class="description || $slots['description'] ? 'my-1' : ''"
        >
          <slot name="title">
            <span>{{ title }}</span>
          </slot>
        </AlertTitle>

        <slot name="action" />
      </div>
    </div>

    <AlertDescription class="text-sm opacity-75 [&_p]:leading-relaxed">
      <slot name="description">
        {{ description }}
      </slot>
    </AlertDescription>

    <slot></slot>
  </Alert>
</template>

<script lang="ts" setup>
// --- external
import { computed } from "vue";

// --- internal
import config from "./alert.config";
import {
  useStyles,
  cn
  //stylesheet
} from "../../utils";

// --- components
import Alert from "./Alert.vue";
import AlertTitle from "./AlertTitle.vue";
import AlertDescription from "./AlertDescription.vue";
import { Icon } from "../icon";

// --- types
import type { ComputedRef } from "vue";
import type { AlertProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<AlertProps>(), {
  // --- styles
  variant: "outline-solid",
  color: "base",
  // --- styles
  uiConfig: () => ({ alert: [] }),
  class: ""
});

defineSlots<{
  /** Append additional content */
  default(props: {}): any;
  /** Provide a title */
  title(props: {}): any;
  /** Provide an action */
  action(props: {}): any;
  /** Provide a description */
  description(props: {}): any;
}>();

const meta = computed(() => ({
  variant: props.variant,
  color: props.color
}));

const styles = useStyles(
  "alert",
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{ alert: string }>;
</script>
