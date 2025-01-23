<template>
  <Icon
    v-bind="props"
    :icon="meta.fallbackIcon || props.icon"
    @error="iconError = true"
  />
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import Icon from "./Icon.vue";
import { type IconProps } from "./types";

const props = defineProps<IconProps>();

const iconError = ref(false);

const meta = computed(() => ({
  fallbackIcon:
    props.fallbackIcon && iconError.value ? props.fallbackIcon : null,
}));
</script>
