<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger :class="cn(variants.select, props.class)">
      <slot name="item" v-bind="{ item: selected }">
        {{ selected?.label }}
      </slot>
      <div class="flex h-4 items-center justify-center">
        <Icon
          icon="arrow-down"
          size="xs"
          class="text-emphasis-medium hover:text-emphasis-none transition-all duration-300"
          :class="isOpen ? 'rotate-180' : ''"
        />
      </div>
    </PopoverTrigger>
    <PopoverContent class="p-0" align="end" disabled>
      <Command>
        <CommandGroup>
          <CommandItem
            v-for="(item, index) in items"
            :key="index"
            :value="item.value"
            @select="onChange(item.value)"
            :class="variants.item"
          >
            <div class="flex w-10 items-center justify-center pr-1">
              <Icon
                v-if="selected?.value === item.value"
                icon="check"
                size="2xs"
              />
            </div>
            <slot
              v-if="$slots.dropdown"
              name="dropdown"
              v-bind="{ item, index }"
            >
              {{ item.label }}
            </slot>
            <slot v-else name="item" v-bind="{ item, index }">
              {{ item.label }}
            </slot>
          </CommandItem>
        </CommandGroup>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
// ---external
import { computed, ref } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import { Popover, PopoverTrigger, PopoverContent } from "../popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../command";
import { Icon } from "../icon";

// --- utils
import { find } from "lodash-es";

// --- types
import type { SelectCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SelectCardsProps>(), {
  // --- props
  loading: false,
  placeholder: "Select an option",
  required: false,
  // -- variants
  color: "base",
  variant: "control",
  layout: "list",
  ring: true,
  // --- styles
  class: "",
  radioClass: "",
});

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const meta = computed(() => ({
  color: props.color,
  layout: props.layout,
  variant: props.variant,
  ring: props.ring,
}));

const variants = useStyles(
  ["select", "item"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: string;
  item: string;
}>;

const selected = computed(() => find(props.items, { value: modelValue.value }));

const isOpen = ref(false);

function onChange(value: any) {
  modelValue.value = value;
  isOpen.value = false;
}
</script>
