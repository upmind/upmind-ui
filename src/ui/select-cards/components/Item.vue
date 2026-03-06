<template>
  <ItemContent
    size="md"
    :item="{
      label: props.label,
      secondaryLabel: props.secondaryLabel || props.appendLabel,
      description: props.description,
      secondaryDescription: props.secondaryDescription,
      badge: badgeProps ?? undefined,
      secondaryBadge: props.secondaryBadge,
      action: props.action
    }"
    @action="emits('action', $event)"
  >
    <template v-if="$slots.prepend" #prepend>
      <slot name="prepend" />
    </template>
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

const emits = defineEmits<{
  action: [event: Event];
}>();

const badgeProps = computed(() => {
  if (!props.badge) return undefined;
  if (isString(props.badge)) return [{ label: props.badge }];
  return castArray(props.badge);
});
</script>
