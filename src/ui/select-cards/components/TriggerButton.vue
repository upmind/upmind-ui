<template>
  <Button
    :loading="loading"
    :class="cn(variants.select.trigger)"
    :size="size"
    :aria-expanded="open"
    variant="control"
    block
    :focusable="focusable"
  >
    <slot name="prepend" />

    <slot v-if="selected" name="item" v-bind="{ item: selected }">
      {{ selected?.label || label }}
    </slot>

    <slot v-if="!selected" name="placeholder" v-bind="{ item: selected }">
      <span class="opacity-50">
        <slot name="placeholder">{{ placeholder }}</slot>
      </span>
    </slot>

    <template #append>
      <Icon
        class="ml-auto opacity-75 transition-all duration-200"
        :class="open ? 'rotate-180' : ''"
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

defineProps<SelectCardsTriggerProps>();

const variants = useStyles(["select"], {}, config, {}) as ComputedRef<{
  select: {
    trigger: string;
  };
}>;
</script>
