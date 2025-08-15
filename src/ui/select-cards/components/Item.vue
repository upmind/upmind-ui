<template>
  <li class="flex w-full list-none justify-between text-md font-medium">
    <span class="flex items-center gap-2">
      {{ label }}
      <Badge v-if="badge" v-bind="badgeProps" size="sm" />
    </span>
    <span>{{ appendLabel }}</span>
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { isObject } from "lodash-es";
import type { SelectCardsItemProps } from "../types";
import { Badge } from "../../badge";

const props = defineProps<SelectCardsItemProps>();

const badgeProps = computed(() => {
  if (!props.badge) return null;
  return isObject(props.badge) ? props.badge : { label: props.badge };
});
</script>
