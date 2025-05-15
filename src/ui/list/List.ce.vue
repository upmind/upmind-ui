<template>
  <ul class="flex flex-col gap-y-2 !p-0">
    <span v-for="(item, index) in items" :key="index" class="flex items-center">
      <Icon :icon="icon" size="2xs" class="mr-1 opacity-50" />
      {{ item }}
    </span>
  </ul>
</template>

<script setup lang="ts">
import Icon from "../icon/Icon.ce.vue";

withDefaults(
  defineProps<{
    icon?: string;
    items: string[];
  }>(),
  {
    icon: "chevron-right",
  }
);
</script>
