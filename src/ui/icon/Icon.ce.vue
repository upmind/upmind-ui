<template>
  <Icon
    v-if="!meta.hasIconError"
    v-bind="props"
    :icon="props.icon"
    @error="iconError = true"
    :aria-checked="checked"
  />
  <Icon v-else v-bind="props" :icon="props.fallback!" />
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import Icon from "./Icon.vue";
import { type IconProps } from "./types";

const props = defineProps<IconProps>();

const iconError = ref(false);

const meta = computed(() => ({
  hasIconError: props.fallback && iconError.value
}));
</script>
