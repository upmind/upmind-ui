<template>
  <Icon v-if="meta.showFallback" v-bind="props" :icon="fallbackIcon" />
  <Icon v-if="!meta.showFallback" v-bind="props" @error="iconError = true" />
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import Icon from "./Icon.vue";
import { type IconProps } from "./types";

const props = defineProps<IconProps>();

const iconError = ref(false);

const meta = computed(() => ({
  showFallback: iconError.value && props.fallbackIcon,
}));
</script>
