<template>
  <ItemContent
    :item="{
      label: props.label,
      badge: badgeProps ?? undefined,
      secondaryLabel: props.appendLabel
    }"
  >
    <template v-if="$slots.secondary" #secondary>
      <slot name="secondary" />
    </template>
    <template v-if="$slots.append" #append>
      <slot name="append" />
    </template>
  </ItemContent>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ItemContent } from "../../item-content";
import { castArray, isObject, isString } from "lodash-es";
import type { SelectCardsItemProps } from "../types";

const props = defineProps<SelectCardsItemProps>();

const badgeProps = computed(() => {
  if (!props.badge) return undefined;
  if (isString(props.badge)) return [{ label: props.badge }];
  return castArray(props.badge);
});
</script>
