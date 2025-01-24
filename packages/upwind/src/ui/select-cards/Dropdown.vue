<template>
  <DropdownMenuRoot v-model:open="open" tabindex="-1">
    <DropdownMenuTrigger as-child>
      <TriggerButton
        v-bind="props"
        :open="open"
        :selected="selected"
        :manuallySelected="manuallySelected"
        :meta="meta"
        :name="name"
        :overrideIndex="overrideIndex"
      >
        <template #item="{ item }">
          <slot name="item" :item="item" />
        </template>
        <template #placeholder>
          <slot name="placeholder" />
        </template>
      </TriggerButton>
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :class="cn(variants.select.content, props.contentClass)"
      >
        <DropdownMenuItem
          v-for="(item, index) in items"
          :key="item.id || index"
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
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>

<script setup lang="ts">
// --- external
import { first } from "lodash-es";
import { ref } from "vue";

// --- internal
import { useSelectCards } from "./utils/useSelectCards";
import { cn, useStyles } from "../../utils";
import config from "./selectCards.config";

// --- components
import TriggerButton from "./components/TriggerButton.vue";
import { Label } from "../label";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "radix-vue";

// --- types
import type { SelectCardsProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<SelectCardsProps>(), {
  variant: "dropdown",
});

const emits = defineEmits(["update:modelValue"]);
const itemRefs = ref<HTMLElement[]>([]);

const { modelValue, open, onChange, selected, meta } = useSelectCards(
  props,
  emits,
  itemRefs
);

const variants = useStyles(
  ["select"],
  meta,
  config,
  props.upwindConfig ?? {}
) as ComputedRef<{
  select: {
    item: string;
    label: string;
    content: string;
  };
}>;

if (props.required && !modelValue.value) {
  emits("update:modelValue", first(props.items)?.value);
}
</script>
