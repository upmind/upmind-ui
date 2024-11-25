<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <Alert :class="cn(variants.alert, props.class)">
    <div class="flex items-center justify-start gap-2">
      <Icon v-if="icon" :icon="icon" :size="iconSize" />
      <div class="flex w-full items-center justify-between gap-2">
        <AlertTitle
          class="font-medium leading-none tracking-tight"
          :class="description || $slots['description'] ? 'mb-1' : ''"
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
  cn,
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
  // --- props
  title: "",
  description: "",
  action: "",
  iconSize: "2xs",
  // --- variants
  variant: "outline",
  color: "base",
  // --- styles
  upwindConfig: () => ({ alert: {} }),
  class: "",
});

const meta = computed(() => ({
  variant: props.variant,
  color: props.color,
  border: props.border,
}));

const variants = useStyles(
  "alert",
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ alert: string }>;
</script>
