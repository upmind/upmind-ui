<template>
  <del v-if="discounted && !free" class="text-sm italic leading-5 opacity-30">{{
    regularPrice
  }}</del>
</template>

<script lang="ts" setup>
defineProps<{
  discounted?: boolean;
  regularPrice?: string;
  free?: boolean;
}>();
</script>
