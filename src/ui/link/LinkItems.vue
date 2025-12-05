<template>
  <span v-if="icon || avatar" :class="styles.link.items">
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
import config from "./link.config";

// --- types
import type { LinkItemsProps } from "./types";
import type { ComputedRef } from "vue";

const props = defineProps<LinkItemsProps>();

const meta = computed(() => {
  return {
    isLoading: props.loading,
    size: props.size,
    color: props.color
  };
});

const styles = useStyles(
  ["link"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  link: {
    items: string;
  };
}>;
</script>
