<template>
  <span
    v-if="discounted"
    class="text-sm italic leading-5 line-through opacity-30"
    >{{ regularPrice }}</span
  >
</template>

<script lang="ts" setup>
defineProps<{
  discounted?: boolean;
  regularPrice?: string;
}>();
</script>
