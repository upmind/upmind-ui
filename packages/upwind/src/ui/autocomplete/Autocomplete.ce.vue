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

    <ComboboxContent
      v-bind="forwarded"
      avoidCollisions
      :class="variants.autocomplete.content"
    >
      <ComboboxViewport>
        <ComboboxEmpty :class="variants.autocomplete.empty">
          {{ emptyMessage }}
        </ComboboxEmpty>

        <ComboboxItem
          v-for="item in items"
          v-bind="forwarded"
          :key="item.value"
          :value="item.value"
          :class="variants.autocomplete.item"
        >
          <span class="flex items-center gap-2">
            <ComboboxItemIndicator :class="variants.autocomplete.indicator">
              <Icon icon="check" size="3xs" />
            </ComboboxItemIndicator>
            <Avatar
              v-if="item.avatar"
              v-bind="item.avatar"
              :size="props.iconSize"
            />
            <span>{{ item.label }}</span>
          </span>
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
import { omit } from "lodash-es";

// --- internal
import { useStyles } from "../../utils";
import config from "./autocomplete.config";
import { cn } from "../../utils";

// --- components
import Icon from "../icon/Icon.ce.vue";
import Avatar from "../avatar/Avatar.ce.vue";
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
  iconSize: "2xs",
  upwindConfig: () => ({ autocomplete: {} }),
  class: "",
  popoverClass: "",
});

const emits = defineEmits<{
  (e: "update:modelValue", payload: string | number): void;
}>();

const forwarded = computed(() =>
  omit(props, ["class", "upwindConfig", "popoverClass"])
);

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
