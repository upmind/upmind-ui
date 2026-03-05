<template>
  <ItemContent
    :item="{
      label: props.label,
      badge: badgeProps ?? undefined,
      secondaryLabel: props.appendLabel
    }"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ItemContent } from "../../item-content";
import { isObject } from "lodash-es";
import type { SelectCardsItemProps } from "../types";

const props = defineProps<SelectCardsItemProps>();

const badgeProps = computed(() => {
  if (!props.badge) return null;
  return isObject(props.badge) ? props.badge : { label: props.badge };
});
</script>
