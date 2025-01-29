<template>
  <component
    :is="radio && useInputGroup ? RadioGroup : 'div'"
    :disabled="disabled"
    :model-value="modelValue"
    :default-value="defaultValue"
    @update:model-value="onChange"
    :class="styles.select.group"
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
          :class="props.class"
          :focusable?="props.focusable"
          :label="props.label"
          :loading="props.loading"
          :manuallySelected="manuallySelected"
          :name="name"
          :open="open"
          :overrideIndex="overrideIndex"
          :placeholder="props.placeholder"
          :selected="selected"
          :size="props.size"
          :useInputGroup="props.useInputGroup"
          :variant="props.variant"
          @blur="handleBlur"
          @focus="handleFocus"
          @keydown.prevent.enter="keyEnter"
        >
          <template #prepend>
            <span v-if="radio" class="flex h-full items-start">
              <RadioGroupItem
                ref="focusRoot"
                :id="
                  manuallySelected
                    ? manuallySelected.value
                    : first(items)?.value
                "
                :value="
                  manuallySelected
                    ? manuallySelected.value
                    : first(items)?.value
                "
                :required="props.required"
                :disabled="props.disabled"
                class="mt-1"
                @focus="handleFocus"
                @blur="handleBlur"
              />
            </span>
          </template>
          <template #item="{ item }">
            <slot name="item" :item="item"></slot>
          </template>
          <template #placeholder>
            <slot name="placeholder"></slot>
          </template>
        </TriggerButton>
      </CollapsibleTrigger>
      <CollapsibleContent
        :onOpenAutoFocus="handleOpenAutoFocus"
        :class="styles.select.content"
      >
        <div
          v-for="(item, index) in items"
          :key="item.id || index"
          tabindex="0"
          :class="styles.select.item"
          @click.prevent="onChange(item.value)"
          @keydown.prevent.arrow-down="focusNextItem(index)"
          @keydown.prevent.arrow-up="focusPreviousItem(index)"
          @keydown.prevent.enter="
            onChange(item.value);
            focusRadio();
          "
          @keydown.prevent.escape="focusRadio"
          :ref="
            (el: HTMLElement) => {
              if (el) itemRefs[index] = el;
            }
          "
        >
          <Label
            :for="`${name}-${overrideIndex + index || index}`"
            :class="cn(styles.select.label)"
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
import { first } from "lodash-es";

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
const focusButton = ref<HTMLElement | null>(null);
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
  handleFocus,
  handleBlur,
} = useSelectCards(
  props,
  emits,
  itemRefs,
  props.radio ? focusRoot : focusButton
);

const styles = useStyles(
  ["select"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  select: {
    item: string;
    label: string;
    group: string;
  };
}>;
</script>
