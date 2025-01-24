<template>
  <Button
    :id="`${name}-${overrideIndex}`"
    :loading="loading"
    :class="cn(variants.select.trigger)"
    :size="size"
    :aria-expanded="openValue"
    variant="control"
    block
    :tabindex="useInputGroup ? 0 : -1"
  >
    <span v-if="radio" class="flex h-full items-start">
      <RadioGroupItem
        ref="focusRoot"
        :id="manuallySelected ? manuallySelected.value : first(items)?.value"
        :value="manuallySelected ? manuallySelected.value : first(items)?.value"
        :name="props.name"
        :required="props.required"
        :disabled="props.disabled"
        class="mt-1"
      />
    </span>

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
        :class="openValue ? 'rotate-180' : ''"
        icon="arrow-down"
        size="xs"
      />
    </template>
  </Button>
</template>

<script setup lang="ts">
// --- external
import { first } from "lodash-es";
import { computed } from "vue";

// --- internal
import { cn, useStyles } from "../../../utils";
import config from "../selectCards.config";

// --- components
import { RadioGroupItem } from "../../radio-group";
import { Button } from "../../button";
import { Icon } from "../../icon";

// --- types
import type { ComputedRef } from "vue";
import type { ButtonProps } from "../../button/types";

const props = defineProps<{
  name: string;
  overrideIndex: number;
  loading: boolean;
  size: ButtonProps["size"];
  openValue: boolean;
  useInputGroup: boolean;
  class: string;
  items: any[];
  selected: any;
  label: string;
  placeholder: string;
  radio: boolean;
  required: boolean;
  disabled: boolean;
  manuallySelected: any;
  variant: string;
}>();

const meta = computed(() => ({
  variant: props.variant,
  isCollapsible: props.variant === "collapsible",
}));

const variants = useStyles(["select"], meta, config, {}) as ComputedRef<{
  select: {
    trigger: string;
  };
}>;
</script>
