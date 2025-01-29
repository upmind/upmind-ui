<template>
  <span :class="styles.select.group">
    <DropdownMenuRoot v-model:open="open" tabindex="-1">
      <DropdownMenuTrigger as-child>
        <TriggerButton
          :class="props.class"
          focusable
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
          <template #item="{ item }">
            <slot name="item" :item="item"></slot>
          </template>
          <template #placeholder>
            <slot name="placeholder"></slot>
          </template>
        </TriggerButton>
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuContent
          :class="cn(styles.select.content, props.contentClass)"
        >
          <DropdownMenuItem
            v-for="(item, index) in items"
            :key="item.id || index"
            @click="onChange(item.value)"
            :class="styles.select.item"
          >
            <Label
              :for="`${name}-${overrideIndex + index || index}`"
              :class="cn(styles.select.label)"
            >
              <slot name="dropdown-item" v-bind="{ item, index }">
                {{ item.label }}
              </slot>
            </Label>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenuRoot>
  </span>
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

const {
  modelValue,
  open,
  onChange,
  selected,
  meta,
  keyEnter,
  handleOpenAutoFocus,
} = useSelectCards(props, emits, itemRefs);

const styles = useStyles(
  ["select"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  select: {
    item: string;
    label: string;
    content: string;
    group: string;
  };
}>;

if (props.required && !modelValue.value) {
  emits("update:modelValue", first(props.items)?.value);
}
</script>
