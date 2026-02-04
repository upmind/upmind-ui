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
import { Avatar } from "../avatar";
import { Icon } from "../icon";
// --- internal
import config from "./input.config";
import { useStyles } from "../../utils";
// --- types
import type { InputItemsProps } from "./types";

defineProps<InputItemsProps>();

const styles = useStyles(["input"], {}, config, {});
</script>
