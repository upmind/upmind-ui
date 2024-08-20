<script setup lang="ts">
import { AvatarImage, type AvatarImageProps } from "radix-vue";

const props = defineProps<AvatarImageProps>();
</script>

<template>
  <avatar-image v-bind="props" class="h-full w-full object-cover" />
</template>
