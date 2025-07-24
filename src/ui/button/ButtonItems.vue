<template>
  <span v-if="icon || avatar" :class="styles.button.items">
    <Icon v-if="icon" :icon="icon" size="2xs" />
    <Avatar v-if="avatar" :icon="avatar" size="2xs" />
  </span>
</template>

<script setup lang="ts">
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

const styles = useStyles(["button"], {}, config, {}) as ComputedRef<{
  button: {
    items: string;
  };
}>;
</script>
