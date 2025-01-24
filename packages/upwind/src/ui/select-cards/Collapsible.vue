<template>
  <component
    :is="radio && useInputGroup ? RadioGroup : 'div'"
    :disabled="disabled"
    :model-value="modelValue"
    :default-value="defaultValue"
    @update:model-value="onChange"
    :class="variants.select.group"
    tabindex="-1"
  >
    <Collapsible v-model:open="open" :disabled="disabled" tabindex="-1">
      <CollapsibleTrigger
        class="w-full"
        as-child
        @keydown.prevent.arrow-down="keyArrowDown"
        @keydown.prevent.arrow-up="keyArrowUp"
      >
        <TriggerButton
          v-bind="props"
          :name="name"
          :overrideIndex="overrideIndex"
          :open="open"
          :selected="selected"
          :manuallySelected="manuallySelected"
          :meta="meta"
          @keydown.prevent.enter="keyEnter"
        >
          <template #item="{ item }">
            <slot name="item" :item="item" />
          </template>
          <template #placeholder>
            <slot name="placeholder" />
          </template>
        </TriggerButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div
          v-for="(item, index) in items"
          :key="item.id || index"
          tabindex="0"
          :class="variants.select.item"
          @click="onChange(item.value)"
          @keydown.prevent.arrow-down="focusNextItem(index)"
          @keydown.prevent.arrow-up="focusPreviousItem(index)"
          @keydown.prevent.enter="
            onChange(item.value);
            focusRadio();
          "
          :ref="
            (el: HTMLElement) => {
              if (el) itemRefs[index] = el;
            }
          "
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
            v-if="radio"
            :id="`${name}-${overrideIndex + index || index}`"
            :value="item.value"
            :name="name"
            :required="required"
            :disabled="disabled"
            class="sr-only"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  </component>
</template>

<script setup lang="ts">
// --- external
import { ref } from "vue";

// --- internal
import { useSelectCards } from "./utils/useSelectCards";
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import TriggerButton from "./components/TriggerButton.vue";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import { Label } from "../label";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../collapsible";

// --- types
import type { SelectCardsProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<SelectCardsProps>(), {
  variant: "collapsible",
});

const emits = defineEmits(["update:modelValue"]);

const itemRefs = ref<HTMLElement[]>([]);
const focusRoot = ref<HTMLElement | null>(null);

const {
  modelValue,
  open,
  meta,
  onChange,
  selected,
  manuallySelected,
  keyArrowDown,
  keyArrowUp,
  keyEnter,
  focusRadio,
  focusNextItem,
  focusPreviousItem,
} = useSelectCards(props, emits, itemRefs, focusRoot);

const variants = useStyles(
  ["select"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: {
    item: string;
    label: string;
    group: string;
  };
}>;
</script>
