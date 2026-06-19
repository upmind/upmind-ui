<script lang="ts" setup>
import { computed } from "vue";
import { cn } from "../../utils";
import { omit } from "lodash-es";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  dataAttrs?: Record<`data-${string}`, string | number | boolean>;
}>();

const dataAttrsRest = computed(() => omit(props.dataAttrs, "data-testid"));
</script>

<template>
  <div
    :class="cn(props.class)"
    role="alert"
    :data-testid="props.dataAttrs?.['data-testid'] ?? 'alert'"
    v-bind="dataAttrsRest"
  >
    <slot />
  </div>
</template>
