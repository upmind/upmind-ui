<template>
  <span v-if="icon || avatar" :class="styles.button.items">
    <Icon
      v-if="icon"
      :icon="icon"
      size="auto"
      :aria-checked="checked"
      aria-hidden="true"
    />
    <Avatar v-if="avatar" v-bind="avatar" size="xs" />
  </span>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
// --- components
import { Avatar } from "../avatar";
import { Icon } from "../icon";
// --- internal
import config from "./button.config";
import { useStyles } from "../../utils";
// --- types
import type { ButtonItemsProps } from "./types";

const props = defineProps<ButtonItemsProps>();

const meta = computed(() => {
  return {
    isLoading: props.loading,
    size: props.size,
    variant: props.variant
  };
});

const styles = useStyles(["button"], meta, config, {});
</script>
