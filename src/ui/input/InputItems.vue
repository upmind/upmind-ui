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
import { Avatar } from "../avatar";
import { Icon } from "../icon";
import config from "./input.config";
import { useStyles } from "../../utils";
import type { InputItemsProps } from "./types";

defineProps<InputItemsProps>();

const styles = useStyles(["input"], {}, config, {});
</script>
