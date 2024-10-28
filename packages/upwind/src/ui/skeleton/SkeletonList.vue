<template>
  <div
    class="flex w-full animate-pulse flex-col space-y-4 divide-y divide-base-200 rounded border p-4 md:p-6"
    role="status"
  >
    <div
      v-for="row in props.rows"
      :key="`skeleton-row-${row}`"
      class="flex items-center justify-between pt-4 first:pt-0"
    >
      <div>
        <div class="mb-2.5 h-2.5 w-24 rounded-full bg-base-300"></div>
        <div class="h-2 w-32 rounded-full bg-base-200"></div>
      </div>
      <div class="h-2.5 w-12 rounded-full bg-base-300"></div>
    </div>

    <span class="sr-only">Loading List...</span>
  </div>
</template>

<script lang="ts" setup>
// ----------------------------------------------
const props = withDefaults(
  defineProps<{
    rows: number;
  }>(),
  {
    rows: 5,
  }
);
</script>
