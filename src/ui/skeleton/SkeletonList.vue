<template>
  <div
    class="divide-base-muted flex w-full animate-pulse flex-col space-y-4 divide-y rounded border p-4 md:p-6"
    role="status"
  >
    <div
      v-for="row in props.rows"
      :key="`skeleton-row-${row}`"
      class="flex items-center justify-between pt-4 first:pt-0"
    >
      <div>
        <div class="bg-base-muted-active mb-2.5 h-2.5 w-24 rounded-full"></div>
        <div class="bg-base-muted h-2 w-32 rounded-full"></div>
      </div>
      <div class="bg-base-muted-active h-2.5 w-12 rounded-full"></div>
    </div>

    <span class="sr-only">Loading List...</span>
  </div>
</template>

<script lang="ts" setup>
// ----------------------------------------------
const props = withDefaults(
  defineProps<{
    rows?: number;
  }>(),
  {
    rows: 5,
  }
);
</script>
