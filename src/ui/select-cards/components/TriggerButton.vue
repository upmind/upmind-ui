<template>
  <Button
    :loading="loading"
    :class="cn(variants.select.trigger, props.class)"
    :size="size"
    :aria-expanded="open"
    :data-hover="$attrs['data-hover']"
    :data-focus="$attrs['data-focus']"
    variant="control"
    block
    :focusable="focusable"
  >
    <slot name="prepend" />

    <slot v-if="selected" name="item" v-bind="{ item: selected }">
      {{ selected?.label || label }}
    </slot>

    <slot v-if="!selected" name="placeholder" v-bind="{ item: selected }">
      <span class="text-text-faint [.group:hover_&,.group[data-hover=true]_&]:text-text-base [.group:focus-within_&,.group[data-focus=true]_&]:text-text-base transition-colors duration-200">
        <slot name="placeholder">{{ placeholder }}</slot>
      </span>
    </slot>

    <template #append>
      <Icon
        class="text-text-muted group-hover:text-text-base ml-auto pl-4 transition-all duration-200 [&>svg]:size-3 [&>svg]:transition-all [&>svg]:duration-300"
        :class="open ? '[&>svg]:rotate-180' : ''"
        icon="arrow-down"
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
