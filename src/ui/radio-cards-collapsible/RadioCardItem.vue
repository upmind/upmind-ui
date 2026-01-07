<template>
  <Label
    :for="`${props.name}-${index}`"
    :class="styles.radioCards.item"
    :data-state="isSelected ? 'checked' : ''"
  >
    <div v-show="!props.minimal" :class="styles.radioCards.radio">
      <RadioGroupItem
        :id="`${props.name}-${index}`"
        :value="value"
        :name="props.name"
        :required="props.required"
        :disabled="props.disabled"
        :class="styles.radioCards.input"
        :tabindex="isSelected || !modelValue ? 0 : -1"
        :data-state="isSelected ? 'checked' : ''"
        :uiConfig="uiConfig"
        @blur="onBlur"
      />
    </div>
    <slot
      name="item"
      v-bind="{
        item: { ...props.item, value },
        isSelect: isSelected
      }"
    >
      <span v-if="props.label">{{ props.label }}</span>
    </slot>
  </Label>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { watchOnce } from "@vueuse/core";

// --- internal
import { cn, useStyles } from "../../utils";
import config from "./radioCards.config";

// --- components
import Label from "../label/Label.ce.vue";
import { RadioGroupItem } from "../radio-group";

// --- types
import type { ComputedRef } from "vue";
import type { RadioCardsCollapsibleItemProps } from "./types";

// -----------------------------------------------------------------------------

const props = withDefaults(defineProps<RadioCardsCollapsibleItemProps>(), {
  // -- variants
  width: 1,
  isList: false
});

const emits = defineEmits(["focus"]);

const isSelected = computed(() => {
  return props.modelValue === props.value;
});

const meta = computed(() => ({
  isList: props.list,
  isMinimal: props.minimal,
  width: props.width
}));

const styles = useStyles(
  ["radioCards"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  radioCards: {
    trigger: string;
    root: string;
    item: string;
    radio: string;
    input: string;
    label: string;
  };
}>;

const onBlur = (e: FocusEvent) => {
  if (props.disabled) {
    watchOnce(
      () => props.disabled,
      () => {
        const el = e.target as HTMLElement;
        if (el && el.dataset.state === "checked") {
          el.focus();
        }
      }
    );
  }
};
</script>
