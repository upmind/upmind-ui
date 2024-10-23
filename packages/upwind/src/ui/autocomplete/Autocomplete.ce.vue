<template>
  <ComboboxRoot v-model:open="open" :class="variants.autocomplete.root">
    <ComboboxAnchor :class="variants.autocomplete.anchor">
      <ComboboxInput
        v-model="modelValue"
        :class="variants.autocomplete.input"
        :placeholder="placeholder"
      />
      <ComboboxTrigger>
        <Icon
          :class="variants.autocomplete.anchorIcon"
          icon="arrow-down"
          size="xs"
        />
      </ComboboxTrigger>
    </ComboboxAnchor>

    <ComboboxContent
      :align="align"
      :side="side"
      avoidCollisions
      :class="variants.autocomplete.content"
    >
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
          <ComboboxItemIndicator :class="variants.autocomplete.indicator">
            <Icon icon="check" size="2xs" />
          </ComboboxItemIndicator>
          {{ item.label }}
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
} from "radix-vue";

// --- types
import type { ComboboxProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<ComboboxProps>(), {
  // --- props
  items: () => [],
  modelValue: "",
  defaultValue: "",
  emptyMessage: "No Results",
  placeholder: "Search...",
  // -- variants
  width: "auto",
  align: "end",
  side: "bottom",
  // --- styles
  upwindConfig: () => ({ combobox: {} }),
  class: "",
  popoverClass: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const meta = computed(() => ({}));

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
