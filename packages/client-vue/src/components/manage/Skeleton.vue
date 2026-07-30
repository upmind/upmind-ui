<template>
  <section class="flex flex-col gap-y-6">
    <div>
      <Skeleton class="h-5 w-20" />
      <Skeleton class="mt-2 h-10 w-full" />
    </div>

    <div>
      <Skeleton class="h-5 w-20" />
      <Skeleton class="mt-2 h-10 w-full" />
      <!-- extra placeholders under the last field, e.g. a helper link -->
      <slot />
    </div>

    <Actions v-if="modal" disabled loading :modal="modal" />
    <Skeleton v-else-if="!noActions" class="h-11 w-full" />
  </section>
</template>

<script setup lang="ts">
import { Skeleton } from "@upmind-automation/upmind-ui";
import Actions from "./Actions.vue";

// -----------------------------------------------------------------------------

const _props = defineProps<{
  modal?: boolean;
  noActions?: boolean;
}>();
</script>
