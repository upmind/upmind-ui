<template>
  <Icon v-if="icon" :icon="icon" size="2xs" />
  <Avatar v-if="avatar" :icon="avatar" size="2xs" />
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

const props = defineProps<InputItemsProps>();

const styles = useStyles(["input"], {}, config, {}) as ComputedRef<{
  input: {
    items: string;
  };
}>;
</script>
