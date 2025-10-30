<template>
  <Button
    :loading="loading"
    :class="cn(variants.select.trigger, props.class)"
    :size="size"
    :aria-expanded="open"
    :data-hover="props.dataHover"
    :data-focus="props.dataFocus"
    variant="control"
    block
    :focusable="focusable"
  >
    <slot name="prepend" />

    <slot v-if="selected" name="item" v-bind="{ item: selected }">
      {{ selected?.label || label }}
    </slot>

    <slot v-if="!selected" name="placeholder" v-bind="{ item: selected }">
      <span
        class="text-faint text-md transition-colors duration-200 [.group:focus-within_&,.group[data-focus=true]_&]:text-base [.group:hover_&,.group[data-hover=true]_&]:text-base"
      >
        <slot name="placeholder">{{ placeholder }}</slot>
      </span>
    </slot>

    <template #append>
      <Icon
        class="text-muted ml-auto pl-4 transition-all duration-200 group-hover:text-base [&>svg]:size-3 [&>svg]:transition-all [&>svg]:duration-200"
        :class="open ? '[&>svg]:rotate-180' : ''"
        icon="chevron-down"
        size="xs"
      />
    </template>
  </Button>
</template>

<script setup lang="ts">
// --- internal
import { cn, useStyles } from "../../../utils";
import config from "../selectCards.config";

// --- components
import { Button } from "../../button";
import { Icon } from "../../icon";

// --- types
import type { ComputedRef } from "vue";
import type { SelectCardsTriggerProps } from "../types";

const props = defineProps<SelectCardsTriggerProps>();

const variants = useStyles(["select"], {}, config, {}) as ComputedRef<{
  select: {
    trigger: string;
  };
}>;
</script>
