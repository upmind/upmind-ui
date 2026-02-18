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
import { computed } from "vue";
import { Avatar } from "../avatar";
import { Icon } from "../icon";
import config from "./link.config";
import { useStyles } from "../../utils";
import type { LinkItemsProps } from "./types";

const props = defineProps<LinkItemsProps>();

const meta = computed(() => {
  return {
    isLoading: props.loading,
    size: props.size,
    color: props.color
  };
});

const styles = useStyles(["link"], meta, config, props.uiConfig ?? {});
</script>
