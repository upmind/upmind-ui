<template>
  <Icon v-if="icon" :icon="icon" size="2xs" :class="styles.input.items" />
  <Avatar
    v-if="avatar"
    :avatar="avatar"
    size="xs"
    :class="styles.input.items"
  />
</template>

<script setup lang="ts">
// --- components
import { Icon } from "../icon";
import { Avatar } from "../avatar";

// --- internal
import { useStyles } from "../../utils";
import config from "./input.config";

// --- types
import type { InputItemsProps } from "./types";
import type { ComputedRef } from "vue";

defineProps<InputItemsProps>();

const styles = useStyles(["input"], {}, config, {});
</script>
