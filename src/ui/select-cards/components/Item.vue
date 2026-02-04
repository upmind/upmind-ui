<template>
  <li
    class="text-md flex w-full list-none items-center justify-between font-medium"
  >
    <div class="flex items-center gap-2">
      {{ label }}
      <Badge v-if="badge" v-bind="badgeProps" size="sm" />
    </div>
    <span>{{ appendLabel }}</span>
  </li>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { Badge } from "../../badge";
import { isObject } from "lodash-es";
import type { SelectCardsItemProps } from "../types";

const props = defineProps<SelectCardsItemProps>();

const badgeProps = computed(() => {
  if (!props.badge) return null;
  return isObject(props.badge) ? props.badge : { label: props.badge };
});
</script>
