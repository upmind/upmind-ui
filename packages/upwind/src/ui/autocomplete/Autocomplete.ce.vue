<template>
  <ComboboxRoot
    v-bind="forwarded"
    v-model="modelValue"
    v-model:open="open"
    :class="variants.autocomplete.root"
  >
    <ComboboxAnchor :class="cn(variants.autocomplete.anchor, props.class)">
      <slot name="prepend" />
      <ComboboxInput
        :class="variants.autocomplete.input"
        :placeholder="placeholder"
      />
      <ComboboxTrigger>
        <Icon
          :class="variants.autocomplete.anchorIcon"
          icon="arrow-down"
          :size="props.iconSize"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxContent avoidCollisions :class="variants.autocomplete.content">
      <ComboboxViewport>
        <ComboboxEmpty :class="variants.autocomplete.empty">
          {{ emptyMessage }}
        </ComboboxEmpty>

        <ComboboxItem
          v-for="item in items"
          :key="item.value"
          :value="item.value"
          :class="variants.autocomplete.item"
        >
          <div class="flex items-center gap-1">
            <ComboboxItemIndicator :class="variants.autocomplete.indicator">
              <Icon icon="check" size="3xs" />
            </ComboboxItemIndicator>
            <span>{{ item.label }}</span>
          </div>
          <span class="pl-2 text-sm opacity-50">{{ item.tag }}</span>
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxContent>
  </ComboboxRoot>
</template>

<script lang="ts" setup>
// --- external
import { ref, computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { useStyles } from "../../utils";
import config from "./autocomplete.config";
import { cn } from "../../utils";

// --- components
import Icon from "../icon/Icon.ce.vue";
import {
  ComboboxAnchor,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemIndicator,
  ComboboxRoot,
  ComboboxTrigger,
  ComboboxViewport,
  useForwardPropsEmits,
} from "radix-vue";

// --- types
import type { AutocompleteProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<AutocompleteProps>(), {
  // --- props
  items: () => [],
  modelValue: "",
  defaultValue: "",
  emptyMessage: "No Results",
  placeholder: "Search...",
  // -- variants
  width: "auto",
  dropdownWidth: "auto",
  align: "end",
  side: "bottom",
  // --- styles
  iconSize: "3xs",
  upwindConfig: () => ({ autocomplete: {} }),
  class: "",
  popoverClass: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const forwarded = useForwardPropsEmits(props, emits);

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const meta = computed(() => ({
  size: props.size,
  width: props.width,
  dropdownWidth: props.dropdownWidth,
}));

const open = ref(false);
// ---

const variants = useStyles(
  ["autocomplete"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  autocomplete: {
    root: string;
    input: string;
    anchor: string;
    anchorIcon: string;
    empty: string;
    content: string;
    item: string;
    indicator: string;
  };
}>;
</script>
