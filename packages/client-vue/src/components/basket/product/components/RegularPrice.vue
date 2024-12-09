<template>
  <del
    v-if="discounted"
    class="text-emphasis-medium text-sm italic leading-5"
    >{{ regularPrice }}</del
  >
</template>

<script lang="ts" setup>
defineProps<{
  discounted?: boolean;
  regularPrice?: string;
  free?: boolean;
}>();
</script>
