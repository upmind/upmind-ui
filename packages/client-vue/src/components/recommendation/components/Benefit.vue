<template>
  <div class="text-base-foreground flex items-start gap-2 leading-tight">
    <span class="text-secondary flex-shrink-0">
      <Icon
        :icon="benefit.icon && !iconError ? benefit.icon : 'dot'"
        class="size-5"
        @error="iconError = true"
      />
    </span>

    <p class="m-0">{{ benefit.label }}</p>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { Benefit } from "@upmind-automation/headless";
import { Icon } from "@upmind-automation/upwind";

const iconError = ref(false);

defineProps<{
  benefit: Benefit;
}>();
</script>
