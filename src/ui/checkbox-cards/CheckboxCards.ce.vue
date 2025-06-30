<template>
  <ToggleGroupRoot
    v-model="modelValue"
    :required="props.required"
    :disabled="props.disabled"
    :class="cn(styles.checkboxCards.root, props.class)"
    type="multiple"
    data-testid="checkbox-group"
  >
    <div
      v-for="(item, index) in items"
      :key="item.id || index"
      :class="styles.checkboxCards.item"
    >
      <CheckboxCardItem
        :id="`${item.id}-${index}`"
        :index="index"
        :value="item.value as string"
        :name="item.id"
        :required="props.required"
        :disabled="props.disabled"
        :no-input="props.noInput"
        :class="cn(styles.checkboxCards.input, props.itemClass)"
        data-testid="checkbox-item"
      >
        <Label
          :for="`${item.id}-${index}`"
          :class="cn(styles.checkboxCards.label)"
          data-testid="checkbox-label"
        >
          <slot name="item" v-bind="{ item, index }">
            {{ item.label }}
          </slot>
        </Label>
      </CheckboxCardItem>
    </div>
  </ToggleGroupRoot>
</template>

<script setup lang="ts">
// ---external
import { computed } from "vue";
import { useVModel } from "@vueuse/core";
import { ToggleGroupRoot } from "radix-vue";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./checkboxCards.config";

// --- components
import CheckboxCardItem from "./CheckboxCardItem.vue";
import { Label } from "../label";

// --- types
import type { CheckboxCardsProps } from "./types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<CheckboxCardsProps>(), {
  cursor: "pointer"
  // --- styles
});

const emits = defineEmits<{
  /** Update the model value */
  (e: "update:modelValue", payload: string[]): void;
}>();

defineSlots<{
  /** Provide a checkbox card item */
  item(props: { item: any; index: number }): any;
}>();

const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue
});

const meta = computed(() => ({
  // layout: props.layout,
  isList: props.list,
  noInput: props.noInput,
  cursor: props.cursor
}));

const styles = useStyles(
  ["checkboxCards"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  checkboxCards: {
    trigger: string;
    root: string;
    item: string;
    input: string;
    label: string;
  };
}>;
</script>
