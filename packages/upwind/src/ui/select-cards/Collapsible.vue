<template>
  <BaseSelectCards
    v-bind="$props"
    :modelValue="modelValue"
    @update:modelValue="$emit('update:modelValue', $event)"
  >
    <template
      #root="{
        openValue,
        setOpenValue,
        items,
        onChange,
        selected,
        manuallySelected,
      }"
    >
      <component
        :is="radio && useInputGroup ? RadioGroup : 'div'"
        :disabled="disabled"
        :model-value="modelValue"
        :default-value="defaultValue"
        @update:model-value="onChange"
        :class="variants.select.group"
        tabindex="-1"
      >
        <Collapsible
          :open="openValue"
          @update:open="(val: boolean) => setOpenValue(val)"
        >
          <CollapsibleTrigger class="w-full">
            <TriggerButton
              v-bind="{
                selected,
                manuallySelected,
                ...props,
              }"
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
              v-for="(item, i) in items"
              :key="item.value || i"
              tabindex="0"
              @click="onChange(item.value)"
              :class="variants.select.item"
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
  </BaseSelectCards>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import TriggerButton from "./components/TriggerButton.vue";
import { RadioGroup, RadioGroupItem } from "../radio-group";
import BaseSelectCards from "./BaseSelectCards.vue";
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

defineEmits(["update:modelValue"]);

const meta = computed(() => ({
  variant: props.variant,
  isCollapsible: props.variant === "collapsible",
}));

const variants = useStyles(
  ["select"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: {
    root: string;
    items: string;
    item: string;
    input: string;
    label: string;
    group: string;
    content: string;
  };
}>;
</script>
