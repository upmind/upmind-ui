<template>
  <span v-if="icon || avatar" :class="styles.button.items">
    <Icon v-if="icon" :icon="icon" size="auto" :aria-checked="checked" />
    <Avatar v-if="avatar" :icon="avatar" size="2xs" />
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
    size: props.size,
    variant: props.variant
  };
});

const styles = useStyles(["button"], meta, config, {}) as ComputedRef<{
  button: {
    items: string;
  };
}>;
</script>
