<template>
  <component
    :is="collapsible ? Collapsible : Popover"
    v-model:open="open"
    :disabled="disabled"
    class="w-full"
  >
    <RadioGroup
      :disabled="disabled"
      :model-value="modelValue"
      :default-value="defaultValue"
      @update:model-value="onChange"
      :class="variants.select.group"
    >
      <component
        :is="collapsible ? CollapsibleTrigger : PopoverTrigger"
        as-child
      >
        <Button
          :loading="loading"
          :class="cn(variants.select.trigger, props.class)"
          :size="size"
          :aria-expanded="open"
          :color="color"
          :variant="variant"
          block
        >
          <span v-if="radio" class="flex h-full items-start">
            <RadioGroupItem
              :id="
                manuallySelected ? manuallySelected.value : first(items).value
              "
              :value="
                manuallySelected ? manuallySelected.value : first(items).value
              "
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
              class="ml-auto opacity-75 transition-all duration-200 group-aria-expanded:rotate-180"
              icon="arrow-down"
              size="xs"
            />
          </template>
        </Button>
      </component>

      <component
        :is="collapsible ? CollapsibleContent : PopoverContent"
        :class="cn(variants.select.content, props.contentClass)"
        :onOpenAutoFocus="handleOpenAutoFocus"
      >
        <div
          v-for="(item, index) in items"
          :key="item.id || index"
          :class="variants.select.item"
          :tabindex="(overrideIndex || index) + 1"
          :ref="
            el => {
              if (el) itemRefs[index] = el as HTMLElement;
            }
          "
          @keydown.enter="onChange(item.value)"
        >
          <Label
            :for="`${name}-${overrideIndex + index || index}`"
            :class="cn(variants.select.label)"
          >
            <slot name="dropdown-item" v-bind="{ item, index }">
              {{ item.label }}
            </slot>
          </Label>

          <!-- Required for the selector to work -->
          <RadioGroupItem
            :id="`${name}-${overrideIndex + index || index}`"
            :value="item.value"
            :name="name"
            :required="required"
            :disabled="disabled"
            class="sr-only"
          />
        </div>
      </component>
    </RadioGroup>
  </component>
</template>

<script lang="ts" setup>
// ---external
import { ref, computed } from "vue";
import { useVModel } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import { Icon } from "../icon";
import { Button } from "../button";
import { Label } from "../label";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../collapsible";

// --- components
import { Popover, PopoverTrigger, PopoverContent } from "../popover";

// --- utils
import { find, first, findIndex } from "lodash-es";
import { useFocus } from "@vueuse/core";

// --- types
import type { SelectCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SelectCardsProps>(), {
  // --- props
  loading: false,
  placeholder: "Select an option",
  required: false,
  overrideIndex: 0,
  // -- variants
  color: "base",
  variant: "control",
  width: "full",
  separate: false,
  // --- styles
  class: "",
  contentClass: "",
});

const emits = defineEmits(["update:modelValue"]);
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});

const open = ref(false);

const meta = computed(() => ({
  color: props.color,
  collapsible: props.collapsible,
  separate: props.separate,
}));

const variants = useStyles(
  ["select"],
  meta,
  config,
  props.upmindUIConfig ?? {}
) as ComputedRef<{
  select: {
    root: string;
    trigger: string;
    items: string;
    item: string;
    input: string;
    label: string;
    group: string;
    content: string;
  };
}>;

const selected = computed(() => find(props.items, { value: modelValue.value }));
const manuallySelected = computed(() => {
  return selected.value && selected.value !== first(props.items)
    ? selected.value
    : undefined;
});

// allow for toggle of selected item
function onChange(value: any) {
  if (!props.required && modelValue.value == value)
    modelValue.value = undefined;
  else modelValue.value = value;

  open.value = false;
}

if (props.required && !modelValue.value) {
  emits("update:modelValue", first(props.items)?.value);
}

const itemRefs = ref<HTMLElement[]>([]);

const handleOpenAutoFocus = (event: Event) => {
  event.preventDefault();
  const selectedItem = findIndex(
    props.items,
    item => item.value === modelValue.value
  );
  const index = selectedItem >= 0 ? selectedItem : 0;
  if (itemRefs.value[index]) {
    const { focused } = useFocus(itemRefs.value[index]);
    focused.value = true;
  }
};
</script>
