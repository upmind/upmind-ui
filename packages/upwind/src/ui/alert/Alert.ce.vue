<template>
  <!--<link rel="stylesheet" :href="stylesheet" />-->

  <Alert :class="cn(variants.alert, props.class)">
    <Icon v-if="icon" :icon="icon" size="xxs" />
    <AlertTitle
      class="mb-1 flex items-center gap-2 font-medium leading-none tracking-tight"
    >
      <span>{{ title }}</span>
    </AlertTitle>
    <AlertDescription class="text-sm opacity-75 [&_p]:leading-relaxed">
      {{ description }}
    </AlertDescription>
  </Alert>
</template>

<script setup lang="ts">
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
}));

const variants = useStyles(
  "alert",
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{ alert: string }>;
</script>
