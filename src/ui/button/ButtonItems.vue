<template>
  <span v-if="icon || avatar" :class="styles.button.items">
    <Icon
      v-if="icon"
      :icon="icon"
      size="auto"
      :aria-checked="checked"
      aria-hidden="true"
    />
    <Avatar v-if="avatar" :avatar="avatar" size="xs" />
  </span>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import { Icon } from "../icon";
import { Avatar } from "../avatar";

// --- internal
import { useStyles } from "../../utils";
import config from "./button.config";

// --- types
import type { ButtonItemsProps } from "./types";
import type { ComputedRef } from "vue";

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
